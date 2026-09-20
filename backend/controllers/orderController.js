'use strict';

const { Op } = require('sequelize');
const { sequelize, Cart, CartItem, Product, Order, OrderItem } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const PAYMENT_METHODS = new Set(['COD', 'UPI', 'NETBANKING', 'CARD']);
const isPositiveInteger = (value) => Number.isSafeInteger(value) && value >= 1;

const normaliseShipping = (shipping = {}) => {
  const fields = ['name', 'address', 'city', 'state', 'postalCode', 'contactNumber'];
  const result = {};
  for (const field of fields) result[field] = typeof shipping[field] === 'string' ? shipping[field].trim() : '';
  if (!result.name || result.name.length > 100) return { error: 'Shipping name is required and must be at most 100 characters.' };
  if (!result.address || result.address.length > 2000) return { error: 'Shipping address is required.' };
  if (!result.city || !result.state || !result.postalCode) return { error: 'City, state, and postal code are required.' };
  if (!/^[6-9]\d{9}$/.test(result.contactNumber)) return { error: 'Enter a valid 10-digit Indian contact number.' };
  return { value: result };
};

const serialiseOrder = (order) => {
  const plain = order.get ? order.get({ plain: true }) : order;
  const items = (plain.items || []).map((item) => ({
    id: item.id, productId: item.productId, productName: item.productName,
    price: Number(item.price), quantity: item.quantity, subtotal: Number(item.subtotal),
  }));
  return {
    id: plain.id, invoiceNumber: plain.invoiceNumber, orderDate: plain.createdAt,
    status: plain.status, paymentMethod: plain.paymentMethod, paymentStatus: plain.paymentStatus,
    shipping: { name: plain.shippingName, address: plain.shippingAddress, city: plain.shippingCity, state: plain.shippingState, postalCode: plain.shippingPostalCode, contactNumber: plain.shippingPhone },
    items, totalProducts: items.length, totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: Number(plain.totalAmount),
  };
};

const createOrder = async (req, res) => {
  const { source, items, shipping, paymentMethod } = req.body || {};
  if (source !== 'buy_now' && source !== 'cart') return errorResponse(res, 'source must be either buy_now or cart.', 400);
  if (!PAYMENT_METHODS.has(paymentMethod)) return errorResponse(res, 'Select a valid simulated payment method.', 400);
  const shippingResult = normaliseShipping(shipping);
  if (shippingResult.error) return errorResponse(res, shippingResult.error, 400);

  if (source === 'buy_now') {
    if (!Array.isArray(items) || items.length !== 1 || !isPositiveInteger(items[0]?.productId) || !isPositiveInteger(items[0]?.quantity)) {
      return errorResponse(res, 'Buy Now requires exactly one product with a positive integer quantity.', 400);
    }
  }

  const transaction = await sequelize.transaction();
  try {
    let requestedItems;
    let cart;
    if (source === 'cart') {
      cart = await Cart.findOne({ where: { userId: req.user.id }, transaction, lock: transaction.LOCK.UPDATE });
      if (!cart) throw Object.assign(new Error('Your cart is empty.'), { status: 400 });
      const cartItems = await CartItem.findAll({ where: { cartId: cart.id }, transaction, lock: transaction.LOCK.UPDATE });
      if (!cartItems.length) throw Object.assign(new Error('Your cart is empty.'), { status: 400 });
      requestedItems = cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity, cartItemId: item.id }));
    } else {
      requestedItems = items;
    }

    const quantities = new Map();
    for (const item of requestedItems) {
      if (!isPositiveInteger(item.productId) || !isPositiveInteger(item.quantity)) throw Object.assign(new Error('Every order quantity must be a positive integer.'), { status: 400 });
      quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
    }
    const productIds = [...quantities.keys()].sort((a, b) => a - b);
    const products = await Product.findAll({ where: { id: { [Op.in]: productIds } }, transaction, lock: transaction.LOCK.UPDATE, order: [['id', 'ASC']] });
    if (products.length !== productIds.length) throw Object.assign(new Error('One or more products no longer exist.'), { status: 404 });

    const productById = new Map(products.map((product) => [product.id, product]));
    const orderLines = productIds.map((productId) => {
      const product = productById.get(productId);
      const quantity = quantities.get(productId);
      if (!product.isActive) throw Object.assign(new Error(`${product.name} is no longer available.`), { status: 409 });
      if (product.stock < quantity) throw Object.assign(new Error(`Insufficient stock for ${product.name}. Only ${product.stock} available.`), { status: 409 });
      const price = Number(product.price);
      return { product, quantity, price, subtotal: Number((price * quantity).toFixed(2)) };
    });
    const totalAmount = Number(orderLines.reduce((sum, line) => sum + line.subtotal, 0).toFixed(2));
    const paymentStatus = paymentMethod === 'COD' ? 'PENDING' : 'COMPLETED';

    // A temporary unique value permits deriving a collision-proof, readable invoice from the DB order id.
    const temporaryInvoice = `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const order = await Order.create({
      invoiceNumber: temporaryInvoice, userId: req.user.id, shippingName: shippingResult.value.name,
      shippingAddress: shippingResult.value.address, shippingCity: shippingResult.value.city,
      shippingState: shippingResult.value.state, shippingPostalCode: shippingResult.value.postalCode,
      shippingPhone: shippingResult.value.contactNumber, totalAmount, status: 'PENDING', paymentMethod, paymentStatus,
    }, { transaction });
    await order.update({ invoiceNumber: `INV-${new Date().getFullYear()}-${String(order.id).padStart(6, '0')}` }, { transaction });
    await OrderItem.bulkCreate(orderLines.map((line) => ({
      orderId: order.id, productId: line.product.id, productName: line.product.name,
      price: line.price, quantity: line.quantity, subtotal: line.subtotal,
    })), { transaction });
    for (const line of orderLines) await line.product.update({ stock: line.product.stock - line.quantity }, { transaction });
    if (source === 'cart') await CartItem.destroy({ where: { cartId: cart.id }, transaction });
    await transaction.commit();

    const completeOrder = await Order.findByPk(order.id, { include: [{ association: 'items' }] });
    return successResponse(res, { order: serialiseOrder(completeOrder) }, 'Order placed successfully.', 201);
  } catch (error) {
    await transaction.rollback();
    return errorResponse(res, error.message || 'Unable to place order.', error.status || 500);
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({ where: { userId: req.user.id }, include: [{ association: 'items' }], order: [['createdAt', 'DESC']] });
    return successResponse(res, { orders: orders.map(serialiseOrder) }, 'Orders retrieved successfully.');
  } catch (error) { return errorResponse(res, 'Unable to retrieve orders.', 500); }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, userId: req.user.id }, include: [{ association: 'items' }] });
    if (!order) return errorResponse(res, 'Order not found.', 404);
    return successResponse(res, { order: serialiseOrder(order) }, 'Order retrieved successfully.');
  } catch (error) { return errorResponse(res, 'Unable to retrieve order.', 500); }
};

module.exports = { createOrder, getOrders, getOrder };
