import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  Search,
  X,
  ChevronDown,
  Package,
  SlidersHorizontal,
  ArrowUpDown,
  Grid3X3,
  LayoutList,
  Tag,
  Star,
} from 'lucide-react';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A–Z' },
  { value: 'name_desc', label: 'Name: Z–A' },
];

const sortProducts = (products, sortBy) => {
  const sorted = [...products];
  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    case 'price_desc':
      return sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    default: // newest — API already orders by createdAt DESC
      return sorted;
  }
};

/* ─── Product Card ────────────────────────────────────────────────────────── */
const ProductCard = ({ product, layout }) => {
  const img = getImageSrc(product.imageUrl);
  const isGrid = layout === 'grid';

  return (
    <Link
      to={`/products/${product.slug || product.id}`}
      id={`product-card-${product.id}`}
      className={`group bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 ${
        isGrid ? 'flex flex-col' : 'flex flex-row items-stretch'
      }`}
    >
      {/* Image */}
      <div
        className={`relative bg-slate-900/60 overflow-hidden shrink-0 ${
          isGrid ? 'aspect-square w-full' : 'w-36 sm:w-48 aspect-square'
        }`}
      >
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

        {!product.inStock && (
          <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-600">
              Out of Stock
            </span>
          </div>
        )}

        {product.brand?.name && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-semibold bg-blue-600/80 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              {product.brand.name}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={`p-4 flex flex-col flex-1 gap-1 ${!isGrid ? 'justify-center' : ''}`}>
        <p className="text-[10px] text-indigo-400 font-medium uppercase tracking-wide truncate">
          {product.category?.name || 'Uncategorized'}
        </p>
        <h3 className={`font-semibold text-slate-100 group-hover:text-white transition-colors leading-snug ${isGrid ? 'text-sm line-clamp-2' : 'text-sm sm:text-base line-clamp-1'}`}>
          {product.name}
        </h3>

        {!isGrid && product.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{product.description}</p>
        )}

        <div className={`flex items-center justify-between ${isGrid ? 'mt-auto pt-3' : 'mt-2'}`}>
          <span className="text-base font-bold text-white">{formatCurrency(product.price)}</span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              product.inStock
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-700/50 text-slate-500 border border-slate-600/30'
            }`}
          >
            {product.inStock ? `${product.stock} left` : 'N/A'}
          </span>
        </div>
      </div>
    </Link>
  );
};

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="rounded-2xl bg-slate-800/40 animate-pulse overflow-hidden">
    <div className="aspect-square bg-slate-700/30" />
    <div className="p-4 space-y-2">
      <div className="h-2.5 bg-slate-700/40 rounded w-1/3" />
      <div className="h-4 bg-slate-700/40 rounded w-2/3" />
      <div className="h-3 bg-slate-700/40 rounded w-1/2" />
    </div>
  </div>
);

/* ─── Filter Chip ─────────────────────────────────────────────────────────── */
const FilterChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-medium">
    {label}
    <button onClick={onRemove} className="hover:text-white transition-colors">
      <X className="w-3 h-3" />
    </button>
  </span>
);

/* ─── Select Dropdown ─────────────────────────────────────────────────────── */
const SelectFilter = ({ id, value, onChange, options, placeholder, icon: Icon }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <Icon className="w-4 h-4" />
      </div>
    )}
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none w-full bg-slate-800/60 border border-slate-700/60 text-slate-200 text-sm rounded-xl pr-8 py-2.5 focus:outline-none focus:border-blue-500/60 transition-colors ${Icon ? 'pl-9' : 'pl-3'}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
  </div>
);

/* ─── Page ────────────────────────────────────────────────────────────────── */
const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state — read from URL params initially
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [layout, setLayout] = useState('grid'); // 'grid' | 'list'

  // Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  const searchTimerRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(searchTimerRef.current);
  }, [search]);

  // Fetch categories & brands once
  useEffect(() => {
    api
      .get('/categories')
      .then((res) => {
        const cats = res.data?.categories || res.categories || [];
        setCategories(cats.map((c) => ({ value: c.slug || String(c.id), label: c.name })));
      })
      .catch(() => {});

    api
      .get('/brands')
      .then((res) => {
        const br = res.data?.brands || res.brands || [];
        setBrands(br.map((b) => ({ value: b.slug || String(b.id), label: b.name })));
      })
      .catch(() => {});
  }, []);

  // Fetch products whenever filters change
  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = {};
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (selectedCategory) params.category = selectedCategory;
    if (selectedBrand) params.brand = selectedBrand;

    api
      .get('/products', { params })
      .then((res) => {
        const all = res.data?.products || [];
        setProducts(all);
      })
      .catch((err) => setError(err.message || 'Failed to load products'))
      .finally(() => setLoading(false));

    // Sync URL params
    const newParams = {};
    if (debouncedSearch.trim()) newParams.search = debouncedSearch.trim();
    if (selectedCategory) newParams.category = selectedCategory;
    if (selectedBrand) newParams.brand = selectedBrand;
    if (sortBy !== 'newest') newParams.sort = sortBy;
    setSearchParams(newParams, { replace: true });
  }, [debouncedSearch, selectedCategory, selectedBrand, sortBy, setSearchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const sortedProducts = sortProducts(products, sortBy);

  const hasFilters = debouncedSearch || selectedCategory || selectedBrand;

  const clearAll = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setSortBy('newest');
  };

  // Active filter chips
  const activeFilters = [];
  if (debouncedSearch) activeFilters.push({ key: 'search', label: `"${debouncedSearch}"`, onRemove: () => setSearch('') });
  if (selectedCategory) {
    const cat = categories.find((c) => c.value === selectedCategory);
    activeFilters.push({ key: 'category', label: cat?.label || selectedCategory, onRemove: () => setSelectedCategory('') });
  }
  if (selectedBrand) {
    const br = brands.find((b) => b.value === selectedBrand);
    activeFilters.push({ key: 'brand', label: br?.label || selectedBrand, onRemove: () => setSelectedBrand('') });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">All Products</h1>
        <p className="text-slate-400 mt-1 text-sm">
          {!loading && `${sortedProducts.length} product${sortedProducts.length !== 1 ? 's' : ''} found`}
          {loading && 'Loading products…'}
        </p>
      </div>

      {/* ── Search + Filter Bar ──────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="products-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands, categories…"
              className="w-full bg-slate-800/60 border border-slate-700/60 text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-blue-500/60 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter toggle (mobile) */}
          <button
            id="products-toggle-filters-btn"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 text-slate-200 text-sm font-medium rounded-xl hover:border-blue-500/40 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className="w-4 h-4 bg-blue-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>

          {/* Desktop filters */}
          <div className="hidden sm:flex gap-3 flex-shrink-0">
            <div className="w-48">
              <SelectFilter
                id="products-category-filter"
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categories}
                placeholder="All Categories"
                icon={Tag}
              />
            </div>
            <div className="w-40">
              <SelectFilter
                id="products-brand-filter"
                value={selectedBrand}
                onChange={setSelectedBrand}
                options={brands}
                placeholder="All Brands"
              />
            </div>
            <div className="w-44">
              <SelectFilter
                id="products-sort-select"
                value={sortBy}
                onChange={setSortBy}
                options={SORT_OPTIONS}
                placeholder="Sort"
                icon={ArrowUpDown}
              />
            </div>
          </div>

          {/* Layout toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/60 border border-slate-700/60 rounded-xl p-1">
            <button
              id="products-grid-layout-btn"
              onClick={() => setLayout('grid')}
              className={`p-2 rounded-lg transition-colors ${layout === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              id="products-list-layout-btn"
              onClick={() => setLayout('list')}
              className={`p-2 rounded-lg transition-colors ${layout === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile expanded filters */}
        {showFilters && (
          <div className="sm:hidden flex flex-col gap-3 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <SelectFilter
              id="products-category-filter-mobile"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories}
              placeholder="All Categories"
              icon={Tag}
            />
            <SelectFilter
              id="products-brand-filter-mobile"
              value={selectedBrand}
              onChange={setSelectedBrand}
              options={brands}
              placeholder="All Brands"
            />
            <SelectFilter
              id="products-sort-select-mobile"
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              placeholder="Sort"
              icon={ArrowUpDown}
            />
          </div>
        )}

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Active:</span>
            {activeFilters.map((f) => (
              <FilterChip key={f.key} label={f.label} onRemove={f.onRemove} />
            ))}
            <button
              onClick={clearAll}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors underline underline-offset-2"
              id="products-clear-filters-btn"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Product Grid / List ──────────────────────────────────────────── */}
      {error ? (
        <div className="text-center py-20">
          <div className="inline-flex flex-col items-center gap-3 text-rose-400">
            <Package className="w-12 h-12 opacity-50" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-2 text-sm px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 transition-colors"
              id="products-retry-btn"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : loading ? (
        <div
          className={
            layout === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5'
              : 'flex flex-col gap-4'
          }
        >
          {Array.from({ length: 12 }).map((_, i) =>
            layout === 'grid' ? <SkeletonCard key={i} /> : (
              <div key={i} className="h-36 rounded-2xl bg-slate-800/40 animate-pulse" />
            )
          )}
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="text-center py-24">
          <Package className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-1">No products found</h3>
          <p className="text-slate-500 text-sm mb-6">
            {hasFilters
              ? 'Try adjusting your filters or search term.'
              : 'No products are available yet. Check back soon!'}
          </p>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="px-5 py-2.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-xl text-sm font-medium hover:bg-blue-600/30 transition-colors"
              id="products-empty-clear-btn"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            layout === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5'
              : 'flex flex-col gap-4'
          }
        >
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} layout={layout} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
