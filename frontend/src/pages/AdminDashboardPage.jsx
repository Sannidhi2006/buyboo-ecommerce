import React, { useEffect, useState } from 'react';
import { BarChart3, Boxes, CircleDollarSign, Clock3, FolderTree, Package, ShoppingBag, Tag, Users } from 'lucide-react';
import api from '../services/api';
import AdminNav from '../components/AdminNav';
import { formatCurrency } from '../utils/formatters';

const cards = [
  ['totalProducts', 'Total Products', Package, 'text-blue-300'],
  ['totalCategories', 'Total Categories', FolderTree, 'text-indigo-300'],
  ['totalBrands', 'Total Brands', Tag, 'text-emerald-300'],
  ['totalUsers', 'Total Users', Users, 'text-cyan-300'],
  ['totalOrders', 'Total Orders', ShoppingBag, 'text-amber-300'],
  ['pendingOrders', 'Pending Orders', Clock3, 'text-orange-300'],
  ['completedOrders', 'Completed Orders', Boxes, 'text-green-300'],
  ['totalRevenue', 'Total Revenue', CircleDollarSign, 'text-pink-300'],
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setStats((res.data || res).stats))
      .catch((err) => setError(err.message || 'Unable to load dashboard statistics.'));
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <AdminNav />
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Operations overview</p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold text-white"><BarChart3 className="h-8 w-8 text-blue-300" />Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Live inventory, customer, order, and revenue signals from MySQL.</p>
        </div>
      </div>
      {error && <p className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</p>}
      {!stats && !error ? <p className="text-slate-400">Loading live statistics...</p> : stats && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([key, label, Icon, color]) => (
            <article key={key} className="rounded-2xl border border-slate-700/70 bg-slate-800/50 p-5 shadow-xl">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span><Icon className={`h-5 w-5 ${color}`} /></div>
              <p className="mt-4 text-3xl font-extrabold text-white">{key === 'totalRevenue' ? formatCurrency(stats[key]) : stats[key]}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 text-xs text-slate-400">Revenue policy: {stats.revenuePolicy}</p>
      </>}
    </div>
  );
}
