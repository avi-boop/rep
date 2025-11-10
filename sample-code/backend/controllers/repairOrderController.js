// controllers/repairOrderController.js
// Controller for Repair Order endpoints

const { RepairOrder, Customer, Device, RepairOrderItem, RepairType } = require('../models');
const { NotificationService } = require('../services/notificationService');
const { validationResult } = require('express-validator');

class RepairOrderController {
  // GET /api/v1/repair-orders
  async getAll(req, res) {
    try {
      const {
        status,
        customerId,
        assignedTo,
        dateFrom,
        dateTo,
        priority,
        page = 1,
        limit = 20,
        sort = 'createdAt',
        order = 'DESC'
      } = req.query;

      // Build where clause
      const where = {};
      
      if (status) where.status = status;
      if (customerId) where.customerId = parseInt(customerId);
      if (assignedTo) where.assignedTo = parseInt(assignedTo);
      if (priority) where.priority = priority;
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.$gte = new Date(dateFrom);
        if (dateTo) where.createdAt.$lte = new Date(dateTo);
      }

      // Pagination
      const offset = (page - 1) * limit;

      const { count, rows } = await RepairOrder.findAndCountAll({
        where,
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
          },
          {
            model: Device,
            as: 'device',
            attributes: ['id', 'brand', 'model', 'deviceType']
          },
          {
            model: RepairOrderItem,
            as: 'items',
            include: [{
              model: RepairType,
              as: 'repairType',
              attributes: ['name', 'category']
            }]
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [[sort, order]]
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching repair orders:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch repair orders'
        }
      });
    }
  }

  // GET /api/v1/repair-orders/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const order = await RepairOrder.findWithDetails(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Repair order not found'
          }
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error fetching repair order:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch repair order'
        }
      });
    }
  }

  // POST /api/v1/repair-orders
  async create(req, res) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const {
        customerId,
        deviceId,
        deviceImei,
        devicePasscode,
        deviceConditionNotes,
        priority,
        expectedCompletionDate,
        items,
        discountAmount,
        internalNotes,
        assignedTo
      } = req.body;

      // Verify customer exists
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }

      // Verify device exists
      const device = await Device.findByPk(deviceId);
      if (!device) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Device not found'
          }
        });
      }

      // Create repair order
      const order = await RepairOrder.create({
        customerId,
        deviceId,
        deviceImei,
        devicePasscode,
        deviceConditionNotes,
        priority: priority || 'normal',
        expectedCompletionDate,
        discountAmount: discountAmount || 0,
        internalNotes,
        assignedTo,
        createdBy: req.user.id
      });

      // Create repair order items
      let totalAmount = 0;
      for (const item of items) {
        const itemTotal = item.unitPrice * item.quantity;
        totalAmount += itemTotal;

        await RepairOrderItem.create({
          repairOrderId: order.id,
          repairTypeId: item.repairTypeId,
          pricingId: item.pricingId,
          partQuality: item.partQuality,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          totalPrice: itemTotal - (item.discount || 0),
          notes: item.notes
        });
      }

      // Update order total
      order.totalAmount = totalAmount;
      order.finalAmount = totalAmount - (discountAmount || 0);
      await order.save();

      // Send notification to customer
      try {
        await NotificationService.sendNotification(
          order.id,
          1, // Template ID for "Order Created"
          'sms'
        );
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the order creation if notification fails
      }

      // Fetch complete order with relations
      const completeOrder = await RepairOrder.findWithDetails(order.id);

      res.status(201).json({
        success: true,
        data: completeOrder,
        message: 'Repair order created successfully'
      });
    } catch (error) {
      console.error('Error creating repair order:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create repair order'
        }
      });
    }
  }

  // PATCH /api/v1/repair-orders/:id/status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const order = await RepairOrder.findByPk(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Repair order not found'
          }
        });
      }

      // Update status
      await order.updateStatus(status, req.user.id);

      // Add notes if provided
      if (notes) {
        order.internalNotes = order.internalNotes 
          ? `${order.internalNotes}\n\n[${new Date().toISOString()}] ${notes}`
          : notes;
        await order.save();
      }

      // Send notification based on status
      let templateId;
      switch (status) {
        case 'in_progress':
          templateId = 2; // "Repair In Progress"
          break;
        case 'ready_for_pickup':
        case 'completed':
          templateId = 3; // "Ready for Pickup"
          break;
        default:
          templateId = null;
      }

      if (templateId) {
        try {
          await NotificationService.sendNotification(
            order.id,
            templateId,
            'sms'
          );
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      }

      // Fetch updated order
      const updatedOrder = await RepairOrder.findWithDetails(id);

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Status updated successfully'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update status'
        }
      });
    }
  }

  // PUT /api/v1/repair-orders/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const order = await RepairOrder.findByPk(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Repair order not found'
          }
        });
      }

      // Update allowed fields
      const allowedFields = [
        'deviceImei',
        'devicePasscode',
        'deviceConditionNotes',
        'priority',
        'expectedCompletionDate',
        'discountAmount',
        'internalNotes',
        'assignedTo'
      ];

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          order[field] = updates[field];
        }
      });

      await order.save();

      // Recalculate total if discount changed
      if (updates.discountAmount !== undefined) {
        await order.calculateTotal();
      }

      const updatedOrder = await RepairOrder.findWithDetails(id);

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Repair order updated successfully'
      });
    } catch (error) {
      console.error('Error updating repair order:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update repair order'
        }
      });
    }
  }

  // DELETE /api/v1/repair-orders/:id
  async cancel(req, res) {
    try {
      const { id } = req.params;

      const order = await RepairOrder.findByPk(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Repair order not found'
          }
        });
      }

      // Soft delete by setting status to cancelled
      await order.updateStatus('cancelled', req.user.id);

      res.json({
        success: true,
        message: 'Repair order cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling repair order:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to cancel repair order'
        }
      });
    }
  }

  // GET /api/v1/repair-orders/:id/history
  async getHistory(req, res) {
    try {
      const { id } = req.params;

      const order = await RepairOrder.findByPk(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Repair order not found'
          }
        });
      }

      const history = await ActivityLog.findAll({
        where: {
          entityType: 'repair_order',
          entityId: id
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch history'
        }
      });
    }
  }
}

module.exports = new RepairOrderController();
