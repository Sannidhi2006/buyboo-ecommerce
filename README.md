# Full-Stack E-Commerce Application

A production-quality full-stack e-commerce web platform built with:
- **Frontend**: React.js, Vite, React Router, Axios, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: MySQL 8.0 with InnoDB relational integrity and transactions
- **Authentication**: JWT & bcrypt password hashing with strict role-based access control (`USER`, `ADMIN`)
- **Currency**: Indian Rupee (₹)

---

## Project Structure

```
ecommerce-app/
├── backend/
│   ├── config/          # Sequelize & database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth, error handling, validation
│   ├── models/          # Sequelize models (User, Product, Order, etc.)
│   ├── routes/          # Express API route modules
│   ├── services/        # Business logic & transactional operations
│   ├── seeders/         # Seed data scripts
│   ├── uploads/         # Static uploaded product images
│   ├── utils/           # Response formatters & helpers
│   ├── app.js           # Express app setup & middleware
│   ├── server.js        # Server entry point & DB connection
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route pages
│   │   ├── layouts/     # Main & Admin layouts
│   │   ├── services/    # Axios API client & services
│   │   ├── context/     # Auth & Cart state contexts
│   │   ├── hooks/       # Custom hooks
│   │   └── utils/       # Formatting (₹ currency, dates)
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── schema.sql       # MySQL DDL with 8 relational tables
├── .env.example         # Template environment variables
└── README.md
```

---

## Quick Setup & Running

### 1. Database Setup
Ensure MySQL is running. Run the schema script to initialize the database and tables:
```bash
# Using MySQL command line or workbench
mysql -u root -p < database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env   # (or edit backend/.env with your MySQL credentials)
npm install
npm run dev
```
The backend server runs on `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server runs on `http://localhost:5173`.
