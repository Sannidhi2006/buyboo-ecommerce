import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  ShoppingBag,
  ArrowRight,
  Star,
  Zap,
  Tag,
  ChevronRight,
  Package,
  TrendingUp,
  Shield,
  Truck,
  RefreshCw,
  HeadphonesIcon,
} from 'lucide-react';

/* ─── Helper ──────────────────────────────────────────────────────────────── */
const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */
const ProductCard = ({ product }) => {
  const img = getImageSrc(product.imageUrl);
  return (
    <Link
      to={`/products/${product.slug || product.id}`}
      className="group relative bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square bg-slate-900/60 overflow-hidden">
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
          <Package className="w-12 h-12 text-slate-600" />
        </div>

        {/* Out of stock badge */}
        {product.isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-600">
              Out of Stock
            </span>
          </div>
        )}

        {/* Brand badge */}
        {product.brand?.name && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-semibold bg-blue-600/80 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
              {product.brand.name}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-1.5">
        <p className="text-[11px] text-indigo-400 font-medium uppercase tracking-wide truncate">
          {product.category?.name || 'Uncategorized'}
        </p>
        <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 group-hover:text-white transition-colors leading-snug">
          {product.name}
        </h3>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-base font-bold text-white">{formatCurrency(product.price)}</span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              product.inStock
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-700/50 text-slate-500 border border-slate-600/30'
            }`}
          >
            {product.inStock ? 'In Stock' : 'Unavailable'}
          </span>
        </div>
      </div>
    </Link>
  );
};

const CategoryCard = ({ category }) => {
  const img = getImageSrc(category.imageUrl);
  return (
    <Link
      to={`/products?category=${category.slug || category.id}`}
      className="group relative bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
    >
      <div className="aspect-video relative overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={category.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-90"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-slate-900 flex items-center justify-center">
            <Tag className="w-10 h-10 text-indigo-500/50" />
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-sm">{category.name}</h3>
          {category.productCount !== undefined && (
            <p className="text-xs text-slate-400 mt-0.5">{category.productCount} products</p>
          )}
        </div>
        {/* Arrow */}
        <div className="absolute top-3 right-3 p-1.5 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </Link>
  );
};

const FeaturePill = ({ icon: Icon, title, desc }) => (
  <div className="flex items-start gap-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="font-semibold text-slate-100 text-sm">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    </div>
  </div>
);

/* ─── Page ────────────────────────────────────────────────────────────────── */
const StorefrontPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    // Fetch featured (latest 8) products
    api
      .get('/products')
      .then((res) => {
        const all = res.data?.products || res.products || [];
        setFeaturedProducts(all.filter((p) => p.inStock).slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));

    // Fetch all categories
    api
      .get('/categories')
      .then((res) => {
        const cats = res.data?.categories || res.categories || [];
        setCategories(cats.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 right-0 w-80 h-80 bg-indigo-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium mb-6">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                India's Premium E-Commerce Platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Discover{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Premium
                </span>{' '}
                Products at Your Fingertips
              </h1>
              <p className="mt-5 text-slate-400 text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Shop from thousands of curated products across top categories and brands — all priced in ₹ for India.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:scale-[1.02]"
                  id="hero-shop-now-btn"
                >
                  <ShoppingBag className="w-4.5 h-4.5" />
                  Shop Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 text-slate-200 font-semibold rounded-xl transition-all"
                  id="hero-browse-categories-btn"
                >
                  <Tag className="w-4 h-4" />
                  Browse Categories
                </Link>
              </div>
            </div>

            {/* Right stats */}
            <div className="hidden lg:grid grid-cols-2 gap-4 flex-shrink-0">
              {[
                { icon: Package, value: `${featuredProducts.length}+`, label: 'Products' },
                { icon: Tag, value: `${categories.length}+`, label: 'Categories' },
                { icon: Star, value: '4.8★', label: 'Avg. Rating' },
                { icon: TrendingUp, value: '24/7', label: 'Support' },
              ].map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 text-center backdrop-blur-sm"
                >
                  <div className="flex justify-center mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ─────────────────────────────────────────────────── */}
      <section className="border-y border-slate-800/60 bg-slate-900/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeaturePill icon={Truck} title="Free Delivery" desc="On orders above ₹499" />
            <FeaturePill icon={Shield} title="Secure Payments" desc="100% safe & encrypted" />
            <FeaturePill icon={RefreshCw} title="Easy Returns" desc="7-day hassle-free returns" />
            <FeaturePill icon={HeadphonesIcon} title="24/7 Support" desc="Always here to help" />
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-indigo-400 text-sm font-medium mb-1">Browse By</p>
              <h2 className="text-2xl font-bold text-white">Shop Categories</h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              id="view-all-categories-link"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingCats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-video rounded-2xl bg-slate-800/40 animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No categories available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Featured Products ──────────────────────────────────────────────── */}
      <section className="py-14 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-blue-400 text-sm font-medium mb-1">Hand-Picked</p>
              <h2 className="text-2xl font-bold text-white">Featured Products</h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              id="view-all-products-link"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-slate-800/40 animate-pulse">
                  <div className="aspect-square" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-slate-700/60 rounded w-1/2" />
                    <div className="h-4 bg-slate-700/60 rounded w-3/4" />
                    <div className="h-4 bg-slate-700/60 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No products available yet.</p>
              <p className="text-sm mt-1">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* CTA */}
          {featuredProducts.length > 0 && (
            <div className="text-center mt-10">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-blue-500/40 text-slate-200 hover:text-white font-semibold rounded-xl transition-all"
                id="storefront-browse-all-btn"
              >
                Browse All Products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="py-14 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-violet-900/60 border border-blue-700/30 p-10 text-center">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                Start Shopping with ApexStore India
              </h2>
              <p className="text-slate-300 mb-6 max-w-md mx-auto">
                Join thousands of happy customers. Sign up today and explore our full catalog.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30"
                  id="storefront-cta-register-btn"
                >
                  Create Account
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all"
                  id="storefront-cta-shop-btn"
                >
                  Shop Without Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StorefrontPage;
