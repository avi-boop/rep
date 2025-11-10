import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PartsQuality } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceModelId = searchParams.get('deviceModelId')
    const repairTypeId = searchParams.get('repairTypeId')

    const where: any = {}

    if (deviceModelId) {
      where.deviceModelId = parseInt(deviceModelId)
    }

    if (repairTypeId) {
      where.repairTypeId = parseInt(repairTypeId)
    }

    const prices = await prisma.price.findMany({
      where,
      include: {
        deviceModel: {
          include: {
            brand: true,
          },
        },
        repairType: true,
      },
      orderBy: [
        { deviceModel: { releaseYear: 'desc' } },
        { deviceModel: { name: 'asc' } },
      ],
    })

    return NextResponse.json({ prices })
  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      deviceModelId,
      repairTypeId,
      partsQuality,
      partsCost,
      laborCost,
      totalPrice,
      isEstimated,
      confidenceScore,
    } = body

    if (!deviceModelId || !repairTypeId || !partsQuality || !totalPrice) {
      return NextResponse.json(
        { error: 'Required fields: deviceModelId, repairTypeId, partsQuality, totalPrice' },
        { status: 400 }
      )
    }

    // Check if price already exists
    const existing = await prisma.price.findFirst({
      where: {
        deviceModelId: parseInt(deviceModelId),
        repairTypeId: parseInt(repairTypeId),
        partsQuality: partsQuality as PartsQuality,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Price already exists for this combination' },
        { status: 400 }
      )
    }

    const price = await prisma.price.create({
      data: {
        deviceModelId: parseInt(deviceModelId),
        repairTypeId: parseInt(repairTypeId),
        partsQuality: partsQuality as PartsQuality,
        partsCost: parseFloat(partsCost || '0'),
        laborCost: parseFloat(laborCost || '0'),
        totalPrice: parseFloat(totalPrice),
        isEstimated: isEstimated || false,
        confidenceScore: confidenceScore ? parseFloat(confidenceScore) : null,
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

    return NextResponse.json({ price }, { status: 201 })
  } catch (error) {
    console.error('Error creating price:', error)
    return NextResponse.json(
      { error: 'Failed to create price' },
      { status: 500 }
    )
  }
}
