const express = require('express');
const router = express.Router();
const {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('../controllers/brandController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const { handleImageUpload } = require('../middleware/upload');

// Public routes
router.get('/', getAllBrands);
router.get('/:id', getBrandById);

// Admin-only routes (strictly protected by authMiddleware + isAdmin)
router.post('/', authMiddleware, isAdmin, handleImageUpload('logo'), createBrand);
router.put('/:id', authMiddleware, isAdmin, handleImageUpload('logo'), updateBrand);
router.delete('/:id', authMiddleware, isAdmin, deleteBrand);

module.exports = router;
