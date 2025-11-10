import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const model = await prisma.deviceModel.findUnique({
      where: { id: parseInt(id) },
      include: {
        brand: true,
        prices: {
          include: {
            repairType: true,
          },
        },
      },
    })

    if (!model) {
      return NextResponse.json(
        { error: 'Device model not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ model })
  } catch (error) {
    console.error('Error fetching device model:', error)
    return NextResponse.json(
      { error: 'Failed to fetch device model' },
      { status: 500 }
    )
  }
}
