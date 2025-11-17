import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const brandId = searchParams.get('brandId')

    const deviceModels = await prisma.deviceModel.findMany({
      where: brandId ? { brandId: parseInt(brandId) } : undefined,
      include: {
        brand: true
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const deviceModel = await prisma.deviceModel.create({
      data: {
        brandId: body.brandId,
        name: body.name,
        modelNumber: body.modelNumber || null,
        releaseYear: body.releaseYear || null,
        deviceType: body.deviceType,
        screenSize: body.screenSize ? parseFloat(body.screenSize) : null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
      include: {
        brand: true
      }
    })
    return NextResponse.json(deviceModel, { status: 201 })
  } catch (error) {
    console.error('Error creating device model:', error)
    return NextResponse.json({ error: 'Failed to create device model' }, { status: 500 })
  }
}
