import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { notifyRepairStatus } from '@/lib/notifications'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const repairId = parseInt(id)

    // Get current status
    const currentRepair = await prisma.repairOrder.findUnique({
      where: { id: repairId },
      select: { status: true }
    })

    if (!currentRepair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 })
    }

    // Update status and log history
    const [repair] = await prisma.$transaction([
      prisma.repairOrder.update({
        where: { id: repairId },
        data: {
          status: body.status,
          ...(body.status === 'completed' && !currentRepair ? { actualCompletion: new Date() } : {})
        },
        include: {
          customer: true,
          deviceModel: {
            include: {
              brand: true
            }
          }
        }
      }),
      prisma.orderStatusHistory.create({
        data: {
          repairOrderId: repairId,
          oldStatus: currentRepair.status,
          newStatus: body.status,
          notes: body.notes || null,
          changedAt: new Date()
        }
      })
    ])

    // Send notification to customer based on new status
    try {
      let notificationStatus: 'created' | 'in_progress' | 'completed' | 'ready_for_pickup' | 'delayed' | null = null

      if (body.status === 'in_progress') {
        notificationStatus = 'in_progress'
      } else if (body.status === 'completed') {
        notificationStatus = 'completed'
      } else if (body.status === 'ready_for_pickup') {
        notificationStatus = 'ready_for_pickup'
      } else if (body.status === 'waiting_for_parts' || body.status === 'delayed') {
        notificationStatus = 'delayed'
      }

      if (notificationStatus) {
        await notifyRepairStatus(
          repair.customer.id,
          {
            firstName: repair.customer.firstName,
            lastName: repair.customer.lastName,
            email: repair.customer.email,
            phone: repair.customer.phone,
            notificationPreferences: repair.customer.notificationPreferences,
          },
          {
            orderNumber: repair.orderNumber,
            deviceModel: repair.deviceModel?.name,
            deviceBrand: repair.deviceModel?.brand?.name,
            status: body.status,
            totalPrice: repair.totalPrice || undefined,
            estimatedCompletion: repair.estimatedCompletion?.toLocaleDateString(),
            actualCompletion: repair.actualCompletion?.toLocaleDateString(),
          },
          notificationStatus
        )
      }
    } catch (notificationError) {
      // Log error but don't fail the status update
      console.error('Failed to send notification:', notificationError)
    }

    return NextResponse.json(repair)
  } catch (error) {
    console.error('Error updating repair status:', error)
    return NextResponse.json({ error: 'Failed to update repair status' }, { status: 500 })
  }
}
