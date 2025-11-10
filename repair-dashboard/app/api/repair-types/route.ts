import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const repairTypes = await prisma.repairType.findMany({
      where: { isActive: true },
      orderBy: {
        category: 'asc'
      }
    })
    return NextResponse.json(repairTypes)
  } catch (error) {
    console.error('Error fetching repair types:', error)
    return NextResponse.json({ error: 'Failed to fetch repair types' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const repairType = await prisma.repairType.create({
      data: {
        name: body.name,
        category: body.category || null,
        description: body.description || null,
        estimatedDuration: body.estimatedDuration || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      }
    })
    return NextResponse.json(repairType, { status: 201 })
  } catch (error) {
    console.error('Error creating repair type:', error)
    return NextResponse.json({ error: 'Failed to create repair type' }, { status: 500 })
  }
}
