const { Op } = require('sequelize');
const { Product, Category, Brand } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { generateUniqueSlug } = require('../utils/slugify');
const storageService = require('../services/storageService');
const parseNonNegativeDecimal = (value) => {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const text = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
const parseNonNegativeInteger = (value) => {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
};

/**
 * Decorates product object with inStock, isOutOfStock, and numeric stock
 */
const formatProduct = (product) => {
  const json = product.toJSON ? product.toJSON() : { ...product };
  const stockNum = Number(json.stock) || 0;
  const isActive = Boolean(json.isActive);

  return {
    ...json,
    stock: stockNum,
    inStock: isActive && stockNum > 0,
    isOutOfStock: isActive && stockNum === 0,
  };
};

/**
 * Public: Get all products
 * GET /api/products
 *
 * Query params supported:
 *   ?category=slug_or_id
 *   ?brand=slug_or_id
 *   ?search=keyword
 *   ?include_inactive=true (only permitted if ADMIN)
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { category, brand, search, include_inactive } = req.query;

    const whereClause = {};

    // Only include inactive products if explicitly requested AND user is ADMIN
    const isAdminUser = req.user && req.user.role === 'ADMIN';
    if (include_inactive === 'true' && isAdminUser) {
      // Return both active and inactive
    } else {
      whereClause.isActive = true;
    }

    // Filter by search query across name, description, category name, and brand name
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { description: { [Op.like]: searchTerm } },
        { '$category.name$': { [Op.like]: searchTerm } },
        { '$brand.name$': { [Op.like]: searchTerm } },
      ];
    }

    // Category filter condition
    const categoryInclude = {
      model: Category,
      as: 'category',
      attributes: ['id', 'name', 'slug'],
    };

    if (category) {
      if (/^\d+$/.test(category)) {
        whereClause.categoryId = Number(category);
      } else {
        categoryInclude.where = { slug: category };
      }
    }

    // Brand filter condition
    const brandInclude = {
      model: Brand,
      as: 'brand',
      attributes: ['id', 'name', 'slug'],
    };

    if (brand) {
      if (/^\d+$/.test(brand)) {
        whereClause.brandId = Number(brand);
      } else {
        brandInclude.where = { slug: brand };
      }
    }

    const products = await Product.findAll({
      where: whereClause,
      include: [categoryInclude, brandInclude],
      order: [['createdAt', 'DESC']],
    });

    return successResponse(
      res,
      {
        products: products.map(formatProduct),
        count: products.length,
      },
      'Products retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Public: Get single product by ID or slug
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);

    const product = await Product.findOne({
      where: isNumeric ? { id } : { slug: id },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'description'],
        },
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'name', 'slug', 'description'],
        },
      ],
    });

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    // Fetch related products (same category or brand, excluding current product)
    const related = await Product.findAll({
      where: {
        id: { [Op.ne]: product.id },
        isActive: true,
        [Op.or]: [
          { categoryId: product.categoryId },
          { brandId: product.brandId },
        ],
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Brand, as: 'brand', attributes: ['id', 'name', 'slug'] },
      ],
      limit: 4,
      order: [['createdAt', 'DESC']],
    });

    return successResponse(
      res,
      {
        product: formatProduct(product),
        relatedProducts: related.map(formatProduct),
      },
      'Product retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Public: Get related products for a product
 * GET /api/products/:id/related
 */
const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);

    const product = await Product.findOne({
      where: isNumeric ? { id } : { slug: id },
      attributes: ['id', 'categoryId', 'brandId'],
    });

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    const related = await Product.findAll({
      where: {
        id: { [Op.ne]: product.id },
        isActive: true,
        [Op.or]: [
          { categoryId: product.categoryId },
          { brandId: product.brandId },
        ],
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Brand, as: 'brand', attributes: ['id', 'name', 'slug'] },
      ],
      limit: 6,
      order: [['createdAt', 'DESC']],
    });

    return successResponse(
      res,
      { relatedProducts: related.map(formatProduct) },
      'Related products retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Create a new product
 * POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, categoryId, brandId, isActive } = req.body;
    let imageUrl = req.body.imageUrl || null;

    // 1. Validate name
    if (!name || !name.trim()) {
      return errorResponse(res, 'Product name is required', 422);
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 200) {
      return errorResponse(res, 'Product name must be between 2 and 200 characters', 422);
    }

    // 2. Validate price
    if (price === undefined || price === null || price === '') {
      return errorResponse(res, 'Product price is required', 422);
    }
    const parsedPrice = parseNonNegativeDecimal(price);
    if (parsedPrice === null) {
      return errorResponse(res, 'Price must be a valid non-negative number', 422);
    }

    // 3. Validate stock
    if (stock === undefined || stock === null || stock === '') {
      return errorResponse(res, 'Stock quantity is required', 422);
    }
    const parsedStock = parseNonNegativeInteger(stock);
    if (parsedStock === null) {
      return errorResponse(res, 'Stock must be a valid non-negative integer', 422);
    }

    // 4. Validate category existence
    if (!categoryId) {
      return errorResponse(res, 'Category is required', 422);
    }
    const categoryExists = await Category.findByPk(categoryId);
    if (!categoryExists) {
      return errorResponse(res, 'Referenced category does not exist', 422);
    }

    // 5. Validate brand existence
    if (!brandId) {
      return errorResponse(res, 'Brand is required', 422);
    }
    const brandExists = await Brand.findByPk(brandId);
    if (!brandExists) {
      return errorResponse(res, 'Referenced brand does not exist', 422);
    }

    // 6. Validate description
    if (!description || !description.trim()) {
      return errorResponse(res, 'Product description is required', 422);
    }

    // 7. Handle image
    if (req.file) {
      imageUrl = storageService.getFileUrl(req.file.filename);
    } else if (!imageUrl || !imageUrl.trim()) {
      return errorResponse(res, 'Product image is required (upload file or provide imageUrl)', 422);
    }

    // 8. Generate unique slug
    const slug = await generateUniqueSlug(Product, trimmedName);

    // 9. Create product
    const product = await Product.create({
      name: trimmedName,
      slug,
      description: description.trim(),
      price: parsedPrice.toFixed(2),
      stock: parsedStock,
      categoryId: Number(categoryId),
      brandId: Number(brandId),
      imageUrl: imageUrl.trim(),
      isActive: isActive !== undefined ? isActive === true || isActive === 'true' : true,
    });

    // Re-fetch with associations for clean response
    const completeProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Brand, as: 'brand', attributes: ['id', 'name', 'slug'] },
      ],
    });

    return successResponse(
      res,
      { product: formatProduct(completeProduct) },
      'Product created successfully',
      201
    );
  } catch (err) {
    if (req.file) {
      storageService.deleteFile(storageService.getFileUrl(req.file.filename));
    }
    next(err);
  }
};

