import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/repair-types - List all repair types
export async function GET(request: NextRequest) {
  try {
    const repairTypes = await prisma.repairType.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: repairTypes,
      count: repairTypes.length,
    })
  } catch (error: any) {
    console.error('Error fetching repair types:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch repair types',
      },
      { status: 500 }
    )
  }
}
