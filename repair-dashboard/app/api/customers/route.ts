import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/customers - List customers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        repairs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: customers,
      count: customers.length,
    })
  } catch (error: any) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch customers',
      },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, phone, email, notificationPreference } = body

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        notificationPreference: notificationPreference || 'sms',
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: customer,
        message: 'Customer created successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create customer',
      },
      { status: 500 }
    )
  }
}
