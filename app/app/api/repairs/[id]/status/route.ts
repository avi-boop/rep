import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RepairStatus } from '@prisma/client'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const repair = await prisma.repair.update({
      where: { id: parseInt(id) },
      data: {
        status: status as RepairStatus,
      },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: true,
          },
        },
      },
    })

    // TODO: Send notification to customer about status change

    return NextResponse.json({ repair })
  } catch (error) {
    console.error('Error updating repair status:', error)
    return NextResponse.json(
      { error: 'Failed to update repair status' },
      { status: 500 }
    )
  }
}
