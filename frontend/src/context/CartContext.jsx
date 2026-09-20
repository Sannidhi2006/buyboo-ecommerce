import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

/**
 * CartProvider
 *
 * Provides cart state backed by the backend (MySQL via Sequelize).
 * The frontend caches the latest backend response but always reconciles
 * after mutations and on initial mount.
 *
 * Backend is the sole source of truth — localStorage is never used for cart.
 */
export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState(null);       // Full cart payload from backend
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ── Derived convenience values ────────────────────────────────────────── */
  // Total number of individual units across all cart items
  const cartCount = cart?.totalQuantity ?? 0;
  const cartItems = cart?.items ?? [];
  const totalProducts = cart?.totalProducts ?? 0;
  const totalAmount = cart?.totalAmount ?? 0;

  /* ── Fetch cart from backend ────────────────────────────────────────────── */
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/cart');
      const latestCart = res.data ?? res;
      setCart(latestCart);
      return latestCart;
    } catch (err) {
      setError(err.message || 'Failed to load cart.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /* ── Auto-fetch on login/logout ─────────────────────────────────────────── */
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
      setError(null);
    }
  }, [isAuthenticated, fetchCart]);

  /* ── Add item to cart ───────────────────────────────────────────────────── */
  const addItem = useCallback(async (productId, quantity = 1) => {
    setError(null);
    const res = await api.post('/cart/items', { productId, quantity });
    const updatedCart = res.data ?? res;
    setCart(updatedCart);
    return updatedCart;
  }, []);

  /* ── Update item quantity ───────────────────────────────────────────────── */
  const updateItem = useCallback(async (cartItemId, quantity) => {
    setError(null);
    const res = await api.put(`/cart/items/${cartItemId}`, { quantity });
    const updatedCart = res.data ?? res;
    setCart(updatedCart);
    return updatedCart;
  }, []);

  /* ── Remove single item ─────────────────────────────────────────────────── */
  const removeItem = useCallback(async (cartItemId) => {
    setError(null);
    const res = await api.delete(`/cart/items/${cartItemId}`);
    const updatedCart = res.data ?? res;
    setCart(updatedCart);
    return updatedCart;
  }, []);

  /* ── Clear entire cart ──────────────────────────────────────────────────── */
  const clearCart = useCallback(async () => {
    setError(null);
    const res = await api.delete('/cart');
    const updatedCart = res.data ?? res;
    setCart(updatedCart);
    return updatedCart;
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems,
        cartCount,
        totalProducts,
        totalAmount,
        loading,
        error,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/**
 * useCart — convenience hook
 * Must be used inside <CartProvider>.
 */
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};

export default CartContext;
