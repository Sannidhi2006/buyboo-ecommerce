# ApexStore India

A full-stack Indian e-commerce application with a React storefront, Express API, MySQL persistence, JWT authentication, role-based administration, cart and checkout flows, simulated payments, inventory management, invoice generation, order history, and security hardening through Phase 9.

## Features

- Registration, login, logout, JWT session validation, bcrypt password hashing
- USER and ADMIN roles with server-side authorization
- Storefront browsing, search, category and brand filters, product details, related products, and stock indicators
- Persistent user carts with server-calculated prices, quantities, subtotals, and totals
- Buy Now and Buy All Cart checkout
- Simulated COD, UPI, net banking, and card payment methods; no payment credentials are collected
- Invoice generation, stock decrement, transactional order creation, and historical order snapshots
- Profile editing, password change, account deactivation, and My Orders
- Admin dashboard with live database statistics, products, categories, brands, orders, payments, and users
- Admin order status updates synchronized to customer order history
- Strict CORS, Helmet security headers, upload restrictions, safe error responses, and security regression tests

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Tailwind CSS, Lucide React
- Backend: Node.js, Express, Sequelize, bcryptjs, jsonwebtoken, Multer, Helmet
- Database: MySQL 8 with InnoDB foreign keys and transactions
- Runtime: Node.js 18+ recommended, npm, MySQL 8+

## Requirements

Install:

- Node.js 18 or newer
- npm
- MySQL 8 or a compatible MySQL server
- Git, if cloning the repository

## Fresh Setup

### 1. Create the database

From the repository root:

```bash
mysql -u root -p < database/schema.sql
```

The schema creates `ecommerce_db`, the catalog tables, carts, orders, order-item snapshots, and user account fields used by Phase 7.

### 2. Configure the backend

Copy the root template into the backend directory:

```bash
copy .env.example backend\.env
```

On macOS/Linux:

```bash
cp .env.example backend/.env
```

Set real local values in `backend/.env` for `DB_USER`, `DB_PASSWORD`, and `JWT_SECRET`. Do not commit `backend/.env`.

Required seed configuration:

```env
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_EMAIL=admin@ecommerce.local
SEED_ADMIN_PASSWORD=choose_a_strong_local_password
SEED_ADMIN_PHONE=9999999999
SEED_SAMPLE_USER_PASSWORD=choose_a_strong_sample_password
```

The remaining sample-user variables have safe example identities in `.env.example` and can be changed.

### 3. Install dependencies

From the repository root:

```bash
npm run install:all
```

Or install separately:

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 4. Apply the Phase 7 migration

For an existing database created before Phase 7:

```bash
node backend/run-phase7-migration.js
```

A fresh database created from `database/schema.sql` already includes the fields.

### 5. Seed catalog and demo accounts

```bash
npm run seed --prefix backend
```

The seed command creates or preserves:

- One ADMIN account using `SEED_ADMIN_*` environment values
- Two USER accounts using `SEED_SAMPLE_USER_*` environment values
- Five categories: Fruits, Clothes, Footwear, Bags, Electronics
- Eleven brands
- Twenty-eight realistic products distributed across all five categories
- Out-of-stock and inactive products for UI testing
- A cart for every seeded account

Passwords are read from environment variables and are never hardcoded in source code or displayed by the API.

### 6. Run the application

Backend:

```bash
npm run dev:backend
```

Frontend, in a second terminal:

```bash
npm run dev:frontend
```

Open `http://localhost:5173`. The API runs at `http://localhost:5000/api`.

For a production frontend build:

```bash
npm run build:frontend
```

## Demo Login

Use the admin username/email configuration from `backend/.env` and the password you chose for `SEED_ADMIN_PASSWORD`. The sample users use the values configured by `SEED_SAMPLE_USER_*` and `SEED_SAMPLE_USER_PASSWORD`.

Credentials are intentionally not printed here as plaintext secrets. This keeps the repository safe to share while preserving a deterministic local setup process.

## API Overview

All responses use:

```json
{ "success": true, "message": "...", "data": {} }
```

Errors use:

```json
{ "success": false, "message": "..." }
```

### Public and authentication routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health and database status |
| POST | `/api/auth/register` | Public | Register a USER |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/me` | Authenticated | Verify current identity |
| GET | `/api/auth/admin-check` | USER/ADMIN JWT + admin | Authorization check |

### Catalog routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/api/categories` | Public | List categories |
| GET | `/api/categories/:id` | Public | Category detail |
| POST | `/api/categories` | ADMIN | Create category |
| PUT | `/api/categories/:id` | ADMIN | Update category |
| DELETE | `/api/categories/:id` | ADMIN | Delete unused category |
| GET | `/api/brands` | Public | List brands |
| GET | `/api/brands/:id` | Public | Brand detail |
| POST | `/api/brands` | ADMIN | Create brand |
| PUT | `/api/brands/:id` | ADMIN | Update brand |
| DELETE | `/api/brands/:id` | ADMIN | Delete unused brand |
| GET | `/api/products` | Public or optional JWT | Search, filter, and list products |
| GET | `/api/products/:id` | Public | Product detail and related products |
| GET | `/api/products/:id/related` | Public | Related products |
| POST | `/api/products` | ADMIN | Create product |
| PUT | `/api/products/:id` | ADMIN | Update product |
| DELETE | `/api/products/:id` | ADMIN | Delete product |

