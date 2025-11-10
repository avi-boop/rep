import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { partsCost, laborCost, totalPrice, isEstimated, confidenceScore } = body

    const price = await prisma.price.update({
      where: { id: parseInt(id) },
      data: {
        partsCost: partsCost ? parseFloat(partsCost) : undefined,
        laborCost: laborCost ? parseFloat(laborCost) : undefined,
        totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
        isEstimated: isEstimated !== undefined ? isEstimated : undefined,
        confidenceScore: confidenceScore ? parseFloat(confidenceScore) : undefined,
      },
      include: {
        deviceModel: {
          include: {
            brand: true,
          },
        },
        repairType: true,
      },
    })

    return NextResponse.json({ price })
  } catch (error) {
    console.error('Error updating price:', error)
    return NextResponse.json(
      { error: 'Failed to update price' },
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
    await prisma.price.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting price:', error)
    return NextResponse.json(
      { error: 'Failed to delete price' },
      { status: 500 }
    )
  }
}
