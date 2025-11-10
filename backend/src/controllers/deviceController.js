// =============================================================================
// DEVICE CONTROLLER
// =============================================================================

const prisma = require('../config/db');
const { successResponse, errorResponse, getPagination, formatPaginationResponse } = require('../utils/helpers');

/**
 * Get all devices with filtering and pagination
 */
exports.getAll = async (req, res, next) => {
  try {
    const { brandId, deviceType, search, page = 1, limit = 50 } = req.query;

    const where = {
      isActive: true,
      ...(brandId && { brandId: parseInt(brandId) }),
      ...(deviceType && { deviceType }),
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      })
    };

    const { skip, take } = getPagination(page, limit);

    const [devices, total] = await Promise.all([
      prisma.deviceModel.findMany({
        where,
        include: {
          brand: {
            select: { id: true, name: true, isPrimary: true }
          }
        },
        orderBy: [
          { brand: { name: 'asc' } },
          { releaseYear: 'desc' },
          { name: 'asc' }
        ],
        skip,
        take
      }),
      prisma.deviceModel.count({ where })
    ]);

    res.json(successResponse(
      formatPaginationResponse(devices, total, page, limit)
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Get device by ID
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const device = await prisma.deviceModel.findUnique({
      where: { id: parseInt(id) },
      include: {
        brand: true,
        pricing: {
          where: { isActive: true },
          include: {
            repairType: true,
            partType: true
          }
        }
      }
    });

    if (!device) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Device not found'));
    }

    res.json(successResponse(device));
  } catch (error) {
    next(error);
  }
};

/**
 * Create new device
 */
exports.create = async (req, res, next) => {
  try {
    const { brandId, name, modelNumber, releaseYear, deviceType, screenSize } = req.body;

    const device = await prisma.deviceModel.create({
      data: {
        brandId: parseInt(brandId),
        name,
        modelNumber,
        releaseYear,
        deviceType,
        screenSize: screenSize ? parseFloat(screenSize) : null
      },
      include: {
        brand: true
      }
    });

    res.status(201).json(successResponse(device, 'Device created successfully'));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json(errorResponse(
        'DUPLICATE_DEVICE',
        'Device with this name already exists for this brand'
      ));
    }
    next(error);
  }
};

/**
 * Update device
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, modelNumber, releaseYear, deviceType, screenSize, isActive } = req.body;

    const device = await prisma.deviceModel.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(modelNumber !== undefined && { modelNumber }),
        ...(releaseYear && { releaseYear }),
        ...(deviceType && { deviceType }),
        ...(screenSize !== undefined && { screenSize: screenSize ? parseFloat(screenSize) : null }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        brand: true
      }
    });

    res.json(successResponse(device, 'Device updated successfully'));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Device not found'));
    }
    next(error);
  }
};

/**
 * Delete device (soft delete)
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.deviceModel.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json(successResponse(null, 'Device deleted successfully'));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Device not found'));
    }
    next(error);
  }
};
