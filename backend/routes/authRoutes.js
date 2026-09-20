const express = require('express');
const router = express.Router();

const {
  register,
  registerValidation,
  login,
  loginValidation,
  getMe,
} = require('../controllers/authController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const { successResponse } = require('../utils/responseHandler');

// POST /api/auth/register — Public
router.post('/register', registerValidation, register);

// POST /api/auth/login — Public
router.post('/login', loginValidation, login);

// GET /api/auth/me — Protected (requires valid JWT)
router.get('/me', authMiddleware, getMe);

// GET /api/auth/admin-check — Protected (requires valid JWT + ADMIN role)
// Used to verify admin permissions and test isAdmin middleware
router.get('/admin-check', authMiddleware, isAdmin, (req, res) => {
  return successResponse(res, { user: req.user }, 'Admin access authorized');
});

module.exports = router;
