'use strict';

const router = require('express').Router();
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const {
  getDashboard,
  getUsers,
  getOrders,
  getOrder,
  updateOrderStatus,
  getPayments,
} = require('../controllers/adminController');

router.use(authMiddleware, isAdmin);
router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/orders', getOrders);
router.get('/orders/:id', getOrder);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/payments', getPayments);

module.exports = router;
