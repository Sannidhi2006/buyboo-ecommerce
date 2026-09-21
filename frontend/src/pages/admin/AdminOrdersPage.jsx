import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, Package, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { formatCurrency } from '../../utils/formatters';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState('');

  const loadOrders = () => {
    setLoading(true);
    api.get('/admin/orders').then((res) => setOrders((res.data || res).orders || []))
      .catch((err) => setError(err.message || 'Unable to load orders.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  const updateStatus = async (orderId, status) => {
    setSaving(orderId); setError(''); setMessage('');
    try {
      const res = await api.put(`/admin/orders/${orderId}/status`, { status });
      const updated = (res.data || res).order;
      setOrders((current) => current.map((order) => order.id === orderId ? updated : order));
      setMessage(`Order ${updated.invoiceNumber} is now ${updated.status}.`);
    } catch (err) { setError(err.message || 'Unable to update order status.'); }
    finally { setSaving(null); }
  };

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <AdminNav />
      <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Fulfillment pipeline</p><h1 className="mt-2 text-3xl font-extrabold">Orders</h1></div><button type="button" onClick={loadOrders} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"><RefreshCw className="h-4 w-4" />Refresh</button></div>
      {message && <p className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" />{message}</p>}
      {error && <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</p>}
      <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-800/50 shadow-xl">
        {loading ? <p className="p-10 text-slate-400">Loading orders...</p> : !orders.length ? <p className="p-10 text-slate-400">No orders found.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400"><tr><th className="p-4">Invoice</th><th className="p-4">Customer</th><th className="p-4">Items</th><th className="p-4">Amount</th><th className="p-4">Payment</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y divide-slate-700/60">{orders.map((order) => <tr key={order.id} className="align-top hover:bg-slate-800"><td className="p-4"><b className="text-white">{order.invoiceNumber}</b><p className="mt-1 text-xs text-slate-500">{new Date(order.orderDate).toLocaleString()}</p></td><td className="p-4"><p className="font-semibold text-white">{order.customer.username}</p><p className="text-xs text-slate-400">{order.customer.email}</p></td><td className="max-w-xs p-4 text-xs text-slate-300">{order.items.map((item) => <p key={item.id}><Package className="mr-1 inline h-3 w-3" />{item.productName} x {item.quantity} at {formatCurrency(item.price)}</p>)}</td><td className="p-4 font-semibold text-white">{formatCurrency(order.totalAmount)}</td><td className="p-4 text-xs text-slate-300">{order.paymentMethod}<br /><span className="text-slate-500">{order.paymentStatus}</span></td><td className="p-4"><div className="relative"><select aria-label={`Status for ${order.invoiceNumber}`} disabled={saving === order.id} value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)} className="appearance-none rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 pr-8 text-xs font-semibold text-white"><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="PROCESSING">Processing</option><option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option><option value="CANCELLED">Cancelled</option></select><ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400" /></div></td></tr>)}</tbody></table></div>}
      </div>
    </div>
  );
}
