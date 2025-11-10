import { prisma } from './prisma'

interface PriceEstimate {
  price: number
  confidence: number
  isEstimated: boolean
  references: number[]
  method: 'exact' | 'interpolation' | 'extrapolation' | 'category_average' | 'fallback'
}

/**
 * Smart Pricing Estimation Algorithm
 * 
 * This algorithm estimates repair prices based on:
 * 1. Exact matches (100% confidence)
 * 2. Interpolation between similar models (85% confidence)
 * 3. Extrapolation from nearby models (60% confidence)
 * 4. Category averages (40% confidence)
 * 5. Fallback default (20% confidence)
 */
export async function estimatePrice(
  deviceModelId: number,
  repairTypeId: number,
  partTypeId: number
): Promise<PriceEstimate> {
  // Step 1: Check for exact match
  const exactPrice = await prisma.pricing.findFirst({
    where: {
      deviceModelId,
      repairTypeId,
      partTypeId,
      isActive: true
    }
  })

  if (exactPrice && !exactPrice.isEstimated) {
    return {
      price: exactPrice.price,
      confidence: 1.0,
      isEstimated: false,
      references: [deviceModelId],
      method: 'exact'
    }
  }

  // Step 2: Get target device info
  const targetDevice = await prisma.deviceModel.findUnique({
    where: { id: deviceModelId },
    include: { brand: true }
  })

  if (!targetDevice) {
    throw new Error('Device not found')
  }

  // Step 3: Find reference prices from same brand within 3 years
  const referencePrices = await prisma.pricing.findMany({
    where: {
      repairTypeId,
      partTypeId,
      isActive: true,
      deviceModel: {
        brandId: targetDevice.brandId,
        releaseYear: targetDevice.releaseYear ? {
          gte: targetDevice.releaseYear - 3,
          lte: targetDevice.releaseYear + 3
        } : undefined
      }
    },
    include: {
      deviceModel: true
    },
    orderBy: {
      deviceModel: {
        releaseYear: 'asc'
      }
    }
  })

  if (referencePrices.length === 0) {
    // Fallback to category average
    return await estimateFromCategoryAverage(repairTypeId, partTypeId)
  }

  // Step 4: Attempt interpolation
  if (referencePrices.length >= 2 && targetDevice.releaseYear) {
    const targetYear = targetDevice.releaseYear // Store for use in filter callbacks
    const older = referencePrices.filter(
      p => p.deviceModel.releaseYear && p.deviceModel.releaseYear < targetYear
    )
    const newer = referencePrices.filter(
      p => p.deviceModel.releaseYear && p.deviceModel.releaseYear > targetYear
    )

    if (older.length > 0 && newer.length > 0 && targetDevice.releaseYear) {
      // Interpolation possible
      const closestOlder = older[older.length - 1]
      const closestNewer = newer[0]

      const olderPrice = closestOlder.price
      const newerPrice = closestNewer.price
      const olderYear = closestOlder.deviceModel.releaseYear!
      const newerYear = closestNewer.deviceModel.releaseYear!

      // Linear interpolation
      const yearDiff = newerYear - olderYear
      const targetYearDiff = targetYear - olderYear
      const priceDiff = newerPrice - olderPrice

      let estimatedPrice = olderPrice + (priceDiff * (targetYearDiff / yearDiff))

      // Apply tier adjustment if needed
      const avgTier = (closestOlder.deviceModel.releaseYear! + closestNewer.deviceModel.releaseYear!) / 2
      // Simplified tier logic: newer models are typically more expensive
      if (targetDevice.name.includes('Pro') || targetDevice.name.includes('Ultra')) {
        estimatedPrice *= 1.15 // Premium tier
      } else if (targetDevice.name.includes('SE') || targetDevice.name.includes('Mini')) {
        estimatedPrice *= 0.85 // Budget tier
      }

      // Round to nice number
      estimatedPrice = roundToNiceNumber(estimatedPrice)

      return {
        price: estimatedPrice,
        confidence: 0.85,
        isEstimated: true,
        references: [closestOlder.deviceModelId, closestNewer.deviceModelId],
        method: 'interpolation'
      }
    }
  }

  // Step 5: Extrapolation from nearest model
  if (referencePrices.length > 0) {
    // Find closest model by release year
    let closest = referencePrices[0]
    let minDiff = Math.abs((closest.deviceModel.releaseYear || 0) - (targetDevice.releaseYear || 0))

    for (const ref of referencePrices) {
      const diff = Math.abs((ref.deviceModel.releaseYear || 0) - (targetDevice.releaseYear || 0))
      if (diff < minDiff) {
        minDiff = diff
        closest = ref
      }
    }

    let estimatedPrice = closest.price

    // Adjust based on year difference
    const yearDiff = (targetDevice.releaseYear || 0) - (closest.deviceModel.releaseYear || 0)
    if (yearDiff > 0) {
      // Target is newer, likely more expensive
      estimatedPrice *= (1 + (yearDiff * 0.05)) // 5% per year
    } else if (yearDiff < 0) {
      // Target is older, likely cheaper
      estimatedPrice *= (1 + (yearDiff * 0.05)) // -5% per year
    }

    // Apply tier adjustment
    if (targetDevice.name.includes('Pro') || targetDevice.name.includes('Ultra')) {
      estimatedPrice *= 1.15
    } else if (targetDevice.name.includes('SE') || targetDevice.name.includes('Mini')) {
      estimatedPrice *= 0.85
    }

    estimatedPrice = roundToNiceNumber(estimatedPrice)

    return {
      price: estimatedPrice,
      confidence: 0.60,
      isEstimated: true,
      references: [closest.deviceModelId],
      method: 'extrapolation'
    }
  }

  // Step 6: Fallback to category average
  return await estimateFromCategoryAverage(repairTypeId, partTypeId)
}

