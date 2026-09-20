const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Brand = require('./Brand');
const Product = require('./Product');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// User <-> Cart (1:1)
User.hasOne(Cart, { foreignKey: 'userId', as: 'cart', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Cart <-> CartItem (1:N)
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' });

// Product <-> CartItem (1:N)
Product.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems', onDelete: 'CASCADE' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Category <-> Product (1:N)
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products', onDelete: 'RESTRICT' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Brand <-> Product (1:N)
Brand.hasMany(Product, { foreignKey: 'brandId', as: 'products', onDelete: 'RESTRICT' });
Product.belongsTo(Brand, { foreignKey: 'brandId', as: 'brand' });

// User <-> Order (1:N)
User.hasMany(Order, { foreignKey: 'userId', as: 'orders', onDelete: 'RESTRICT' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Order <-> OrderItem (1:N)
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Product <-> OrderItem (1:N)
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems', onDelete: 'SET NULL' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = {
  sequelize,
  User,
  Category,
  Brand,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem,
};
