// =============================================================================
// BRAND ROUTES
// =============================================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const brandController = require('../controllers/brandController');
const validate = require('../middleware/validator');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/brands - Get all brands
router.get('/', authenticateToken, brandController.getAll);

// GET /api/brands/:id - Get brand by ID
router.get('/:id', authenticateToken, brandController.getById);

// POST /api/brands - Create brand
router.post('/',
  authenticateToken,
  requireRole('admin', 'manager'),
  [
    body('name').trim().notEmpty().withMessage('Name is required')
  ],
  validate,
  brandController.create
);

// PUT /api/brands/:id - Update brand
router.put('/:id',
  authenticateToken,
  requireRole('admin', 'manager'),
  brandController.update
);

// DELETE /api/brands/:id - Delete brand
router.delete('/:id',
  authenticateToken,
  requireRole('admin'),
  brandController.remove
);

module.exports = router;
