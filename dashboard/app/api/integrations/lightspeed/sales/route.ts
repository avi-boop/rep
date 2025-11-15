import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { lightspeedService } from '@/lib/lightspeed'

/**
 * POST /api/integrations/lightspeed/sales
 * Sync a completed repair order to Lightspeed as a sale
 */
export async function POST(request: NextRequest) {
  try {
    const { repairOrderId } = await request.json()

    if (!repairOrderId) {
      return NextResponse.json(
        { error: 'repairOrderId is required' },
        { status: 400 }
      )
    }

    // Check if Lightspeed is configured
    if (!lightspeedService.isConfigured()) {
      return NextResponse.json(
        { error: 'Lightspeed POS not configured' },
        { status: 400 }
      )
    }

    // Get repair order with all details
    const repair = await prisma.repairOrder.findUnique({
      where: { id: parseInt(repairOrderId) },
      include: {
        customer: true,
        deviceModel: {
          include: { brand: true }
        },
        repairOrderItems: {
          include: {
            repairType: true,
            partType: true
          }
        }
      }
    })

    if (!repair) {
      return NextResponse.json(
        { error: 'Repair order not found' },
        { status: 404 }
      )
    }

    // Check if already synced
    if (repair.lightspeedSaleId) {
      return NextResponse.json(
        {
          error: 'Repair order already synced to Lightspeed',
          saleId: repair.lightspeedSaleId
        },
        { status: 400 }
      )
    }

    // Create line items from repair items
    const items = repair.repairOrderItems.map(item => ({
      name: `${repair.deviceModel.brand.name} ${repair.deviceModel.name} - ${item.repairType.name}${item.partType ? ` (${item.partType.name})` : ''}`,
      price: item.unitPrice,
      quantity: item.quantity,
      sku: `REPAIR-${repair.deviceModel.id}-${item.repairType.id}${item.partType ? `-${item.partType.id}` : ''}`
    }))

    // Create sale in Lightspeed
    const sale = await lightspeedService.createSale({
      customerId: repair.customer.lightspeedId || undefined,
      items,
      totalPaid: repair.totalPrice,
      paymentType: 'cash',
      note: `Repair Order #${repair.orderNumber} - ${repair.issueDescription || 'Device repair'}`
    })

    // Update repair with Lightspeed sale ID
    await prisma.repairOrder.update({
      where: { id: repair.id },
      data: {
        lightspeedSaleId: sale.id,
        syncedToLightspeed: true,
        syncedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      saleId: sale.id,
      message: 'Repair order successfully synced to Lightspeed POS'
    })

  } catch (error: any) {
    console.error('Error syncing to Lightspeed:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync to Lightspeed',
        message: error.message
      },
      { status: 500 }
    )
  }
}
