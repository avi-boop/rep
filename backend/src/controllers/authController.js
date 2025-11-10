// =============================================================================
// AUTHENTICATION CONTROLLER
// =============================================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { successResponse, errorResponse, sanitizeUser } = require('../utils/helpers');

/**
 * Register new user
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json(errorResponse(
        'USER_EXISTS',
        'Username or email already exists'
      ));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role
      }
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json(successResponse({
      user: sanitizeUser(user),
      token
    }, 'User registered successfully'));

  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json(errorResponse(
        'INVALID_CREDENTIALS',
        'Invalid username or password'
      ));
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json(errorResponse(
        'ACCOUNT_DISABLED',
        'Account is disabled. Please contact administrator'
      ));
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json(errorResponse(
        'INVALID_CREDENTIALS',
        'Invalid username or password'
      ));
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    );

    res.json(successResponse({
      user: sanitizeUser(user),
      token,
      refreshToken
    }, 'Login successful'));

  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (optional - for token blacklisting)
 */
exports.logout = async (req, res, next) => {
  try {
    // In a production app, you would blacklist the token in Redis
    res.json(successResponse(null, 'Logout successful'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json(errorResponse(
        'USER_NOT_FOUND',
        'User not found'
      ));
    }

    res.json(successResponse(sanitizeUser(user)));
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(errorResponse(
        'NO_REFRESH_TOKEN',
        'Refresh token is required'
      ));
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.isActive) {
      return res.status(403).json(errorResponse(
        'INVALID_TOKEN',
        'Invalid refresh token'
      ));
    }

    // Generate new access token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json(successResponse({ token }));
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json(errorResponse(
        'INVALID_PASSWORD',
        'Current password is incorrect'
      ));
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    res.json(successResponse(null, 'Password changed successfully'));
  } catch (error) {
    next(error);
  }
};
