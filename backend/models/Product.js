const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name is required' },
      },
    },
    slug: {
      type: DataTypes.STRING(220),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product description is required' },
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: { args: [0], msg: 'Price must be positive' },
      },
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: { args: [0], msg: 'Stock cannot be negative' },
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id',
    },
    brandId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'brand_id',
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'image_url',
      validate: {
        notEmpty: { msg: 'Product image is required' },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    tableName: 'products',
  }
);

module.exports = Product;
