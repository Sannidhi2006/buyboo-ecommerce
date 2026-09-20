import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  ArrowLeft,
  Package,
  Tag,
  Star,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  ChevronRight,
  AlertCircle,
  Layers,
  Hash,
  Plus,
  Minus,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

/* ─── Helper ──────────────────────────────────────────────────────────────── */
const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

/* ─── Related Product Card ────────────────────────────────────────────────── */
const RelatedCard = ({ product }) => {
  const img = getImageSrc(product.imageUrl);
  return (
    <Link
      to={`/products/${product.slug || product.id}`}
      id={`related-product-${product.id}`}
      className="group bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 flex flex-col"
    >
      <div className="aspect-square bg-slate-900/60 overflow-hidden relative">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div
          className={`${img ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center`}
          style={img ? { display: 'none' } : {}}
        >
          <Package className="w-10 h-10 text-slate-600" />
        </div>
      </div>
      <div className="p-3">
        <p className="text-[10px] text-indigo-400 font-medium truncate">{product.category?.name}</p>
        <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 mt-0.5">{product.name}</h4>
        <p className="text-sm font-bold text-white mt-1.5">{formatCurrency(product.price)}</p>
      </div>
    </Link>
  );
};

/* ─── Breadcrumb ─────────────────────────────────────────────────────────── */
const Breadcrumb = ({ category, productName }) => (
  <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 flex-wrap">
    <Link to="/" className="hover:text-slate-300 transition-colors">Home</Link>
    <ChevronRight className="w-3 h-3" />
    <Link to="/products" className="hover:text-slate-300 transition-colors">Products</Link>
    {category && (
      <>
        <ChevronRight className="w-3 h-3" />
        <Link
          to={`/products?category=${category.slug || category.id}`}
          className="hover:text-slate-300 transition-colors"
        >
          {category.name}
        </Link>
      </>
    )}
    <ChevronRight className="w-3 h-3" />
    <span className="text-slate-400 truncate max-w-xs">{productName}</span>
  </nav>
);

