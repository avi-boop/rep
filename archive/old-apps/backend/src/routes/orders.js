// =============================================================================
// REPAIR ORDER ROUTES
// =============================================================================

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const orderController = require('../controllers/orderController');
const validate = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');

// GET /api/orders - Get all orders with filtering
router.get('/',
  authenticateToken,
  [
    query('status').optional().isIn(['pending', 'in_progress', 'waiting_parts', 'completed', 'ready_pickup', 'delivered', 'cancelled']),
    query('priority').optional().isIn(['normal', 'urgent', 'express']),
    query('customerId').optional().isInt(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  orderController.getAll
);

// GET /api/orders/stats - Get order statistics
router.get('/stats', authenticateToken, orderController.getStats);

// GET /api/orders/:id - Get order by ID
router.get('/:id', authenticateToken, orderController.getById);

// POST /api/orders - Create new order
router.post('/',
  authenticateToken,
  [
    body('customerId').isInt().withMessage('Customer ID is required'),
    body('deviceModelId').isInt().withMessage('Device model ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one repair item is required'),
    body('items.*.repairTypeId').isInt().withMessage('Repair type ID is required for each item'),
    body('items.*.partTypeId').isInt().withMessage('Part type ID is required for each item'),
    body('items.*.unitPrice').isDecimal().withMessage('Unit price is required for each item')
  ],
  validate,
  orderController.create
);

// PUT /api/orders/:id - Update order
router.put('/:id', authenticateToken, orderController.update);

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status',
  authenticateToken,
  [
    body('status').isIn(['pending', 'in_progress', 'waiting_parts', 'completed', 'ready_pickup', 'delivered', 'cancelled']).withMessage('Invalid status')
  ],
  validate,
  orderController.updateStatus
);

// DELETE /api/orders/:id - Cancel order
router.delete('/:id', authenticateToken, orderController.cancel);

module.exports = router;
