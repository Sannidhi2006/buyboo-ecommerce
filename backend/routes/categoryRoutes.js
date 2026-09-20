const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const { handleImageUpload } = require('../middleware/upload');

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin-only routes (strictly protected by authMiddleware + isAdmin)
router.post('/', authMiddleware, isAdmin, handleImageUpload('image'), createCategory);
router.put('/:id', authMiddleware, isAdmin, handleImageUpload('image'), updateCategory);
router.delete('/:id', authMiddleware, isAdmin, deleteCategory);

module.exports = router;
