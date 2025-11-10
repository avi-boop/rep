import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const repairTypes = await prisma.repairType.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { prices: true, repairItems: true },
        },
      },
    })

    return NextResponse.json({ repairTypes })
  } catch (error) {
    console.error('Error fetching repair types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repair types' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, category, complexityLevel, avgTimeMinutes } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Required fields: name, category' },
        { status: 400 }
      )
    }

    const repairType = await prisma.repairType.create({
      data: {
        name,
        category,
        complexityLevel: complexityLevel || 3,
        avgTimeMinutes: avgTimeMinutes || 45,
      },
    })

    return NextResponse.json({ repairType }, { status: 201 })
  } catch (error) {
    console.error('Error creating repair type:', error)
    return NextResponse.json(
      { error: 'Failed to create repair type' },
      { status: 500 }
    )
  }
}
