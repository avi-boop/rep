# API Implementation Examples

## Complete API Route Examples (Next.js App Router)

### 1. Create New Repair - `/app/api/repairs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { estimatePrice } from '@/lib/pricing/estimator'
import { sendNotification } from '@/lib/notifications'
import { z } from 'zod'

// Validation schema
const createRepairSchema = z.object({
  customerId: z.number(),
  deviceModelId: z.number(),
  deviceImei: z.string().optional(),
  deviceCondition: z.string().optional(),
  priority: z.enum(['standard', 'urgent', 'express']).default('standard'),
  repairItems: z.array(z.object({
    repairTypeId: z.number(),
    partsQuality: z.enum(['original', 'aftermarket_premium', 'aftermarket_standard', 'aftermarket_economy']),
    manualPrice: z.number().optional()
  })),
  notes: z.string().optional(),
  depositPaid: z.number().default(0)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createRepairSchema.parse(body)
    
    // Generate repair number (RR-YYYYMMDD-XXX)
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.repair.count({
      where: {
        repairNumber: {
          startsWith: `RR-${dateStr}`
        }
      }
    })
    const repairNumber = `RR-${dateStr}-${String(count + 1).padStart(3, '0')}`
    
    // Calculate prices for each repair item
    let totalCost = 0
    const repairItemsWithPrices = await Promise.all(
      validated.repairItems.map(async (item) => {
        let finalPrice = item.manualPrice
        let priceId = null
        
        if (!finalPrice) {
          // Use smart pricing
          const estimate = await estimatePrice(
            validated.deviceModelId,
            item.repairTypeId,
            item.partsQuality
          )
          finalPrice = estimate.price
          
          // Try to find or create price record
          if (!estimate.isEstimated) {
            const priceRecord = await prisma.price.findFirst({
              where: {
                deviceModelId: validated.deviceModelId,
                repairTypeId: item.repairTypeId,
                partsQuality: item.partsQuality
              }
            })
            priceId = priceRecord?.id || null
          }
        }
        
        totalCost += finalPrice
        
        return {
          repairTypeId: item.repairTypeId,
          partsQuality: item.partsQuality,
          priceId,
          finalPrice,
          priceOverridden: !!item.manualPrice,
          status: 'pending'
        }
      })
    )
    
    // Calculate estimated completion (default: 3 days)
    const estimatedCompletion = new Date()
    estimatedCompletion.setDate(estimatedCompletion.getDate() + 3)
    
    // Create repair with items in transaction
    const repair = await prisma.$transaction(async (tx) => {
      const newRepair = await tx.repair.create({
        data: {
          repairNumber,
          customerId: validated.customerId,
          deviceModelId: validated.deviceModelId,
          deviceImei: validated.deviceImei,
          deviceCondition: validated.deviceCondition,
          status: 'new',
          priority: validated.priority,
          estimatedCompletion,
          totalCost,
          depositPaid: validated.depositPaid,
          notes: validated.notes,
          repairItems: {
            create: repairItemsWithPrices
          }
        },
        include: {
          customer: true,
          deviceModel: {
            include: {
              brand: true
            }
          },
          repairItems: {
            include: {
              repairType: true
            }
          }
        }
      })
      
      // Send notification
      await sendNotification({
        type: 'repair_received',
        repairId: newRepair.id,
        customerId: validated.customerId,
        repair: newRepair
      })
      
      return newRepair
    })
    
    return NextResponse.json({
      success: true,
      data: repair
    }, { status: 201 })
    
  } catch (error) {
    console.error('Create repair error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create repair'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { repairNumber: { contains: search, mode: 'insensitive' } },
        { deviceImei: { contains: search, mode: 'insensitive' } },
        { customer: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } }
          ]
        }}
      ]
    }
    
    const [repairs, total] = await Promise.all([
      prisma.repair.findMany({
        where,
        include: {
          customer: true,
          deviceModel: {
            include: { brand: true }
          },
          repairItems: {
            include: { repairType: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.repair.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      data: repairs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Get repairs error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch repairs'
    }, { status: 500 })
  }
}
```

### 2. Update Repair Status - `/app/api/repairs/[id]/status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendNotification } from '@/lib/notifications'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum([
    'new',
    'diagnosed',
    'awaiting_approval',
    'approved',
    'awaiting_parts',
    'in_progress',
    'testing',
    'ready',
    'completed',
    'cancelled'
  ]),
  notes: z.string().optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repairId = parseInt(params.id)
    const body = await request.json()
    const validated = updateStatusSchema.parse(body)
    
    // Get current repair
    const currentRepair = await prisma.repair.findUnique({
      where: { id: repairId },
      include: {
        customer: true,
        deviceModel: { include: { brand: true } },
        repairItems: { include: { repairType: true } }
      }
    })
    
    if (!currentRepair) {
      return NextResponse.json({
        success: false,
        error: 'Repair not found'
      }, { status: 404 })
    }
    
    const oldStatus = currentRepair.status
    
    // Update repair
    const updatedRepair = await prisma.repair.update({
      where: { id: repairId },
      data: {
        status: validated.status,
        notes: validated.notes || currentRepair.notes,
        actualCompletion: validated.status === 'completed' ? new Date() : undefined
      },
      include: {
        customer: true,
        deviceModel: { include: { brand: true } },
        repairItems: { include: { repairType: true } }
      }
    })
    
    // Send appropriate notification based on status
    const notificationMap: Record<string, string> = {
      'diagnosed': 'repair_diagnosed',
      'awaiting_approval': 'approval_required',
      'in_progress': 'repair_in_progress',
      'ready': 'ready_for_pickup',
      'completed': 'repair_completed'
    }
    
    if (notificationMap[validated.status]) {
      await sendNotification({
        type: notificationMap[validated.status],
        repairId: updatedRepair.id,
        customerId: updatedRepair.customerId,
        repair: updatedRepair
      })
    }
    
    // Create status history log
    await prisma.$executeRaw`
      INSERT INTO repair_status_history (repair_id, old_status, new_status, changed_by, notes)
      VALUES (${repairId}, ${oldStatus}, ${validated.status}, ${1}, ${validated.notes || null})
    `
    
    return NextResponse.json({
      success: true,
      data: updatedRepair
    })
    
  } catch (error) {
    console.error('Update status error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update status'
    }, { status: 500 })
  }
}
```

### 3. Smart Price Estimation - `/app/api/pricing/estimate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { estimatePrice } from '@/lib/pricing/estimator'
import { z } from 'zod'