async function estimateFromCategoryAverage(
  repairTypeId: number,
  partTypeId: number
): Promise<PriceEstimate> {
  const avgResult = await prisma.pricing.aggregate({
    where: {
      repairTypeId,
      partTypeId,
      isActive: true
    },
    _avg: {
      price: true
    },
    _count: true
  })

  if (avgResult._count > 0 && avgResult._avg.price) {
    return {
      price: roundToNiceNumber(avgResult._avg.price),
      confidence: 0.40,
      isEstimated: true,
      references: [],
      method: 'category_average'
    }
  }

  // Ultimate fallback - base price by repair type
  const basePrice = getBasePriceByRepairType(repairTypeId)
  
  return {
    price: basePrice,
    confidence: 0.20,
    isEstimated: true,
    references: [],
    method: 'fallback'
  }
}

function roundToNiceNumber(price: number): number {
  // Round to nearest $5 or make it end in 9
  if (price < 50) {
    return Math.round(price / 5) * 5
  } else if (price < 200) {
    return Math.round(price / 10) * 10 - 1 // $49, $69, $99, etc.
  } else {
    return Math.round(price / 20) * 20 - 1 // $199, $219, $239, etc.
  }
}

function getBasePriceByRepairType(repairTypeId: number): number {
  // Fallback base prices by common repair types
  const basePrices: Record<number, number> = {
    1: 199, // Screen - default
    2: 99,  // Battery - default
    3: 79,  // Back Panel - default
    4: 89,  // Charging Port - default
    5: 129, // Camera - default
  }
  return basePrices[repairTypeId] || 99
}

/**
 * Batch estimate prices for multiple combinations
 */
export async function estimatePriceBatch(
  combinations: Array<{
    deviceModelId: number
    repairTypeId: number
    partTypeId: number
  }>
): Promise<Map<string, PriceEstimate>> {
  const results = new Map<string, PriceEstimate>()

  for (const combo of combinations) {
    const key = `${combo.deviceModelId}-${combo.repairTypeId}-${combo.partTypeId}`
    try {
      const estimate = await estimatePrice(
        combo.deviceModelId,
        combo.repairTypeId,
        combo.partTypeId
      )
      results.set(key, estimate)
    } catch (error) {
      console.error(`Error estimating price for ${key}:`, error)
    }
  }

  return results
}

/**
 * Save estimated price to database
 */
export async function saveEstimatedPrice(
  deviceModelId: number,
  repairTypeId: number,
  partTypeId: number,
  estimate: PriceEstimate
) {
  return await prisma.pricing.create({
    data: {
      deviceModelId,
      repairTypeId,
      partTypeId,
      price: estimate.price,
      isEstimated: true,
      confidenceScore: estimate.confidence,
      notes: `Auto-estimated using ${estimate.method} method`
    }
  })
}
