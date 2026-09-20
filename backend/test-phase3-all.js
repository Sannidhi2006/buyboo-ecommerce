const http = require('http');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { sequelize, User, Category, Brand, Product, Cart } = require('./models');

// Multipart form-data builder helper for Node's built-in http request
function createMultipartFormData(fields = {}, files = {}) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const buffers = [];

  // Text fields
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      buffers.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
        )
      );
    }
  }

  // File fields
  for (const [key, file] of Object.entries(files)) {
    buffers.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`
      )
    );
    buffers.push(file.content);
    buffers.push(Buffer.from('\r\n'));
  }

  buffers.push(Buffer.from(`--${boundary}--\r\n`));

  const bodyBuffer = Buffer.concat(buffers);
  return {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': bodyBuffer.length,
    },
    body: bodyBuffer,
  };
}

// HTTP request helper
function request(server, { method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: address.port,
      path,
      method,
      headers: { ...headers },
    };

    let sendBuffer = null;

    if (body !== null && body !== undefined) {
      if (Buffer.isBuffer(body)) {
        sendBuffer = body;
      } else if (typeof body === 'object') {
        sendBuffer = Buffer.from(JSON.stringify(body));
        if (!options.headers['Content-Type']) {
          options.headers['Content-Type'] = 'application/json';
        }
      } else {
        sendBuffer = Buffer.from(String(body));
      }

      if (!options.headers['Content-Length']) {
        options.headers['Content-Length'] = sendBuffer.length;
      }
    }

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

    if (sendBuffer) {
      req.write(sendBuffer);
    }
    req.end();
  });
}

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('🧪 PHASE 3: COMPREHENSIVE AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  // Verify DB connection
  await sequelize.authenticate();
  console.log('✔ MySQL connection verified.');

  // Start test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`✔ Test HTTP server listening on port ${port}\n`);

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
    // ─────────────────────────────────────────────────────────────────────────
    // REGRESSION TESTS (Phase 1 & Phase 2)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- [REGRESSION] Phase 1 & 2 Integrity Checks ---');

    // 1. Health check
    const healthRes = await request(server, { method: 'GET', path: '/api/health' });
    assert(healthRes.status === 200, 'GET /api/health returns 200');
    assert(healthRes.body.data?.status === 'UP', 'Health reports UP');
    assert(healthRes.body.data?.database.includes('Connected'), 'DB status is Connected');

    // 2. Setup standard USER and retrieve token
    await User.destroy({ where: { username: 'test_phase3_user' } });
    const regRes = await request(server, {
      method: 'POST',
      path: '/api/auth/register',
      body: {
        username: 'test_phase3_user',
        email: 'test_phase3_user@example.com',
        phone: '9876543210',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    });
    assert(regRes.status === 201, 'Registration returns 201 Created');
    assert(regRes.body.data?.user?.role === 'USER', 'Registered user has USER role');

    // Login as USER
    const userLoginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        username: 'test_phase3_user',
        password: 'Password123!',
      },
    });
    assert(userLoginRes.status === 200, 'USER login returns 200 OK');
    const userToken = userLoginRes.body.data?.token;

    // Verify /api/auth/me for USER
    const userMeRes = await request(server, {
      method: 'GET',
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userMeRes.status === 200, 'GET /api/auth/me returns 200 OK');
    assert(userMeRes.body.data?.user?.username === 'test_phase3_user', 'Username matches in /me');
    assert(userMeRes.body.data?.user?.password === undefined, 'No password returned in /me');

    // Login as ADMIN
    const adminLoginRes = await request(server, {
      method: 'POST',
      path: '/api/auth/login',
      body: {
        username: process.env.SEED_ADMIN_USERNAME || 'admin',
        password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
      },
    });
    assert(adminLoginRes.status === 200, 'ADMIN login returns 200 OK');
    const adminToken = adminLoginRes.body.data?.token;
    assert(adminLoginRes.body.data?.user?.role === 'ADMIN', 'Admin identity verified as ADMIN role');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST A: Public Category API
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST A] Public Category API ---');
    const catRes = await request(server, { method: 'GET', path: '/api/categories' });
    assert(catRes.status === 200, 'GET /api/categories returns 200 OK');
    assert(Array.isArray(catRes.body.data?.categories), 'Returns categories array');
    assert(catRes.body.data.categories.length >= 5, 'Contains at least 5 seeded categories');
    const firstCat = catRes.body.data.categories[0];
    assert(Boolean(firstCat.id && firstCat.name && firstCat.slug), 'Category has id, name, slug');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST B: Public Brand API
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST B] Public Brand API ---');
    const brandRes = await request(server, { method: 'GET', path: '/api/brands' });
    assert(brandRes.status === 200, 'GET /api/brands returns 200 OK');
    assert(Array.isArray(brandRes.body.data?.brands), 'Returns brands array');
    assert(brandRes.body.data.brands.length >= 5, 'Contains at least 5 seeded brands');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST C: Public Product API
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST C] Public Product API ---');
    const prodRes = await request(server, { method: 'GET', path: '/api/products' });
    assert(prodRes.status === 200, 'GET /api/products returns 200 OK');
    assert(Array.isArray(prodRes.body.data?.products), 'Returns products array');
    assert(prodRes.body.data.products.length >= 20, 'Returns at least 20 seeded products');

    // Verify public query parameters
    const catFilterRes = await request(server, {
      method: 'GET',
      path: '/api/products?category=electronics',
    });
    assert(catFilterRes.status === 200, 'GET /api/products?category=electronics returns 200');
    assert(catFilterRes.body.data.products.length > 0, 'Category filter returns items');

    const searchRes = await request(server, {
      method: 'GET',
      path: '/api/products?search=iPhone',
    });
    assert(searchRes.status === 200, 'GET /api/products?search=iPhone returns 200');
    assert(
      searchRes.body.data.products.some((p) => p.name.includes('iPhone')),
      'Search finds iPhone product'
    );

    // Verify inStock / isOutOfStock flags
    const hasInStock = prodRes.body.data.products.some((p) => p.inStock === true);
    const hasOutOfStock = prodRes.body.data.products.some((p) => p.isOutOfStock === true);
    assert(hasInStock, 'Products expose inStock flag correctly');
    assert(hasOutOfStock, 'Products expose isOutOfStock flag correctly (stock = 0)');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST D: Product Details by ID / Slug
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST D] Product Details ---');
    const sampleProduct = prodRes.body.data.products[0];
    const singleProdRes = await request(server, {
      method: 'GET',
      path: `/api/products/${sampleProduct.id}`,
    });
    assert(singleProdRes.status === 200, 'GET /api/products/:id returns 200 OK');
    assert(Boolean(singleProdRes.body.data?.product?.category), 'Includes category association');
    assert(Boolean(singleProdRes.body.data?.product?.brand), 'Includes brand association');

    // Nonexistent product -> 404
    const notFoundRes = await request(server, {
      method: 'GET',
      path: '/api/products/9999999',
    });
    assert(notFoundRes.status === 404, 'Nonexistent product returns 404 Not Found');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST E: USER cannot create product (403 Forbidden)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST E] USER cannot create product (403) ---');
    const userCreateProd = await request(server, {
      method: 'POST',
      path: '/api/products',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        name: 'Hacked Product',
        price: 99.99,
        stock: 10,
        categoryId: firstCat.id,
        brandId: brandRes.body.data.brands[0].id,
        description: 'Unauthorized creation attempt',
        imageUrl: 'https://example.com/test.jpg',
      },
    });
    assert(userCreateProd.status === 403, 'USER calling POST /api/products receives 403 Forbidden');
    assert(userCreateProd.body.success === false, 'Response has success: false');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST F: USER cannot modify or delete product (403 Forbidden)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST F] USER cannot modify/delete product (403) ---');
    const userEditProd = await request(server, {
      method: 'PUT',
      path: `/api/products/${sampleProduct.id}`,
      headers: { Authorization: `Bearer ${userToken}` },
      body: { name: 'Unauthorized Name Edit' },
    });
    assert(userEditProd.status === 403, 'USER calling PUT /api/products/:id receives 403 Forbidden');

    const userDeleteProd = await request(server, {
      method: 'DELETE',
      path: `/api/products/${sampleProduct.id}`,
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userDeleteProd.status === 403, 'USER calling DELETE /api/products/:id receives 403 Forbidden');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST G: USER cannot modify categories (403 Forbidden)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST G] USER cannot modify categories (403) ---');
    const userCreateCat = await request(server, {
      method: 'POST',
      path: '/api/categories',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { name: 'Hacked Category' },
    });
    assert(userCreateCat.status === 403, 'USER calling POST /api/categories receives 403 Forbidden');

    const userEditCat = await request(server, {
      method: 'PUT',
      path: `/api/categories/${firstCat.id}`,
      headers: { Authorization: `Bearer ${userToken}` },
      body: { name: 'Hacked Cat Edit' },
    });
    assert(userEditCat.status === 403, 'USER calling PUT /api/categories/:id receives 403 Forbidden');

    const userDeleteCat = await request(server, {
      method: 'DELETE',
      path: `/api/categories/${firstCat.id}`,
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userDeleteCat.status === 403, 'USER calling DELETE /api/categories/:id receives 403 Forbidden');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST H: USER cannot modify brands (403 Forbidden)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST H] USER cannot modify brands (403) ---');
    const firstBrand = brandRes.body.data.brands[0];
    const userCreateBrand = await request(server, {
      method: 'POST',
      path: '/api/brands',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { name: 'Hacked Brand' },
    });
    assert(userCreateBrand.status === 403, 'USER calling POST /api/brands receives 403 Forbidden');

    const userEditBrand = await request(server, {
      method: 'PUT',
      path: `/api/brands/${firstBrand.id}`,
      headers: { Authorization: `Bearer ${userToken}` },
      body: { name: 'Hacked Brand Edit' },
    });
    assert(userEditBrand.status === 403, 'USER calling PUT /api/brands/:id receives 403 Forbidden');

    const userDeleteBrand = await request(server, {
      method: 'DELETE',
      path: `/api/brands/${firstBrand.id}`,
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userDeleteBrand.status === 403, 'USER calling DELETE /api/brands/:id receives 403 Forbidden');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST I: ADMIN Product Creation
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST I] ADMIN Product Creation ---');
    const adminCreateProdRes = await request(server, {
      method: 'POST',
      path: '/api/products',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Admin Test Wireless Keyboard',
        price: 2499.0,
        stock: 35,
        categoryId: firstCat.id,
        brandId: firstBrand.id,
        description: 'High quality mechanical keyboard designed for rapid typing.',
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
        isActive: true,
      },
    });
    assert(adminCreateProdRes.status === 201, 'ADMIN POST /api/products returns 201 Created');
    const createdProd = adminCreateProdRes.body.data?.product;
    assert(createdProd?.name === 'Admin Test Wireless Keyboard', 'Created product has correct name');
    assert(createdProd?.stock === 35, 'Created product has correct stock');
    assert(createdProd?.inStock === true, 'Created product marked inStock: true');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST J: ADMIN Product Edit
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST J] ADMIN Product Edit ---');
    const adminEditProdRes = await request(server, {
      method: 'PUT',
      path: `/api/products/${createdProd.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Admin Test Mechanical Keyboard Pro',
        price: 2999.0,
        stock: 0, // Test updating to 0 stock
      },
    });
    assert(adminEditProdRes.status === 200, 'ADMIN PUT /api/products/:id returns 200 OK');
    const editedProd = adminEditProdRes.body.data?.product;
    assert(editedProd?.name === 'Admin Test Mechanical Keyboard Pro', 'Name updated correctly');
    assert(editedProd?.stock === 0, 'Stock updated to 0');
    assert(editedProd?.isOutOfStock === true, 'Server-side stock reflects isOutOfStock: true');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST K: ADMIN Product Delete
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST K] ADMIN Product Delete ---');
    const adminDeleteProdRes = await request(server, {
      method: 'DELETE',
      path: `/api/products/${createdProd.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDeleteProdRes.status === 200, 'ADMIN DELETE /api/products/:id returns 200 OK');

    // Confirm product is deleted
    const verifyDelProd = await request(server, {
      method: 'GET',
      path: `/api/products/${createdProd.id}`,
    });
    assert(verifyDelProd.status === 404, 'Deleted product is no longer found (404)');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST L: ADMIN Category CRUD & Safe Delete Check (409 Conflict)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST L] ADMIN Category CRUD & Safe Deletion Check ---');
    // 1. Create category
    const adminCreateCatRes = await request(server, {
      method: 'POST',
      path: '/api/categories',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Temporary Test Category',
        description: 'Category for deletion testing',
      },
    });
    assert(adminCreateCatRes.status === 201, 'ADMIN creates category returns 201 Created');
    const tempCat = adminCreateCatRes.body.data?.category;

    // 2. Edit category
    const adminEditCatRes = await request(server, {
      method: 'PUT',
      path: `/api/categories/${tempCat.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { description: 'Updated description for temp category' },
    });
    assert(adminEditCatRes.status === 200, 'ADMIN updates category returns 200 OK');

    // 3. Attempt to delete a category that HAS products (e.g. firstCat which has products)
    const inUseCatDel = await request(server, {
      method: 'DELETE',
      path: `/api/categories/${firstCat.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(inUseCatDel.status === 409, 'Deleting in-use category rejected with 409 Conflict');
    assert(inUseCatDel.body.message.includes('product(s) are currently associated'), 'Error message clarifies product dependency');

    // 4. Delete the empty temporary category -> succeeds
    const tempCatDel = await request(server, {
      method: 'DELETE',
      path: `/api/categories/${tempCat.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(tempCatDel.status === 200, 'Deleting unused category returns 200 OK');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST M: ADMIN Brand CRUD & Safe Delete Check (409 Conflict)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST M] ADMIN Brand CRUD & Safe Deletion Check ---');
    // 1. Create brand
    const adminCreateBrandRes = await request(server, {
      method: 'POST',
      path: '/api/brands',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Temporary Test Brand',
        description: 'Brand for deletion testing',
      },
    });
    assert(adminCreateBrandRes.status === 201, 'ADMIN creates brand returns 201 Created');
    const tempBrand = adminCreateBrandRes.body.data?.brand;

    // 2. Edit brand
    const adminEditBrandRes = await request(server, {
      method: 'PUT',
      path: `/api/brands/${tempBrand.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { description: 'Updated brand description' },
    });
    assert(adminEditBrandRes.status === 200, 'ADMIN updates brand returns 200 OK');

    // 3. Attempt to delete in-use brand (firstBrand)
    const inUseBrandDel = await request(server, {
      method: 'DELETE',
      path: `/api/brands/${firstBrand.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(inUseBrandDel.status === 409, 'Deleting in-use brand rejected with 409 Conflict');

    // 4. Delete unused brand
    const tempBrandDel = await request(server, {
      method: 'DELETE',
      path: `/api/brands/${tempBrand.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(tempBrandDel.status === 200, 'Deleting unused brand returns 200 OK');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST N: Image Upload Handling & Security
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST N] Image Upload & Security ---');

    // 1. Valid image upload test (fake 1x1 valid PNG buffer)
    const validPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const multipartValid = createMultipartFormData(
      {
        name: 'Product with Uploaded Image',
        price: '499.00',
        stock: '15',
        categoryId: String(firstCat.id),
        brandId: String(firstBrand.id),
        description: 'Product created with uploaded multipart image',
      },
      {
        image: {
          filename: 'test-image.png',
          contentType: 'image/png',
          content: validPngBuffer,
        },
      }
    );

    const uploadSuccessRes = await request(server, {
      method: 'POST',
      path: '/api/products',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        ...multipartValid.headers,
      },
      body: multipartValid.body,
    });
    assert(uploadSuccessRes.status === 201, 'Valid image upload accepted with 201 Created');
    const uploadedProd = uploadSuccessRes.body.data?.product;
    assert(uploadedProd?.imageUrl?.startsWith('/uploads/'), 'Image URL points to /uploads/');

    // Verify file exists on disk
    const savedFilename = path.basename(uploadedProd.imageUrl);
    const diskPath = path.join(__dirname, 'uploads', savedFilename);
    assert(fs.existsSync(diskPath), 'Uploaded image file successfully written to disk');

    // 2. Clean up created product & verify disk file is also deleted
    const cleanupProdRes = await request(server, {
      method: 'DELETE',
      path: `/api/products/${uploadedProd.id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(cleanupProdRes.status === 200, 'Cleanup uploaded product returns 200');
    assert(!fs.existsSync(diskPath), 'Associated uploaded image file was safely removed from disk on deletion');

    // 3. Invalid file type test (upload .txt or script)
    const multipartInvalid = createMultipartFormData(
      {
        name: 'Invalid File Upload Test',
        price: '100',
        stock: '5',
        categoryId: String(firstCat.id),
        brandId: String(firstBrand.id),
        description: 'Attempting to upload executable/txt file',
      },
      {
        image: {
          filename: 'exploit.sh',
          contentType: 'application/x-sh',
          content: Buffer.from('#!/bin/bash\necho bad'),
        },
      }
    );

    const uploadInvalidRes = await request(server, {
      method: 'POST',
      path: '/api/products',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        ...multipartInvalid.headers,
      },
      body: multipartInvalid.body,
    });
    assert(uploadInvalidRes.status === 400, 'Invalid file type rejected with 400 Bad Request');
    assert(uploadInvalidRes.body.message.includes('Only JPEG, PNG, and WebP'), 'Error message specifies allowed image types');

    // ─────────────────────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n====================================================');
    console.log(`PHASE 3 VERIFICATION SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    // Clean up temporary user
    await User.destroy({ where: { username: 'test_phase3_user' } });
  } finally {
    server.close();
  }
}

runPhase3Tests().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