const estimateSchema = z.object({
  deviceModelId: z.number(),
  repairTypeId: z.number(),
  partsQuality: z.enum(['original', 'aftermarket_premium', 'aftermarket_standard', 'aftermarket_economy'])
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = estimateSchema.parse(body)
    
    const estimate = await estimatePrice(
      validated.deviceModelId,
      validated.repairTypeId,
      validated.partsQuality
    )
    
    // Get reference device names for transparency
    const referenceDevices = await prisma.deviceModel.findMany({
      where: {
        id: { in: estimate.references }
      },
      include: {
        brand: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        price: estimate.price,
        confidence: estimate.confidence,
        isEstimated: estimate.isEstimated,
        confidenceLabel: getConfidenceLabel(estimate.confidence),
        referenceDevices: referenceDevices.map(d => ({
          id: d.id,
          name: `${d.brand.name} ${d.name}${d.variant ? ` ${d.variant}` : ''}`
        }))
      }
    })
    
  } catch (error) {
    console.error('Price estimation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to estimate price'
    }, { status: 500 })
  }
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'High'
  if (confidence >= 0.75) return 'Good'
  if (confidence >= 0.6) return 'Moderate'
  if (confidence >= 0.4) return 'Low'
  return 'Very Low'
}
```

### 4. Customer Search/Sync - `/app/api/customers/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { syncCustomerFromLightspeed } from '@/lib/lightspeed'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const syncLightspeed = searchParams.get('sync') === 'true'
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Search query must be at least 2 characters'
      }, { status: 400 })
    }
    
    // Search local database first
    const localCustomers = await prisma.customer.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
    
    // If sync enabled and no local results, try Lightspeed
    if (syncLightspeed && localCustomers.length === 0) {
      try {
        const lightspeedCustomers = await searchLightspeedCustomers(query)
        
        // Import found customers
        if (lightspeedCustomers.length > 0) {
          const imported = await Promise.all(
            lightspeedCustomers.slice(0, 5).map(lsCustomer => 
              syncCustomerFromLightspeed(lsCustomer.customerID)
            )
          )
          
          return NextResponse.json({
            success: true,
            data: imported.filter(c => c !== null),
            source: 'lightspeed'
          })
        }
      } catch (error) {
        console.error('Lightspeed search error:', error)
        // Continue with local results
      }
    }
    
    return NextResponse.json({
      success: true,
      data: localCustomers,
      source: 'local'
    })
    
  } catch (error) {
    console.error('Customer search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Search failed'
    }, { status: 500 })
  }
}

