// models/RepairOrder.js
// Sequelize model for Repair Orders

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RepairOrder = sequelize.define('RepairOrder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
      field: 'order_number'
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      },
      field: 'customer_id'
    },
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'devices',
        key: 'id'
      },
      field: 'device_id'
    },
    deviceImei: {
      type: DataTypes.STRING(50),
      field: 'device_imei'
    },
    devicePasscode: {
      type: DataTypes.STRING(50),
      field: 'device_passcode'
    },
    deviceConditionNotes: {
      type: DataTypes.TEXT,
      field: 'device_condition_notes'
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'in_progress',
        'awaiting_parts',
        'completed',
        'ready_for_pickup',
        'picked_up',
        'cancelled'
      ),
      defaultValue: 'pending',
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('normal', 'urgent'),
      defaultValue: 'normal'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'total_amount'
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'discount_amount'
    },
    finalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'final_amount'
    },
    expectedCompletionDate: {
      type: DataTypes.DATEONLY,
      field: 'expected_completion_date'
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at'
    },
    pickedUpAt: {
      type: DataTypes.DATE,
      field: 'picked_up_at'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'created_by'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'assigned_to'
    },
    internalNotes: {
      type: DataTypes.TEXT,
      field: 'internal_notes'
    }
  }, {
    tableName: 'repair_orders',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (order) => {
        if (!order.orderNumber) {
          // Generate order number
          const lastOrder = await RepairOrder.findOne({
            order: [['id', 'DESC']]
          });
          const nextNum = lastOrder ? lastOrder.id + 1 : 1;
          order.orderNumber = `RO-${String(nextNum).padStart(5, '0')}`;
        }
      }
    }
  });

  RepairOrder.associate = (models) => {
    RepairOrder.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });
    
    RepairOrder.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      as: 'device'
    });
    
    RepairOrder.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    RepairOrder.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'technician'
    });
    
    RepairOrder.hasMany(models.RepairOrderItem, {
      foreignKey: 'repairOrderId',
      as: 'items'
    });
    
    RepairOrder.hasMany(models.DevicePhoto, {
      foreignKey: 'repairOrderId',
      as: 'photos'
    });
    
    RepairOrder.hasMany(models.NotificationLog, {
      foreignKey: 'repairOrderId',
      as: 'notifications'
    });
  };

  // Instance methods
  RepairOrder.prototype.calculateTotal = async function() {
    const items = await this.getItems();
    this.totalAmount = items.reduce((sum, item) => 
      sum + parseFloat(item.totalPrice), 0
    );
    this.finalAmount = this.totalAmount - (this.discountAmount || 0);
    await this.save();
    return this.finalAmount;
  };

  RepairOrder.prototype.updateStatus = async function(newStatus, userId) {
    const oldStatus = this.status;
    this.status = newStatus;
    
    // Set completion date if completed
    if (newStatus === 'completed') {
      this.completedAt = new Date();
    }
    
    // Set pickup date if picked up
    if (newStatus === 'picked_up') {
      this.pickedUpAt = new Date();
    }
    
    await this.save();
    
    // Log activity
    await sequelize.models.ActivityLog.create({
      userId,
      action: 'status_changed',
      entityType: 'repair_order',
      entityId: this.id,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus }
    });
    
    return this;
  };

  // Class methods
  RepairOrder.findWithDetails = async function(orderId) {
    return await RepairOrder.findByPk(orderId, {
      include: [
        {
          model: sequelize.models.Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
        },
        {
          model: sequelize.models.Device,
          as: 'device',
          attributes: ['id', 'brand', 'model', 'deviceType']
        },
        {
          model: sequelize.models.User,
          as: 'technician',
          attributes: ['id', 'username', 'email']
        },
        {
          model: sequelize.models.RepairOrderItem,
          as: 'items',
          include: [{
            model: sequelize.models.RepairType,
            as: 'repairType',
            attributes: ['id', 'name', 'category']
          }]
        }
      ]
    });
  };

  RepairOrder.getActiveOrders = async function(filters = {}) {
    const whereClause = {
      status: {
        [sequelize.Sequelize.Op.notIn]: ['picked_up', 'cancelled']
      }
    };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.assignedTo) {
      whereClause.assignedTo = filters.assignedTo;
    }

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    return await RepairOrder.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        },
        {
          model: sequelize.models.Device,
          as: 'device',
          attributes: ['id', 'brand', 'model']
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['expectedCompletionDate', 'ASC']
      ]
    });
  };

  RepairOrder.getStatistics = async function(startDate, endDate) {
    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      };
    }

    const [totalOrders, totalRevenue, statusBreakdown] = await Promise.all([
      RepairOrder.count({ where: whereClause }),
      
      RepairOrder.sum('finalAmount', { where: whereClause }),
      
      RepairOrder.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: whereClause,
        group: ['status'],
        raw: true
      })
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue || 0,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {})
    };
  };

  return RepairOrder;
};
