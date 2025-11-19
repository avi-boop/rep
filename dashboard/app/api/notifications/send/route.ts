import { NextRequest, NextResponse } from 'next/server'
import { sendNotification, getNotificationStatus } from '@/lib/notifications'
import { prisma } from '@/lib/db'

/**
 * GET /api/notifications/send
 * Check notification service status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const notificationId = searchParams.get('notificationId')

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 })
    }

    const status = await getNotificationStatus(parseInt(notificationId))
    return NextResponse.json(status)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get notification status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications/send
 * Send a notification manually
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { repairOrderId, template, sendSMS, sendEmail } = body

    // Validate input
    if (!repairOrderId || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: repairOrderId, template' },
        { status: 400 }
      )
    }

    // Fetch repair order with customer data
    const repairOrder = await prisma.repairOrder.findUnique({
      where: { id: repairOrderId },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: true,
          },
        },
        repairOrderItems: {
          include: {
            repairType: true,
            partType: true,
          },
        },
      },
    })

    if (!repairOrder) {
      return NextResponse.json(
        { error: 'Repair order not found' },
        { status: 404 }
      )
    }

    // Prepare notification data
    const repairItems = repairOrder.repairOrderItems.map(
      (item) => `${item.repairType.name} (${item.partType.name})`
    )

    const trackingUrl = `${process.env.NEXTAUTH_URL || 'https://repair.theprofitplatform.com.au'}/track/${repairOrder.orderNumber}`

    // Send notification
    const result = await sendNotification(
      template,
      {
        customerName: `${repairOrder.customer.firstName} ${repairOrder.customer.lastName}`,
        customerEmail: repairOrder.customer.email,
        customerPhone: repairOrder.customer.phone,
        orderNumber: repairOrder.orderNumber,
        deviceModel: repairOrder.deviceModel?.name,
        deviceBrand: repairOrder.deviceModel?.brand?.name,
        totalPrice: repairOrder.totalPrice || 0,
        repairItems,
        trackingUrl,
        estimatedCompletion: repairOrder.estimatedCompletion?.toLocaleString(),
        actualCompletion: repairOrder.actualCompletion?.toLocaleString(),
      },
      {
        sendSMS: sendSMS !== false,
        sendEmail: sendEmail !== false,
      }
    )

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification', details: error.message },
      { status: 500 }
    )
  }
}
