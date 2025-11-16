import { NextRequest, NextResponse } from 'next/server';
import { lightspeedService } from '@/lib/lightspeed';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/integrations/lightspeed/customers
 * Fetch customers from Lightspeed and sync to local database
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!lightspeedService.isConfigured()) {
      return NextResponse.json(
        { error: 'Lightspeed not configured. Please add your API credentials in settings.' },
        { status: 400 }
      );
    }

    if (action === 'sync') {
      // Fetch customers from Lightspeed and sync to local database
      const lightspeedCustomers = await lightspeedService.getCustomers(limit, offset);

      const syncedCustomers = [];
      for (const lsCustomer of lightspeedCustomers) {
        if (!lsCustomer.id) continue;

        // Check if customer already exists
        const existing = await prisma.customer.findUnique({
          where: { lightspeedId: lsCustomer.id },
        });

        if (existing) {
          // Update existing customer
          const updated = await prisma.customer.update({
            where: { id: existing.id },
            data: {
              firstName: lsCustomer.firstName,
              lastName: lsCustomer.lastName,
              email: lsCustomer.emailAddress || null,
              phone: lsCustomer.primaryPhone || existing.phone,
              lastSyncedAt: new Date(),
            },
          });
          syncedCustomers.push({ action: 'updated', customer: updated });
        } else {
          // Create new customer (only if phone number provided)
          if (lsCustomer.primaryPhone) {
            const created = await prisma.customer.create({
              data: {
                lightspeedId: lsCustomer.id,
                firstName: lsCustomer.firstName,
                lastName: lsCustomer.lastName,
                email: lsCustomer.emailAddress || null,
                phone: lsCustomer.primaryPhone,
                lastSyncedAt: new Date(),
              },
            });
            syncedCustomers.push({ action: 'created', customer: created });
          }
        }
      }

      return NextResponse.json({
        success: true,
        synced: syncedCustomers.length,
        customers: syncedCustomers,
      });
    }

    // Default: just list Lightspeed customers
    const customers = await lightspeedService.getCustomers(limit, offset);
    return NextResponse.json({ customers });

  } catch (error: any) {
    console.error('Lightspeed customer sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync customers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/lightspeed/customers
 * Create a new customer in both Lightspeed and local database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone } = body;

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'First name, last name, and phone are required' },
        { status: 400 }
      );
    }

    if (!lightspeedService.isConfigured()) {
      return NextResponse.json(
        { error: 'Lightspeed not configured' },
        { status: 400 }
      );
    }

    // Create in Lightspeed first
    const lightspeedCustomer = await lightspeedService.createCustomer({
      firstName,
      lastName,
      email,
      phone,
    });

    // Create in local database
    const localCustomer = await prisma.customer.create({
      data: {
        lightspeedId: lightspeedCustomer.id,
        firstName,
        lastName,
        email: email || null,
        phone,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      customer: localCustomer,
      lightspeedId: lightspeedCustomer.id,
    });

  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrations/lightspeed/customers
 * Update a customer in both Lightspeed and local database
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, lightspeedId, updates } = body;

    if (!customerId || !lightspeedId) {
      return NextResponse.json(
        { error: 'Customer ID and Lightspeed ID required' },
        { status: 400 }
      );
    }

    if (!lightspeedService.isConfigured()) {
      return NextResponse.json(
        { error: 'Lightspeed not configured' },
        { status: 400 }
      );
    }

    // Update in Lightspeed
    await lightspeedService.updateCustomer(lightspeedId, updates);

    // Update in local database
    const localCustomer = await prisma.customer.update({
      where: { id: parseInt(customerId) },
      data: {
        ...updates,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      customer: localCustomer,
    });

  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: 500 }
    );
  }
}
