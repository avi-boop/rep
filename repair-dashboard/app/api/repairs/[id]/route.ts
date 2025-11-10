import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const repair = await prisma.repairOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: true
          }
        },
        repairOrderItems: {
          include: {
            repairType: true,
            partType: true,
            pricing: true
          }
        },
        orderStatusHistory: {
          orderBy: {
            changedAt: 'desc'
          }
        },
        photos: true
      }
    })

    if (!repair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 })
    }

    return NextResponse.json(repair)
  } catch (error) {
    console.error('Error fetching repair:', error)
    return NextResponse.json({ error: 'Failed to fetch repair' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params
    const repairId = parseInt(id)

    // If status is being changed, log it
    if (body.status) {
      const currentRepair = await prisma.repairOrder.findUnique({
        where: { id: repairId },
        select: { status: true }
      })

      if (currentRepair && currentRepair.status !== body.status) {
        await prisma.orderStatusHistory.create({
          data: {
            repairOrderId: repairId,
            oldStatus: currentRepair.status,
            newStatus: body.status,
            notes: body.statusNotes || null,
            changedAt: new Date()
          }
        })
      }
    }

    const repair = await prisma.repairOrder.update({
      where: { id: repairId },
      data: {
        status: body.status,
        priority: body.priority,
        issueDescription: body.issueDescription,
        cosmeticCondition: body.cosmeticCondition,
        devicePassword: body.devicePassword,
        estimatedCompletion: body.estimatedCompletion ? new Date(body.estimatedCompletion) : undefined,
        actualCompletion: body.actualCompletion ? new Date(body.actualCompletion) : undefined,
        totalPrice: body.totalPrice !== undefined ? body.totalPrice : undefined,
        depositPaid: body.depositPaid !== undefined ? body.depositPaid : undefined,
      },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: true
          }
        },
        repairOrderItems: {
          include: {
            repairType: true,
            partType: true
          }
        }
      }
    })

    return NextResponse.json(repair)
  } catch (error) {
    console.error('Error updating repair:', error)
    return NextResponse.json({ error: 'Failed to update repair' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.repairOrder.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting repair:', error)
    return NextResponse.json({ error: 'Failed to delete repair' }, { status: 500 })
  }
}
