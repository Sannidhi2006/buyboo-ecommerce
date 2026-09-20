const { Op } = require('sequelize');

/**
 * Converts any string to a clean, URL-safe slug.
 * @param {string} text
 * @returns {string} Clean slug
 */
const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/[^\w-]+/g, '') // Remove all non-word chars (except hyphens)
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Trim hyphen from start
    .replace(/-+$/, ''); // Trim hyphen from end
};

/**
 * Generates a unique slug for a given Sequelize model.
 * If the slug already exists in the database, it appends -1, -2, etc.
 *
 * @param {import('sequelize').Model} Model - Sequelize model (e.g. Category, Brand, Product)
 * @param {string} text - Source text (e.g. name)
 * @param {number|null} excludeId - ID to exclude when updating an existing record
 * @returns {Promise<string>} Unique slug
 */
const generateUniqueSlug = async (Model, text, excludeId = null) => {
  let baseSlug = slugify(text);
  if (!baseSlug) {
    baseSlug = `item-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const whereClause = { slug };
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const existing = await Model.findOne({ where: whereClause, attributes: ['id'] });
    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

module.exports = {
  slugify,
  generateUniqueSlug,
};
