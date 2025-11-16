import { prisma } from '@/lib/prisma'
import { PartsQuality } from '@prisma/client'

export interface PriceEstimate {
  price: number
  confidence: number
  references: number[]
  isEstimated: boolean
  method: string
}

/**
 * Estimate price for a device model and repair type
 * Uses smart interpolation algorithm based on similar devices
 */
export async function estimatePrice(
  deviceModelId: number,
  repairTypeId: number,
  partsQuality: PartsQuality
): Promise<PriceEstimate> {
  // 1. Check if exact price exists
  const exactPrice = await prisma.price.findFirst({
    where: {
      deviceModelId,
      repairTypeId,
      partsQuality,
    },
  })

  if (exactPrice && !exactPrice.isEstimated) {
    return {
      price: Number(exactPrice.totalPrice),
      confidence: 1.0,
      references: [deviceModelId],
      isEstimated: false,
      method: 'exact',
    }
  }

  // 2. Get target device info
  const targetDevice = await prisma.deviceModel.findUnique({
    where: { id: deviceModelId },
    include: { brand: true },
  })

  if (!targetDevice) {
    throw new Error('Device not found')
  }

  // 3. Find reference prices from same brand within 3 years
  const referencePrices = await prisma.price.findMany({
    where: {
      repairTypeId,
      partsQuality,
      isEstimated: false,
      deviceModel: {
        brandId: targetDevice.brandId,
        releaseYear: {
          gte: targetDevice.releaseYear - 3,
          lte: targetDevice.releaseYear + 3,
        },
      },
    },
    include: {
      deviceModel: true,
    },
    orderBy: {
      deviceModel: {
        releaseYear: 'asc',
      },
    },
  })

  if (referencePrices.length === 0) {
    // Fallback to category average
    return estimateFromCategoryAverage(repairTypeId, partsQuality)
  }

  // 4. Find bracketing models (older and newer)
  const older = referencePrices.filter(
    (p) => p.deviceModel.releaseYear < targetDevice.releaseYear
  )
  const newer = referencePrices.filter(
    (p) => p.deviceModel.releaseYear > targetDevice.releaseYear
  )

  let estimatedPrice: number
  let confidence: number
  let method: string

  if (older.length > 0 && newer.length > 0) {
    // Interpolation (best case)
    const closestOlder = older[older.length - 1]
    const closestNewer = newer[0]

    const olderPrice = Number(closestOlder.totalPrice)
    const newerPrice = Number(closestNewer.totalPrice)
    const olderYear = closestOlder.deviceModel.releaseYear
    const newerYear = closestNewer.deviceModel.releaseYear

    // Linear interpolation
    const yearDiff = newerYear - olderYear
    const targetYearDiff = targetDevice.releaseYear - olderYear
    const priceDiff = newerPrice - olderPrice

    estimatedPrice = olderPrice + (priceDiff * targetYearDiff) / yearDiff
    confidence = 0.85
    method = 'interpolation'
  } else if (referencePrices.length > 0) {
    // Extrapolation (less confident)
    const nearest = older.length > 0 ? older[older.length - 1] : newer[0]
    estimatedPrice = Number(nearest.totalPrice)

    // Adjust for year difference
    const yearDiff = Math.abs(
      targetDevice.releaseYear - nearest.deviceModel.releaseYear
    )
    const yearlyIncrease = 0.05 // 5% per year
    const adjustment =
      targetDevice.releaseYear > nearest.deviceModel.releaseYear
        ? 1 + yearlyIncrease * yearDiff
        : 1 - yearlyIncrease * yearDiff

    estimatedPrice *= adjustment
    confidence = Math.max(0.4, 0.7 - yearDiff * 0.1)
    method = 'extrapolation'
  } else {
    // Should never reach here due to earlier check
    return estimateFromCategoryAverage(repairTypeId, partsQuality)
  }

  // 5. Adjust for tier level
  const tierAdjustment = getTierAdjustment(targetDevice.tierLevel)
  estimatedPrice *= tierAdjustment

  // 6. Round to nearest $5 or make it end in 9
  estimatedPrice = roundToNiceNumber(estimatedPrice)

  return {
    price: estimatedPrice,
    confidence,
    references: referencePrices.map((p) => p.deviceModelId),
    isEstimated: true,
    method,
  }
}

/**
 * Get tier adjustment multiplier
 * Tier 1 = Flagship (Pro, Pro Max) - 15% more
 * Tier 2 = Standard - baseline
 * Tier 3 = Budget (SE, Mini) - 15% less
 */
function getTierAdjustment(tierLevel: number): number {
  const adjustments: Record<number, number> = {
    1: 1.15, // Flagship
    2: 1.0, // Standard
    3: 0.85, // Budget
  }
  return adjustments[tierLevel] || 1.0
}

/**
 * Round to a nice number
 * Makes prices end in 9 or rounds to nearest $10
 */
function roundToNiceNumber(price: number): number {
  // Round to nearest $10
  const rounded = Math.round(price / 10) * 10
  // Make it end in 9 for psychological pricing
  return rounded > 50 ? rounded - 1 : rounded
}

/**
 * Fallback: Estimate from category average
 */
async function estimateFromCategoryAverage(
  repairTypeId: number,
  partsQuality: PartsQuality
): Promise<PriceEstimate> {
  const avgResult = await prisma.price.aggregate({
    where: {
      repairTypeId,
      partsQuality,
      isEstimated: false,
    },
    _avg: {
      totalPrice: true,
    },
    _count: true,
  })

  const avgPrice = Number(avgResult._avg.totalPrice) || 100

  return {
    price: roundToNiceNumber(avgPrice),
    confidence: avgResult._count > 5 ? 0.5 : 0.3,
    references: [],
    isEstimated: true,
    method: 'category_average',
  }
}

/**
 * Get or create estimated price
 * This function will save the estimate to the database if it doesn't exist
 */
export async function getOrCreateEstimatedPrice(
  deviceModelId: number,
  repairTypeId: number,
  partsQuality: PartsQuality
): Promise<{
  price: number
  priceId: number | null
  isEstimated: boolean
  confidence: number
}> {
  // Check if price exists
  let priceRecord = await prisma.price.findFirst({
    where: {
      deviceModelId,
      repairTypeId,
      partsQuality,
    },
  })

  if (priceRecord) {
    return {
      price: Number(priceRecord.totalPrice),
      priceId: priceRecord.id,
      isEstimated: priceRecord.isEstimated,
      confidence: Number(priceRecord.confidenceScore) || 1.0,
    }
  }

  // Estimate the price
  const estimate = await estimatePrice(deviceModelId, repairTypeId, partsQuality)

  // Save the estimate
  priceRecord = await prisma.price.create({
    data: {
      deviceModelId,
      repairTypeId,
      partsQuality,
      partsCost: estimate.price * 0.5, // Assume 50% parts cost
      laborCost: estimate.price * 0.5, // Assume 50% labor cost
      totalPrice: estimate.price,
      isEstimated: true,
      confidenceScore: estimate.confidence,
    },
  })

  // Log the estimation
  await prisma.priceEstimationLog.create({
    data: {
      deviceModelId,
      repairTypeId,
      partsQuality: partsQuality as string,
      estimatedPrice: estimate.price,
      confidenceScore: estimate.confidence,
      referenceModels: JSON.stringify(estimate.references),
      algorithmVersion: 'v1.0',
    },
  })

  return {
    price: estimate.price,
    priceId: priceRecord.id,
    isEstimated: true,
    confidence: estimate.confidence,
  }
}
