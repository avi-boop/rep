import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { lightspeedService } from '@/lib/lightspeed'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const hasActiveRepairs = searchParams.get('hasActiveRepairs') === 'true'

    const where: any = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter for customers with active repairs (status not 'completed' or 'cancelled')
    if (hasActiveRepairs) {
      where.repairOrders = {
        some: {
          status: {
            notIn: ['completed', 'cancelled']
          }
        }
      }
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { repairOrders: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Create customer in local database first
    const customer = await prisma.customer.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email || null,
        notes: body.notes || null,
        notificationPreferences: JSON.stringify(body.notificationPreferences || { sms: true, email: true, push: false }),
      }
    })

    // Sync to Lightspeed if configured (non-blocking)
    if (lightspeedService.isConfigured()) {
      try {
        const lightspeedCustomer = await lightspeedService.createCustomer({
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email || '',
          phone: body.phone,
        })

        // Update local customer with Lightspeed ID
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            lightspeedId: lightspeedCustomer.id,
            lastSyncedAt: new Date(),
          }
        })

        console.log(`Customer synced to Lightspeed: ${lightspeedCustomer.id}`)
      } catch (lightspeedError: any) {
        // Log error but don't fail the request
        console.error('Failed to sync customer to Lightspeed:', lightspeedError.message)
      }
    }

    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    console.error('Error creating customer:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Phone number already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
