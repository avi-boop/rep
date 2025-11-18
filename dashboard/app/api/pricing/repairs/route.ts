import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const modelId = searchParams.get('modelId')
    const partTypeId = searchParams.get('partTypeId')

    if (!modelId) {
      return NextResponse.json(
        {
          success: false,
          error: 'modelId is required'
        },
        { status: 400 }
      )
    }

    // Get model info
    const model = await prisma.deviceModel.findUnique({
      where: { id: parseInt(modelId) },
      include: { brand: true }
    })

    if (!model) {
      return NextResponse.json(
        {
          success: false,
          error: 'Model not found'
        },
        { status: 404 }
      )
    }

    // Get all active repair types
    const repairTypes = await prisma.repairType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    // Get selected part type or default to Standard
    let selectedPartType
    if (partTypeId) {
      selectedPartType = await prisma.partType.findUnique({
        where: { id: parseInt(partTypeId) }
      })
    } else {
      selectedPartType = await prisma.partType.findFirst({
        where: { name: 'Standard' }
      })
    }

    if (!selectedPartType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Part type not found'
        },
        { status: 404 }
      )
    }

    // Get pricing for each repair type
    const repairs = await Promise.all(
      repairTypes.map(async (repairType) => {
        const pricing = await prisma.pricing.findFirst({
          where: {
            deviceModelId: parseInt(modelId),
            repairTypeId: repairType.id,
            partTypeId: selectedPartType.id,
            isActive: true
          },
          include: {
            priceHistory: {
              orderBy: { changedAt: 'desc' },
              take: 5
            }
          }
        })

        // Calculate margin if we have pricing
        const margin = pricing && pricing.cost
          ? ((pricing.price - pricing.cost) / pricing.price) * 100
          : null

        return {
          repairType: {
            id: repairType.id,
            name: repairType.name,
            category: repairType.category,
            description: repairType.description,
            estimatedDuration: repairType.estimatedDuration
          },
          pricing: pricing ? {
            id: pricing.id,
            price: pricing.price,
            cost: pricing.cost,
            margin,
            isEstimated: pricing.isEstimated,
            confidenceScore: pricing.confidenceScore,
            notes: pricing.notes,
            validFrom: pricing.validFrom,
            validUntil: pricing.validUntil,
            updatedAt: pricing.updatedAt,
            priceHistory: pricing.priceHistory
          } : null,
          partType: {
            id: selectedPartType.id,
            name: selectedPartType.name,
            qualityLevel: selectedPartType.qualityLevel,
            warrantyMonths: selectedPartType.warrantyMonths
          }
        }
      })
    )

    // Calculate summary stats
    const availablePricing = repairs.filter(r => r.pricing !== null)
    const totalRepairs = repairTypes.length
    const priceCount = availablePricing.length
    const averagePrice = priceCount > 0
      ? availablePricing.reduce((sum, r) => sum + (r.pricing?.price || 0), 0) / priceCount
      : 0
    const averageMargin = availablePricing.filter(r => r.pricing?.margin).length > 0
      ? availablePricing.reduce((sum, r) => sum + (r.pricing?.margin || 0), 0) /
        availablePricing.filter(r => r.pricing?.margin).length
      : 0

    return NextResponse.json({
      success: true,
      modelInfo: {
        id: model.id,
        name: model.name,
        modelNumber: model.modelNumber,
        releaseYear: model.releaseYear,
        deviceType: model.deviceType,
        screenSize: model.screenSize,
        brand: {
          id: model.brand.id,
          name: model.brand.name
        }
      },
      repairs,
      stats: {
        totalRepairs,
        priceCount,
        missingCount: totalRepairs - priceCount,
        averagePrice: Math.round(averagePrice * 100) / 100,
        averageMargin: Math.round(averageMargin * 100) / 100,
        completionRate: Math.round((priceCount / totalRepairs) * 100)
      }
    })
  } catch (error) {
    console.error('Error fetching repair options:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch repair options'
      },
      { status: 500 }
    )
  }
}
