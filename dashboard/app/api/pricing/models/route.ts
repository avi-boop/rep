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

    // Calculate price ranges and stats for each model
    const modelsWithStats = await Promise.all(
      models.map(async (model) => {
        const priceStats = await prisma.pricing.aggregate({
          where: {
            deviceModelId: model.id,
            isActive: true
          },
          _min: { price: true },
          _max: { price: true },
          _count: true
        })

        return {
          id: model.id,
          brandId: model.brandId,
          brandName: model.brand.name,
          name: model.name,
          modelNumber: model.modelNumber,
          releaseYear: model.releaseYear,
          deviceType: model.deviceType,
          screenSize: model.screenSize,
          repairCount: priceStats._count,
          priceRange: {
            min: priceStats._min.price || 0,
            max: priceStats._max.price || 0
          }
        }
      })
    )

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
