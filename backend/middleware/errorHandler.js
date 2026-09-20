const { errorResponse } = require('../utils/responseHandler');

/**
 * Centralized Error Handling Middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', err);

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors && err.errors[0] ? err.errors[0].path : 'Field';
    return errorResponse(res, `${field} already exists. Please use a unique value.`, 409);
  }

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors && err.errors[0] ? err.errors[0].message : 'Validation error';
    return errorResponse(res, message, 400);
  }

  // Sequelize Foreign Key Error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return errorResponse(res, 'Cannot perform operation due to foreign key relationship constraint.', 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid authentication token.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Authentication token has expired. Please log in again.', 401);
  }

  // Multer Error
  if (err.name === 'MulterError') {
    return errorResponse(res, `Upload error: ${err.message}`, 400);
  }

  const statusCode = err.statusCode || (err.status ? parseInt(err.status, 10) : 500);
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, statusCode, err.stack);
};

module.exports = errorHandler;
