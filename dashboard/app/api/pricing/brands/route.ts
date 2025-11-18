import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Fetch all primary brands with their model counts
    const brands = await prisma.brand.findMany({
      where: { isPrimary: true },
      include: {
        _count: {
          select: {
            deviceModels: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Get pricing counts for each brand
    const brandsWithStats = await Promise.all(
      brands.map(async (brand) => {
        const pricingCount = await prisma.pricing.count({
          where: {
            deviceModel: { brandId: brand.id },
            isActive: true
          }
        })

        return {
          id: brand.id,
          name: brand.name,
          logoUrl: brand.logoUrl,
          isPrimary: brand.isPrimary,
          modelCount: brand._count.deviceModels,
          pricingCount
        }
      })
    )

    return NextResponse.json({
      success: true,
      brands: brandsWithStats
    })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch brands'
      },
      { status: 500 }
    )
  }
}
