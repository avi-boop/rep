// =============================================================================
// ANALYTICS ROUTES
// =============================================================================

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/analytics/dashboard - Get dashboard statistics
router.get('/dashboard', authenticateToken, analyticsController.getDashboardStats);

// GET /api/analytics/revenue - Get revenue analytics
router.get('/revenue', authenticateToken, analyticsController.getRevenueAnalytics);

// GET /api/analytics/repairs - Get repair analytics
router.get('/repairs', authenticateToken, analyticsController.getRepairAnalytics);

// GET /api/analytics/customers - Get customer analytics
router.get('/customers', authenticateToken, analyticsController.getCustomerAnalytics);

module.exports = router;
