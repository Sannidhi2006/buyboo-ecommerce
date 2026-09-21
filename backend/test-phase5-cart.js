'use strict';

// Integration test for Phase 5. It uses a temporary HTTP server and temporary
// DB rows, then removes only the rows it created.
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('./app');
const { sequelize, User, Category, Brand, Product, Cart, CartItem } = require('./models');

const request = (server, { method, path, token, body }) => new Promise((resolve, reject) => {
  const address = server.address();
  const payload = body === undefined ? null : JSON.stringify(body);
  const req = http.request({
    hostname: '127.0.0.1', port: address.port, path, method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
    },
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
  });
  req.on('error', reject);
  if (payload) req.write(payload);
  req.end();
});

const run = async () => {
  const suffix = `ph5_${Date.now()}`;
  let userA; let userB; let category; let brand; let productA; let productB; let server;
  let passed = 0;
  const assert = (condition, message) => {
    if (!condition) throw new Error(`FAIL: ${message}`);
    passed += 1;
    console.log(`PASS: ${message}`);
  };

  try {
    await sequelize.authenticate();
    [category, brand] = await Promise.all([
      Category.create({ name: `Cart category ${suffix}`, slug: `cart-category-${suffix}` }),
      Brand.create({ name: `Cart brand ${suffix}`, slug: `cart-brand-${suffix}` }),
    ]);
    productA = await Product.create({ name: `Cart product A ${suffix}`, slug: `cart-product-a-${suffix}`, description: 'Cart test product', price: 100, stock: 3, categoryId: category.id, brandId: brand.id, imageUrl: '/uploads/test.png', isActive: true });
    productB = await Product.create({ name: `Cart product B ${suffix}`, slug: `cart-product-b-${suffix}`, description: 'Cart test product', price: 250, stock: 5, categoryId: category.id, brandId: brand.id, imageUrl: '/uploads/test.png', isActive: true });
    userA = await User.create({ username: `cart_a_${suffix}`, email: `cart_a_${suffix}@test.local`, password: 'hash-not-used', phone: '9000000001', role: 'USER' });
    userB = await User.create({ username: `cart_b_${suffix}`, email: `cart_b_${suffix}@test.local`, password: 'hash-not-used', phone: '9000000002', role: 'USER' });
    const tokenA = jwt.sign({ id: userA.id, authVersion: userA.authVersion }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ id: userB.id, authVersion: userB.authVersion }, process.env.JWT_SECRET, { expiresIn: '1h' });
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));

    let res = await request(server, { method: 'GET', path: '/api/cart' });
    assert(res.status === 401, 'cart APIs reject unauthenticated requests');
    res = await request(server, { method: 'GET', path: '/api/cart', token: tokenA });
    assert(res.status === 200 && res.body.data.totalQuantity === 0, 'empty cart is returned for a new user');
    res = await request(server, { method: 'POST', path: '/api/cart/items', token: tokenA, body: { productId: productA.id, quantity: 1 } });
    assert(res.status === 201 && res.body.data.totalAmount === 100, 'add item persists server-calculated amount');
    res = await request(server, { method: 'GET', path: '/api/cart', token: tokenB });
    assert(res.status === 200 && res.body.data.totalProducts === 0, 'a second user cannot read the first user cart');
    res = await request(server, { method: 'POST', path: '/api/cart/items', token: tokenA, body: { productId: productA.id, quantity: 1 } });
    assert(res.status === 201 && res.body.data.totalProducts === 1 && res.body.data.totalQuantity === 2, 'same product merges into one cart row');
    res = await request(server, { method: 'POST', path: '/api/cart/items', token: tokenA, body: { productId: productB.id, quantity: 2 } });
    assert(res.status === 201 && res.body.data.totalProducts === 2 && res.body.data.totalAmount === 700, 'multiple products and totals are correct');
    res = await request(server, { method: 'POST', path: '/api/cart/items', token: tokenA, body: { productId: productA.id, quantity: '1.5' } });
    assert(res.status === 400, 'fractional quantity is rejected');
    res = await request(server, { method: 'POST', path: '/api/cart/items', token: tokenA, body: { productId: productA.id, quantity: -1 } });
    assert(res.status === 400, 'negative quantity is rejected');
    res = await request(server, { method: 'POST', path: '/api/cart/items', token: tokenA, body: { productId: 999999999, quantity: 1 } });
    assert(res.status === 404, 'unknown product is rejected');
    res = await request(server, { method: 'POST', path: '/api/cart/items', token: tokenA, body: { productId: productA.id, quantity: 2 } });
    assert(res.status === 400, 'merged quantity above stock is rejected');
    const cartItemA = (await request(server, { method: 'GET', path: '/api/cart', token: tokenA })).body.data.items.find((item) => item.productId === productA.id);
    res = await request(server, { method: 'PUT', path: `/api/cart/items/${cartItemA.cartItemId}`, token: tokenB, body: { quantity: 1 } });
    assert(res.status === 403, 'a second user cannot update another user cart item');
    res = await request(server, { method: 'DELETE', path: `/api/cart/items/${cartItemA.cartItemId}`, token: tokenB });
    assert(res.status === 403, 'a second user cannot remove another user cart item');
    res = await request(server, { method: 'PUT', path: `/api/cart/items/${cartItemA.cartItemId}`, token: tokenA, body: { quantity: 0 } });
    assert(res.status === 400, 'zero quantity is rejected');
    res = await request(server, { method: 'PUT', path: `/api/cart/items/${cartItemA.cartItemId}`, token: tokenA, body: { quantity: 3 } });
    assert(res.status === 200 && res.body.data.items.find((item) => item.productId === productA.id).quantity === 3, 'quantity update is persisted');
    await productA.update({ isActive: false });
    res = await request(server, { method: 'POST', path: '/api/cart/items', token: tokenA, body: { productId: productA.id, quantity: 1 } });
    assert(res.status === 400, 'inactive products cannot be added');
    res = await request(server, { method: 'PUT', path: `/api/cart/items/${cartItemA.cartItemId}`, token: tokenA, body: { quantity: 2 } });
    assert(res.status === 400, 'inactive products cannot be updated');
    res = await request(server, { method: 'DELETE', path: '/api/cart', token: tokenA });
    assert(res.status === 200 && res.body.data.totalProducts === 0, 'clear cart removes only authenticated user items');
    console.log(`\nPhase 5 cart tests passed: ${passed}`);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (userA || userB) {
      const users = [userA, userB].filter(Boolean);
      const carts = await Cart.findAll({ where: { userId: users.map((user) => user.id) } });
      await CartItem.destroy({ where: { cartId: carts.map((cart) => cart.id) } });
      await Cart.destroy({ where: { id: carts.map((cart) => cart.id) } });
      await User.destroy({ where: { id: users.map((user) => user.id) } });
    }
    if (productA || productB) await Product.destroy({ where: { id: [productA, productB].filter(Boolean).map((product) => product.id) } });
    if (category) await Category.destroy({ where: { id: category.id } });
    if (brand) await Brand.destroy({ where: { id: brand.id } });
    await sequelize.close();
  }
};

run().catch((error) => { console.error(error); process.exitCode = 1; });
