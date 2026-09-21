'use strict';

const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('./app');
const { sequelize, User, Cart, Category, Brand, Product, Order, OrderItem } = require('./models');

const request = (server, { method, path, token, body, origin }) => new Promise((resolve, reject) => {
  const payload = body === undefined ? null : JSON.stringify(body);
  const req = http.request({
    hostname: '127.0.0.1', port: server.address().port, path, method,
    headers: {
      'Content-Type': 'application/json',
      ...(origin ? { Origin: origin } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
    },
  }, (res) => {
    let text = '';
    res.on('data', (chunk) => { text += chunk; });
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(text) }));
  });
  req.on('error', reject);
  if (payload) req.write(payload);
  req.end();
});

const tokenFor = (user) => jwt.sign({ id: user.id, authVersion: user.authVersion }, process.env.JWT_SECRET);

(async () => {
  let server; let user; let category; let brand; let product; let order;
  let passed = 0;
  const ok = (condition, message) => { if (!condition) throw new Error(`FAIL: ${message}`); passed += 1; console.log(`PASS: ${message}`); };
  try {
    await sequelize.authenticate();
    const admin = await User.findOne({ where: { role: 'ADMIN', isActive: true } });
    if (!admin) throw new Error('No active admin available.');
    user = await User.create({ username: `phase9${Date.now()}`, email: `phase9${Date.now()}@test.local`, password: 'Phase9@1', phone: '9000000003' });
    await Cart.create({ userId: user.id });
    category = await Category.findOne();
    brand = await Brand.findOne();
    product = await Product.create({ name: `Phase 9 Product ${Date.now()}`, slug: `phase-9-product-${Date.now()}`, description: 'Security test product', price: 999, stock: 5, categoryId: category.id, brandId: brand.id, imageUrl: '/test.png', isActive: true });
    server = http.createServer(app); await new Promise((resolve) => server.listen(0, resolve));
    const userToken = tokenFor(user); const adminToken = tokenFor(admin);

    const evilCors = await request(server, { method: 'GET', path: '/api/health', origin: 'https://evil.example' });
    ok(evilCors.status >= 400 && !evilCors.headers['access-control-allow-origin'], 'unauthorized CORS origin is rejected');
    const allowedCors = await request(server, { method: 'GET', path: '/api/health', origin: process.env.CLIENT_URL || 'http://localhost:5173' });
    ok(allowedCors.status === 200 && allowedCors.headers['access-control-allow-origin'], 'configured CORS origin is allowed');

    const me = await request(server, { method: 'GET', path: '/api/auth/me', token: userToken });
    ok(me.status === 200 && !JSON.stringify(me.body).match(/password|password_hash|passwordHash/i), 'auth profile contains no password fields');
    const adminUsers = await request(server, { method: 'GET', path: '/api/admin/users', token: adminToken });
    ok(adminUsers.status === 200 && !JSON.stringify(adminUsers.body).match(/password|password_hash|passwordHash|token/i), 'admin users response contains no credentials');

    const injectionSearch = await request(server, { method: 'GET', path: "/api/products?search=%27%20OR%201%3D1%20--" });
    ok(injectionSearch.status === 200 && injectionSearch.body.success === true, 'SQL injection-style search input is treated as data');

    const malformedPrice = await request(server, { method: 'POST', path: '/api/products', token: adminToken, body: { name: 'Bad Price', price: '12abc', stock: 1, categoryId: category.id, brandId: brand.id, description: 'bad', imageUrl: '/test.png' } });
    ok(malformedPrice.status === 422, 'malformed product price is rejected');

    const maliciousOrder = await request(server, { method: 'POST', path: '/api/orders', token: userToken, body: { source: 'buy_now', items: [{ productId: product.id, quantity: 2, price: 1, subtotal: 1 }], totalAmount: 1, shipping: { name: 'Test', address: 'Address', city: 'Pune', state: 'Maharashtra', postalCode: '411001', contactNumber: '9000000003' }, paymentMethod: 'UPI' } });
    order = maliciousOrder.body.data.order;
    ok(maliciousOrder.status === 201 && order.totalAmount === 1998 && order.items[0].price === 999 && order.items[0].subtotal === 1998, 'order price, subtotal, and total ignore malicious client values');

    const malformedRoute = await request(server, { method: 'GET', path: '/api/admin/orders/not-a-number', token: adminToken });
    ok(malformedRoute.status === 404 && !JSON.stringify(malformedRoute.body).match(/Sequelize|stack|at\s+\w+\s+\(/i), 'controlled errors expose only clean messages');
    console.log(`Phase 9 security tests passed: ${passed}`);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (order) { await OrderItem.destroy({ where: { orderId: order.id } }); await Order.destroy({ where: { id: order.id } }); }
    if (product) await Product.destroy({ where: { id: product.id } });
    if (user) { await Cart.destroy({ where: { userId: user.id } }); await User.destroy({ where: { id: user.id } }); }
    await sequelize.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
