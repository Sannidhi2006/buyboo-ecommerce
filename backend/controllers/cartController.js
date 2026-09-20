'use strict';

const { Cart, CartItem, Product, Brand } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/* ─────────────────────────────────────────────────────────────────────────────
   Helper: get or create the authenticated user's cart (never duplicates).
───────────────────────────────────────────────────────────────────────────── */
const getOrCreateCart = async (userId) => {
  const [cart] = await Cart.findOrCreate({
    where: { userId },
    defaults: { userId },
  });
  return cart;
};

// Do not let parseInt turn values such as "1item" or "1.5" into a valid
// quantity. Cart quantities are deliberately limited to whole positive numbers.
const parseQuantity = (value) => {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : null;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const quantity = Number(value);
    return Number.isSafeInteger(quantity) ? quantity : null;
  }
  return null;
};

/* ─────────────────────────────────────────────────────────────────────────────
   Helper: build the full cart response payload for a given userId.
   Fetches cart + all items, joins current product data from DB (never trusts
   frontend-supplied prices or names).
───────────────────────────────────────────────────────────────────────────── */
const buildCartPayload = async (userId) => {
  const cart = await Cart.findOne({
    where: { userId },
    include: [
      {
        association: 'items',
        include: [
          {
            association: 'product',
            include: [{ association: 'brand' }, { association: 'category' }],
          },
        ],
      },
    ],
  });

  if (!cart) {
    return {
      cartId: null,
      items: [],
      totalProducts: 0,
      totalQuantity: 0,
      totalAmount: 0,
    };
  }

  const items = (cart.items || []).map((item) => {
    const product = item.product;
    const price = parseFloat(product?.price ?? 0);
    const quantity = item.quantity;
    const subtotal = parseFloat((price * quantity).toFixed(2));

    return {
      cartItemId: item.id,
      productId: product?.id ?? null,
      productName: product?.name ?? '(Product removed)',
      productImage: product?.imageUrl ?? null,
      brand: product?.brand?.name ?? null,
      price,
      quantity,
      stock: product?.stock ?? 0,
      isActive: product?.isActive ?? false,
      inStock: product ? product.stock > 0 : false,
      subtotal,
    };
  });

  const totalProducts = items.length;
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = parseFloat(
    items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)
  );

  return {
    cartId: cart.id,
    items,
    totalProducts,
    totalQuantity,
    totalAmount,
  };
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/cart
   Returns the authenticated user's full cart with backend-derived totals.
