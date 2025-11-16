// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/register - Register new user
router.post('/register',
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'manager', 'technician', 'front_desk']).withMessage('Invalid role')
  ],
  validate,
  authController.register
);

// POST /api/auth/login - Login
router.post('/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  authController.login
);

// POST /api/auth/logout - Logout (optional, for token blacklisting)
router.post('/logout', authenticateToken, authController.logout);

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, authController.getCurrentUser);

// POST /api/auth/refresh - Refresh token
router.post('/refresh', authController.refreshToken);

// POST /api/auth/change-password - Change password
router.post('/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validate,
  authController.changePassword
);

module.exports = router;
