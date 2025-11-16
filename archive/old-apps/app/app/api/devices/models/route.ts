import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const isPhone = searchParams.get('isPhone')
    const isTablet = searchParams.get('isTablet')

    const where: any = {}

    if (brandId) {
      where.brandId = parseInt(brandId)
    }

    if (isPhone === 'true') {
      where.isPhone = true
    }

    if (isTablet === 'true') {
      where.isTablet = true
    }

    const models = await prisma.deviceModel.findMany({
      where,
      include: {
        brand: true,
        _count: {
          select: { repairs: true, prices: true },
        },
      },
      orderBy: [
        { releaseYear: 'desc' },
        { releaseMonth: 'desc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ models })
  } catch (error) {
    console.error('Error fetching device models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch device models' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      brandId,
      name,
      variant,
      releaseYear,
      releaseMonth,
      tierLevel,
      isPhone,
      isTablet,
    } = body

    if (!brandId || !name || !releaseYear || !tierLevel) {
      return NextResponse.json(
        { error: 'Required fields: brandId, name, releaseYear, tierLevel' },
        { status: 400 }
      )
    }

    const model = await prisma.deviceModel.create({
      data: {
        brandId: parseInt(brandId),
        name,
        variant,
        releaseYear: parseInt(releaseYear),
        releaseMonth: releaseMonth ? parseInt(releaseMonth) : null,
        tierLevel: parseInt(tierLevel),
        isPhone: isPhone !== false,
        isTablet: isTablet === true,
      },
      include: {
        brand: true,
      },
    })

    return NextResponse.json({ model }, { status: 201 })
  } catch (error) {
    console.error('Error creating device model:', error)
    return NextResponse.json(
      { error: 'Failed to create device model' },
      { status: 500 }
    )
  }
}
