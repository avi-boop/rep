import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateOrderNumber } from '@/lib/utils'
import { notifyRepairStatus } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')

    const where: any = {}
    if (status) where.status = status
    if (customerId) where.customerId = parseInt(customerId)

    const repairs = await prisma.repairOrder.findMany({
      where,
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
    })

    return NextResponse.json(repairs)
  } catch (error) {
    console.error('Error fetching repairs:', error)
    return NextResponse.json({ error: 'Failed to fetch repairs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Generate unique order number
    const orderNumber = generateOrderNumber()

    // Create repair order with items
    const repair = await prisma.repairOrder.create({
      data: {
        orderNumber,
        customerId: body.customerId,
        deviceModelId: body.deviceModelId,
        deviceImei: body.deviceImei || null,
        deviceSerial: body.deviceSerial || null,
        devicePassword: body.devicePassword || null,
        status: body.status || 'pending',
        priority: body.priority || 'normal',
        issueDescription: body.issueDescription || null,
        cosmeticCondition: body.cosmeticCondition || null,
        estimatedCompletion: body.estimatedCompletion ? new Date(body.estimatedCompletion) : null,
        totalPrice: body.totalPrice || 0,
        depositPaid: body.depositPaid || 0,
        repairOrderItems: {
          create: body.items?.map((item: any) => ({
            repairTypeId: item.repairTypeId,
            partTypeId: item.partTypeId,
            pricingId: item.pricingId || null,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            totalPrice: item.totalPrice,
            status: 'pending'
          })) || []
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

    // Send notification to customer
    let notificationResult = null
    try {
      notificationResult = await notifyRepairStatus(
        repair.customer.id,
        {
          firstName: repair.customer.firstName,
          lastName: repair.customer.lastName,
          email: repair.customer.email,
          phone: repair.customer.phone,
          notificationPreferences: repair.customer.notificationPreferences,
        },
        {
          orderNumber: repair.orderNumber,
          deviceModel: repair.deviceModel?.name,
          deviceBrand: repair.deviceModel?.brand?.name,
          status: repair.status,
          totalPrice: repair.totalPrice || undefined,
          estimatedCompletion: repair.estimatedCompletion?.toLocaleDateString(),
        },
        'created'
      )
    } catch (notificationError) {
      // Log error but don't fail the repair creation
      console.error('Failed to send notification:', notificationError)
    }

    return NextResponse.json({
      repair,
      notifications: notificationResult || { sms: { sent: false }, email: { sent: false } }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating repair:', error)
    return NextResponse.json({ error: 'Failed to create repair' }, { status: 500 })
  }
}
