import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function OrderConfirmationPage() {
  const { state } = useLocation(); const order = state?.order;
  if (!order) return <div className="max-w-2xl mx-auto p-10"><p className="text-slate-400">No order confirmation is available in this browser session.</p><Link to="/orders" className="text-blue-400">View My Orders</Link></div>;
  return <div className="max-w-2xl mx-auto px-4 py-14 text-center"><CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" /><h1 className="mt-4 text-3xl font-extrabold">Order Placed Successfully!</h1><p className="mt-2 text-slate-400">Your demo order has been saved. No real payment was processed.</p><div className="mt-7 text-left bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-3"><p>Invoice Number: <b>{order.invoiceNumber}</b></p><p>Order Date: <b>{new Date(order.orderDate).toLocaleString()}</b></p><p>Total Products: <b>{order.totalProducts}</b></p><p>Total Quantity: <b>{order.totalQuantity}</b></p><p>Total Amount: <b>{formatCurrency(order.totalAmount)}</b></p><p>Payment Method: <b>{order.paymentMethod}</b></p><p>Payment Status: <b>{order.paymentStatus === 'COMPLETED' ? 'Paid (simulated)' : 'Pending'}</b></p><p>Order Status: <b>{order.status}</b></p></div><div className="mt-6 flex justify-center gap-3"><Link to="/orders" className="px-4 py-2.5 bg-blue-600 rounded-xl font-semibold">View My Orders</Link><Link to="/products" className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl">Continue Shopping</Link></div></div>;
}
