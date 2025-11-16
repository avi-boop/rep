// =============================================================================
// PRICING CONTROLLER
// =============================================================================

const prisma = require('../config/db');
const smartPricingService = require('../services/smartPricingService');
const { successResponse, errorResponse, getPagination, formatPaginationResponse } = require('../utils/helpers');

/**
 * Get all pricing with filtering
 */
exports.getAll = async (req, res, next) => {
  try {
    const { deviceModelId, repairTypeId, partTypeId, isEstimated, page = 1, limit = 50 } = req.query;

    const where = {
      isActive: true,
      ...(deviceModelId && { deviceModelId: parseInt(deviceModelId) }),
      ...(repairTypeId && { repairTypeId: parseInt(repairTypeId) }),
      ...(partTypeId && { partTypeId: parseInt(partTypeId) }),
      ...(isEstimated !== undefined && { isEstimated: isEstimated === 'true' })
    };

    const { skip, take } = getPagination(page, limit);

    const [prices, total] = await Promise.all([
      prisma.pricing.findMany({
        where,
        include: {
          deviceModel: {
            include: { brand: true }
          },
          repairType: true,
          partType: true
        },
        orderBy: [
          { deviceModel: { brand: { name: 'asc' } } },
          { deviceModel: { name: 'asc' } },
          { repairType: { name: 'asc' } }
        ],
        skip,
        take
      }),
      prisma.pricing.count({ where })
    ]);

    res.json(successResponse(
      formatPaginationResponse(prices, total, page, limit)
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Get pricing matrix (for display purposes)
 */
exports.getMatrix = async (req, res, next) => {
  try {
    const { brandId, deviceType } = req.query;

    const prices = await prisma.pricing.findMany({
      where: {
        isActive: true,
        ...(brandId && { deviceModel: { brandId: parseInt(brandId) } }),
        ...(deviceType && { deviceModel: { deviceType } })
      },
      include: {
        deviceModel: {
          include: { brand: true }
        },
        repairType: true,
        partType: true
      }
    });

    // Organize into matrix format
    const matrix = {};
    
    prices.forEach(price => {
      const deviceKey = `${price.deviceModel.brand.name} ${price.deviceModel.name}`;
      const repairKey = price.repairType.name;
      const partKey = price.partType.name;

      if (!matrix[deviceKey]) {
        matrix[deviceKey] = {
          deviceId: price.deviceModel.id,
          device: `${price.deviceModel.brand.name} ${price.deviceModel.name}`,
          repairs: {}
        };
      }

      if (!matrix[deviceKey].repairs[repairKey]) {
        matrix[deviceKey].repairs[repairKey] = {
          repairTypeId: price.repairType.id,
          parts: {}
        };
      }

      matrix[deviceKey].repairs[repairKey].parts[partKey] = {
        pricingId: price.id,
        partTypeId: price.partType.id,
        price: parseFloat(price.price),
        cost: price.cost ? parseFloat(price.cost) : null,
        isEstimated: price.isEstimated,
        confidenceScore: price.confidenceScore ? parseFloat(price.confidenceScore) : null
      };
    });

    res.json(successResponse(matrix));
  } catch (error) {
    next(error);
  }
};

/**
 * Estimate price using smart pricing algorithm
 */
exports.estimatePrice = async (req, res, next) => {
  try {
    const { deviceModelId, repairTypeId, partTypeId } = req.query;

    const estimate = await smartPricingService.estimatePrice(
      parseInt(deviceModelId),
      parseInt(repairTypeId),
      parseInt(partTypeId)
    );

    res.json(successResponse(estimate));
  } catch (error) {
    next(error);
  }
};

/**
 * Get price by ID
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const price = await prisma.pricing.findUnique({
      where: { id: parseInt(id) },
      include: {
        deviceModel: {
          include: { brand: true }
        },
        repairType: true,
        partType: true,
        priceHistory: {
          orderBy: { changedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!price) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Price not found'));
    }

    res.json(successResponse(price));
  } catch (error) {
    next(error);
  }
};

/**
 * Create price entry
 */
exports.create = async (req, res, next) => {
  try {
    const { deviceModelId, repairTypeId, partTypeId, price, cost, notes, isEstimated, confidenceScore } = req.body;

    const pricing = await prisma.pricing.create({
      data: {
        deviceModelId: parseInt(deviceModelId),
        repairTypeId: parseInt(repairTypeId),
        partTypeId: parseInt(partTypeId),
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : null,
        notes,
        isEstimated: isEstimated || false,
        confidenceScore: confidenceScore ? parseFloat(confidenceScore) : null
      },
      include: {
        deviceModel: {
          include: { brand: true }
        },
        repairType: true,
        partType: true
      }
    });

    res.status(201).json(successResponse(pricing, 'Price created successfully'));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json(errorResponse(
        'DUPLICATE_PRICE',
        'Price already exists for this combination'
      ));
    }
    next(error);
  }
};

/**
 * Update price entry
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, cost, notes, isEstimated, confidenceScore, isActive } = req.body;

    const pricing = await prisma.pricing.update({
      where: { id: parseInt(id) },
      data: {
        ...(price && { price: parseFloat(price) }),
        ...(cost !== undefined && { cost: cost ? parseFloat(cost) : null }),
        ...(notes !== undefined && { notes }),
        ...(isEstimated !== undefined && { isEstimated }),
        ...(confidenceScore !== undefined && { confidenceScore: confidenceScore ? parseFloat(confidenceScore) : null }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        deviceModel: {
          include: { brand: true }
        },
        repairType: true,
        partType: true
      }
    });

    res.json(successResponse(pricing, 'Price updated successfully'));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Price not found'));
    }
    next(error);
  }
};

/**
 * Delete price entry (soft delete)
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.pricing.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json(successResponse(null, 'Price deleted successfully'));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Price not found'));
    }
    next(error);
  }
};

/**
 * Bulk create/update prices
 */
exports.bulkUpsert = async (req, res, next) => {
  try {
    const { prices } = req.body;

    if (!Array.isArray(prices) || prices.length === 0) {
      return res.status(400).json(errorResponse(
        'INVALID_DATA',
        'Prices array is required'
      ));
    }

    const results = [];

    for (const priceData of prices) {
      try {
        const result = await prisma.pricing.upsert({
          where: {
            deviceModelId_repairTypeId_partTypeId_validFrom: {
              deviceModelId: parseInt(priceData.deviceModelId),
              repairTypeId: parseInt(priceData.repairTypeId),
              partTypeId: parseInt(priceData.partTypeId),
              validFrom: priceData.validFrom ? new Date(priceData.validFrom) : new Date()
            }
          },
          update: {
            price: parseFloat(priceData.price),
            cost: priceData.cost ? parseFloat(priceData.cost) : null,
            notes: priceData.notes,
            isEstimated: priceData.isEstimated || false
          },
          create: {
            deviceModelId: parseInt(priceData.deviceModelId),
            repairTypeId: parseInt(priceData.repairTypeId),
            partTypeId: parseInt(priceData.partTypeId),
            price: parseFloat(priceData.price),
            cost: priceData.cost ? parseFloat(priceData.cost) : null,
            notes: priceData.notes,
            isEstimated: priceData.isEstimated || false,
            validFrom: priceData.validFrom ? new Date(priceData.validFrom) : new Date()
          }
        });

        results.push(result);
      } catch (error) {
        console.error(`Error upserting price for device ${priceData.deviceModelId}:`, error);
      }
    }

    res.json(successResponse({
      total: prices.length,
      processed: results.length
    }, `Processed ${results.length} of ${prices.length} prices`));
  } catch (error) {
    next(error);
  }
};
