#!/usr/bin/env tsx

/**
 * Customer Duplicate Merge Utility
 *
 * Safely merges duplicate customer records with the following features:
 * - Dry-run mode to preview changes
 * - Transaction-based (all-or-nothing per group)
 * - Automatic backup before merge
 * - Foreign key updates (repair orders, notifications, etc.)
 * - Data consolidation from secondary records
 * - Detailed logging
 *
 * Usage:
 *   npx tsx scripts/merge-customer-duplicates.ts --dry-run
 *   npx tsx scripts/merge-customer-duplicates.ts --group-id email_no@mail.com
 *   npx tsx scripts/merge-customer-duplicates.ts --confidence 95
 *   npx tsx scripts/merge-customer-duplicates.ts --all
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface MergeOptions {
  dryRun: boolean
  groupId?: string
  minConfidence?: number
  mergeAll: boolean
}

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
 * Parse command line arguments
 */
function parseArgs(): MergeOptions {
  const args = process.argv.slice(2)

  return {
    dryRun: args.includes('--dry-run'),
    groupId: args.includes('--group-id') ? args[args.indexOf('--group-id') + 1] : undefined,
    minConfidence: args.includes('--confidence') ? parseInt(args[args.indexOf('--confidence') + 1]) : 95,
    mergeAll: args.includes('--all')
  }
}

/**
 * Load duplicate groups from analysis report
 */
function loadDuplicateGroups(minConfidence: number = 95): any[] {
  const reportPath = path.join(__dirname, '../reports/customer-duplicates-report.json')

  if (!fs.existsSync(reportPath)) {
    throw new Error(`Report not found at ${reportPath}. Run analyze-customer-duplicates.ts first.`)
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))

  return report.duplicateGroups.filter((g: any) => g.confidence >= minConfidence)
}

/**
 * Create backup of customers before merge
 */
async function createBackup(groupId: string, customerIds: number[]): Promise<string> {
  const backupDir = path.join(__dirname, '../backups/customer-merges', new Date().toISOString().split('T')[0])

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
 * Merge a single duplicate group
 */
async function mergeGroup(group: any, dryRun: boolean): Promise<MergeResult> {
  const {id: groupId, customers, primaryCustomerId, confidence} = group

  console.log(`\n${'='.repeat(80)}`)
  console.log(`📦 Group: ${groupId} (Confidence: ${confidence}%)`)
  console.log(`   Primary: Customer #${primaryCustomerId}`)
  console.log(`   Merging: ${customers.filter((c: any) => c.id !== primaryCustomerId).map((c: any) => `#${c.id}`).join(', ')}`)

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

  try {
    const primaryCustomer = customers.find((c: any) => c.id === primaryCustomerId)
    const secondaryCustomers = customers.filter((c: any) => c.id !== primaryCustomerId)

    if (!primaryCustomer) {
      throw new Error(`Primary customer #${primaryCustomerId} not found in group`)
    }

    // Create backup
    if (!dryRun) {
      const backupPath = await createBackup(groupId, customers.map((c: any) => c.id))
      console.log(`   💾 Backup created: ${backupPath}`)
    } else {
      console.log(`   💾 [DRY-RUN] Would create backup`)
    }

    // Start transaction
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
        console.log(`   🔍 [DRY-RUN] Would merge customer #${secondary.id}:`)

        const repairCount = await prisma.repairOrder.count({
          where: { customerId: secondary.id }
        })
        const notificationCount = await prisma.notification.count({
          where: { customerId: secondary.id }
        })
        const chatCount = await prisma.chatHistory.count({
          where: { customerId: secondary.id }
        })

        console.log(`      - Repair orders to update: ${repairCount}`)
        console.log(`      - Notifications to update: ${notificationCount}`)
        console.log(`      - Chat messages to update: ${chatCount}`)

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

    console.log(`   ✅ ${dryRun ? '[DRY-RUN] Would merge' : 'Merged'} successfully:`)
    console.log(`      - Repair orders updated: ${result.repairOrdersUpdated}`)
    console.log(`      - Notifications updated: ${result.notificationsUpdated}`)
    console.log(`      - Chat messages updated: ${result.chatHistoryUpdated}`)
    if (result.dataConsolidated.length > 0) {
      console.log(`      - Data consolidated: ${result.dataConsolidated.join(', ')}`)
    }

  } catch (error: any) {
    result.error = error.message
    console.error(`   ❌ Error merging group: ${error.message}`)
  }

  return result
}

/**
 * Main merge function
 */
async function mergeCustomerDuplicates() {
  const options = parseArgs()

  console.log('🚀 Customer Duplicate Merge Utility')
  console.log(`   Mode: ${options.dryRun ? 'DRY-RUN (no changes will be made)' : 'LIVE (changes will be committed)'}`)
  console.log(`   Min confidence: ${options.minConfidence}%\n`)

  if (!options.dryRun && !options.mergeAll && !options.groupId) {
    console.error('❌ Error: Must specify --dry-run, --all, or --group-id for live merge')
    process.exit(1)
  }

  try {
    let groupsToMerge: any[]

    if (options.groupId) {
      // Merge specific group
      const allGroups = loadDuplicateGroups(0)
      const group = allGroups.find(g => g.id === options.groupId)

      if (!group) {
        throw new Error(`Group "${options.groupId}" not found in report`)
      }

      groupsToMerge = [group]
    } else {
      // Load groups by confidence
      groupsToMerge = loadDuplicateGroups(options.minConfidence)
    }

    console.log(`📋 Found ${groupsToMerge.length} duplicate group(s) to process\n`)

    const results: MergeResult[] = []

    for (const group of groupsToMerge) {
      const result = await mergeGroup(group, options.dryRun)
      results.push(result)

      // Add small delay between groups
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Summary
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const totalCustomersMerged = results.reduce((sum, r) => sum + r.mergedCustomerIds.length, 0)
    const totalRepairOrders = results.reduce((sum, r) => sum + r.repairOrdersUpdated, 0)

    console.log(`\n${'='.repeat(80)}`)
    console.log(`\n📊 Merge Summary:`)
    console.log(`   Groups processed: ${results.length}`)
    console.log(`   Successful: ${successful}`)
    console.log(`   Failed: ${failed}`)
    console.log(`   Total customers merged: ${totalCustomersMerged}`)
    console.log(`   Total repair orders updated: ${totalRepairOrders}`)

    if (options.dryRun) {
      console.log(`\n💡 This was a DRY-RUN. No changes were made.`)
      console.log(`   Run without --dry-run to apply changes.`)
    } else {
      console.log(`\n✅ Merge complete! All changes have been committed.`)
      console.log(`   Backups saved in: backups/customer-merges/`)
    }

  } catch (error: any) {
    console.error(`\n❌ Fatal error: ${error.message}`)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  mergeCustomerDuplicates()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

export { mergeCustomerDuplicates, mergeGroup }
