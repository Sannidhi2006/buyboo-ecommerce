'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { createOrder, getOrders, getOrder } = require('../controllers/orderController');
router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrder);
module.exports = router;
