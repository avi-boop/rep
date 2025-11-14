import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // TODO: Trigger notification to customer
    // await sendNotification(repair.customerId, 'status_update', { repair, newStatus: body.status })

    return NextResponse.json(repair)
  } catch (error) {
    console.error('Error updating repair status:', error)
    return NextResponse.json({ error: 'Failed to update repair status' }, { status: 500 })
  }
}
