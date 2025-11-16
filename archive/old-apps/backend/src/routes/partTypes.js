// =============================================================================
// PART TYPE ROUTES
// =============================================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const partTypeController = require('../controllers/partTypeController');
const validate = require('../middleware/validator');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/part-types - Get all part types
router.get('/', authenticateToken, partTypeController.getAll);

// POST /api/part-types - Create part type
router.post('/',
  authenticateToken,
  requireRole('admin', 'manager'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('qualityLevel').isInt({ min: 1, max: 5 }).withMessage('Quality level must be 1-5')
  ],
  validate,
  partTypeController.create
);

// PUT /api/part-types/:id - Update part type
router.put('/:id', authenticateToken, requireRole('admin', 'manager'), partTypeController.update);

// DELETE /api/part-types/:id - Delete part type
router.delete('/:id', authenticateToken, requireRole('admin'), partTypeController.remove);

module.exports = router;
