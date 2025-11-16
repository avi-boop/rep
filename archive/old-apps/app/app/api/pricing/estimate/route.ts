import { NextResponse } from 'next/server'
import { PartsQuality } from '@prisma/client'
import { estimatePrice } from '@/lib/pricing/estimator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deviceModelId, repairTypeId, partsQuality } = body

    if (!deviceModelId || !repairTypeId || !partsQuality) {
      return NextResponse.json(
        { error: 'Required fields: deviceModelId, repairTypeId, partsQuality' },
        { status: 400 }
      )
    }

    const estimate = await estimatePrice(
      parseInt(deviceModelId),
      parseInt(repairTypeId),
      partsQuality as PartsQuality
    )

    return NextResponse.json({ estimate })
  } catch (error: any) {
    console.error('Error estimating price:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to estimate price' },
      { status: 500 }
    )
  }
}
