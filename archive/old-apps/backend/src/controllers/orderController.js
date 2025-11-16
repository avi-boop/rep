// =============================================================================
// REPAIR ORDER CONTROLLER
// =============================================================================

const prisma = require('../config/db');
const { 
  successResponse, 
  errorResponse, 
  getPagination, 
  formatPaginationResponse,
  generateOrderNumber,
  calculateTotal
} = require('../utils/helpers');

/**
 * Get all orders with filtering and pagination
 */
exports.getAll = async (req, res, next) => {
  try {
    const { status, priority, customerId, search, page = 1, limit = 20 } = req.query;

    const where = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(customerId && { customerId: parseInt(customerId) }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customer: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } }
            ]
          }}
        ]
      })
    };

    const { skip, take } = getPagination(page, limit);

    const [orders, total] = await Promise.all([
      prisma.repairOrder.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true
            }
          },
          deviceModel: {
            include: {
              brand: {
                select: { id: true, name: true }
              }
            }
          },
          repairOrderItems: {
            include: {
              repairType: true,
              partType: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.repairOrder.count({ where })
    ]);

    res.json(successResponse(
      formatPaginationResponse(orders, total, page, limit)
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics
 */
exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedToday,
      totalRevenue,
      revenueToday
    ] = await Promise.all([
      prisma.repairOrder.count(),
      prisma.repairOrder.count({ where: { status: 'pending' } }),
      prisma.repairOrder.count({ where: { status: 'in_progress' } }),
      prisma.repairOrder.count({ 
        where: { 
          status: 'completed',
          actualCompletion: { gte: today }
        }
      }),
      prisma.repairOrder.aggregate({
        _sum: { totalPrice: true }
      }),
      prisma.repairOrder.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { totalPrice: true }
      })
    ]);

    res.json(successResponse({
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedToday,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      revenueToday: revenueToday._sum.totalPrice || 0
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.repairOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        deviceModel: {
          include: { brand: true }
        },
        repairOrderItems: {
          include: {
            repairType: true,
            partType: true,
            pricing: true
          }
        },
        notifications: {
          orderBy: { createdAt: 'desc' }
        },
        orderStatusHistory: {
          orderBy: { changedAt: 'desc' }
        },
        photos: true
      }
    });

    if (!order) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
    }

    res.json(successResponse(order));
  } catch (error) {
    next(error);
  }
};

/**
 * Create new repair order
 */
exports.create = async (req, res, next) => {
  try {
    const {
      customerId,
      deviceModelId,
      deviceImei,
      deviceSerial,
      devicePassword,
      priority,
      issueDescription,
      cosmeticCondition,
      estimatedCompletion,
      depositPaid,
      items
    } = req.body;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) }
    });

    if (!customer) {
      return res.status(404).json(errorResponse('CUSTOMER_NOT_FOUND', 'Customer not found'));
    }

    // Verify device model exists
    const deviceModel = await prisma.deviceModel.findUnique({
      where: { id: parseInt(deviceModelId) }
    });

    if (!deviceModel) {
      return res.status(404).json(errorResponse('DEVICE_NOT_FOUND', 'Device model not found'));
    }

    // Calculate totals
    const calculatedItems = items.map(item => {
      const totalPrice = (parseFloat(item.unitPrice) * (item.quantity || 1)) - (parseFloat(item.discount) || 0);
      return {
        ...item,
        totalPrice
      };
    });

    const totalPrice = calculateTotal(calculatedItems);

    // Create order with items
    const order = await prisma.repairOrder.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: parseInt(customerId),
        deviceModelId: parseInt(deviceModelId),
        deviceImei,
        deviceSerial,
        devicePassword,
        priority: priority || 'normal',
        issueDescription,
        cosmeticCondition,
        estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : null,
        totalPrice,
        depositPaid: depositPaid || 0,
        checkedInBy: req.user.id,
        repairOrderItems: {
          create: calculatedItems.map(item => ({
            repairTypeId: parseInt(item.repairTypeId),
            partTypeId: parseInt(item.partTypeId),
            pricingId: item.pricingId ? parseInt(item.pricingId) : null,
            quantity: item.quantity || 1,
            unitPrice: parseFloat(item.unitPrice),
            discount: parseFloat(item.discount) || 0,
            totalPrice: item.totalPrice
          }))
        }
      },
      include: {
        customer: true,
        deviceModel: {
          include: { brand: true }
        },
        repairOrderItems: {
          include: {
            repairType: true,
            partType: true
          }
        }
      }
    });

    res.status(201).json(successResponse(order, 'Repair order created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update repair order
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      deviceImei,
      deviceSerial,
      devicePassword,
      priority,
      issueDescription,
      cosmeticCondition,
      estimatedCompletion,
      depositPaid,
      assignedTechnicianId
    } = req.body;

    const order = await prisma.repairOrder.update({
      where: { id: parseInt(id) },
      data: {
        ...(deviceImei !== undefined && { deviceImei }),
        ...(deviceSerial !== undefined && { deviceSerial }),
        ...(devicePassword !== undefined && { devicePassword }),
        ...(priority && { priority }),
        ...(issueDescription !== undefined && { issueDescription }),
        ...(cosmeticCondition !== undefined && { cosmeticCondition }),
        ...(estimatedCompletion && { estimatedCompletion: new Date(estimatedCompletion) }),
        ...(depositPaid !== undefined && { depositPaid: parseFloat(depositPaid) }),
        ...(assignedTechnicianId !== undefined && { assignedTechnicianId: parseInt(assignedTechnicianId) })
      },
      include: {
        customer: true,
        deviceModel: {
          include: { brand: true }
        },
        repairOrderItems: {
          include: {
            repairType: true,
            partType: true
          }
        }
      }
    });

    res.json(successResponse(order, 'Order updated successfully'));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
    }
    next(error);
  }
};

/**
 * Update order status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Get current order
    const currentOrder = await prisma.repairOrder.findUnique({
      where: { id: parseInt(id) },
      select: { status: true }
    });

    if (!currentOrder) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
    }

    // Update order status
    const order = await prisma.repairOrder.update({
      where: { id: parseInt(id) },
      data: {
        status,
        ...(status === 'completed' && { actualCompletion: new Date() })
      },
      include: {
        customer: true,
        deviceModel: {
          include: { brand: true }
        }
      }
    });

    // Log status change
    await prisma.orderStatusHistory.create({
      data: {
        repairOrderId: parseInt(id),
        oldStatus: currentOrder.status,
        newStatus: status,
        notes,
        changedBy: req.user.id
      }
    });

    // TODO: Trigger notification based on status change

    res.json(successResponse(order, 'Status updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 */
exports.cancel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.repairOrder.update({
      where: { id: parseInt(id) },
      data: { status: 'cancelled' }
    });

    res.json(successResponse(order, 'Order cancelled successfully'));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
    }
    next(error);
  }
};