/**
 * Admin: Update an existing product
 * PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, categoryId, brandId, isActive } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    // Update name and slug
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 200) {
        return errorResponse(res, 'Product name must be between 2 and 200 characters', 422);
      }
      if (trimmedName !== product.name) {
        product.name = trimmedName;
        product.slug = await generateUniqueSlug(Product, trimmedName, product.id);
      }
    }

    // Update price
    if (price !== undefined) {
      const parsedPrice = parseNonNegativeDecimal(price);
      if (parsedPrice === null) {
        return errorResponse(res, 'Price must be a valid non-negative number', 422);
      }
      product.price = parsedPrice.toFixed(2);
    }

    // Update stock
    if (stock !== undefined) {
      const parsedStock = parseNonNegativeInteger(stock);
      if (parsedStock === null) {
        return errorResponse(res, 'Stock must be a valid non-negative integer', 422);
      }
      product.stock = parsedStock;
    }

    // Update category
    if (categoryId !== undefined) {
      const categoryExists = await Category.findByPk(categoryId);
      if (!categoryExists) {
        return errorResponse(res, 'Referenced category does not exist', 422);
      }
      product.categoryId = Number(categoryId);
    }

    // Update brand
    if (brandId !== undefined) {
      const brandExists = await Brand.findByPk(brandId);
      if (!brandExists) {
        return errorResponse(res, 'Referenced brand does not exist', 422);
      }
      product.brandId = Number(brandId);
    }

    // Update description
    if (description !== undefined) {
      if (!description.trim()) {
        return errorResponse(res, 'Product description cannot be empty', 422);
      }
      product.description = description.trim();
    }

    // Update active status
    if (isActive !== undefined) {
      product.isActive = isActive === true || isActive === 'true';
    }

    // Handle image update
    if (req.file) {
      const newImageUrl = storageService.getFileUrl(req.file.filename);
      // Clean up previous image if it was a local file
      if (product.imageUrl) {
        storageService.deleteFile(product.imageUrl);
      }
      product.imageUrl = newImageUrl;
    } else if (req.body.imageUrl !== undefined && req.body.imageUrl.trim()) {
      product.imageUrl = req.body.imageUrl.trim();
    }

    await product.save();

    // Re-fetch with associations
    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Brand, as: 'brand', attributes: ['id', 'name', 'slug'] },
      ],
    });

    return successResponse(
      res,
      { product: formatProduct(updatedProduct) },
      'Product updated successfully'
    );
  } catch (err) {
    if (req.file) {
      storageService.deleteFile(storageService.getFileUrl(req.file.filename));
    }
    next(err);
  }
};

/**
 * Admin: Delete a product
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    const oldImageUrl = product.imageUrl;
    await product.destroy();

    // Delete local image if exists
    if (oldImageUrl) {
      storageService.deleteFile(oldImageUrl);
    }

    return successResponse(res, { id: Number(id) }, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
