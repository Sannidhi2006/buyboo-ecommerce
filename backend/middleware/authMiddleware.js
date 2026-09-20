const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHandler');
const { User } = require('../models');

/**
 * authMiddleware
 *
 * Reads the JWT from:  Authorization: Bearer <token>
 * Verifies it against JWT_SECRET.
 * Attaches decoded identity to req.user.
 * Returns 401 for missing, invalid, malformed, or expired tokens.
 *
 * NEVER trusts user IDs or roles sent in the request body/params.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access denied. No authentication token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'Access denied. Malformed Authorization header.', 401);
    }

    // Verify the token — this throws if invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Re-fetch user from DB to get the current, authoritative role
    // This prevents stale JWTs from granting elevated permissions if a role was changed
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return errorResponse(res, 'Access denied. User account not found or has been deleted.', 401);
    }
    if (!user.isActive || decoded.authVersion !== user.authVersion) {
      return errorResponse(res, 'Authentication session is no longer valid. Please log in again.', 401);
    }

    // Attach identity to request — role comes from DB, not the JWT payload
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Authentication token has expired. Please log in again.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid authentication token.', 401);
    }
    return errorResponse(res, 'Authentication failed.', 401);
  }
};

/**
 * optionalAuth
 *
 * Checks for Authorization: Bearer <token> if provided, but does not block if absent.
 * Used for routes that are public but provide enriched/admin data when authenticated.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        if (user) {
          req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role,
          };
        }
      }
    }
  } catch {
    // Ignore error for optional auth
  }
  next();
};

/**
 * isAdmin middleware
 *
 * Must be used AFTER authMiddleware.
 * Allows ADMIN role through; returns 403 Forbidden for all others.
 *
 * Role is sourced from req.user which is set by authMiddleware from the DB —
 * never from the request body, query params, or localStorage.
 *
 * Usage:
 *   router.get('/admin/something', authMiddleware, isAdmin, controller);
 */
const isAdmin = (req, res, next) => {
  // req.user is guaranteed to exist because authMiddleware runs first
  if (!req.user) {
    return errorResponse(res, 'Access denied. Authentication required.', 401);
  }

  if (req.user.role !== 'ADMIN') {
    return errorResponse(
      res,
      'Access denied. You do not have permission to access this resource.',
      403
    );
  }

  next();
};

module.exports = { authMiddleware, optionalAuth, isAdmin };
