const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User, Cart } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// ─────────────────────────────────────────────────────────────────────────────
// Validation rule sets
// ─────────────────────────────────────────────────────────────────────────────

const registerValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3–50 characters.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Contact number is required.')
    .matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit Indian mobile number starting with 6-9.'),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extract validation errors
// ─────────────────────────────────────────────────────────────────────────────

const extractValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errors.array()[0].msg;
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: sign a JWT
// ─────────────────────────────────────────────────────────────────────────────

const signToken = (user) => {
  // Only id and role go into the JWT payload.
  // Role is re-fetched from DB on every protected request, so the JWT role
  // is a hint only — authMiddleware always re-validates from DB.
  return jwt.sign(
    { id: user.id, role: user.role, authVersion: user.authVersion },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Safe user shape — never include password or internal fields
// ─────────────────────────────────────────────────────────────────────────────

const safeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
    phone: user.phone,
    role: user.role,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    // 1. Run validation
    const validationError = extractValidationErrors(req);
    if (validationError) {
      return errorResponse(res, validationError, 422);
    }

    const { username, email, phone, password } = req.body;

    // 2. SECURITY: forcibly ignore any `role` field from the request body.
    //    Public registration ALWAYS creates USER role — no exceptions.

    // 3. Check uniqueness of email
    const existingEmail = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existingEmail) {
      return errorResponse(res, 'An account with this email address already exists.', 409);
    }

    // 4. Check uniqueness of username
    const existingUsername = await User.findOne({ where: { username: username.trim() } });
    if (existingUsername) {
      return errorResponse(res, 'This username is already taken. Please choose another.', 409);
    }

    // 5. Create user — role is hardcoded to 'USER', password is bcrypt-hashed by beforeSave hook
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,              // hashed by beforeSave hook in User model
      role: 'USER',          // ALWAYS 'USER' — never trust req.body.role
    });

    // 6. Create persistent cart for the new user
    await Cart.create({ userId: user.id });

    // 7. Return safe user data (toJSON() strips password automatically)
    return successResponse(
      res,
      { user: safeUser(user) },
      'User registered successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────

const login = async (req, res, next) => {
  try {
    // 1. Run validation
    const validationError = extractValidationErrors(req);
    if (validationError) {
      return errorResponse(res, validationError, 422);
    }

    const { username, password } = req.body;

    // 2. Find user by username — login uses USERNAME, not email
    const user = await User.findOne({ where: { username: username.trim() } });

    // 3. Generic error message: never reveal whether username vs password was wrong
    if (!user) {
      return errorResponse(res, 'Invalid username or password.', 401);
    }
    if (!user.isActive) {
      return errorResponse(res, 'Invalid username or password.', 401);
    }

    // 4. Verify password against bcrypt hash
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return errorResponse(res, 'Invalid username or password.', 401);
    }

    // 5. Sign JWT (contains only id + role — NO password/hash)
    const token = signToken(user);

    return successResponse(
      res,
      {
        token,
        user: safeUser(user),
      },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected — requires valid JWT)
// ─────────────────────────────────────────────────────────────────────────────

const getMe = async (req, res, next) => {
  try {
    // req.user is set by authMiddleware from the DB — not from the JWT payload
    return successResponse(
      res,
      { user: req.user },
      'User profile retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  registerValidation,
  login,
  loginValidation,
  getMe,
};
