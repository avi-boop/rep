// =============================================================================
// BRAND CONTROLLER
// =============================================================================

const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get all brands
 */
exports.getAll = async (req, res, next) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: [
        { isPrimary: 'desc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { deviceModels: true }
        }
      }
    });

    res.json(successResponse(brands));
  } catch (error) {
    next(error);
  }
};

/**
 * Get brand by ID
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id: parseInt(id) },
      include: {
        deviceModels: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!brand) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Brand not found'));
    }

    res.json(successResponse(brand));
  } catch (error) {
    next(error);
  }
};

/**
 * Create brand
 */
exports.create = async (req, res, next) => {
  try {
    const { name, isPrimary, logoUrl } = req.body;

    const brand = await prisma.brand.create({
      data: {
        name,
        isPrimary: isPrimary || false,
        logoUrl
      }
    });

    res.status(201).json(successResponse(brand, 'Brand created successfully'));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json(errorResponse('DUPLICATE_BRAND', 'Brand already exists'));
    }
    next(error);
  }
};

/**
 * Update brand
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, isPrimary, logoUrl } = req.body;

    const brand = await prisma.brand.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(logoUrl !== undefined && { logoUrl })
      }
    });

    res.json(successResponse(brand, 'Brand updated successfully'));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Brand not found'));
    }
    next(error);
  }
};

/**
 * Delete brand
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if brand has devices
    const deviceCount = await prisma.deviceModel.count({
      where: { brandId: parseInt(id) }
    });

    if (deviceCount > 0) {
      return res.status(400).json(errorResponse(
        'BRAND_HAS_DEVICES',
        'Cannot delete brand with existing devices'
      ));
    }

    await prisma.brand.delete({
      where: { id: parseInt(id) }
    });

    res.json(successResponse(null, 'Brand deleted successfully'));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Brand not found'));
    }
    next(error);
  }
};
