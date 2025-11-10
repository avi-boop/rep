// =============================================================================
// CUSTOMER CONTROLLER
// =============================================================================

const prisma = require('../config/db');
const { successResponse, errorResponse, getPagination, formatPaginationResponse } = require('../utils/helpers');

/**
 * Get all customers with search and pagination
 */
exports.getAll = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const { skip, take } = getPagination(page, limit);

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: { repairOrders: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.customer.count({ where })
    ]);

    res.json(successResponse(
      formatPaginationResponse(customers, total, page, limit)
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer by ID
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: {
        repairOrders: {
          include: {
            deviceModel: {
              include: { brand: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Customer not found'));
    }

    res.json(successResponse(customer));
  } catch (error) {
    next(error);
  }
};

/**
 * Create new customer
 */
exports.create = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, notificationPreferences, notes, lightspeedId } = req.body;

    // Check if phone already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { phone }
    });

    if (existingCustomer) {
      return res.status(400).json(errorResponse(
        'DUPLICATE_PHONE',
        'Customer with this phone number already exists'
      ));
    }

    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        notificationPreferences: notificationPreferences || { sms: true, email: true, push: false },
        notes,
        lightspeedId
      }
    });

    res.status(201).json(successResponse(customer, 'Customer created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update customer
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, notificationPreferences, notes, isActive } = req.body;

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone && { phone }),
        ...(notificationPreferences && { notificationPreferences }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json(successResponse(customer, 'Customer updated successfully'));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Customer not found'));
    }
    next(error);
  }
};

/**
 * Delete customer (soft delete)
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.customer.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json(successResponse(null, 'Customer deleted successfully'));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Customer not found'));
    }
    next(error);
  }
};

/**
 * Search customers (advanced search)
 */
exports.search = async (req, res, next) => {
  try {
    const { query: searchQuery } = req.body;

    if (!searchQuery || searchQuery.length < 2) {
      return res.status(400).json(errorResponse(
        'INVALID_SEARCH',
        'Search query must be at least 2 characters'
      ));
    }

    const customers = await prisma.customer.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: searchQuery, mode: 'insensitive' } },
          { lastName: { contains: searchQuery, mode: 'insensitive' } },
          { phone: { contains: searchQuery } },
          { email: { contains: searchQuery, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    res.json(successResponse(customers));
  } catch (error) {
    next(error);
  }
};
