import { NextRequest, NextResponse } from 'next/server';
import { lightspeedService } from '@/lib/lightspeed';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/integrations/lightspeed/pricing
 * Sync a repair price to Lightspeed POS
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pricingId } = body;

    if (!pricingId) {
      return NextResponse.json(
        { error: 'Pricing ID required' },
        { status: 400 }
      );
    }

    if (!lightspeedService.isConfigured()) {
      return NextResponse.json(
        { error: 'Lightspeed not configured. Please add your API credentials in settings.' },
        { status: 400 }
      );
    }

    // Get pricing details
    const pricing = await prisma.pricing.findUnique({
      where: { id: parseInt(pricingId) },
      include: {
        deviceModel: {
          include: {
            brand: true,
          },
        },
        repairType: true,
        partType: true,
      },
    });

    if (!pricing) {
      return NextResponse.json(
        { error: 'Pricing not found' },
        { status: 404 }
      );
    }

    // Build description for Lightspeed item
    const description = `${pricing.deviceModel.brand.name} ${pricing.deviceModel.name} - ${pricing.repairType.name}${pricing.partType ? ` (${pricing.partType.name})` : ''}`;

    // Sync to Lightspeed
    const lightspeedItem = await lightspeedService.syncPricing({
      description,
      price: pricing.price,
      cost: pricing.cost || undefined,
      lightspeedItemId: undefined, // TODO: Store and use existing Lightspeed item ID
    });

    return NextResponse.json({
      success: true,
      lightspeedItemId: lightspeedItem.id,
      message: 'Price synced to Lightspeed successfully',
    });

  } catch (error: any) {
    console.error('Lightspeed pricing sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync pricing' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/lightspeed/pricing
 * Get items from Lightspeed for comparison
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!lightspeedService.isConfigured()) {
      return NextResponse.json(
        { error: 'Lightspeed not configured' },
        { status: 400 }
      );
    }

    const items = await lightspeedService.getItems(limit, offset);

    return NextResponse.json({ items });

  } catch (error: any) {
    console.error('Error fetching Lightspeed items:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
