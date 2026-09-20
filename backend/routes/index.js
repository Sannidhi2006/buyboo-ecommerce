const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const brandRoutes = require('./brandRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');

// Health check — Phase 1 (must never be removed)
router.use('/health', healthRoutes);

// Authentication — Phase 2
router.use('/auth', authRoutes);

// Catalog & Admin CRUD — Phase 3
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/products', productRoutes);

// Cart — Phase 5
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);

module.exports = router;
