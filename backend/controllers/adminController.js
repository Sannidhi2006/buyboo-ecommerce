'use strict';

const { Op } = require('sequelize');
const { Brand, Category, Order, OrderItem, Product, User } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const REVENUE_WHERE = { paymentStatus: 'COMPLETED', status: { [Op.ne]: 'CANCELLED' } };

const safeAdminUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  phone: user.phone,
  role: user.role,
  registrationDate: user.createdAt,
  status: user.isActive ? 'ACTIVE' : 'DEACTIVATED',
});

const serialiseAdminOrder = (order) => {
  const plain = order.get ? order.get({ plain: true }) : order;
  const items = (plain.items || []).map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    price: Number(item.price),
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
  }));

  return {
    id: plain.id,
    invoiceNumber: plain.invoiceNumber,
    orderDate: plain.createdAt,
    status: plain.status,
    paymentMethod: plain.paymentMethod,
    paymentStatus: plain.paymentStatus,
    totalAmount: Number(plain.totalAmount),
    totalProducts: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    customer: plain.user ? safeAdminUser(plain.user) : { id: plain.userId, username: plain.shippingName },
    shipping: {
      name: plain.shippingName,
      address: plain.shippingAddress,
      city: plain.shippingCity,
      state: plain.shippingState,
      postalCode: plain.shippingPostalCode,
      contactNumber: plain.shippingPhone,
    },
    items,
  };
};

const orderInclude = [
  { association: 'items' },
  { association: 'user', attributes: ['id', 'username', 'email', 'phone', 'role', 'isActive', 'createdAt'] },
];

const getDashboard = async (req, res) => {
  try {
    const [totalProducts, totalCategories, totalBrands, totalUsers, totalOrders, pendingOrders, completedOrders, revenue] = await Promise.all([
      Product.count(),
      Category.count(),
      Brand.count(),
      User.count(),
      Order.count(),
      Order.count({ where: { status: 'PENDING' } }),
      Order.count({ where: { status: 'DELIVERED' } }),
      Order.sum('totalAmount', { where: REVENUE_WHERE }),
    ]);

    return successResponse(res, {
      stats: {
        totalProducts,
        totalCategories,
        totalBrands,
        totalUsers,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: Number(revenue || 0),
        revenuePolicy: 'Persisted orders with COMPLETED payment status, excluding CANCELLED orders.',
      },
    }, 'Admin dashboard statistics retrieved successfully.');
  } catch (error) {
    return errorResponse(res, 'Unable to retrieve dashboard statistics.', 500);
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    return successResponse(res, { users: users.map(safeAdminUser) }, 'Admin users retrieved successfully.');
  } catch (error) {
    return errorResponse(res, 'Unable to retrieve users.', 500);
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({ include: orderInclude, order: [['createdAt', 'DESC']] });
    return successResponse(res, { orders: orders.map(serialiseAdminOrder) }, 'Admin orders retrieved successfully.');
  } catch (error) {
    return errorResponse(res, 'Unable to retrieve orders.', 500);
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: orderInclude });
    if (!order) return errorResponse(res, 'Order not found.', 404);
    return successResponse(res, { order: serialiseAdminOrder(order) }, 'Admin order retrieved successfully.');
  } catch (error) {
    return errorResponse(res, 'Unable to retrieve order.', 500);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const requestedStatus = typeof req.body?.status === 'string' ? req.body.status.trim().toUpperCase() : '';
    if (!ORDER_STATUSES.includes(requestedStatus)) {
      return errorResponse(res, 'Status must be Pending, Confirmed, Processing, Shipped, Delivered, or Cancelled.', 400);
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) return errorResponse(res, 'Order not found.', 404);
    await order.update({ status: requestedStatus });

    const updatedOrder = await Order.findByPk(order.id, { include: orderInclude });
    return successResponse(res, { order: serialiseAdminOrder(updatedOrder) }, 'Order status updated successfully.');
  } catch (error) {
    return errorResponse(res, 'Unable to update order status.', 500);
  }
};

const getPayments = async (req, res) => {
  try {
    const orders = await Order.findAll({
      attributes: ['id', 'invoiceNumber', 'shippingName', 'totalAmount', 'paymentMethod', 'paymentStatus', 'createdAt', 'status'],
      order: [['createdAt', 'DESC']],
    });
    const payments = orders.map((order) => ({
      invoiceNumber: order.invoiceNumber,
      customer: order.shippingName,
      amount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      date: order.createdAt,
      orderStatus: order.status,
    }));
    return successResponse(res, { payments }, 'Simulated payment records retrieved successfully.');
  } catch (error) {
    return errorResponse(res, 'Unable to retrieve payments.', 500);
  }
};

module.exports = { getDashboard, getUsers, getOrders, getOrder, updateOrderStatus, getPayments, ORDER_STATUSES };
