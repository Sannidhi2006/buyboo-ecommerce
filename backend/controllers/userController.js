'use strict';
const { User, Cart, CartItem } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const safeUser = (user) => ({ id: user.id, username: user.username, email: user.email, phone: user.phone, role: user.role });
const validPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

const getMe = async (req, res) => successResponse(res, { user: safeUser(req.user) }, 'Profile retrieved successfully.');
const updateMe = async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) return errorResponse(res, 'Username must be 3–50 letters, numbers, or underscores.', 400);
    if (!/^\S+@\S+\.\S+$/.test(email)) return errorResponse(res, 'Enter a valid email address.', 400);
    if (!validPhone(phone)) return errorResponse(res, 'Enter a valid 10-digit Indian contact number.', 400);
    const duplicate = await User.findOne({ where: { username } });
    if (duplicate && duplicate.id !== req.user.id) return errorResponse(res, 'This username is already taken.', 409);
    const emailDuplicate = await User.findOne({ where: { email } });
    if (emailDuplicate && emailDuplicate.id !== req.user.id) return errorResponse(res, 'An account with this email address already exists.', 409);
    const user = await User.findByPk(req.user.id); await user.update({ username, email, phone });
    return successResponse(res, { user: safeUser(user) }, 'Profile updated successfully.');
  } catch (error) { return errorResponse(res, 'Unable to update profile.', 500); }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body || {};
    if (!currentPassword || !newPassword || !confirmNewPassword) return errorResponse(res, 'Current password, new password, and confirmation are required.', 400);
    if (newPassword !== confirmNewPassword) return errorResponse(res, 'New password and confirmation do not match.', 400);
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) return errorResponse(res, 'New password must meet the existing password requirements.', 400);
    const user = await User.findByPk(req.user.id);
    if (!(await user.comparePassword(currentPassword))) return errorResponse(res, 'Current password is incorrect.', 400);
    if (await user.comparePassword(newPassword)) return errorResponse(res, 'New password must differ from your current password.', 400);
    await user.update({ password: newPassword, authVersion: user.authVersion + 1 });
    return successResponse(res, {}, 'Password changed. Please log in again.');
  } catch (error) { return errorResponse(res, 'Unable to change password.', 500); }
};
const deleteMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const cart = await Cart.findOne({ where: { userId: user.id } });
    if (cart) await CartItem.destroy({ where: { cartId: cart.id } });
    await user.update({ isActive: false, authVersion: user.authVersion + 1 });
    return successResponse(res, {}, 'Account deactivated successfully.');
  } catch (error) { return errorResponse(res, 'Unable to deactivate account.', 500); }
};
module.exports = { getMe, updateMe, changePassword, deleteMe };
