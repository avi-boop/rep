import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RepairStatus, Priority, PartsQuality } from '@prisma/client'
import { generateRepairNumber } from '@/lib/utils'
import { getOrCreateEstimatedPrice } from '@/lib/pricing/estimator'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')

    const where: any = {}

    if (status) {
      where.status = status as RepairStatus
    }

    if (customerId) {
      where.customerId = parseInt(customerId)
    }

    if (search) {
      where.OR = [
        { repairNumber: { contains: search, mode: 'insensitive' } },
        { deviceImei: { contains: search } },
        {
          customer: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          },
        },
      ]
    }

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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    return NextResponse.json({ repairs })
  } catch (error) {
    console.error('Error fetching repairs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repairs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      customerId,
      deviceModelId,
      deviceImei,
      deviceCondition,
      priority,
      notes,
      repairItems,
      estimatedCompletion,
    } = body

    if (!customerId || !deviceModelId || !repairItems || repairItems.length === 0) {
      return NextResponse.json(
        { error: 'Required fields: customerId, deviceModelId, repairItems' },
        { status: 400 }
      )
    }

    // Generate repair number
    const repairNumber = generateRepairNumber()

    // Calculate total cost
    let totalCost = 0
    const itemsData = []

    for (const item of repairItems) {
      const priceData = await getOrCreateEstimatedPrice(
        deviceModelId,
        item.repairTypeId,
        item.partsQuality as PartsQuality
      )

      totalCost += priceData.price
      itemsData.push({
        repairTypeId: item.repairTypeId,
        partsQuality: item.partsQuality as PartsQuality,
        priceId: priceData.priceId,
        finalPrice: priceData.price,
        priceOverridden: false,
        status: 'pending',
        notes: item.notes,
      })
    }

    // Create repair with items
    const repair = await prisma.repair.create({
      data: {
        repairNumber,
        customerId: parseInt(customerId),
        deviceModelId: parseInt(deviceModelId),
        deviceImei,
        deviceCondition,
        status: RepairStatus.new,
        priority: (priority as Priority) || Priority.standard,
        totalCost,
        notes,
        estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : null,
        repairItems: {
          create: itemsData,
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

    return NextResponse.json({ repair }, { status: 201 })
  } catch (error) {
    console.error('Error creating repair:', error)
    return NextResponse.json(
      { error: 'Failed to create repair' },
      { status: 500 }
    )
  }
}
