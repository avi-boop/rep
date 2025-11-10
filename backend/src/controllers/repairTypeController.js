// =============================================================================
// REPAIR TYPE CONTROLLER
// =============================================================================

const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { category } = req.query;

    const repairTypes = await prisma.repairType.findMany({
      where: {
        isActive: true,
        ...(category && { category })
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json(successResponse(repairTypes));
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, category, description, estimatedDuration } = req.body;

    const repairType = await prisma.repairType.create({
      data: {
        name,
        category,
        description,
        estimatedDuration
      }
    });

    res.status(201).json(successResponse(repairType, 'Repair type created successfully'));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json(errorResponse('DUPLICATE', 'Repair type already exists'));
    }
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, description, estimatedDuration, isActive } = req.body;

    const repairType = await prisma.repairType.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(estimatedDuration && { estimatedDuration }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json(successResponse(repairType, 'Repair type updated successfully'));
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.repairType.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json(successResponse(null, 'Repair type deleted successfully'));
  } catch (error) {
    next(error);
  }
};
