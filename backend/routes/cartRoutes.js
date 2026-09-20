'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} = require('../controllers/cartController');

// All cart routes require authentication — Phase 5
// Unauthenticated requests return 401.

/**
 * GET /api/cart
 * Returns the authenticated user's full cart with backend-calculated totals.
 */
router.get('/', authMiddleware, getCart);

/**
 * POST /api/cart/items
 * Add a product to the cart. Validates product exists, active, in stock, qty ≥ 1.
 * Merges quantity if the product is already in the cart.
 */
router.post('/items', authMiddleware, addItem);

/**
 * PUT /api/cart/items/:id
 * Update the quantity of a cart item (ownership-verified).
 */
router.put('/items/:id', authMiddleware, updateItem);

/**
 * DELETE /api/cart/items/:id
 * Remove a single item from the cart (ownership-verified).
 */
router.delete('/items/:id', authMiddleware, removeItem);

/**
 * DELETE /api/cart
 * Clear all items from the authenticated user's cart.
 */
router.delete('/', authMiddleware, clearCart);

module.exports = router;
