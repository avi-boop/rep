import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { normalizePhone } from '@/lib/utils/phone'

/**
 * Check if a customer with the given phone number already exists
 * Uses normalized phone numbers for accurate matching
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const rawPhone = searchParams.get('phone')

    if (!rawPhone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Normalize phone number for consistent matching
    const normalizedPhone = normalizePhone(rawPhone)

    if (!normalizedPhone || normalizedPhone.length < 10) {
      return NextResponse.json(
        { exists: false, customer: null }
      )
    }

    // Find customer with matching normalized phone
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: normalizedPhone
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      }
    })

    if (existingCustomer) {
      return NextResponse.json({
        exists: true,
        customer: existingCustomer
      })
    }

    return NextResponse.json({
      exists: false,
      customer: null
    })
  } catch (error) {
    console.error('Error checking for duplicate customer:', error)
    const message = error instanceof Error ? error.message : 'Failed to check for duplicate'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
