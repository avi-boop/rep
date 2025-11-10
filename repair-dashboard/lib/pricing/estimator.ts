import { prisma } from '@/lib/prisma'

export interface PriceEstimate {
  price: number
  confidence: number
  references: number[]
  isEstimated: boolean
  source: string
}

/**
 * Estimates price for a device repair using smart interpolation
 * Based on nearby models, release dates, and part types
 */
export async function estimatePrice(
  deviceModelId: number,
  repairTypeId: number,
  partTypeId: number
): Promise<PriceEstimate> {
  // 1. Check if exact price exists
  const exactPrice = await prisma.pricing.findFirst({
    where: {
      deviceModelId,
      repairTypeId,
      partTypeId,
      isActive: true,
    },
  })

  if (exactPrice && !exactPrice.isEstimated) {
    return {
      price: Number(exactPrice.price),
      confidence: 1.0,
      references: [deviceModelId],
      isEstimated: false,
      source: 'exact_match',
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

  // 3. Find reference prices from same brand
  const referencePrices = await prisma.pricing.findMany({
    where: {
      repairTypeId,
      partTypeId,
      isEstimated: false, // Only use confirmed prices for estimation
      isActive: true,
      deviceModel: {
        brandId: targetDevice.brandId,
        ...(targetDevice.releaseYear && {
          releaseYear: {
            gte: targetDevice.releaseYear - 2,
            lte: targetDevice.releaseYear + 2,
          },
        }),
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
    (p) => p.deviceModel.releaseYear && targetDevice.releaseYear && p.deviceModel.releaseYear < targetDevice.releaseYear
  )
  const newer = referencePrices.filter(
    (p) => p.deviceModel.releaseYear && targetDevice.releaseYear && p.deviceModel.releaseYear > targetDevice.releaseYear
  )

  let estimatedPrice: number
  let confidence: number
  let source: string

  if (older.length > 0 && newer.length > 0) {
    // Interpolation (best case)
    const closestOlder = older[older.length - 1]
    const closestNewer = newer[0]

    const olderPrice = Number(closestOlder.price)
    const newerPrice = Number(closestNewer.price)
    const olderYear = closestOlder.deviceModel.releaseYear!
    const newerYear = closestNewer.deviceModel.releaseYear!

    // Linear interpolation
    const yearDiff = newerYear - olderYear
    const targetYearDiff = targetDevice.releaseYear! - olderYear
    const priceDiff = newerPrice - olderPrice

    estimatedPrice = olderPrice + (priceDiff * targetYearDiff) / yearDiff
    confidence = 0.85
    source = 'interpolation'
  } else if (referencePrices.length > 0) {
    // Extrapolation (less confident)
    const nearest = referencePrices[referencePrices.length - 1]
    estimatedPrice = Number(nearest.price)
    confidence = 0.60
    source = 'extrapolation'
  } else {
    // Fallback
    return estimateFromCategoryAverage(repairTypeId, partsQuality)
  }

  // 5. Round to nearest $5 or $9 ending
  estimatedPrice = roundToNiceNumber(estimatedPrice)

  return {
    price: estimatedPrice,
    confidence,
    references: referencePrices.map((p) => p.deviceModelId),
    isEstimated: true,
    source,
  }
}

function roundToNiceNumber(price: number): number {
  // Round to nearest $10 and make it end in 9
  const rounded = Math.round(price / 10) * 10
  return rounded - 1 // $149, $199, $249, etc.
}

async function estimateFromCategoryAverage(
  repairTypeId: number,
  partTypeId: number
): Promise<PriceEstimate> {
  const avgResult = await prisma.pricing.aggregate({
    where: {
      repairTypeId,
      partTypeId,
      isEstimated: false,
      isActive: true,
    },
    _avg: {
      price: true,
    },
    _count: true,
  })

  if (!avgResult._avg.price || avgResult._count === 0) {
    throw new Error('No reference prices available for estimation')
  }

  return {
    price: roundToNiceNumber(Number(avgResult._avg.price)),
    confidence: 0.40,
    references: [],
    isEstimated: true,
    source: 'category_average',
  }
}

/**
 * Get or create price (with estimation if needed)
 */
export async function getPrice(
  deviceModelId: number,
  repairTypeId: number,
  partTypeId: number
): Promise<PriceEstimate> {
  try {
    return await estimatePrice(deviceModelId, repairTypeId, partTypeId)
  } catch (error) {
    console.error('Price estimation failed:', error)
    throw error
  }
}
