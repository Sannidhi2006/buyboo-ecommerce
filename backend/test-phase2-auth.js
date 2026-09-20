const http = require('http');
const app = require('./app');
const { sequelize, User, Cart } = require('./models');

// Helper to make HTTP requests to the test server
function request(server, { method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: address.port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING PHASE 2 AUTOMATED AUTH VERIFICATION ---');

  // Verify DB connection
  await sequelize.authenticate();
  console.log('✔ Phase 1 DB connection verified.');

  // Clean up any previous test user
  await User.destroy({ where: { username: 'testuser_ph2' } });

  // Start test server on random port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`✔ Express server listening on temporary test port ${port}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  PASS: ${message}`);
      passed++;
    } else {
      console.error(`  FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Phase 1 Health check
    console.log('\n[1] Testing Phase 1 Health Check...');
    const healthRes = await request(server, { method: 'GET', path: '/api/health' });
    assert(healthRes.status === 200, 'GET /api/health returns 200');
    assert(healthRes.body.success === true, 'Health check reports success: true');
    assert(healthRes.body.data?.status === 'UP', 'Health check status is UP');
    assert(healthRes.body.data?.database.includes('Connected'), 'Database reported as Connected');

    // 2. Register new user
    console.log('\n[2] Testing Registration...');
    const regPayload = {
      username: 'testuser_ph2',
      email: 'testuser_ph2@example.com',
      phone: '9876543210',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'ADMIN', // Attacker attempt to escalate privilege!
    };
    const regRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: regPayload,
    });
    assert(regRes.status === 201, 'POST /api/auth/register returns 201 Created');
    assert(regRes.body.data?.user?.username === 'testuser_ph2', 'User username is testuser_ph2');
    assert(regRes.body.data?.user?.role === 'USER', 'Role is strictly USER (ignored client ADMIN injection)');
    assert(regRes.body.data?.user?.password === undefined, 'User object does NOT contain password');

    // Check cart created
    const createdUser = await User.findOne({ where: { username: 'testuser_ph2' } });
    const cart = await Cart.findOne({ where: { userId: createdUser.id } });
    assert(cart !== null, 'Persistent Cart was automatically created for user');

    // 3. Reject duplicate email
    console.log('\n[3] Testing Duplicate Email Rejection...');
    const dupEmailRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        username: 'other_user',
        email: 'testuser_ph2@example.com',
        phone: '9876543211',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    });
    assert(dupEmailRes.status === 409, 'Duplicate email rejected with 409 Conflict');
    assert(dupEmailRes.body.success === false, 'Duplicate email response success is false');

    // 4. Reject duplicate username
    console.log('\n[4] Testing Duplicate Username Rejection...');
    const dupUserRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        username: 'testuser_ph2',
        email: 'another@example.com',
        phone: '9876543212',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    });
    assert(dupUserRes.status === 409, 'Duplicate username rejected with 409 Conflict');

    // 5. Test validation failure (short password, invalid phone, mismatched passwords)
    console.log('\n[5] Testing Validation Rules...');
    const badValRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        username: 'ab',
        email: 'notanemail',
        phone: '123',
        password: 'weak',
        confirmPassword: 'nomatch',
      },
    });
    assert(badValRes.status === 422, 'Invalid input rejected with 422 Unprocessable Entity');

    // 6. Login with incorrect password
    console.log('\n[6] Testing Failed Login (Wrong Password)...');
    const wrongPassRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        username: 'testuser_ph2',
        password: 'WrongPassword!',
      },
    });
    assert(wrongPassRes.status === 401, 'Wrong password rejected with 401 Unauthorized');
    assert(wrongPassRes.body.success === false, 'Failed login response success is false');

    // 7. Login with valid credentials
    console.log('\n[7] Testing Successful Login...');
    const loginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        username: 'testuser_ph2',
        password: 'Password123!',
      },
    });
    assert(loginRes.status === 200, 'Valid login returns 200 OK');
    assert(typeof loginRes.body.data?.token === 'string', 'JWT token string is returned');
    assert(loginRes.body.data?.user?.username === 'testuser_ph2', 'User username matches in login response');
    assert(loginRes.body.data?.user?.password === undefined, 'No password returned in login response');

    const userToken = loginRes.body.data?.token;

    // 8. GET /api/auth/me with valid Bearer token
    console.log('\n[8] Testing GET /api/auth/me with Bearer Token...');
    const meRes = await request(server, {
      method: 'GET',
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 OK');
    assert(meRes.body.data?.user?.username === 'testuser_ph2', 'Correct user profile returned');
    assert(meRes.body.data?.user?.password === undefined, 'User profile does NOT contain password or password_hash');
    assert(meRes.body.data?.user?.role === 'USER', 'User profile role is USER');

    // 9. GET /api/auth/me without token
    console.log('\n[9] Testing GET /api/auth/me without Token...');
    const noTokenRes = await request(server, {
      method: 'GET',
      path: '/api/auth/me',
    });
    assert(noTokenRes.status === 401, 'GET /api/auth/me without token returns 401');

    // 10. GET /api/auth/me with malformed / invalid token
    console.log('\n[10] Testing GET /api/auth/me with Invalid Token...');
    const invalidTokenRes = await request(server, {
      method: 'GET',
      path: '/api/auth/me',
      headers: { Authorization: 'Bearer invalid_token_value_xyz' },
    });
    assert(invalidTokenRes.status === 401, 'Invalid token returns 401');

    // 11. Test isAdmin middleware with USER token -> 403 Forbidden
    console.log('\n[11] Testing isAdmin Middleware with regular USER token...');
    const forbiddenRes = await request(server, {
      method: 'GET',
      path: '/api/auth/admin-check',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(forbiddenRes.status === 403, 'Regular USER gets 403 Forbidden on admin route');
    assert(forbiddenRes.body.success === false, '403 response reports success: false');

    // 12. Test isAdmin middleware with ADMIN credentials -> 200 OK
    console.log('\n[12] Testing isAdmin Middleware with ADMIN token...');
    const adminLoginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        username: 'admin',
        password: 'Admin@12345',
      },
    });

    assert(adminLoginRes.status === 200, 'Admin login returns 200 OK');
    const adminToken = adminLoginRes.body.data?.token;

    const adminCheckRes = await request(server, {
      method: 'GET',
      path: '/api/auth/admin-check',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminCheckRes.status === 200, 'ADMIN user gets 200 OK on admin-check route');
    assert(adminCheckRes.body.data?.user?.role === 'ADMIN', 'Admin profile confirms ADMIN role');

    console.log(`\n==============================================`);
    console.log(`PHASE 2 AUTH TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log(`==============================================`);

    // Clean up test user
    await User.destroy({ where: { username: 'testuser_ph2' } });
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
