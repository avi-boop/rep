import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { RepairStatus } from '@prisma/client'

// GET /api/repairs/[id] - Get single repair
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repairId = parseInt(params.id)

    const repair = await prisma.repair.findUnique({
      where: { id: repairId },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: true,
          },
        },
        repairItems: {
          include: {
            repairType: true,
            price: true,
          },
        },
        notifications: {
          orderBy: {
            sentAt: 'desc',
          },
        },
      },
    })

    if (!repair) {
      return NextResponse.json(
        {
          success: false,
          error: 'Repair not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: repair,
    })
  } catch (error: any) {
    console.error('Error fetching repair:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch repair',
      },
      { status: 500 }
    )
  }
}

// PATCH /api/repairs/[id] - Update repair
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repairId = parseInt(params.id)
    const body = await request.json()

    const { status, notes, estimatedCompletion, actualCompletion, technicianId } = body

    const updateData: any = {}
    if (status) updateData.status = status as RepairStatus
    if (notes !== undefined) updateData.notes = notes
    if (estimatedCompletion) updateData.estimatedCompletion = new Date(estimatedCompletion)
    if (actualCompletion) updateData.actualCompletion = new Date(actualCompletion)
    if (technicianId !== undefined) updateData.technicianId = technicianId

    // If status is completed, set actualCompletion
    if (status === 'completed' && !actualCompletion) {
      updateData.actualCompletion = new Date()
    }

    const repair = await prisma.repair.update({
      where: { id: repairId },
      data: updateData,
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: true,
          },
        },
        repairItems: {
          include: {
            repairType: true,
          },
        },
      },
    })

    // TODO: Send status update notification
    // if (status && status !== repair.status) {
    //   await sendStatusUpdateNotification(repair)
    // }

    return NextResponse.json({
      success: true,
      data: repair,
      message: 'Repair updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating repair:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update repair',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/repairs/[id] - Delete repair
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repairId = parseInt(params.id)

    // Delete repair items first, then repair
    await prisma.$transaction(async (tx) => {
      await tx.repairItem.deleteMany({
        where: { repairId },
      })
      await tx.notification.deleteMany({
        where: { repairId },
      })
      await tx.repair.delete({
        where: { id: repairId },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Repair deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting repair:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete repair',
      },
      { status: 500 }
    )
  }
}
