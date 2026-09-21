'use strict';

const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('./app');
const { Op } = require('sequelize');
const { sequelize, User, Order, OrderItem } = require('./models');

const request = (server, { method, path, token, body }) => new Promise((resolve, reject) => {
  const payload = body === undefined ? null : JSON.stringify(body);
  const req = http.request({
    hostname: '127.0.0.1',
    port: server.address().port,
    path,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
    },
  }, (res) => {
    let text = '';
    res.on('data', (chunk) => { text += chunk; });
    res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(text) }));
  });
  req.on('error', reject);
  if (payload) req.write(payload);
  req.end();
});

const tokenFor = (user) => jwt.sign({ id: user.id, authVersion: user.authVersion }, process.env.JWT_SECRET);

(async () => {
  let server;
  let customer;
  let otherCustomer;
  let order;
  let passes = 0;
  const ok = (condition, message) => {
    if (!condition) throw new Error(`FAIL: ${message}`);
    passes += 1;
    console.log(`PASS: ${message}`);
  };

  try {
    await sequelize.authenticate();
    const admin = await User.findOne({ where: { role: 'ADMIN', isActive: true } });
    if (!admin) throw new Error('No active seeded admin found.');
    customer = await User.create({ username: `phase8a${Date.now()}`, email: `phase8a${Date.now()}@test.local`, password: 'Phase8@1', phone: '9000000001' });
    otherCustomer = await User.create({ username: `phase8b${Date.now()}`, email: `phase8b${Date.now()}@test.local`, password: 'Phase8@1', phone: '9000000002' });
    order = await Order.create({
      invoiceNumber: `P8-${Date.now()}`,
      userId: customer.id,
      shippingName: 'Phase Eight Customer',
      totalAmount: 1234.5,
      status: 'PENDING',
      paymentMethod: 'UPI',
      paymentStatus: 'COMPLETED',
      shippingAddress: 'Snapshot Street',
      shippingCity: 'Pune',
      shippingState: 'Maharashtra',
      shippingPostalCode: '411001',
      shippingPhone: '9000000001',
    });
    await OrderItem.create({ orderId: order.id, productId: null, productName: 'Historical Snapshot Product', price: 1234.5, quantity: 1, subtotal: 1234.5 });

    const adminToken = tokenFor(admin);
    const customerToken = tokenFor(customer);
    const otherToken = tokenFor(otherCustomer);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));

    const endpoints = [
      { method: 'GET', path: '/api/admin/dashboard' },
      { method: 'GET', path: '/api/admin/users' },
      { method: 'GET', path: '/api/admin/orders' },
      { method: 'GET', path: `/api/admin/orders/${order.id}` },
      { method: 'PUT', path: `/api/admin/orders/${order.id}/status`, body: { status: 'CONFIRMED' } },
      { method: 'GET', path: '/api/admin/payments' },
    ];
    for (const endpoint of endpoints) {
      const noToken = await request(server, endpoint);
      ok(noToken.status === 401, `${endpoint.method} ${endpoint.path} rejects missing token with 401`);
      const userToken = await request(server, { ...endpoint, token: customerToken });
      ok(userToken.status === 403, `${endpoint.method} ${endpoint.path} rejects USER with 403`);
    }

    const dashboard = await request(server, { method: 'GET', path: '/api/admin/dashboard', token: adminToken });
    ok(dashboard.status === 200, 'ADMIN can read dashboard statistics');
    const expectedRevenue = Number(await Order.sum('totalAmount', { where: { paymentStatus: 'COMPLETED', status: { [Op.ne]: 'CANCELLED' } } }) || 0);
    ok(dashboard.body.data.stats.totalProducts === await require('./models').Product.count(), 'dashboard total products matches database');
    ok(dashboard.body.data.stats.totalCategories === await require('./models').Category.count(), 'dashboard total categories matches database');
    ok(dashboard.body.data.stats.totalBrands === await require('./models').Brand.count(), 'dashboard total brands matches database');
    ok(dashboard.body.data.stats.totalUsers === await User.count(), 'dashboard total users matches database');
    ok(Number(dashboard.body.data.stats.totalRevenue) === expectedRevenue, 'dashboard revenue uses persisted completed non-cancelled order totals');

    const users = await request(server, { method: 'GET', path: '/api/admin/users', token: adminToken });
    ok(users.status === 200 && users.body.data.users.some((entry) => entry.id === customer.id), 'ADMIN can read users');
    ok(users.body.data.users.every((entry) => !('password' in entry) && !('passwordHash' in entry) && !('token' in entry) && !('jwt' in entry)), 'admin users response contains no secrets');

    const adminOrders = await request(server, { method: 'GET', path: '/api/admin/orders', token: adminToken });
    const adminOrder = adminOrders.body.data.orders.find((entry) => entry.id === order.id);
    ok(adminOrders.status === 200 && adminOrder, 'ADMIN can read all orders');
    ok(adminOrder.items[0].productName === 'Historical Snapshot Product' && adminOrder.items[0].price === 1234.5, 'admin order response uses historical item snapshots');
    const adminOrderDetail = await request(server, { method: 'GET', path: `/api/admin/orders/${order.id}`, token: adminToken });
    ok(adminOrderDetail.status === 200 && adminOrderDetail.body.data.order.items[0].productName === 'Historical Snapshot Product', 'ADMIN can read an order detail with snapshots');

    const invalidStatus = await request(server, { method: 'PUT', path: `/api/admin/orders/${order.id}/status`, token: adminToken, body: { status: 'REFUNDED' } });
    ok(invalidStatus.status === 400, 'invalid order status is rejected');
    const update = await request(server, { method: 'PUT', path: `/api/admin/orders/${order.id}/status`, token: adminToken, body: { status: 'SHIPPED' } });
    ok(update.status === 200 && update.body.data.order.status === 'SHIPPED', 'ADMIN can update order status');
    await order.reload();
    ok(order.status === 'SHIPPED', 'order status update persists in MySQL');

    const customerOrders = await request(server, { method: 'GET', path: '/api/orders', token: customerToken });
    ok(customerOrders.status === 200 && customerOrders.body.data.orders.find((entry) => entry.id === order.id)?.status === 'SHIPPED', 'order owner sees synchronized status in My Orders');
    const otherOrder = await request(server, { method: 'GET', path: `/api/orders/${order.id}`, token: otherToken });
    ok(otherOrder.status === 404, 'other customer cannot retrieve the order');
    const otherOrders = await request(server, { method: 'GET', path: '/api/orders', token: otherToken });
    ok(otherOrders.status === 200 && !otherOrders.body.data.orders.some((entry) => entry.id === order.id), 'other customer order list excludes the order');

    const payments = await request(server, { method: 'GET', path: '/api/admin/payments', token: adminToken });
    const payment = payments.body.data.payments.find((entry) => entry.invoiceNumber === order.invoiceNumber);
    ok(payments.status === 200 && payment.amount === 1234.5 && payment.paymentMethod === 'UPI', 'ADMIN can read simulated payment metadata');
    ok(payment && Object.keys(payment).sort().join(',') === 'amount,customer,date,invoiceNumber,orderStatus,paymentMethod,paymentStatus', 'payment response contains only approved metadata');

    console.log(`Phase 8 admin tests passed: ${passes}`);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (order) {
      await OrderItem.destroy({ where: { orderId: order.id } });
      await Order.destroy({ where: { id: order.id } });
    }
    if (customer || otherCustomer) await User.destroy({ where: { id: [customer, otherCustomer].filter(Boolean).map((user) => user.id) } });
    await sequelize.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