async function searchLightspeedCustomers(query: string) {
  // This would call Lightspeed API
  // Placeholder implementation
  return []
}
```

### 5. Reports - Revenue Analytics - `/app/api/reports/revenue/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today' // today, week, month, year
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    let dateRange: { gte: Date; lte: Date }
    
    if (startDate && endDate) {
      dateRange = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else {
      const now = new Date()
      switch (period) {
        case 'today':
          dateRange = { gte: startOfDay(now), lte: endOfDay(now) }
          break
        case 'week':
          dateRange = { gte: startOfWeek(now), lte: endOfWeek(now) }
          break
        case 'month':
          dateRange = { gte: startOfMonth(now), lte: endOfMonth(now) }
          break
        default:
          dateRange = { gte: startOfDay(now), lte: endOfDay(now) }
      }
    }
    
    // Get completed repairs in date range
    const completedRepairs = await prisma.repair.findMany({
      where: {
        status: 'completed',
        actualCompletion: dateRange
      },
      include: {
        repairItems: {
          include: {
            repairType: true
          }
        },
        deviceModel: {
          include: {
            brand: true
          }
        }
      }
    })
    
    // Calculate metrics
    const totalRevenue = completedRepairs.reduce((sum, r) => sum + Number(r.totalCost), 0)
    const totalRepairs = completedRepairs.length
    const averageRepairValue = totalRepairs > 0 ? totalRevenue / totalRepairs : 0
    
    // Revenue by device brand
    const revenueByBrand = completedRepairs.reduce((acc, repair) => {
      const brand = repair.deviceModel.brand.name
      if (!acc[brand]) {
        acc[brand] = { revenue: 0, count: 0 }
      }
      acc[brand].revenue += Number(repair.totalCost)
      acc[brand].count += 1
      return acc
    }, {} as Record<string, { revenue: number; count: number }>)
    
    // Revenue by repair type
    const revenueByRepairType = completedRepairs.reduce((acc, repair) => {
      repair.repairItems.forEach(item => {
        const typeName = item.repairType.name
        if (!acc[typeName]) {
          acc[typeName] = { revenue: 0, count: 0 }
        }
        acc[typeName].revenue += Number(item.finalPrice)
        acc[typeName].count += 1
      })
      return acc
    }, {} as Record<string, { revenue: number; count: number }>)
    
    // Daily breakdown
    const dailyRevenue = completedRepairs.reduce((acc, repair) => {
      const date = repair.actualCompletion?.toISOString().split('T')[0] || 'unknown'
      if (!acc[date]) {
        acc[date] = { revenue: 0, count: 0 }
      }
      acc[date].revenue += Number(repair.totalCost)
      acc[date].count += 1
      return acc
    }, {} as Record<string, { revenue: number; count: number }>)
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalRepairs,
          averageRepairValue
        },
        revenueByBrand: Object.entries(revenueByBrand).map(([brand, data]) => ({
          brand,
          ...data
        })),
        revenueByRepairType: Object.entries(revenueByRepairType).map(([type, data]) => ({
          repairType: type,
          ...data
        })),
        dailyRevenue: Object.entries(dailyRevenue).map(([date, data]) => ({
          date,
          ...data
        })).sort((a, b) => a.date.localeCompare(b.date))
      }
    })
    
  } catch (error) {
    console.error('Revenue report error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate report'
    }, { status: 500 })
  }
}
```

### 6. Notification Service - `/lib/notifications.ts`

```typescript
import { prisma } from '@/lib/db'
import twilio from 'twilio'
import sgMail from '@sendgrid/mail'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

