const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Brand = sequelize.define(
  'Brand',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Brand name is required' },
      },
    },
    slug: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    logoUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'logo_url',
    },
  },
  {
    tableName: 'brands',
  }
);

module.exports = Brand;
