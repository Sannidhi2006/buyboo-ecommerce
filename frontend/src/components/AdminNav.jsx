import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, FolderTree, LogOut, Package, ShoppingBag, Tag, User, Users, WalletCards } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { label: 'Dashboard', path: '/admin', icon: BarChart3 },
  { label: 'Products', path: '/admin/products', icon: Package },
  { label: 'Categories', path: '/admin/categories', icon: FolderTree },
  { label: 'Brands', path: '/admin/brands', icon: Tag },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Payments', path: '/admin/payments', icon: WalletCards },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Profile', path: '/profile', icon: User },
];

export default function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="mb-8 overflow-x-auto border-b border-slate-700/70 pb-3" aria-label="Admin navigation">
      <div className="flex min-w-max items-center gap-2">
        {links.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${active ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-950/30"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </nav>
  );
}
