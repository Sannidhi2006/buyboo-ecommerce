/**
 * Standard API Response Formatters
 *
 * Rules:
 * Success: { "success": true, "message": "...", "data": {} }
 * Error:   { "success": false, "message": "..." }
 */

const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message = 'An error occurred', statusCode = 500, details = null) => {
  const response = {
    success: false,
    message,
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
};
