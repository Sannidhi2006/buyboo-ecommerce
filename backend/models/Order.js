const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'invoice_number',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    shippingName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'shipping_name',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    paymentMethod: {
      type: DataTypes.ENUM('CARD', 'UPI', 'COD', 'NETBANKING'),
      allowNull: false,
      field: 'payment_method',
    },
    paymentStatus: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
      allowNull: false,
      defaultValue: 'COMPLETED',
      field: 'payment_status',
    },
    shippingAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'shipping_address',
    },
    shippingCity: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'shipping_city',
    },
    shippingState: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'shipping_state',
    },
    shippingPostalCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'shipping_postal_code',
    },
    shippingPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'shipping_phone',
    },
  },
  {
    tableName: 'orders',
  }
);

module.exports = Order;
