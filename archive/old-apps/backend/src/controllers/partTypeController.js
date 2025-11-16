// =============================================================================
// PART TYPE CONTROLLER
// =============================================================================

const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const partTypes = await prisma.partType.findMany({
      where: { isActive: true },
      orderBy: { qualityLevel: 'desc' }
    });

    res.json(successResponse(partTypes));
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, qualityLevel, warrantyMonths, description } = req.body;

    const partType = await prisma.partType.create({
      data: {
        name,
        qualityLevel,
        warrantyMonths,
        description
      }
    });

    res.status(201).json(successResponse(partType, 'Part type created successfully'));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json(errorResponse('DUPLICATE', 'Part type already exists'));
    }
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const partType = await prisma.partType.update({
      where: { id: parseInt(id) },
      data: updates
    });

    res.json(successResponse(partType, 'Part type updated successfully'));
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.partType.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json(successResponse(null, 'Part type deleted successfully'));
  } catch (error) {
    next(error);
  }
};
