import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const brandId = searchParams.get('brandId')
    const search = searchParams.get('search') || ''

    if (!brandId) {
      return NextResponse.json(
        {
          success: false,
          error: 'brandId is required'
        },
        { status: 400 }
      )
    }

    // Fetch models for the brand with search filter
    const models = await prisma.deviceModel.findMany({
      where: {
        brandId: parseInt(brandId),
        isActive: true,
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        })
      },
      include: {
        brand: true,
        _count: {
          select: { pricings: true }
        }
      },
      orderBy: [
        { releaseYear: 'desc' },
        { name: 'asc' }
      ]
    })

    // Calculate price ranges and stats for each model (optimized with single query)
    const modelIds = models.map(m => m.id)

    const pricingStats = modelIds.length > 0
      ? await prisma.pricing.groupBy({
          by: ['deviceModelId'],
          where: {
            deviceModelId: { in: modelIds },
            isActive: true
          },
          _min: { price: true },
          _max: { price: true },
          _count: true
        })
      : []

    // Map stats to models
    const modelsWithStats = models.map(model => {
      const stats = pricingStats.find(s => s.deviceModelId === model.id)

      return {
        id: model.id,
        brandId: model.brandId,
        brandName: model.brand.name,
        name: model.name,
        modelNumber: model.modelNumber,
        releaseYear: model.releaseYear,
        deviceType: model.deviceType,
        screenSize: model.screenSize,
        logoUrl: model.brand.logoUrl,  // Use brand logo
        repairCount: stats?._count || 0,
        priceRange: {
          min: stats?._min.price || 0,
          max: stats?._max.price || 0
        }
      }
    })

    return NextResponse.json({
      success: true,
      models: modelsWithStats
    })
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch models'
      },
      { status: 500 }
    )
  }
}
