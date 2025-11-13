import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: {
        isPrimary: 'desc'
      },
      include: {
        _count: {
          select: { deviceModels: true }
        }
      }
    })
    return NextResponse.json(brands)
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const brand = await prisma.brand.create({
      data: {
        name: body.name,
        isPrimary: body.isPrimary || false,
        logoUrl: body.logoUrl || null,
      }
    })
    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
  }
}