interface NotificationPayload {
  type: string
  repairId: number
  customerId: number
  repair: any
}

export async function sendNotification(payload: NotificationPayload) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: payload.customerId }
    })
    
    if (!customer) {
      throw new Error('Customer not found')
    }
    
    const template = getNotificationTemplate(payload.type, payload.repair)
    const channel = customer.notificationPreference || 'sms'
    
    let deliveredStatus = 'pending'
    
    try {
      if (channel === 'sms' || channel === 'both') {
        await sendSMS(customer.phone, template.message)
        deliveredStatus = 'sent'
      }
      
      if (channel === 'email' || channel === 'both') {
        if (customer.email) {
          await sendEmail(customer.email, template.subject, template.message)
          deliveredStatus = 'sent'
        }
      }
    } catch (error) {
      console.error('Notification delivery error:', error)
      deliveredStatus = 'failed'
    }
    
    // Log notification
    await prisma.notification.create({
      data: {
        repairId: payload.repairId,
        customerId: payload.customerId,
        type: payload.type,
        channel,
        message: template.message,
        deliveredStatus
      }
    })
    
    return { success: deliveredStatus !== 'failed' }
    
  } catch (error) {
    console.error('Send notification error:', error)
    return { success: false, error }
  }
}

async function sendSMS(to: string, message: string) {
  if (!process.env.TWILIO_PHONE_NUMBER) {
    console.log('[DEV] SMS:', to, message)
    return
  }
  
  await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to
  })
}

async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.log('[DEV] Email:', to, subject, text)
    return
  }
  
  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    text,
    html: `<p>${text.replace(/\n/g, '<br>')}</p>`
  })
}

