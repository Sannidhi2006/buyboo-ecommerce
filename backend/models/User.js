const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: 'Username already taken',
      },
      validate: {
        notEmpty: { msg: 'Username cannot be empty' },
        len: { args: [3, 50], msg: 'Username must be between 3 and 50 characters' },
        is: {
          args: /^[a-zA-Z0-9_]+$/,
          msg: 'Username can only contain letters, numbers, and underscores',
        },
      },
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: {
        msg: 'Email address already in use',
      },
      validate: {
        isEmail: { msg: 'Must be a valid email address' },
        notEmpty: { msg: 'Email cannot be empty' },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('USER', 'ADMIN'),
      allowNull: false,
      defaultValue: 'USER',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Phone number cannot be empty' },
        is: {
          args: /^[6-9]\d{9}$/,
          msg: 'Please enter a valid 10-digit Indian mobile number',
        },
      },
    },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
    authVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'auth_version' },
  },
  {
    tableName: 'users',
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Instance method: Compare plaintext password vs stored hash
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ensure password hash is NEVER serialized to JSON responses
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
