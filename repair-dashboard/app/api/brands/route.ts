import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/brands - List all brands
export async function GET(request: NextRequest) {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: [
        { isPrimary: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: {
            devices: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: brands,
      count: brands.length,
    })
  } catch (error: any) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch brands',
      },
      { status: 500 }
    )
  }
}