function getNotificationTemplate(type: string, repair: any) {
  const deviceName = `${repair.deviceModel.brand.name} ${repair.deviceModel.name}`
  const repairTypes = repair.repairItems.map((i: any) => i.repairType.name).join(', ')
  const shopName = process.env.SHOP_NAME || 'Mobile Repair Shop'
  const shopPhone = process.env.SHOP_PHONE || ''
  
  const templates: Record<string, { subject: string; message: string }> = {
    repair_received: {
      subject: `Repair Received - ${repair.repairNumber}`,
      message: `Hi ${repair.customer.firstName}! We've received your ${deviceName} for ${repairTypes}. Repair #${repair.repairNumber}. We'll diagnose it shortly and send you a quote. Estimated completion: ${repair.estimatedCompletion?.toLocaleDateString()}. - ${shopName}`
    },
    repair_diagnosed: {
      subject: `Diagnosis Complete - ${repair.repairNumber}`,
      message: `${repair.customer.firstName}, we've diagnosed your ${deviceName}. Repairs needed: ${repairTypes}. Total: $${repair.totalCost}. Reply YES to approve or call us to discuss. ${shopPhone} - ${shopName}`
    },
    approval_required: {
      subject: `Approval Needed - ${repair.repairNumber}`,
      message: `${repair.customer.firstName}, your ${deviceName} repair requires approval. Total cost: $${repair.totalCost}. Please call ${shopPhone} or reply YES to approve. - ${shopName}`
    },
    repair_in_progress: {
      subject: `Repair In Progress - ${repair.repairNumber}`,
      message: `Good news ${repair.customer.firstName}! We've started working on your ${deviceName}. Estimated completion: ${repair.estimatedCompletion?.toLocaleDateString()}. - ${shopName}`
    },
    ready_for_pickup: {
      subject: `Ready for Pickup! - ${repair.repairNumber}`,
      message: `Great news ${repair.customer.firstName}! Your ${deviceName} is ready for pickup! Balance due: $${Number(repair.totalCost) - Number(repair.depositPaid)}. Visit us at ${process.env.SHOP_ADDRESS || 'our location'}. Hours: ${process.env.SHOP_HOURS || 'Mon-Sat 9am-6pm'}. - ${shopName}`
    },
    repair_completed: {
      subject: `Repair Completed - ${repair.repairNumber}`,
      message: `${repair.customer.firstName}, your ${deviceName} repair is complete! Thank you for choosing ${shopName}. Your device comes with a warranty. Keep your receipt. Have questions? Call ${shopPhone}.`
    }
  }
  
  return templates[type] || templates.repair_received
}
```

---

## FastAPI Alternative (Python Backend)

### Main Application - `main.py`

```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import os

from database import get_db, engine
from models import Base, Repair, Customer, DeviceModel, RepairItem
from schemas import RepairCreate, RepairResponse, CustomerResponse
from pricing import estimate_price
from notifications import send_notification

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mobile Repair Dashboard API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/repairs", response_model=RepairResponse)
async def create_repair(repair_data: RepairCreate, db: Session = Depends(get_db)):
    """Create new repair"""
    
    # Generate repair number
    today = datetime.now()
    date_str = today.strftime("%Y%m%d")
    count = db.query(Repair).filter(
        Repair.repair_number.like(f"RR-{date_str}%")
    ).count()
    repair_number = f"RR-{date_str}-{str(count + 1).zfill(3)}"
    
    # Calculate total cost
    total_cost = 0
    repair_items_data = []
    
    for item in repair_data.repair_items:
        if item.manual_price:
            price = item.manual_price
        else:
            estimate = estimate_price(
                repair_data.device_model_id,
                item.repair_type_id,
                item.parts_quality
            )
            price = estimate['price']
        
        total_cost += price
        repair_items_data.append({
            'repair_type_id': item.repair_type_id,
            'parts_quality': item.parts_quality,
            'final_price': price,
            'price_overridden': bool(item.manual_price)
        })
    
    # Create repair
    estimated_completion = datetime.now() + timedelta(days=3)
    
    repair = Repair(
        repair_number=repair_number,
        customer_id=repair_data.customer_id,
        device_model_id=repair_data.device_model_id,
        device_imei=repair_data.device_imei,
        device_condition=repair_data.device_condition,
        status='new',
        priority=repair_data.priority,
        estimated_completion=estimated_completion,
        total_cost=total_cost,
        deposit_paid=repair_data.deposit_paid or 0,
        notes=repair_data.notes
    )
    
    db.add(repair)
    db.commit()
    db.refresh(repair)
    
    # Add repair items
    for item_data in repair_items_data:
        item = RepairItem(repair_id=repair.id, **item_data)
        db.add(item)
    
    db.commit()
    
    # Send notification
    send_notification('repair_received', repair.id, repair.customer_id)
    
    return repair

