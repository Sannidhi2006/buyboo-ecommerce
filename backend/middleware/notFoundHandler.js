const { errorResponse } = require('../utils/responseHandler');

const notFoundHandler = (req, res) => {
  return errorResponse(res, `API route not found: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = notFoundHandler;
