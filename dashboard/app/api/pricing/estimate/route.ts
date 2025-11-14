import { NextRequest, NextResponse } from 'next/server'
import { estimatePrice, saveEstimatedPrice } from '@/lib/pricing-estimator'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  // Require authentication
  const auth = requireAuth(request)
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const body = await request.json()
    
    const estimate = await estimatePrice(
      body.deviceModelId,
      body.repairTypeId,
      body.partTypeId
    )

    // Optionally save the estimate to database
    if (body.save && estimate.isEstimated) {
      await saveEstimatedPrice(
        body.deviceModelId,
        body.repairTypeId,
        body.partTypeId,
        estimate
      )
    }

    return NextResponse.json({
      ...estimate,
      deviceModelId: body.deviceModelId,
      repairTypeId: body.repairTypeId,
      partTypeId: body.partTypeId
    })
  } catch (error: any) {
    console.error('Error estimating price:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to estimate price' },
      { status: 500 }
    )
  }
}
