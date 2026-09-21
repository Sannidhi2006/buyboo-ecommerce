import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// ── Phase 2: Auth Pages ────────────────────────────────────────────────────
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

// ── Phase 3: Admin Pages ───────────────────────────────────────────────────
import AdminDashboardPlaceholder from './pages/AdminDashboardPlaceholder';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminBrandsPage from './pages/admin/AdminBrandsPage';

// ── Phase 4: Customer Storefront ───────────────────────────────────────────
import StorefrontPage from './pages/StorefrontPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPlaceholderPage from './pages/CheckoutPlaceholderPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col justify-between font-sans">
            <Navbar />

            <main className="flex-1 flex flex-col">
              <Routes>
                {/* ── Public / Storefront Routes (Phase 4) ──────────────── */}
                <Route path="/" element={<StorefrontPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route
                  path="/cart"
                  element={<ProtectedRoute><CartPage /></ProtectedRoute>}
                />
                <Route
                  path="/checkout"
                  element={<ProtectedRoute><CheckoutPlaceholderPage /></ProtectedRoute>}
                />
                <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                {/* ── Auth Routes (Phase 2) ──────────────────────────────── */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* ── Protected Admin Routes (Phase 3) ──────────────────── */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboardPlaceholder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminProductsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminCategoriesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/brands"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminBrandsPage />
                    </ProtectedRoute>
                  }
                />

                {/* ── Catch-all 404 ─────────────────────────────────────── */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
              ApexStore India Platform — Full-Stack E-Commerce (Phase 4: Customer Storefront)
            </footer>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
