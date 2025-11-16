// =============================================================================
// CUSTOMER ROUTES
// =============================================================================

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const customerController = require('../controllers/customerController');
const validate = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');

// GET /api/customers - Get all customers with search/filtering
router.get('/',
  authenticateToken,
  [
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  customerController.getAll
);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', authenticateToken, customerController.getById);

// POST /api/customers - Create customer
router.post('/',
  authenticateToken,
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('email').optional().isEmail().withMessage('Valid email is required')
  ],
  validate,
  customerController.create
);

// PUT /api/customers/:id - Update customer
router.put('/:id', authenticateToken, customerController.update);

// DELETE /api/customers/:id - Delete customer (soft delete)
router.delete('/:id', authenticateToken, customerController.remove);

// POST /api/customers/search - Search customers
router.post('/search',
  authenticateToken,
  customerController.search
);

module.exports = router;
