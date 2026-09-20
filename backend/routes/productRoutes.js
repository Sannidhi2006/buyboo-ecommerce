const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { authMiddleware, optionalAuth, isAdmin } = require('../middleware/authMiddleware');
const { handleImageUpload } = require('../middleware/upload');

// Public routes
router.get('/', optionalAuth, getAllProducts);
router.get('/:id', getProductById);

// Admin-only routes (strictly protected by authMiddleware + isAdmin)
router.post('/', authMiddleware, isAdmin, handleImageUpload('image'), createProduct);
router.put('/:id', authMiddleware, isAdmin, handleImageUpload('image'), updateProduct);
router.delete('/:id', authMiddleware, isAdmin, deleteProduct);

module.exports = router;
