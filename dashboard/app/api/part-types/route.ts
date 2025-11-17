import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Disable caching for this API route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const partTypes = await prisma.partType.findMany({
      where: { isActive: true },
      orderBy: {
        qualityLevel: 'desc'
      }
    })

    return NextResponse.json(partTypes, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching part types:', error)
    return NextResponse.json({ error: 'Failed to fetch part types' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const partType = await prisma.partType.create({
      data: {
        name: body.name,
        qualityLevel: body.qualityLevel,
        warrantyMonths: body.warrantyMonths || 3,
        description: body.description || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      }
    })
    return NextResponse.json(partType, { status: 201 })
  } catch (error) {
    console.error('Error creating part type:', error)
    return NextResponse.json({ error: 'Failed to create part type' }, { status: 500 })
  }
}