/* ─── Page ────────────────────────────────────────────────────────────────── */
const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState(null);
  const [cartError, setCartError] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setProduct(null);
    setRelatedProducts([]);

    api
      .get(`/products/${id}`)
      .then((res) => {
        const data = res.data || res;
        setProduct(data.product || null);
        setRelatedProducts(data.relatedProducts || []);
      })
      .catch((err) => setError(err.message || 'Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const changeQuantity = (nextQuantity) => {
    if (!product) return;
    setQuantity(Math.max(1, Math.min(nextQuantity, product.stock)));
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    setAdding(true);
    setCartError(null);
    setCartMessage(null);
    try {
      await addItem(product.id, quantity);
      setCartMessage(`${product.name} added to your cart.`);
    } catch (err) {
      setCartError(err.message || 'Unable to add this product to your cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    navigate('/checkout', { state: { productId: product.id, quantity } });
  };

  /* ── Loading Skeleton ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-4 w-48 bg-slate-800/60 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square rounded-2xl bg-slate-800/40 animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 bg-slate-800/40 rounded w-1/3 animate-pulse" />
            <div className="h-8 bg-slate-800/40 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-slate-800/40 rounded w-1/2 animate-pulse" />
            <div className="space-y-2 mt-4">
              <div className="h-3 bg-slate-800/40 rounded animate-pulse" />
              <div className="h-3 bg-slate-800/40 rounded animate-pulse" />
              <div className="h-3 bg-slate-800/40 rounded w-4/5 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error State ──────────────────────────────────────────────────────── */
  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="p-4 bg-rose-500/10 rounded-2xl">
            <AlertCircle className="w-12 h-12 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Product Not Found</h2>
          <p className="text-slate-400 max-w-sm">
            {error || "The product you're looking for doesn't exist or has been removed."}
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg hover:bg-slate-700 transition-colors"
              id="product-detail-go-back-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
              id="product-detail-browse-btn"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const img = getImageSrc(product.imageUrl);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <Breadcrumb category={product.category} productName={product.name} />

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6"
        id="product-detail-back-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* ── Main Product Section ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Left: Image */}
        <div className="relative">
          <div className="aspect-square rounded-3xl overflow-hidden bg-slate-800/60 border border-slate-700/60 shadow-2xl">
            {img ? (
              <img
                src={img}
                alt={product.name}
                id="product-detail-image"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              className={`${img ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center`}
              style={img ? { display: 'none' } : {}}
            >
              <Package className="w-24 h-24 text-slate-600" />
            </div>
          </div>

          {/* Out of stock overlay */}
          {product.isOutOfStock && (
            <div className="absolute inset-0 rounded-3xl bg-slate-900/60 flex items-center justify-center">
              <span className="bg-slate-800/90 border border-slate-600 text-slate-300 font-bold px-6 py-2.5 rounded-full text-sm">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex flex-col gap-5">
          {/* Category + Brand badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.category && (
              <Link
                to={`/products?category=${product.category.slug || product.category.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium hover:bg-indigo-500/25 transition-colors"
                id="product-detail-category-link"
              >
                <Tag className="w-3 h-3" />
                {product.category.name}
              </Link>
            )}
            {product.brand && (
              <Link
                to={`/products?brand=${product.brand.slug || product.brand.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-500/25 transition-colors"
                id="product-detail-brand-link"
              >
                <Star className="w-3 h-3" />
                {product.brand.name}
              </Link>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight" id="product-detail-name">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-white" id="product-detail-price">
              {formatCurrency(product.price)}
            </span>
            <span className="text-sm text-slate-400">incl. all taxes</span>
          </div>

          {/* Stock status */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium w-fit ${
              product.inStock
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
            id="product-detail-stock-status"
          >
            {product.inStock ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                In Stock
                <span className="text-xs font-normal text-emerald-500/70 ml-1">
                  ({product.stock} available)
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Out of Stock
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Description</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Product Info Table */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-slate-700/40">
              {product.category && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Tag className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-xs text-slate-500 w-20 shrink-0">Category</span>
                  <span className="text-sm text-slate-200 font-medium">{product.category.name}</span>
                </div>
              )}
              {product.brand && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs text-slate-500 w-20 shrink-0">Brand</span>
                  <span className="text-sm text-slate-200 font-medium">{product.brand.name}</span>
                </div>
              )}
              <div className="flex items-center gap-3 px-4 py-3">
                <Hash className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-xs text-slate-500 w-20 shrink-0">SKU / ID</span>
                <span className="text-sm text-slate-400 font-mono">{product.id}</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 w-fit bg-slate-800/60 border border-slate-700 rounded-xl p-1">
            <button onClick={() => changeQuantity(quantity - 1)} disabled={quantity <= 1 || !product.inStock} aria-label="Decrease quantity" className="p-2 text-slate-300 disabled:opacity-30"><Minus className="w-4 h-4" /></button>
            <span className="w-8 text-center font-semibold" id="product-detail-quantity">{quantity}</span>
            <button onClick={() => changeQuantity(quantity + 1)} disabled={quantity >= product.stock || !product.inStock} aria-label="Increase quantity" className="p-2 text-slate-300 disabled:opacity-30"><Plus className="w-4 h-4" /></button>
          </div>
          {cartError && <p className="text-sm text-rose-400" role="alert">{cartError}</p>}
          {cartMessage && <p className="text-sm text-emerald-400">{cartMessage}</p>}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || adding}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                product.inStock
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:scale-[1.01]'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
              id="product-detail-add-to-cart-btn"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              {adding ? 'Adding...' : product.inStock ? 'Add to Cart' : 'Unavailable'}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={!product.inStock || adding}
              id="product-detail-buy-now-btn"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white transition-all"
            >
              Buy Now
            </button>

            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors"
              id="product-detail-continue-shopping-btn"
            >
              Continue Shopping
            </Link>
          </div>

          {/* Category description */}
          {product.category?.description && (
            <div className="mt-1 text-xs text-slate-500 italic border-t border-slate-800/60 pt-3">
              <span className="font-medium text-slate-400">About this category: </span>
              {product.category.description}
            </div>
          )}
        </div>
      </div>

      {/* ── Related Products ──────────────────────────────────────────────── */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-slate-800/60 pt-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-blue-400 text-xs font-medium mb-1">You Might Also Like</p>
              <h2 className="text-xl font-bold text-white">Related Products</h2>
            </div>
            <Link
              to={`/products${product.category ? `?category=${product.category.slug || product.category.id}` : ''}`}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              id="product-detail-view-more-link"
            >
              View More →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {relatedProducts.map((p) => (
              <RelatedCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
