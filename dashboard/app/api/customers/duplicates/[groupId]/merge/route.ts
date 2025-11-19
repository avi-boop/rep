import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as fs from 'fs'
import * as path from 'path'

interface MergeResult {
  success: boolean
  groupId: string
  primaryCustomerId: number
  mergedCustomerIds: number[]
  repairOrdersUpdated: number
  notificationsUpdated: number
  chatHistoryUpdated: number
  dataConsolidated: string[]
  error?: string
}

/**
 * Create backup of customers before merge
 */
async function createBackup(groupId: string, customerIds: number[]): Promise<string> {
  const backupDir = path.join(process.cwd(), 'backups/customer-merges', new Date().toISOString().split('T')[0])

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const customers = await prisma.customer.findMany({
    where: {
      id: { in: customerIds }
    },
    include: {
      repairOrders: {
        include: {
          repairOrderItems: true,
          notifications: true,
          orderStatusHistory: true,
          photos: true
        }
      },
      notifications: true,
      chatHistory: true
    }
  })

  const backupPath = path.join(backupDir, `${groupId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`)

  fs.writeFileSync(backupPath, JSON.stringify({
    groupId,
    backupDate: new Date().toISOString(),
    customers
  }, null, 2))

  return backupPath
}

/**
 * POST /api/customers/duplicates/[groupId]/merge
 * Merge a specific duplicate group
 *
 * Body:
 * - dryRun: boolean (default: true)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const params = await context.params
    const groupId = decodeURIComponent(params.groupId)
    const body = await request.json()
    const dryRun = body.dryRun !== false // Default to true for safety

    // Load report to get group details
    const reportPath = path.join(process.cwd(), 'reports/customer-duplicates-report.json')

    if (!fs.existsSync(reportPath)) {
      return NextResponse.json(
        { error: 'No duplicate analysis report found. Run analysis first.' },
        { status: 404 }
      )
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
    const group = report.duplicateGroups.find((g: any) => g.id === groupId)

    if (!group) {
      return NextResponse.json(
        { error: `Duplicate group "${groupId}" not found` },
        { status: 404 }
      )
    }

    const { customers, primaryCustomerId } = group

    const result: MergeResult = {
      success: false,
      groupId,
      primaryCustomerId,
      mergedCustomerIds: [],
      repairOrdersUpdated: 0,
      notificationsUpdated: 0,
      chatHistoryUpdated: 0,
      dataConsolidated: []
    }

    const primaryCustomer = customers.find((c: any) => c.id === primaryCustomerId)
    const secondaryCustomers = customers.filter((c: any) => c.id !== primaryCustomerId)

    if (!primaryCustomer) {
      return NextResponse.json(
        { error: `Primary customer #${primaryCustomerId} not found in group` },
        { status: 400 }
      )
    }

    // Create backup before merge
    if (!dryRun) {
      const backupPath = await createBackup(groupId, customers.map((c: any) => c.id))
      console.log(`Backup created: ${backupPath}`)
    }

    // Perform merge or dry-run
    if (!dryRun) {
      await prisma.$transaction(async (tx) => {
        const primaryData = await tx.customer.findUnique({
          where: { id: primaryCustomerId },
          include: {
            repairOrders: true,
            notifications: true,
            chatHistory: true
          }
        })

        if (!primaryData) {
          throw new Error(`Primary customer #${primaryCustomerId} not found in database`)
        }

        // Consolidate data from secondaries
        const updatedData: any = {}

        for (const secondary of secondaryCustomers) {
          // If primary is missing email and secondary has it, use secondary's email
          if (!primaryData.email && secondary.email) {
            updatedData.email = secondary.email
            result.dataConsolidated.push(`email from #${secondary.id}`)
          }

          // Append notes
          if (secondary.hasNotes) {
            const secondaryData = await tx.customer.findUnique({
              where: { id: secondary.id }
            })

            if (secondaryData?.notes) {
              const currentNotes = primaryData.notes || ''
              updatedData.notes = currentNotes
                ? `${currentNotes}\n\n--- Merged from Customer #${secondary.id} ---\n${secondaryData.notes}`
                : secondaryData.notes

              result.dataConsolidated.push(`notes from #${secondary.id}`)
            }
          }

          // Update foreign keys: repair orders
          const repairOrderCount = await tx.repairOrder.updateMany({
            where: { customerId: secondary.id },
            data: { customerId: primaryCustomerId }
          })
          result.repairOrdersUpdated += repairOrderCount.count

          // Update foreign keys: notifications
          const notificationCount = await tx.notification.updateMany({
            where: { customerId: secondary.id },
            data: { customerId: primaryCustomerId }
          })
          result.notificationsUpdated += notificationCount.count

          // Update foreign keys: chat history
          const chatCount = await tx.chatHistory.updateMany({
            where: { customerId: secondary.id },
            data: { customerId: primaryCustomerId }
          })
          result.chatHistoryUpdated += chatCount.count

          // Soft delete secondary customer
          await tx.customer.update({
            where: { id: secondary.id },
            data: {
              mergedIntoId: primaryCustomerId,
              mergedAt: new Date(),
              isActive: false,
              // Append "(merged)" to phone to avoid unique constraint
              phone: `${secondary.phone}_merged_${secondary.id}`
            }
          })

          result.mergedCustomerIds.push(secondary.id)
        }

        // Update primary customer with consolidated data
        if (Object.keys(updatedData).length > 0) {
          await tx.customer.update({
            where: { id: primaryCustomerId },
            data: updatedData
          })
        }
      })
    } else {
      // Dry-run: simulate the counts
      for (const secondary of secondaryCustomers) {
        const repairCount = await prisma.repairOrder.count({
          where: { customerId: secondary.id }
        })
        const notificationCount = await prisma.notification.count({
          where: { customerId: secondary.id }
        })
        const chatCount = await prisma.chatHistory.count({
          where: { customerId: secondary.id }
        })

        result.repairOrdersUpdated += repairCount
        result.notificationsUpdated += notificationCount
        result.chatHistoryUpdated += chatCount
        result.mergedCustomerIds.push(secondary.id)

        if (secondary.email && !primaryCustomer.email) {
          result.dataConsolidated.push(`email from #${secondary.id}`)
        }
        if (secondary.hasNotes) {
          result.dataConsolidated.push(`notes from #${secondary.id}`)
        }
      }
    }

    result.success = true

    return NextResponse.json({
      ...result,
      dryRun,
      message: dryRun
        ? 'Dry-run completed. No changes were made.'
        : 'Merge completed successfully.'
    })
  } catch (error: any) {
    console.error('Error merging customers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to merge customers' },
      { status: 500 }
    )
  }
}