### Cart, checkout, and account routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/api/cart` | Authenticated | Current user's cart |
| POST | `/api/cart/items` | Authenticated | Add item |
| PUT | `/api/cart/items/:id` | Authenticated, owned item | Change quantity |
| DELETE | `/api/cart/items/:id` | Authenticated, owned item | Remove item |
| DELETE | `/api/cart` | Authenticated | Clear current cart |
| POST | `/api/orders` | Authenticated | Buy Now or cart checkout |
| GET | `/api/orders` | Authenticated | Current user's orders |
| GET | `/api/orders/:id` | Authenticated, owned order | Order detail |
| GET | `/api/users/me` | Authenticated | Safe profile |
| PUT | `/api/users/me` | Authenticated | Edit username, email, phone |
| PUT | `/api/users/me/password` | Authenticated | Change password and invalidate old tokens |
| DELETE | `/api/users/me` | Authenticated | Deactivate account and clear cart |

### Admin routes

Every `/api/admin/*` route applies both `authMiddleware` and `isAdmin`. Missing authentication returns `401`; a normal USER returns `403`.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/admin/dashboard` | Live counts and persisted revenue |
| GET | `/api/admin/users` | Safe user directory, no credentials |
| GET | `/api/admin/orders` | All orders and historical snapshots |
| GET | `/api/admin/orders/:id` | Admin order detail |
| PUT | `/api/admin/orders/:id/status` | Validate and update order status |
| GET | `/api/admin/payments` | Simulated payment metadata only |

Revenue includes persisted orders with `payment_status = COMPLETED` and excludes `CANCELLED` orders. Payment data never includes card numbers, CVV, UPI PINs, bank credentials, or payment tokens.

## Folder Structure

```text
backend/
  app.js, server.js
  config/                 Sequelize connection
  controllers/            Auth, catalog, cart, order, user, admin logic
  middleware/             Auth, upload, errors, not-found handling
  models/                 Sequelize models and relationships
  routes/                 Express route modules
  seeders/seed.js         Idempotent catalog and account seed
  migrations/             Phase migrations
  services/               File storage helpers
  test-phase*.js          Regression and security suites
frontend/
  src/App.jsx             Router
  src/components/         Navbar, protected route, admin nav
  src/context/             Auth, cart, toast providers
  src/pages/               Storefront, checkout, account, orders
  src/pages/admin/         Catalog and Phase 8 admin screens
database/schema.sql       MySQL schema
.env.example              Safe configuration template
README.md                 This guide
```

## Verification

Run the available automated suites from the repository root:

```bash
node backend/test-phase2-auth.js
node backend/test-phase3-all.js
node backend/test-phase5-cart.js
node backend/test-phase6-orders.js
node backend/test-phase7-account.js
node backend/test-phase8-admin.js
node backend/test-phase9-security.js
npm run build:frontend
```

The suites cover authentication, catalog/admin authorization, carts, checkout, order snapshots and rollback, account/session invalidation, admin live statistics, status synchronization, CORS, password safety, error leakage, SQL-injection-style inputs, and price/total manipulation.

## Troubleshooting

### MySQL connection fails

Check that MySQL is running, the database exists, and `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `backend/.env` are correct. Run `node backend/test-connection.js`.

### Missing Phase 7 columns

Run `node backend/run-phase7-migration.js` against the existing database.

### Seed refuses to run

Set `SEED_ADMIN_PASSWORD` and `SEED_SAMPLE_USER_PASSWORD` in `backend/.env`. The seed intentionally refuses to use plaintext fallback passwords.

### Frontend cannot reach the API

Start the backend on port 5000 and set `VITE_API_BASE_URL=http://localhost:5000/api` for the frontend build/dev environment.

### CORS error

Set `CLIENT_URL` in `backend/.env` to the exact frontend origin, such as `http://localhost:5173`, then restart the backend.

### Uploaded images do not appear

Confirm the backend is running, the file exists under `backend/uploads`, and the API returns a `/uploads/...` URL. Only JPEG, PNG, and WebP uploads up to 5 MB are accepted.

### Port already in use

Change `PORT` for the backend or use Vite's port configuration for the frontend, then update `CLIENT_URL` and `VITE_API_BASE_URL` accordingly.

## Phase 10 Manual Checklist

Run the backend and frontend, seed the database, and verify:

- Auth: register, login, invalid login, logout
- User: browse, search, category/brand filters, product detail, related products, cart quantity changes, remove, Buy Now, Buy All Cart, checkout, payment selection, order creation, My Orders, profile edit, password change, account deletion
- Admin: login, live dashboard, category/brand/product CRUD, price/image changes, users, orders, status update, payments
- Security: a normal USER is redirected from every `/admin/*` page and receives `403` from every admin API

The automated suites validate the server-side portions of this checklist. Browser-only visual and interaction checks require opening the running frontend in a browser.
