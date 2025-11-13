import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Validation schemas
const repairQuerySchema = z.object({
  status: z.enum(['pending', 'diagnosed', 'in_progress', 'waiting_parts', 'completed', 'delivered', 'cancelled']).optional(),
  customerId: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : undefined),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
  pageSize: z.string().regex(/^\d+$/).optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
})

const repairItemSchema = z.object({
  repairTypeId: z.number().int().positive(),
  partTypeId: z.number().int().positive().nullable().optional(),
  pricingId: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().positive().max(999999),
  discount: z.number().min(0).max(100).default(0),
  totalPrice: z.number().positive().max(999999),
})

const createRepairSchema = z.object({
  customerId: z.number().int().positive(),
  deviceModelId: z.number().int().positive(),
  deviceImei: z.string().regex(/^\d{15}$/).nullable().optional(),
  deviceSerial: z.string().max(100).nullable().optional(),
  devicePassword: z.string().max(100).nullable().optional(),
  status: z.enum(['pending', 'diagnosed', 'in_progress', 'waiting_parts', 'completed', 'delivered', 'cancelled']).default('pending'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  issueDescription: z.string().min(10).max(2000).nullable().optional(),
  cosmeticCondition: z.string().max(500).nullable().optional(),
  estimatedCompletion: z.string().datetime().nullable().optional(),
  totalPrice: z.number().min(0).max(999999).default(0),
  depositPaid: z.number().min(0).max(999999).default(0),
  items: z.array(repairItemSchema).min(1, 'At least one repair item is required'),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryData = Object.fromEntries(searchParams.entries())
    
    // Validate query parameters
    const validatedQuery = repairQuerySchema.parse(queryData)
    const { page, pageSize, ...filters } = validatedQuery

    const where: Prisma.RepairOrderWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.priority && { priority: filters.priority }),
    }

    // Pagination
    const skip = (page - 1) * pageSize
    
    const [repairs, total] = await Promise.all([
      prisma.repairOrder.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          customer: true,
          deviceModel: {
            include: {
              brand: true
            }
          },
          repairOrderItems: {
            include: {
              repairType: true,
              partType: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.repairOrder.count({ where })
    ])

    return NextResponse.json({
      data: repairs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid query parameters', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error fetching repairs:', error)
    return NextResponse.json({ 
      error: 'An error occurred while fetching repairs' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createRepairSchema.parse(body)
    
    // Generate unique order number
    const orderNumber = generateOrderNumber()

    // Create repair order with items
    const repair = await prisma.repairOrder.create({
      data: {
        orderNumber,
        customerId: validatedData.customerId,
        deviceModelId: validatedData.deviceModelId,
        deviceImei: validatedData.deviceImei ?? null,
        deviceSerial: validatedData.deviceSerial ?? null,
        devicePassword: validatedData.devicePassword ?? null,
        status: validatedData.status,
        priority: validatedData.priority,
        issueDescription: validatedData.issueDescription ?? null,
        cosmeticCondition: validatedData.cosmeticCondition ?? null,
        estimatedCompletion: validatedData.estimatedCompletion ? new Date(validatedData.estimatedCompletion) : null,
        totalPrice: validatedData.totalPrice,
        depositPaid: validatedData.depositPaid,
        repairOrderItems: {
          create: validatedData.items.map(item => ({
            repairTypeId: item.repairTypeId,
            partTypeId: item.partTypeId ?? null,
            pricingId: item.pricingId ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            totalPrice: item.totalPrice,
            status: 'pending'
          }))
        }
      },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: true
          }
        },
        repairOrderItems: {
          include: {
            repairType: true,
            partType: true
          }
        }
      }
    })

    return NextResponse.json({ data: repair }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 })
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json({ 
          error: 'Invalid customer ID, device model ID, or repair type ID' 
        }, { status: 400 })
      }
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'A repair order with this order number already exists' 
        }, { status: 409 })
      }
    }
    
    console.error('Error creating repair:', error)
    return NextResponse.json({ 
      error: 'An error occurred while creating repair order' 
    }, { status: 500 })
  }
}
