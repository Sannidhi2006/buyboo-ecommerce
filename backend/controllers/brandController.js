const { Brand, Product, sequelize } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { generateUniqueSlug } = require('../utils/slugify');
const storageService = require('../services/storageService');

/**
 * Public: Get all brands
 * GET /api/brands
 */
const getAllBrands = async (req, res, next) => {
  try {
    const brands = await Brand.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM products AS p
              WHERE p.brand_id = Brand.id
            )`),
            'productCount',
          ],
        ],
      },
      order: [['name', 'ASC']],
    });

    return successResponse(res, { brands }, 'Brands retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Public: Get single brand by ID or slug
 * GET /api/brands/:id
 */
const getBrandById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);

    const brand = await Brand.findOne({
      where: isNumeric ? { id } : { slug: id },
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM products AS p
              WHERE p.brand_id = Brand.id
            )`),
            'productCount',
          ],
        ],
      },
    });

    if (!brand) {
      return errorResponse(res, 'Brand not found', 404);
    }

    return successResponse(res, { brand }, 'Brand retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Create a new brand
 * POST /api/brands
 */
const createBrand = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    let logoUrl = req.body.logoUrl || null;

    if (typeof name !== 'string' || !name.trim()) {
      return errorResponse(res, 'Brand name is required', 422);
    }

    const trimmedName = name.trim();

    // Check if brand name already exists
    const existing = await Brand.findOne({ where: { name: trimmedName } });
    if (existing) {
      return errorResponse(res, 'A brand with this name already exists', 409);
    }

    // Handle logo file upload if present
    if (req.file) {
      logoUrl = storageService.getFileUrl(req.file.filename);
    }

    const slug = await generateUniqueSlug(Brand, trimmedName);

    const brand = await Brand.create({
      name: trimmedName,
      slug,
      description: description === undefined || description === null ? null : typeof description === 'string' ? description.trim() : null,
      logoUrl,
    });

    return successResponse(res, { brand }, 'Brand created successfully', 201);
  } catch (err) {
    if (req.file) {
      storageService.deleteFile(storageService.getFileUrl(req.file.filename));
    }
    next(err);
  }
};

/**
 * Admin: Update an existing brand
 * PUT /api/brands/:id
 */
const updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const brand = await Brand.findByPk(id);
    if (!brand) {
      return errorResponse(res, 'Brand not found', 404);
    }

    if (name !== undefined && typeof name !== 'string') {
      return errorResponse(res, 'Brand name must be text.', 422);
    }
    if (name && name.trim() && name.trim() !== brand.name) {
      const trimmedName = name.trim();
      const duplicate = await Brand.findOne({
        where: { name: trimmedName },
      });
      if (duplicate && duplicate.id !== brand.id) {
        return errorResponse(res, 'Another brand with this name already exists', 409);
      }
      brand.name = trimmedName;
      brand.slug = await generateUniqueSlug(Brand, trimmedName, brand.id);
    }

    if (description !== undefined) {
      if (typeof description !== 'string' && description !== null) {
        return errorResponse(res, 'Brand description must be text.', 422);
      }
      brand.description = description ? description.trim() : null;
    }

    if (req.file) {
      const newLogoUrl = storageService.getFileUrl(req.file.filename);
      if (brand.logoUrl) {
        storageService.deleteFile(brand.logoUrl);
      }
      brand.logoUrl = newLogoUrl;
    } else if (req.body.logoUrl !== undefined) {
      brand.logoUrl = req.body.logoUrl;
    }

    await brand.save();

    return successResponse(res, { brand }, 'Brand updated successfully');
  } catch (err) {
    if (req.file) {
      storageService.deleteFile(storageService.getFileUrl(req.file.filename));
    }
    next(err);
  }
};

/**
 * Admin: Delete a brand safely
 * DELETE /api/brands/:id
 *
 * Safety Requirement:
 * Check if products reference this brand.
 * If so, reject deletion with 409 Conflict.
 */
const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByPk(id);
    if (!brand) {
      return errorResponse(res, 'Brand not found', 404);
    }

    // Safety check: Count referenced products
    const referencingProductsCount = await Product.count({ where: { brandId: id } });
    if (referencingProductsCount > 0) {
      return errorResponse(
        res,
        `Cannot delete brand: ${referencingProductsCount} product(s) are currently associated with it. Please reassign or delete these products first.`,
        409
      );
    }

    const oldLogoUrl = brand.logoUrl;
    await brand.destroy();

    if (oldLogoUrl) {
      storageService.deleteFile(oldLogoUrl);
    }

    return successResponse(res, { id: Number(id) }, 'Brand deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};
