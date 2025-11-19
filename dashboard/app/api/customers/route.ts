import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lightspeedService } from '@/lib/lightspeed'
import { createCustomerSchema, customerSearchSchema } from '@/lib/validations/customer'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const rawSearch = searchParams.get('search')
    const rawHasActiveRepairs = searchParams.get('hasActiveRepairs')

    // Validate search parameters
    const validationResult = customerSearchSchema.safeParse({
      search: rawSearch || undefined,
      hasActiveRepairs: rawHasActiveRepairs || undefined
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { search, hasActiveRepairs } = validationResult.data

    const where: Prisma.CustomerWhereInput = {}

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
      },
      take: 100 // Limit results to prevent performance issues
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch customers'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()

    const validationResult = createCustomerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Check for duplicate phone number before creating (server-side check to prevent race conditions)
    if (validatedData.phone && validatedData.phone.trim()) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          phone: validatedData.phone
        }
      })

      if (existingCustomer) {
        return NextResponse.json(
          {
            error: 'A customer with this phone number already exists',
            duplicate: true,
            customer: {
              id: existingCustomer.id,
              firstName: existingCustomer.firstName,
              lastName: existingCustomer.lastName,
              phone: existingCustomer.phone,
              email: existingCustomer.email,
            }
          },
          { status: 409 } // 409 Conflict
        )
      }
    }

    // Create customer in local database first
    const customer = await prisma.customer.create({
      data: {
        firstName: validatedData.firstName || '',
        lastName: validatedData.lastName || '',
        phone: validatedData.phone || '',
        email: validatedData.email || null,
        notes: validatedData.notes || null,
        notificationPreferences: JSON.stringify(
          validatedData.notificationPreferences ||
          { sms: true, email: true, push: false }
        ),
      }
    })

    // Sync to Lightspeed if configured (non-blocking)
    if (lightspeedService.isConfigured()) {
      try {
        const lightspeedCustomer = await lightspeedService.createCustomer({
          firstName: validatedData.firstName || '',
          lastName: validatedData.lastName || '',
          email: validatedData.email || '',
          phone: validatedData.phone || '',
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

    // Handle Prisma unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field'
      return NextResponse.json(
        { error: `A customer with this ${field} already exists` },
        { status: 400 }
      )
    }

    // Handle Zod validation errors (should be caught above, but just in case)
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Generic error
    const message = error instanceof Error ? error.message : 'Failed to create customer'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
