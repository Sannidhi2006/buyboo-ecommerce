import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
export default function OrdersPage() {
  const [orders, setOrders] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/orders').then((res) => setOrders((res.data || res).orders || [])).catch((err) => setError(err.message || 'Unable to load orders.')).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="max-w-5xl mx-auto p-10 text-slate-400">Loading orders…</div>;
  return <div className="max-w-5xl mx-auto px-4 py-10"><h1 className="text-3xl font-extrabold">My Orders</h1>{error && <p className="mt-4 text-rose-400">{error}</p>}{!orders.length ? <div className="mt-8 text-slate-400">No orders yet. <Link to="/products" className="text-blue-400">Start shopping</Link></div> : <div className="mt-6 space-y-4">{orders.map((order) => <article key={order.id} className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl"><div className="flex justify-between gap-3"><div><b>{order.invoiceNumber}</b><p className="text-sm text-slate-400">{new Date(order.orderDate).toLocaleString()}</p></div><b>{formatCurrency(order.totalAmount)}</b></div><p className="mt-2 text-sm">{order.totalQuantity} item(s) · {order.status} · {order.paymentStatus === 'COMPLETED' ? 'Paid (simulated)' : 'COD Pending'}</p><ul className="mt-3 text-sm text-slate-300">{order.items.map((item) => <li key={item.id}>{item.productName} × {item.quantity}</li>)}</ul><Link to={`/orders/${order.id}`} className="inline-block mt-3 text-sm text-blue-400">View details →</Link></article>)}</div>}</div>;
}
