import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  PackageX,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

/* ─── Image helper ────────────────────────────────────────────────────────── */
const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

/* ─── Single Cart Item Row ────────────────────────────────────────────────── */
const CartItemRow = ({ item, onUpdate, onRemove, onBuyNow }) => {
  const [busy, setBusy] = useState(false);
  const [itemError, setItemError] = useState(null);
  const img = getImageSrc(item.productImage);

  const handleQtyChange = async (newQty) => {
    if (newQty < 1) return;
    if (newQty > item.stock) {
      setItemError(`Only ${item.stock} unit(s) available.`);
      return;
    }
    setBusy(true);
    setItemError(null);
    try {
      await onUpdate(item.cartItemId, newQty);
    } catch (err) {
      setItemError(err.message || 'Failed to update quantity.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setItemError(null);
    try {
      await onRemove(item.cartItemId);
    } catch (err) {
      setItemError(err.message || 'Failed to remove item.');
      setBusy(false);
    }
  };

  const unavailable = !item.isActive || item.stock === 0;

  return (
    <div
      id={`cart-item-${item.cartItemId}`}
      className={`group relative bg-slate-800/50 border rounded-2xl p-4 sm:p-5 transition-all duration-200 ${
        unavailable
          ? 'border-rose-500/30 bg-rose-950/10'
          : 'border-slate-700/60 hover:border-slate-600/80'
      } ${busy ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Unavailable banner */}
      {unavailable && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-medium">
          <AlertCircle className="w-3 h-3" />
          {!item.isActive ? 'Unavailable' : 'Out of Stock'}
        </div>
      )}

      <div className="flex gap-4">
        {/* Product Image */}
        <Link
          to={`/products/${item.productId}`}
          className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-900/60 border border-slate-700/40 hover:border-blue-500/40 transition-colors"
        >
          {img ? (
            <img
              src={img}
              alt={item.productName}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-slate-600" />
            </div>
          )}
        </Link>

        {/* Details */}
        <div className="flex-1 min-w-0">
          {/* Brand */}
          {item.brand && (
            <p className="text-xs text-blue-400 font-medium mb-0.5">{item.brand}</p>
          )}

          {/* Product Name */}
          <Link
            to={`/products/${item.productId}`}
            className="text-sm sm:text-base font-semibold text-slate-100 hover:text-white line-clamp-2 transition-colors"
            id={`cart-item-name-${item.cartItemId}`}
          >
            {item.productName}
          </Link>

          {/* Price */}
          <p className="text-base font-bold text-white mt-1" id={`cart-item-price-${item.cartItemId}`}>
            {formatCurrency(item.price)}
          </p>

          {/* Error */}
          {itemError && (
            <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {itemError}
            </p>
          )}

          {/* Controls Row */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {/* Quantity Controls */}
            <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-700/60 rounded-xl p-1">
              <button
                onClick={() => handleQtyChange(item.quantity - 1)}
                disabled={item.quantity <= 1 || busy}
                id={`cart-item-decrease-${item.cartItemId}`}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span
                className="w-8 text-center text-sm font-semibold text-white"
                id={`cart-item-qty-${item.cartItemId}`}
              >
                {item.quantity}
              </span>

              <button
                onClick={() => handleQtyChange(item.quantity + 1)}
                disabled={item.quantity >= item.stock || busy}
                id={`cart-item-increase-${item.cartItemId}`}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subtotal */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-bold text-emerald-400" id={`cart-item-subtotal-${item.cartItemId}`}>
                {formatCurrency(item.subtotal)}
              </span>
            </div>

            {/* Stock info */}
            {item.stock > 0 && item.stock <= 5 && (
              <span className="text-xs text-amber-400 font-medium">
                Only {item.stock} left!
              </span>
            )}

            <button
              onClick={() => onBuyNow(item)}
              disabled={unavailable || busy}
              id={`cart-item-buy-now-${item.cartItemId}`}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
            >
              Buy Now
            </button>
          </div>
        </div>

        {/* Remove Button */}
        <div className="shrink-0 flex items-start">
          <button
            onClick={handleRemove}
            disabled={busy}
            id={`cart-item-remove-${item.cartItemId}`}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all disabled:opacity-30"
            title="Remove item"
            aria-label="Remove item from cart"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Totals Panel ────────────────────────────────────────────────────────── */
const TotalsPanel = ({ cart, onClear, clearing, onCheckout }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 sticky top-24">
      <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <ShoppingBag className="w-4 h-4 text-blue-400" />
        Order Summary
      </h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Total Products</span>
          <span className="font-semibold text-slate-200" id="cart-total-products">
            {cart.totalProducts}
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Total Quantity</span>
          <span className="font-semibold text-slate-200" id="cart-total-quantity">
            {cart.totalQuantity}
          </span>
        </div>
        <div className="border-t border-slate-700/60 pt-3 flex justify-between">
          <span className="text-slate-300 font-medium">Total Amount</span>
          <span className="text-xl font-extrabold text-white" id="cart-total-amount">
            {formatCurrency(cart.totalAmount)}
          </span>
        </div>
      </div>

      <button
        className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30 hover:scale-[1.01]"
        id="cart-checkout-btn"
        onClick={onCheckout}
        title="Buy all items in this cart"
      >
        Buy All Cart
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="mt-2.5 text-center text-xs text-slate-500">Demo / simulated payment at checkout</p>

      {/* Clear cart */}
      <button
        onClick={onClear}
        disabled={clearing}
        id="cart-clear-btn"
        className="mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-800/40 transition-all disabled:opacity-40"
      >
        <Trash2 className="w-3.5 h-3.5" />
        {clearing ? 'Clearing...' : 'Clear Cart'}
      </button>
    </div>
  );
};

/* ─── Empty State ─────────────────────────────────────────────────────────── */
const EmptyCart = () => (
  <div
    className="flex flex-col items-center justify-center py-24 gap-5 text-center"
    id="cart-empty-state"
  >
    <div className="p-6 bg-slate-800/60 rounded-3xl border border-slate-700/40">
      <PackageX className="w-16 h-16 text-slate-500" />
    </div>
    <div className="space-y-2">
      <h2 className="text-xl font-bold text-white">Your cart is empty</h2>
      <p className="text-slate-400 max-w-sm">
        Start shopping to add products to your cart.
      </p>
    </div>
    <Link
      to="/products"
      id="cart-continue-shopping-btn"
      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:scale-[1.01]"
    >
      <ShoppingCart className="w-4 h-4" />
      Continue Shopping
    </Link>
  </div>
);

/* ─── Main Cart Page ──────────────────────────────────────────────────────── */
const CartPage = () => {
  const { cart, cartItems, loading, error, updateItem, removeItem, clearCart, fetchCart } =
    useCart();
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleClearCart = async () => {
    setClearing(true);
    setClearError(null);
    setSuccessMsg(null);
    try {
      await clearCart();
      setSuccessMsg('Cart cleared successfully.');
      showToast('Cart cleared successfully.', 'success');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setClearError(err.message || 'Failed to clear cart.');
      showToast(err.message || 'Failed to clear cart.', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleBuyNow = (item) => {
    navigate('/checkout', {
      state: { productId: item.productId, quantity: item.quantity },
    });
  };
  const handleCartCheckout = () => navigate('/checkout', { state: { source: 'cart' } });

  /* Loading */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-8 w-40 bg-slate-800/60 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-800/40 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-slate-800/40 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3" id="cart-page-title">
            <ShoppingCart className="w-7 h-7 text-blue-400" />
            Your Cart
            {cart && cart.totalQuantity > 0 && (
              <span className="text-base font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-0.5 rounded-full">
                {cart.totalQuantity} item{cart.totalQuantity !== 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            All prices and totals are calculated from the server.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCart}
            id="cart-refresh-btn"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-700/60"
            title="Refresh cart from server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <Link
            to="/products"
            id="cart-continue-shopping-header-btn"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-slate-700/60"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Global error / success */}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {clearError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {clearError}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Empty State */}
      {(!cart || cartItems.length === 0) ? (
        <EmptyCart />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4" id="cart-items-list">
            {cartItems.map((item) => (
              <CartItemRow
                key={item.cartItemId}
                item={item}
                onUpdate={updateItem}
                onRemove={removeItem}
                onBuyNow={handleBuyNow}
              />
            ))}
          </div>

          {/* Totals Panel */}
          <div className="lg:col-span-1">
            <TotalsPanel cart={cart} onClear={handleClearCart} clearing={clearing} onCheckout={handleCartCheckout} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
