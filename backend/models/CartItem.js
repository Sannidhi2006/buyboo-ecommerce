const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define(
  'CartItem',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cartId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'cart_id',
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isInt: true,
        min: { args: [1], msg: 'Quantity must be at least 1' },
      },
    },
  },
  {
    tableName: 'cart_items',
    indexes: [
      {
        unique: true,
        fields: ['cart_id', 'product_id'],
        name: 'unique_cart_product',
      },
    ],
  }
);

module.exports = CartItem;
