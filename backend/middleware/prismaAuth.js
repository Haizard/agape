/**
 * Prisma Authentication Middleware
 * 
 * This file provides authentication middleware for Prisma routes.
 * It's designed to be compatible with the existing authentication system.
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateJWT = (req, res, next) => {
  logger.debug('[PrismaAuth] Authenticating JWT token...');
  
  // Check for token in authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  // Check for token in query parameters (for PDF downloads)
  const queryToken = req.query.token;
  
  // Get token from header or query parameter
  let token;
  if (authHeader) {
    token = authHeader.split(' ')[1];
  } else if (queryToken) {
    token = queryToken;
  }
  
  if (!token) {
    logger.debug('[PrismaAuth] No token found in auth header or query parameters');
    
    // For development or specific endpoints, allow access without token
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('[PrismaAuth] Allowing access without token for development');
      req.user = { role: 'guest' };
      return next();
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  try {
    // Use a consistent JWT secret key with a fallback
    const jwtSecret = process.env.JWT_SECRET || 'kjjf6565i87utgfu64erd';
    
    const decoded = jwt.verify(token, jwtSecret);
    logger.debug(`[PrismaAuth] Token verified successfully for user: ${decoded.username || decoded.email || 'unknown'}`);
    
    // Ensure userId is set correctly
    if (decoded.id && !decoded.userId) {
      decoded.userId = decoded.id;
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`[PrismaAuth] Token verification failed: ${error.message}`);
    
    // For development, allow access even with invalid token
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('[PrismaAuth] Allowing access with invalid token for development');
      req.user = { role: 'guest' };
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * Authorize user role
 * @param {string|Array} requiredRoles - Required role(s)
 * @returns {Function} - Middleware function
 */
const authorizeRole = (requiredRoles) => {
  return (req, res, next) => {
    logger.debug('[PrismaAuth] Authorizing role...');
    
    // Convert to array if a single role is provided
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Check if user and role exist
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User role not found'
      });
    }
    
    // Special case for admin2 user - always grant admin access
    if (req.user.username === 'admin2') {
      logger.debug('[PrismaAuth] Special case: admin2 user detected, granting admin access');
      return next();
    }
    
    // Normalize roles for case-insensitive comparison
    const userRole = req.user.role.toLowerCase();
    const normalizedRoles = roles.map(role => role.toLowerCase());
    
    // Check if user's role is in the required roles
    if (!normalizedRoles.includes(userRole)) {
      logger.debug(`[PrismaAuth] User role ${userRole} not in required roles: ${normalizedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `Unauthorized: Required role(s): ${roles.join(', ')}, your role: ${req.user.role}`
      });
    }
    
    logger.debug(`[PrismaAuth] Authorization successful for role: ${req.user.role}`);
    next();
  };
};

module.exports = {
  authenticateJWT,
  authorizeRole
};
