import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RepairStatus, Priority } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const repair = await prisma.repair.findUnique({
      where: { id: parseInt(id) },
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
        { error: 'Repair not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ repair })
  } catch (error) {
    console.error('Error fetching repair:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repair' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      status,
      priority,
      technicianId,
      estimatedCompletion,
      actualCompletion,
      totalCost,
      depositPaid,
      notes,
    } = body

    const data: any = {}

    if (status) data.status = status as RepairStatus
    if (priority) data.priority = priority as Priority
    if (technicianId !== undefined) data.technicianId = technicianId ? parseInt(technicianId) : null
    if (estimatedCompletion !== undefined) data.estimatedCompletion = estimatedCompletion ? new Date(estimatedCompletion) : null
    if (actualCompletion !== undefined) data.actualCompletion = actualCompletion ? new Date(actualCompletion) : null
    if (totalCost !== undefined) data.totalCost = parseFloat(totalCost)
    if (depositPaid !== undefined) data.depositPaid = parseFloat(depositPaid)
    if (notes !== undefined) data.notes = notes

    const repair = await prisma.repair.update({
      where: { id: parseInt(id) },
      data,
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

    return NextResponse.json({ repair })
  } catch (error) {
    console.error('Error updating repair:', error)
    return NextResponse.json(
      { error: 'Failed to update repair' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.repair.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting repair:', error)
    return NextResponse.json(
      { error: 'Failed to delete repair' },
      { status: 500 }
    )
  }
}
