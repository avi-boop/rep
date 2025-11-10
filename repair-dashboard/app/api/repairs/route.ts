import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPrice } from '@/lib/pricing/estimator'
import { PartsQuality, RepairStatus } from '@prisma/client'

// GET /api/repairs - List all repairs with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (status) where.status = status as RepairStatus
    if (customerId) where.customerId = parseInt(customerId)

    const repairs = await prisma.repair.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: repairs,
      count: repairs.length,
    })
  } catch (error: any) {
    console.error('Error fetching repairs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch repairs',
      },
      { status: 500 }
    )
  }
}

// POST /api/repairs - Create new repair
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      deviceModelId,
      deviceImei,
      deviceCondition,
      priority,
      repairItems,
      notes,
      estimatedCompletion,
    } = body

    // Validate required fields
    if (!customerId || !deviceModelId || !repairItems || repairItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    // Generate repair number
    const repairNumber = await generateRepairNumber()

    // Calculate total cost from repair items
    let totalCost = 0
    const itemsWithPrices = []

    for (const item of repairItems) {
      const priceEstimate = await getPrice(
        deviceModelId,
        item.repairTypeId,
        item.partsQuality as PartsQuality
      )
      totalCost += priceEstimate.price
      itemsWithPrices.push({
        ...item,
        finalPrice: priceEstimate.price,
        priceOverridden: false,
      })
    }

    // Create repair with items in a transaction
    const repair = await prisma.$transaction(async (tx) => {
      const newRepair = await tx.repair.create({
        data: {
          repairNumber,
          customerId,
          deviceModelId,
          deviceImei,
          deviceCondition,
          priority: priority || 'standard',
          status: 'new',
          totalCost,
          notes,
          estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : null,
          repairItems: {
            create: itemsWithPrices.map((item) => ({
              repairTypeId: item.repairTypeId,
              partsQuality: item.partsQuality,
              finalPrice: item.finalPrice,
              priceOverridden: item.priceOverridden,
              notes: item.notes,
            })),
          },
        },
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

      // TODO: Send notification to customer
      // await sendRepairCreatedNotification(newRepair)

      return newRepair
    })

    return NextResponse.json(
      {
        success: true,
        data: repair,
        message: 'Repair created successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating repair:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create repair',
      },
      { status: 500 }
    )
  }
}

// Helper function to generate unique repair number
async function generateRepairNumber(): Promise<string> {
  const today = new Date()
  const year = today.getFullYear().toString().slice(-2)
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')

  // Find today's repair count
  const count = await prisma.repair.count({
    where: {
      createdAt: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lt: new Date(today.setHours(23, 59, 59, 999)),
      },
    },
  })

  const sequence = (count + 1).toString().padStart(4, '0')
  return `RR${year}${month}${day}-${sequence}`
}