───────────────────────────────────────────────────────────────────────────── */
const getCart = async (req, res) => {
  try {
    const payload = await buildCartPayload(req.user.id);
    return successResponse(res, payload, 'Cart retrieved successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to retrieve cart.', 500, err.message);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/cart/items
   Add a product to the cart (or increase quantity if already present).
   Validates: product exists, active, in stock, quantity ≥ 1, quantity ≤ stock.
   Merges if the same product is already in the cart.
───────────────────────────────────────────────────────────────────────────── */
const addItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // ── 1. Validate quantity input ─────────────────────────────────────────
    const qty = parseQuantity(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return errorResponse(res, 'Quantity must be an integer of at least 1.', 400);
    }

    // ── 2. Verify product exists ───────────────────────────────────────────
    if (!productId) {
      return errorResponse(res, 'productId is required.', 400);
    }
    const product = await Product.findByPk(productId);
    if (!product) {
      return errorResponse(res, 'Product not found.', 404);
    }

    // ── 3. Verify product is active ────────────────────────────────────────
    if (!product.isActive) {
      return errorResponse(res, 'This product is currently unavailable.', 400);
    }

    // ── 4. Verify product is in stock ──────────────────────────────────────
    if (product.stock <= 0) {
      return errorResponse(res, 'This product is out of stock.', 400);
    }

    // ── 5. Get or create the user's cart ──────────────────────────────────
    const cart = await getOrCreateCart(req.user.id);

    // ── 6. Check for existing cart item (merge if present) ─────────────────
    const existing = await CartItem.findOne({
      where: { cartId: cart.id, productId: product.id },
    });

    if (existing) {
      const newQty = existing.quantity + qty;
      // ── 7. Check merged quantity against current stock ─────────────────
      if (newQty > product.stock) {
        return errorResponse(
          res,
          `Cannot add ${qty} more. You already have ${existing.quantity} in your cart and only ${product.stock} are available.`,
          400
        );
      }
      await existing.update({ quantity: newQty });
    } else {
      // ── 7. Requested quantity must not exceed stock ─────────────────────
      if (qty > product.stock) {
        return errorResponse(
          res,
          `Only ${product.stock} unit(s) available. Requested: ${qty}.`,
          400
        );
      }
      await CartItem.create({ cartId: cart.id, productId: product.id, quantity: qty });
    }

    const payload = await buildCartPayload(req.user.id);
    return successResponse(res, payload, 'Item added to cart.', 201);
  } catch (err) {
    return errorResponse(res, 'Failed to add item to cart.', 500, err.message);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PUT /api/cart/items/:id
   Update quantity for a cart item.
   Validates ownership, product still active, quantity ≥ 1, within stock.
───────────────────────────────────────────────────────────────────────────── */
const updateItem = async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id, 10);
    const { quantity } = req.body;

    // Validate quantity
    const qty = parseQuantity(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return errorResponse(res, 'Quantity must be an integer of at least 1.', 400);
    }

    // Find the cart item
    const cartItem = await CartItem.findByPk(cartItemId, {
      include: [{ association: 'product' }],
    });

    if (!cartItem) {
      return errorResponse(res, 'Cart item not found.', 404);
    }

    // Verify ownership: cart item must belong to this user's cart
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (!cart || cartItem.cartId !== cart.id) {
      return errorResponse(res, 'You do not have permission to modify this cart item.', 403);
    }

    // Product must still exist and be active
    const product = cartItem.product;
    if (!product) {
      return errorResponse(res, 'Product no longer exists.', 404);
    }
    if (!product.isActive) {
      return errorResponse(
        res,
        'This product is no longer available and cannot be updated.',
        400
      );
    }

    // Quantity must not exceed current stock
    if (qty > product.stock) {
      return errorResponse(
        res,
        `Only ${product.stock} unit(s) available. Requested: ${qty}.`,
        400
      );
    }

    await cartItem.update({ quantity: qty });

    const payload = await buildCartPayload(req.user.id);
    return successResponse(res, payload, 'Cart item updated.');
  } catch (err) {
    return errorResponse(res, 'Failed to update cart item.', 500, err.message);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE /api/cart/items/:id
   Remove a single item from the cart (ownership-verified).
───────────────────────────────────────────────────────────────────────────── */
const removeItem = async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id, 10);

    const cartItem = await CartItem.findByPk(cartItemId);
    if (!cartItem) {
      return errorResponse(res, 'Cart item not found.', 404);
    }

    // Verify ownership
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (!cart || cartItem.cartId !== cart.id) {
      return errorResponse(res, 'You do not have permission to remove this cart item.', 403);
    }

    await cartItem.destroy();

    const payload = await buildCartPayload(req.user.id);
    return successResponse(res, payload, 'Item removed from cart.');
  } catch (err) {
    return errorResponse(res, 'Failed to remove cart item.', 500, err.message);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE /api/cart
   Clear all items from the authenticated user's cart.
   Does NOT delete another user's cart.
───────────────────────────────────────────────────────────────────────────── */
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });

    if (cart) {
      await CartItem.destroy({ where: { cartId: cart.id } });
    }

    const payload = await buildCartPayload(req.user.id);
    return successResponse(res, payload, 'Cart cleared.');
  } catch (err) {
    return errorResponse(res, 'Failed to clear cart.', 500, err.message);
  }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
