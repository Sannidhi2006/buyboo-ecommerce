import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Package, FolderTree, Tag, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminDashboardPlaceholder = () => {
  const { currentUser } = useAuth();

  const adminModules = [
    {
      title: 'Products Inventory',
      description: 'Manage product catalog, pricing, inventory stock, and image assets.',
      path: '/admin/products',
      icon: Package,
      color: 'from-blue-600 to-indigo-600',
      badge: 'CRUD Active',
    },
    {
      title: 'Categories',
      description: 'Configure product categories, navigation taxonomy, and descriptions.',
      path: '/admin/categories',
      icon: FolderTree,
      color: 'from-indigo-600 to-purple-600',
      badge: 'CRUD Active',
    },
    {
      title: 'Brands',
      description: 'Manage manufacturer labels, brand logos, and authorized suppliers.',
      path: '/admin/brands',
      icon: Tag,
      color: 'from-emerald-600 to-teal-600',
      badge: 'CRUD Active',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-700/80 rounded-3xl p-8 mb-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrator Control Center
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome, <span className="text-amber-400">{currentUser?.username}</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              ApexStore Phase 3 administrative management suite. Maintain your catalog,
              safely edit brands & categories, and manage inventory stock levels.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-sm font-medium border border-slate-700 transition self-start md:self-auto"
          >
            <span>View Storefront</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.path}
              to={module.path}
              className="group p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-200 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {module.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                  {module.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {module.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                <span>Access Management</span>
                <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Roadmap Note */}
      <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800 text-center text-xs text-slate-500">
        Phase 3: Catalog & Admin CRUD | Advanced sales analytics, revenue graphs, and order pipelines will unlock in Phase 8.
      </div>
    </div>
  );
};

export default AdminDashboardPlaceholder;
