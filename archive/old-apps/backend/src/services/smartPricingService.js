// =============================================================================
// SMART PRICING SERVICE
// =============================================================================
// Intelligently estimate prices based on existing data

const prisma = require('../config/db');

/**
 * Estimate price for a device/repair/part combination
 * Uses interpolation, extrapolation, and averaging techniques
 */
async function estimatePrice(deviceModelId, repairTypeId, partTypeId) {
  try {
    // 1. Check if exact price exists
    const exactPrice = await prisma.pricing.findFirst({
      where: {
        deviceModelId,
        repairTypeId,
        partTypeId,
        isActive: true
      }
    });

    if (exactPrice && !exactPrice.isEstimated) {
      return {
        price: parseFloat(exactPrice.price),
        cost: exactPrice.cost ? parseFloat(exactPrice.cost) : null,
        isEstimated: false,
        confidenceScore: 1.0,
        method: 'exact',
        references: [exactPrice.id]
      };
    }

    // 2. Get target device information
    const targetDevice = await prisma.deviceModel.findUnique({
      where: { id: deviceModelId },
      include: { brand: true }
    });

    if (!targetDevice) {
      throw new Error('Device not found');
    }

    // 3. Find reference prices from same brand and repair/part type
    const referencePrices = await prisma.pricing.findMany({
      where: {
        repairTypeId,
        partTypeId,
        isActive: true,
        deviceModel: {
          brandId: targetDevice.brandId
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
    });

    if (referencePrices.length === 0) {
      // Try to find from other brands (less accurate)
      return await estimateFromOtherBrands(repairTypeId, partTypeId);
    }

    // 4. Find bracketing models (devices released before and after target)
    const olderDevices = referencePrices.filter(
      p => p.deviceModel.releaseYear && targetDevice.releaseYear && 
           p.deviceModel.releaseYear < targetDevice.releaseYear
    ).sort((a, b) => b.deviceModel.releaseYear - a.deviceModel.releaseYear);

    const newerDevices = referencePrices.filter(
      p => p.deviceModel.releaseYear && targetDevice.releaseYear && 
           p.deviceModel.releaseYear > targetDevice.releaseYear
    ).sort((a, b) => a.deviceModel.releaseYear - b.deviceModel.releaseYear);

    let estimatedPrice;
    let estimatedCost;
    let confidence;
    let method;

    // 5. Interpolation (best case - have devices on both sides)
    if (olderDevices.length > 0 && newerDevices.length > 0) {
      const older = olderDevices[0];
      const newer = newerDevices[0];

      const olderPrice = parseFloat(older.price);
      const newerPrice = parseFloat(newer.price);
      const olderYear = older.deviceModel.releaseYear;
      const newerYear = newer.deviceModel.releaseYear;
      const targetYear = targetDevice.releaseYear;

      // Linear interpolation
      const yearDiff = newerYear - olderYear;
      const targetYearDiff = targetYear - olderYear;
      const priceDiff = newerPrice - olderPrice;

      estimatedPrice = olderPrice + (priceDiff * (targetYearDiff / yearDiff));

      // Estimate cost similarly if available
      if (older.cost && newer.cost) {
        const olderCost = parseFloat(older.cost);
        const newerCost = parseFloat(newer.cost);
        const costDiff = newerCost - olderCost;
        estimatedCost = olderCost + (costDiff * (targetYearDiff / yearDiff));
      }

      confidence = 0.85;
      method = 'interpolation';
    }
    // 6. Extrapolation (have devices only on one side)
    else if (referencePrices.length > 0) {
      const nearest = referencePrices[0];
      estimatedPrice = parseFloat(nearest.price);
      estimatedCost = nearest.cost ? parseFloat(nearest.cost) : null;
      
      // Apply slight adjustment based on device tier/positioning
      if (targetDevice.screenSize && nearest.deviceModel.screenSize) {
        const sizeRatio = parseFloat(targetDevice.screenSize) / parseFloat(nearest.deviceModel.screenSize);
        estimatedPrice = estimatedPrice * (0.8 + (sizeRatio * 0.2)); // Adjust by up to 20%
      }

      confidence = 0.60;
      method = 'extrapolation';
    }
    // 7. Fallback to category average
    else {
      return await estimateFromCategoryAverage(repairTypeId, partTypeId);
    }

    // 8. Round to nice numbers ($x9 ending)
    estimatedPrice = roundToNicePrice(estimatedPrice);
    if (estimatedCost) {
      estimatedCost = Math.round(estimatedCost);
    }

    return {
      price: estimatedPrice,
      cost: estimatedCost,
      isEstimated: true,
      confidenceScore: confidence,
      method,
      references: referencePrices.map(p => p.id).slice(0, 5)
    };

  } catch (error) {
    console.error('Error estimating price:', error);
    throw error;
  }
}

/**
 * Estimate from other brands when same brand data not available
 */
async function estimateFromOtherBrands(repairTypeId, partTypeId) {
  const allPrices = await prisma.pricing.findMany({
    where: {
      repairTypeId,
      partTypeId,
      isActive: true
    }
  });

  if (allPrices.length === 0) {
    return {
      price: 0,
      cost: null,
      isEstimated: true,
      confidenceScore: 0,
      method: 'no_data',
      references: []
    };
  }

  const avgPrice = allPrices.reduce((sum, p) => sum + parseFloat(p.price), 0) / allPrices.length;
  const costsAvailable = allPrices.filter(p => p.cost);
  const avgCost = costsAvailable.length > 0
    ? costsAvailable.reduce((sum, p) => sum + parseFloat(p.cost), 0) / costsAvailable.length
    : null;

  return {
    price: roundToNicePrice(avgPrice),
    cost: avgCost ? Math.round(avgCost) : null,
    isEstimated: true,
    confidenceScore: 0.50,
    method: 'cross_brand_average',
    references: allPrices.map(p => p.id).slice(0, 5)
  };
}

/**
 * Estimate from category average (lowest confidence)
 */
async function estimateFromCategoryAverage(repairTypeId, partTypeId) {
  const avgResult = await prisma.pricing.aggregate({
    where: {
      repairTypeId,
      partTypeId,
      isActive: true
    },
    _avg: {
      price: true,
      cost: true
    }
  });

  return {
    price: avgResult._avg.price ? roundToNicePrice(parseFloat(avgResult._avg.price)) : 0,
    cost: avgResult._avg.cost ? Math.round(parseFloat(avgResult._avg.cost)) : null,
    isEstimated: true,
    confidenceScore: 0.40,
    method: 'category_average',
    references: []
  };
}

/**
 * Round price to nice number (ends in 9)
 * Examples: 149, 199, 249, 299
 */
function roundToNicePrice(price) {
  // Round to nearest 10, then subtract 1
  const rounded = Math.round(price / 10) * 10;
  return rounded - 1;
}

/**
 * Batch estimate prices for multiple combinations
 */
async function batchEstimate(combinations) {
  const results = [];

  for (const combo of combinations) {
    try {
      const estimate = await estimatePrice(
        combo.deviceModelId,
        combo.repairTypeId,
        combo.partTypeId
      );
      results.push({
        ...combo,
        ...estimate,
        success: true
      });
    } catch (error) {
      results.push({
        ...combo,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  estimatePrice,
  batchEstimate,
  estimateFromCategoryAverage
};
