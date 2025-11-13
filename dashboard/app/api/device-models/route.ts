import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const brandId = searchParams.get('brandId')

    const where = brandId ? { brandId: parseInt(brandId) } : {}

    const deviceModels = await prisma.deviceModel.findMany({
      where: {
        ...where,
        isActive: true
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { releaseYear: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(deviceModels)
  } catch (error) {
    console.error('Error fetching device models:', error)
    return NextResponse.json({ error: 'Failed to fetch device models' }, { status: 500 })
  }
}
