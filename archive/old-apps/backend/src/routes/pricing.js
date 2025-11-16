// =============================================================================
// PRICING ROUTES
// =============================================================================

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const pricingController = require('../controllers/pricingController');
const validate = require('../middleware/validator');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/pricing - Get pricing with filtering
router.get('/',
  authenticateToken,
  [
    query('deviceModelId').optional().isInt(),
    query('repairTypeId').optional().isInt(),
    query('partTypeId').optional().isInt(),
    query('isEstimated').optional().isBoolean()
  ],
  validate,
  pricingController.getAll
);

// GET /api/pricing/matrix - Get pricing matrix
router.get('/matrix',
  authenticateToken,
  pricingController.getMatrix
);

// GET /api/pricing/estimate - Estimate price using smart pricing
router.get('/estimate',
  authenticateToken,
  [
    query('deviceModelId').isInt().withMessage('Device model ID is required'),
    query('repairTypeId').isInt().withMessage('Repair type ID is required'),
    query('partTypeId').isInt().withMessage('Part type ID is required')
  ],
  validate,
  pricingController.estimatePrice
);

// GET /api/pricing/:id - Get price by ID
router.get('/:id', authenticateToken, pricingController.getById);

// POST /api/pricing - Create price entry
router.post('/',
  authenticateToken,
  requireRole('admin', 'manager'),
  [
    body('deviceModelId').isInt().withMessage('Device model ID is required'),
    body('repairTypeId').isInt().withMessage('Repair type ID is required'),
    body('partTypeId').isInt().withMessage('Part type ID is required'),
    body('price').isDecimal().withMessage('Price is required'),
    body('cost').optional().isDecimal()
  ],
  validate,
  pricingController.create
);

// PUT /api/pricing/:id - Update price entry
router.put('/:id',
  authenticateToken,
  requireRole('admin', 'manager'),
  pricingController.update
);

// DELETE /api/pricing/:id - Delete price entry
router.delete('/:id',
  authenticateToken,
  requireRole('admin'),
  pricingController.remove
);

// POST /api/pricing/bulk - Bulk create/update prices
router.post('/bulk',
  authenticateToken,
  requireRole('admin', 'manager'),
  pricingController.bulkUpsert
);

module.exports = router;
