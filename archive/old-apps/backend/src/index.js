// =============================================================================
// MOBILE REPAIR DASHBOARD - MAIN SERVER FILE
// =============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Security
app.use(helmet());

// CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/repair-types', require('./routes/repairTypes'));
app.use('/api/part-types', require('./routes/partTypes'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found'
    }
  });
});

// =============================================================================
// ERROR HANDLER
// =============================================================================

app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.details || []
      }
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
  }

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

// =============================================================================
// SERVER START
// =============================================================================

const server = app.listen(PORT, () => {
  console.log('=============================================================================');
  console.log('  🚀 MOBILE REPAIR DASHBOARD API');
  console.log('=============================================================================');
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Server running on: http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
  console.log('=============================================================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
