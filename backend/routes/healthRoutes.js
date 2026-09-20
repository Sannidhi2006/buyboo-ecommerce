const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseHandler');

router.get('/', async (req, res) => {
  try {
    await sequelize.authenticate();
    return successResponse(
      res,
      {
        status: 'UP',
        database: 'Connected (MySQL)',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      },
      'Backend API service is healthy and operational'
    );
  } catch (error) {
    return errorResponse(res, `Database connection check failed: ${error.message}`, 503);
  }
});

module.exports = router;
