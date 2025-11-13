import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/devices - List devices with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const brandId = searchParams.get('brandId')
    const type = searchParams.get('type') // 'phone' or 'tablet'

    const where: any = {}
    if (brandId) where.brandId = parseInt(brandId)
    if (type === 'phone') where.isPhone = true
    if (type === 'tablet') where.isTablet = true

    const devices = await prisma.deviceModel.findMany({
      where,
      include: {
        brand: true,
      },
      orderBy: [
        { brand: { name: 'asc' } },
        { releaseYear: 'desc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: devices,
      count: devices.length,
    })
  } catch (error: any) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch devices',
      },
      { status: 500 }
    )
  }
}
