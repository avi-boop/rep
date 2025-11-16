// =============================================================================
// UTILITY HELPER FUNCTIONS
// =============================================================================

/**
 * Generate order number with format: R20231210-0001
 */
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `R${year}${month}${day}-${random}`;
}

/**
 * Calculate pagination offsets
 */
function getPagination(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  return {
    skip: offset,
    take: limit
  };
}

/**
 * Format pagination response
 */
function formatPaginationResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasMore: page < totalPages
    }
  };
}

/**
 * Format success response
 */
function successResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data
  };
}

/**
 * Format error response
 */
function errorResponse(code, message, details = null) {
  const response = {
    success: false,
    error: {
      code,
      message
    }
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return response;
}

/**
 * Sanitize user object (remove sensitive data)
 */
function sanitizeUser(user) {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

/**
 * Calculate price with discount
 */
function calculateDiscountedPrice(price, discount) {
  return price - discount;
}

/**
 * Calculate total from items
 */
function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + (parseFloat(item.totalPrice) || 0);
  }, 0);
}

module.exports = {
  generateOrderNumber,
  getPagination,
  formatPaginationResponse,
  successResponse,
  errorResponse,
  sanitizeUser,
  calculateDiscountedPrice,
  calculateTotal
};
