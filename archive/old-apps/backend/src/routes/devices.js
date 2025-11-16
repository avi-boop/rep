// =============================================================================
// DEVICE ROUTES
// =============================================================================

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const deviceController = require('../controllers/deviceController');
const validate = require('../middleware/validator');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/devices - Get all devices with filtering
router.get('/',
  authenticateToken,
  [
    query('brandId').optional().isInt().withMessage('Brand ID must be an integer'),
    query('deviceType').optional().isIn(['phone', 'tablet']).withMessage('Invalid device type'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ],
  validate,
  deviceController.getAll
);

// GET /api/devices/:id - Get device by ID
router.get('/:id',
  authenticateToken,
  deviceController.getById
);

// POST /api/devices - Create device (admin/manager only)
router.post('/',
  authenticateToken,
  requireRole('admin', 'manager'),
  [
    body('brandId').isInt().withMessage('Brand ID is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('deviceType').isIn(['phone', 'tablet']).withMessage('Device type must be phone or tablet'),
    body('releaseYear').optional().isInt({ min: 2000, max: 2030 }).withMessage('Invalid release year')
  ],
  validate,
  deviceController.create
);

// PUT /api/devices/:id - Update device
router.put('/:id',
  authenticateToken,
  requireRole('admin', 'manager'),
  deviceController.update
);

// DELETE /api/devices/:id - Delete device
router.delete('/:id',
  authenticateToken,
  requireRole('admin'),
  deviceController.remove
);

module.exports = router;
