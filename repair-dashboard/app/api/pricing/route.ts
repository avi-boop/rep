import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceModelId = searchParams.get('deviceModelId')
    const repairTypeId = searchParams.get('repairTypeId')
    const partTypeId = searchParams.get('partTypeId')

    const where: any = { isActive: true }
    if (deviceModelId) where.deviceModelId = parseInt(deviceModelId)
    if (repairTypeId) where.repairTypeId = parseInt(repairTypeId)
    if (partTypeId) where.partTypeId = parseInt(partTypeId)

    const pricing = await prisma.pricing.findMany({
      where,
      include: {
        deviceModel: {
          include: {
            brand: true
          }
        },
        repairType: true,
        partType: true
      },
      orderBy: [
        { deviceModel: { brand: { name: 'asc' } } },
        { deviceModel: { name: 'asc' } }
      ]
    })

    return NextResponse.json(pricing)
  } catch (error) {
    console.error('Error fetching pricing:', error)
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if pricing already exists
    const existing = await prisma.pricing.findFirst({
      where: {
        deviceModelId: body.deviceModelId,
        repairTypeId: body.repairTypeId,
        partTypeId: body.partTypeId
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Pricing already exists for this combination' }, { status: 400 })
    }

    const pricing = await prisma.pricing.create({
      data: {
        deviceModelId: body.deviceModelId,
        repairTypeId: body.repairTypeId,
        partTypeId: body.partTypeId,
        price: parseFloat(body.price),
        cost: body.cost ? parseFloat(body.cost) : null,
        isEstimated: body.isEstimated || false,
        confidenceScore: body.confidenceScore ? parseFloat(body.confidenceScore) : null,
        notes: body.notes || null,
      },
      include: {
        deviceModel: {
          include: {
            brand: true
          }
        },
        repairType: true,
        partType: true
      }
    })

    return NextResponse.json(pricing, { status: 201 })
  } catch (error) {
    console.error('Error creating pricing:', error)
    return NextResponse.json({ error: 'Failed to create pricing' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Get existing pricing for history tracking
    const existing = await prisma.pricing.findUnique({
      where: { id: body.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Pricing not found' }, { status: 404 })
    }

    // Track price changes in history
    const priceChanged = body.price !== undefined && parseFloat(body.price) !== existing.price
    const costChanged = body.cost !== undefined && parseFloat(body.cost) !== existing.cost

    if (priceChanged || costChanged) {
      await prisma.priceHistory.create({
        data: {
          pricingId: body.id,
          oldPrice: existing.price,
          newPrice: body.price !== undefined ? parseFloat(body.price) : existing.price,
          oldCost: existing.cost,
          newCost: body.cost !== undefined ? parseFloat(body.cost) : existing.cost,
          reason: body.changeReason || 'Manual update via dashboard',
          changedBy: body.changedBy || null
        }
      })
    }

    const pricing = await prisma.pricing.update({
      where: { id: body.id },
      data: {
        price: body.price !== undefined ? parseFloat(body.price) : undefined,
        cost: body.cost !== undefined ? parseFloat(body.cost) : undefined,
        isEstimated: body.isEstimated,
        confidenceScore: body.confidenceScore !== undefined ? parseFloat(body.confidenceScore) : undefined,
        notes: body.notes,
        isActive: body.isActive,
      },
      include: {
        deviceModel: {
          include: {
            brand: true
          }
        },
        repairType: true,
        partType: true,
        priceHistory: {
          orderBy: { changedAt: 'desc' },
          take: 5
        }
      }
    })

    return NextResponse.json(pricing)
  } catch (error) {
    console.error('Error updating pricing:', error)
    return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 })
  }
}
