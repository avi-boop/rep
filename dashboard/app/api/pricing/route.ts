import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Input validation schemas
const pricingQuerySchema = z.object({
  deviceModelId: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : undefined),
  repairTypeId: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : undefined),
  partTypeId: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : undefined),
  page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
  pageSize: z.string().regex(/^\d+$/).optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
})

const createPricingSchema = z.object({
  deviceModelId: z.number().int().positive(),
  repairTypeId: z.number().int().positive(),
  partTypeId: z.number().int().positive().nullable().optional(),
  price: z.number().positive().max(999999),
  cost: z.number().positive().max(999999).nullable().optional(),
  isEstimated: z.boolean().optional().default(false),
  confidenceScore: z.number().min(0).max(1).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

const updatePricingSchema = z.object({
  id: z.number().int().positive(),
  price: z.number().positive().max(999999).optional(),
  cost: z.number().positive().max(999999).nullable().optional(),
  isEstimated: z.boolean().optional(),
  confidenceScore: z.number().min(0).max(1).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
  changeReason: z.string().max(500).optional(),
  changedBy: z.string().max(100).nullable().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryData = Object.fromEntries(searchParams.entries())
    
    const validatedQuery = pricingQuerySchema.parse(queryData)
    const { page, pageSize, ...filters } = validatedQuery

    // Build where clause safely
    const where: Prisma.PricingWhereInput = {
      isActive: true,
      ...(filters.deviceModelId && { deviceModelId: filters.deviceModelId }),
      ...(filters.repairTypeId && { repairTypeId: filters.repairTypeId }),
      ...(filters.partTypeId && { partTypeId: filters.partTypeId }),
    }

    // Pagination
    const skip = (page - 1) * pageSize
    
    const [pricing, total] = await Promise.all([
      prisma.pricing.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          deviceModel: {
            include: {
              brand: true
            }
          },
          repairType: true,
          partType: true
        },
        orderBy: [
          { deviceModel: { brand: { name: 'asc' } } },
          { deviceModel: { name: 'asc' } }
        ]
      }),
      prisma.pricing.count({ where })
    ])

    return NextResponse.json({
      data: pricing,
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
    
    console.error('Error fetching pricing:', error)
    return NextResponse.json({ 
      error: 'An error occurred while fetching pricing data' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createPricingSchema.parse(body)
    
    // Check if pricing already exists
    const existing = await prisma.pricing.findFirst({
      where: {
        deviceModelId: validatedData.deviceModelId,
        repairTypeId: validatedData.repairTypeId,
        partTypeId: validatedData.partTypeId ?? null
      }
    })

    if (existing) {
      return NextResponse.json({ 
        error: 'Pricing already exists for this device model and repair type combination' 
      }, { status: 409 })
    }

    const pricing = await prisma.pricing.create({
      data: {
        deviceModelId: validatedData.deviceModelId,
        repairTypeId: validatedData.repairTypeId,
        partTypeId: validatedData.partTypeId ?? null,
        price: validatedData.price,
        cost: validatedData.cost ?? null,
        isEstimated: validatedData.isEstimated,
        confidenceScore: validatedData.confidenceScore ?? null,
        notes: validatedData.notes ?? null,
      },
      include: {
        deviceModel: {
          include: {
            brand: true
          }
        },
        repairType: true,
        partType: true
      }
    })

    return NextResponse.json({ data: pricing }, { status: 201 })
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
          error: 'Invalid device model, repair type, or part type ID' 
        }, { status: 400 })
      }
    }
    
    console.error('Error creating pricing:', error)
    return NextResponse.json({ 
      error: 'An error occurred while creating pricing' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = updatePricingSchema.parse(body)

    // Get existing pricing for history tracking
    const existing = await prisma.pricing.findUnique({
      where: { id: validatedData.id }
    })

    if (!existing) {
      return NextResponse.json({ 
        error: 'Pricing not found' 
      }, { status: 404 })
    }

    // Track price changes in history
    const priceChanged = validatedData.price !== undefined && validatedData.price !== existing.price
    const costChanged = validatedData.cost !== undefined && validatedData.cost !== existing.cost

    if (priceChanged || costChanged) {
      await prisma.priceHistory.create({
        data: {
          pricingId: validatedData.id,
          oldPrice: existing.price,
          newPrice: validatedData.price ?? existing.price,
          oldCost: existing.cost,
          newCost: validatedData.cost ?? existing.cost,
          reason: validatedData.changeReason ?? 'Manual update via dashboard',
          changedBy: validatedData.changedBy ?? null
        }
      })
    }

    const pricing = await prisma.pricing.update({
      where: { id: validatedData.id },
      data: {
        ...(validatedData.price !== undefined && { price: validatedData.price }),
        ...(validatedData.cost !== undefined && { cost: validatedData.cost }),
        ...(validatedData.isEstimated !== undefined && { isEstimated: validatedData.isEstimated }),
        ...(validatedData.confidenceScore !== undefined && { confidenceScore: validatedData.confidenceScore }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
      include: {
        deviceModel: {
          include: {
            brand: true
          }
        },
        repairType: true,
        partType: true,
        priceHistory: {
          orderBy: { changedAt: 'desc' },
          take: 5
        }
      }
    })

    return NextResponse.json({ data: pricing })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 })
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ 
          error: 'Pricing not found' 
        }, { status: 404 })
      }
    }
    
    console.error('Error updating pricing:', error)
    return NextResponse.json({ 
      error: 'An error occurred while updating pricing' 
    }, { status: 500 })
  }
}
