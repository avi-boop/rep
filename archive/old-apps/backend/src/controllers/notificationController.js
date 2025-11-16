// =============================================================================
// NOTIFICATION CONTROLLER
// =============================================================================

const prisma = require('../config/db');
const notificationService = require('../services/notificationService');
const { successResponse, errorResponse, getPagination, formatPaginationResponse } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { customerId, repairOrderId, status, type, page = 1, limit = 20 } = req.query;

    const where = {
      ...(customerId && { customerId: parseInt(customerId) }),
      ...(repairOrderId && { repairOrderId: parseInt(repairOrderId) }),
      ...(status && { status }),
      ...(type && { type })
    };

    const { skip, take } = getPagination(page, limit);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
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
          repairOrder: {
            select: {
              id: true,
              orderNumber: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.notification.count({ where })
    ]);

    res.json(successResponse(
      formatPaginationResponse(notifications, total, page, limit)
    ));
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        repairOrder: true
      }
    });

    if (!notification) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Notification not found'));
    }

    res.json(successResponse(notification));
  } catch (error) {
    next(error);
  }
};

exports.send = async (req, res, next) => {
  try {
    const { customerId, repairOrderId, type, subject, message, eventType } = req.body;

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) }
    });

    if (!customer) {
      return res.status(404).json(errorResponse('CUSTOMER_NOT_FOUND', 'Customer not found'));
    }

    // Send notification based on type
    let result;
    if (type === 'sms') {
      result = await notificationService.sendSMS(customer.phone, message);
    } else if (type === 'email') {
      result = await notificationService.sendEmail(customer.email, subject || 'Notification', message);
    }

    // Log notification
    const notification = await prisma.notification.create({
      data: {
        customerId: parseInt(customerId),
        repairOrderId: repairOrderId ? parseInt(repairOrderId) : null,
        type,
        eventType,
        subject,
        message,
        status: result.success ? 'sent' : 'failed',
        sentAt: result.success ? new Date() : null,
        errorMessage: result.error || null,
        externalId: result.messageId || null
      }
    });

    res.json(successResponse(notification, result.success ? 'Notification sent successfully' : 'Notification failed'));
  } catch (error) {
    next(error);
  }
};
