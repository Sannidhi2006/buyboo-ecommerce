const { Category, Product, sequelize } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { generateUniqueSlug } = require('../utils/slugify');
const storageService = require('../services/storageService');

/**
 * Public: Get all categories
 * GET /api/categories
 */
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM products AS p
              WHERE p.category_id = Category.id
            )`),
            'productCount',
          ],
        ],
      },
      order: [['name', 'ASC']],
    });

    return successResponse(res, { categories }, 'Categories retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Public: Get single category by ID or slug
 * GET /api/categories/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);

    const category = await Category.findOne({
      where: isNumeric ? { id } : { slug: id },
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM products AS p
              WHERE p.category_id = Category.id
            )`),
            'productCount',
          ],
        ],
      },
    });

    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    return successResponse(res, { category }, 'Category retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Create a new category
 * POST /api/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    let imageUrl = req.body.imageUrl || null;

    if (!name || !name.trim()) {
      return errorResponse(res, 'Category name is required', 422);
    }

    const trimmedName = name.trim();

    // Check if category name already exists
    const existing = await Category.findOne({ where: { name: trimmedName } });
    if (existing) {
      return errorResponse(res, 'A category with this name already exists', 409);
    }

    // Handle uploaded file if present
    if (req.file) {
      imageUrl = storageService.getFileUrl(req.file.filename);
    }

    const slug = await generateUniqueSlug(Category, trimmedName);

    const category = await Category.create({
      name: trimmedName,
      slug,
      description: description ? description.trim() : null,
      imageUrl,
    });

    return successResponse(res, { category }, 'Category created successfully', 201);
  } catch (err) {
    // If database insertion fails and a file was uploaded, clean it up
    if (req.file) {
      storageService.deleteFile(storageService.getFileUrl(req.file.filename));
    }
    next(err);
  }
};

/**
 * Admin: Update an existing category
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    let updatedSlug = category.slug;
    if (name && name.trim() && name.trim() !== category.name) {
      const trimmedName = name.trim();
      const duplicate = await Category.findOne({
        where: { name: trimmedName },
      });
      if (duplicate && duplicate.id !== category.id) {
        return errorResponse(res, 'Another category with this name already exists', 409);
      }
      category.name = trimmedName;
      updatedSlug = await generateUniqueSlug(Category, trimmedName, category.id);
      category.slug = updatedSlug;
    }

    if (description !== undefined) {
      category.description = description ? description.trim() : null;
    }

    // Handle file upload
    if (req.file) {
      const newImageUrl = storageService.getFileUrl(req.file.filename);
      // Clean up old local image
      if (category.imageUrl) {
        storageService.deleteFile(category.imageUrl);
      }
      category.imageUrl = newImageUrl;
    } else if (req.body.imageUrl !== undefined) {
      category.imageUrl = req.body.imageUrl;
    }

    await category.save();

    return successResponse(res, { category }, 'Category updated successfully');
  } catch (err) {
    if (req.file) {
      storageService.deleteFile(storageService.getFileUrl(req.file.filename));
    }
    next(err);
  }
};

/**
 * Admin: Delete a category safely
 * DELETE /api/categories/:id
 *
 * Safety Requirement:
 * Check if products reference this category.
 * If so, reject deletion with 409 Conflict rather than orphaning products.
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    // Safety check: Count referenced products
    const referencingProductsCount = await Product.count({ where: { categoryId: id } });
    if (referencingProductsCount > 0) {
      return errorResponse(
        res,
        `Cannot delete category: ${referencingProductsCount} product(s) are currently associated with it. Please reassign or delete these products first.`,
        409
      );
    }

    // Safe to delete
    const oldImageUrl = category.imageUrl;
    await category.destroy();

    // Clean up local image file if present
    if (oldImageUrl) {
      storageService.deleteFile(oldImageUrl);
    }

    return successResponse(res, { id: Number(id) }, 'Category deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
