// =============================================================================
// REPAIR TYPE ROUTES
// =============================================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const repairTypeController = require('../controllers/repairTypeController');
const validate = require('../middleware/validator');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/repair-types - Get all repair types
router.get('/', authenticateToken, repairTypeController.getAll);

// POST /api/repair-types - Create repair type
router.post('/',
  authenticateToken,
  requireRole('admin', 'manager'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').optional().trim(),
    body('estimatedDuration').optional().isInt({ min: 1 }).withMessage('Duration must be positive')
  ],
  validate,
  repairTypeController.create
);

// PUT /api/repair-types/:id - Update repair type
router.put('/:id', authenticateToken, requireRole('admin', 'manager'), repairTypeController.update);

// DELETE /api/repair-types/:id - Delete repair type
router.delete('/:id', authenticateToken, requireRole('admin'), repairTypeController.remove);

module.exports = router;