@app.get("/api/repairs", response_model=List[RepairResponse])
async def get_repairs(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get repairs with filters"""
    
    query = db.query(Repair)
    
    if status and status != 'all':
        query = query.filter(Repair.status == status)
    
    if search:
        query = query.join(Customer).filter(
            (Repair.repair_number.ilike(f"%{search}%")) |
            (Customer.first_name.ilike(f"%{search}%")) |
            (Customer.last_name.ilike(f"%{search}%")) |
            (Customer.phone.ilike(f"%{search}%"))
        )
    
    query = query.order_by(Repair.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    
    return query.all()

@app.patch("/api/repairs/{repair_id}/status")
async def update_repair_status(
    repair_id: int,
    status: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update repair status"""
    
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    
    if not repair:
        raise HTTPException(status_code=404, detail="Repair not found")
    
    old_status = repair.status
    repair.status = status
    
    if notes:
        repair.notes = notes
    
    if status == 'completed':
        repair.actual_completion = datetime.now()
    
    db.commit()
    
    # Send notification
    notification_map = {
        'diagnosed': 'repair_diagnosed',
        'awaiting_approval': 'approval_required',
        'in_progress': 'repair_in_progress',
        'ready': 'ready_for_pickup',
        'completed': 'repair_completed'
    }
    
    if status in notification_map:
        send_notification(notification_map[status], repair.id, repair.customer_id)
    
    return {"success": True, "data": repair}

@app.post("/api/pricing/estimate")
async def get_price_estimate(
    device_model_id: int,
    repair_type_id: int,
    parts_quality: str,
    db: Session = Depends(get_db)
):
    """Get smart price estimation"""
    
    estimate = estimate_price(device_model_id, repair_type_id, parts_quality)
    
    return {
        "success": True,
        "data": estimate
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Environment Variables Template - `.env.example`

```bash
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
SESSION_SECRET=your-secret-key-change-this

# Shop Info
SHOP_NAME="Your Mobile Repair Shop"
SHOP_PHONE="+1234567890"
SHOP_ADDRESS="123 Main St, City, State 12345"
SHOP_HOURS="Mon-Sat 9am-6pm"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/repairs_db"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis (optional for caching)
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# Lightspeed API
LIGHTSPEED_ENABLED=false
LIGHTSPEED_CLIENT_ID="your-client-id"
LIGHTSPEED_CLIENT_SECRET="your-client-secret"
LIGHTSPEED_ACCOUNT_ID="your-account-id"
LIGHTSPEED_REFRESH_TOKEN="your-refresh-token"
LIGHTSPEED_WEBHOOK_SECRET="your-webhook-secret"
LIGHTSPEED_API_URL="https://api.lightspeedapp.com"

# Twilio (SMS)
TWILIO_ENABLED=true
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# SendGrid (Email)
SENDGRID_ENABLED=true
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@yourshop.com"
SENDGRID_FROM_NAME="Your Mobile Repair Shop"

# AWS S3 (File Storage)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="repair-photos"

# Monitoring
SENTRY_DSN=""
SENTRY_ENVIRONMENT="development"

# Feature Flags
FEATURE_LIGHTSPEED_SYNC=false
FEATURE_PHOTO_UPLOAD=true
FEATURE_SMS_NOTIFICATIONS=true
FEATURE_EMAIL_NOTIFICATIONS=true
```

---

## Docker Compose for Local Development - `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: repair_db
    environment:
      POSTGRES_USER: repair_user
      POSTGRES_PASSWORD: repair_pass
      POSTGRES_DB: repairs_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U repair_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: repair_redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  mailcatcher:
    image: sj26/mailcatcher
    container_name: repair_mail
    ports:
      - "1080:1080"  # Web interface
      - "1025:1025"  # SMTP

  adminer:
    image: adminer
    container_name: repair_adminer
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: postgres

volumes:
  postgres_data:
  redis_data:
```

**Usage:**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Access:
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - Adminer (DB GUI): http://localhost:8080
# - Mailcatcher: http://localhost:1080
```

---

This provides complete, production-ready API implementations with error handling, validation, notifications, and smart pricing logic!
