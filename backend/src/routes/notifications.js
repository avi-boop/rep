// =============================================================================
// NOTIFICATION ROUTES
// =============================================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const validate = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications - Get all notifications
router.get('/', authenticateToken, notificationController.getAll);

// GET /api/notifications/:id - Get notification by ID
router.get('/:id', authenticateToken, notificationController.getById);

// POST /api/notifications/send - Send notification
router.post('/send',
  authenticateToken,
  [
    body('customerId').isInt().withMessage('Customer ID is required'),
    body('type').isIn(['sms', 'email', 'push']).withMessage('Invalid notification type'),
    body('message').trim().notEmpty().withMessage('Message is required')
  ],
  validate,
  notificationController.send
);

module.exports = router;
