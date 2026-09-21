import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Home,
  LogIn,
  UserPlus,
  LogOut,
  Shield,
  User,
  Package,
  FolderTree,
  Tag,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isProductsActive = location.pathname.startsWith('/products');

  const navLinkClass = (active) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-50 text-blue-700 border border-blue-200'
        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
    }`;

  const adminLinkClass = (active, color = 'amber') => {
    const colorMap = {
      amber: active
        ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
        : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/60',
      blue: active
        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/60',
      indigo: active
        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/60',
      emerald: active
        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/60',
    };
    return `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${colorMap[color]}`;
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3" id="navbar-logo-link">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-950">
            Buyboo
          </span>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Main navigation">
          {/* Home */}
          <Link to="/" id="navbar-home-link" className={navLinkClass(isActive('/'))}>
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          {/* Shop / Products — visible to everyone */}
          <Link to="/products" id="navbar-shop-link" className={navLinkClass(isProductsActive)}>
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Shop</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/cart"
                id="navbar-cart-link"
                className={navLinkClass(isActive('/cart'))}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Cart ({cartCount})</span>
              </Link>
              <Link to="/orders" id="navbar-orders-link" className={navLinkClass(isActive('/orders'))}>
                <Package className="w-4 h-4" /><span className="hidden md:inline">Orders</span>
              </Link>
              <Link to="/profile" id="navbar-profile-link" className={navLinkClass(isActive('/profile'))}>
                <User className="w-4 h-4" /><span className="hidden md:inline">Profile</span>
              </Link>
              {/* Admin Links */}
              {isAdmin && (
                <div className="flex items-center gap-1 border-l border-slate-700/80 pl-2 ml-1">
                  <Link
                    to="/admin"
                    id="navbar-admin-dashboard-link"
                    className={adminLinkClass(isActive('/admin'), 'amber')}
                    title="Admin Hub"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Dashboard</span>
                  </Link>

                  <Link
                    to="/admin/products"
                    id="navbar-admin-products-link"
                    className={adminLinkClass(isActive('/admin/products'), 'blue')}
                    title="Manage Products"
                  >
                    <Package className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden md:inline">Products</span>
                  </Link>

                  <Link
                    to="/admin/categories"
                    id="navbar-admin-categories-link"
                    className={adminLinkClass(isActive('/admin/categories'), 'indigo')}
                    title="Manage Categories"
                  >
                    <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden md:inline">Categories</span>
                  </Link>

                  <Link
                    to="/admin/brands"
                    id="navbar-admin-brands-link"
                    className={adminLinkClass(isActive('/admin/brands'), 'emerald')}
                    title="Manage Brands"
                  >
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden md:inline">Brands</span>
                  </Link>
                </div>
              )}

              {/* User Identity Pill */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 ml-1"
                id="navbar-user-pill"
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-slate-200">{currentUser?.username}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isAdmin
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {currentUser?.role || 'USER'}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                id="navbar-logout-btn"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-800/40 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/cart" id="navbar-cart-link" className={navLinkClass(isActive('/cart'))}>
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
              </Link>
              <Link
                to="/login"
                id="navbar-login-link"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/login')
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>

              <Link
                to="/register"
                id="navbar-register-link"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/register')
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
