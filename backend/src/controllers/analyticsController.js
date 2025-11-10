// =============================================================================
// ANALYTICS CONTROLLER
// =============================================================================

const prisma = require('../config/db');
const { successResponse } = require('../utils/helpers');

/**
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedToday,
      revenueToday,
      revenueThisMonth,
      topRepairTypes,
      topBrands
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
        where: { createdAt: { gte: today } },
        _sum: { totalPrice: true }
      }),
      prisma.repairOrder.aggregate({
        where: { createdAt: { gte: thisMonth } },
        _sum: { totalPrice: true }
      }),
      // Top repair types
      prisma.repairOrderItem.groupBy({
        by: ['repairTypeId'],
        _count: true,
        orderBy: { _count: { repairTypeId: 'desc' } },
        take: 5
      }),
      // Top brands
      prisma.repairOrder.groupBy({
        by: ['deviceModelId'],
        _count: true,
        orderBy: { _count: { deviceModelId: 'desc' } },
        take: 5
      })
    ]);

    // Get details for top items
    const topRepairTypesWithDetails = await Promise.all(
      topRepairTypes.map(async (item) => {
        const repairType = await prisma.repairType.findUnique({
          where: { id: item.repairTypeId }
        });
        return {
          ...repairType,
          count: item._count
        };
      })
    );

    const topBrandsWithDetails = await Promise.all(
      topBrands.map(async (item) => {
        const device = await prisma.deviceModel.findUnique({
          where: { id: item.deviceModelId },
          include: { brand: true }
        });
        return {
          brand: device?.brand.name,
          device: device?.name,
          count: item._count
        };
      })
    );

    res.json(successResponse({
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        inProgress: inProgressOrders,
        completedToday
      },
      revenue: {
        today: parseFloat(revenueToday._sum.totalPrice || 0),
        thisMonth: parseFloat(revenueThisMonth._sum.totalPrice || 0)
      },
      topRepairTypes: topRepairTypesWithDetails,
      topBrands: topBrandsWithDetails
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue analytics
 */
exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const where = {
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const orders = await prisma.repairOrder.findMany({
      where,
      select: {
        createdAt: true,
        totalPrice: true,
        status: true
      }
    });

    // Group by date
    const grouped = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { date, revenue: 0, orders: 0 };
      }
      grouped[date].revenue += parseFloat(order.totalPrice);
      grouped[date].orders += 1;
    });

    const timeline = Object.values(grouped).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json(successResponse({ timeline }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get repair analytics
 */
exports.getRepairAnalytics = async (req, res, next) => {
  try {
    const statusCount = await prisma.repairOrder.groupBy({
      by: ['status'],
      _count: true
    });

    const priorityCount = await prisma.repairOrder.groupBy({
      by: ['priority'],
      _count: true
    });

    const avgCompletionTime = await prisma.$queryRaw`
      SELECT AVG(EXTRACT(EPOCH FROM (actual_completion - created_at)) / 3600) as avg_hours
      FROM repair_orders
      WHERE actual_completion IS NOT NULL
    `;

    res.json(successResponse({
      byStatus: statusCount,
      byPriority: priorityCount,
      avgCompletionHours: avgCompletionTime[0]?.avg_hours || 0
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer analytics
 */
exports.getCustomerAnalytics = async (req, res, next) => {
  try {
    const totalCustomers = await prisma.customer.count({ where: { isActive: true } });
    
    const repeatCustomers = await prisma.customer.findMany({
      where: {
        isActive: true,
        repairOrders: {
          some: {}
        }
      },
      include: {
        _count: {
          select: { repairOrders: true }
        }
      }
    });

    const customersWithMultipleOrders = repeatCustomers.filter(
      c => c._count.repairOrders > 1
    ).length;

    const topCustomers = repeatCustomers
      .sort((a, b) => b._count.repairOrders - a._count.repairOrders)
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        phone: c.phone,
        orderCount: c._count.repairOrders
      }));

    res.json(successResponse({
      total: totalCustomers,
      repeatCustomers: customersWithMultipleOrders,
      repeatRate: totalCustomers > 0 ? (customersWithMultipleOrders / totalCustomers * 100).toFixed(2) : 0,
      topCustomers
    }));
  } catch (error) {
    next(error);
  }
};
