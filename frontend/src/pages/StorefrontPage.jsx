import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Package, ShoppingCart, Tag } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';

const getImageSrc = (url) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `http://localhost:5000${url}`;
};

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const image = getImageSrc(product.imageUrl);
  const unavailable = !product.inStock;

  const addToCart = async () => {
    setBusy(true);
    try {
      await addItem(product.id, 1);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2200);
    } catch (error) {
      window.alert(error.message || 'Unable to add this product.');
    } finally {
      setBusy(false);
    }
  };

  const buyNow = () => navigate('/checkout', { state: { productId: product.id, quantity: 1 } });

  return (
    <article className="group flex min-w-0 flex-col border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md">
      <Link to={`/products/${product.slug || product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {image ? <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="flex h-full items-center justify-center"><Package className="h-12 w-12 text-slate-300" /></div>}
          {unavailable && <span className="absolute left-3 top-3 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">Out of stock</span>}
        </div>
        <div className="p-4 pb-2">
          <p className="mb-1 text-xs text-slate-500">{product.brand?.name || product.category?.name}</p>
          <h3 className="min-h-10 text-sm font-semibold leading-5 text-slate-900">{product.name}</h3>
          <p className="mt-2 text-base font-bold text-slate-950">{formatCurrency(product.price)}</p>
        </div>
      </Link>
      <div className="mt-auto grid grid-cols-2 gap-2 p-4 pt-2">
        <button type="button" disabled={unavailable || busy} onClick={addToCart} className="inline-flex items-center justify-center gap-1 border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</button>
        <button type="button" disabled={unavailable || busy} onClick={buyNow} className="bg-blue-600 px-2 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">Buy Now</button>
      </div>
      {added && <p className="px-4 pb-3 text-xs font-medium text-emerald-700">Added to cart</p>}
    </article>
  );
}

function CategoryCard({ category }) {
  const image = getImageSrc(category.imageUrl);
  return <Link to={`/products?category=${category.slug || category.id}`} className="group relative overflow-hidden border border-slate-200 bg-slate-100"><div className="aspect-[4/3]">{image ? <img src={image} alt={category.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="flex h-full items-center justify-center"><Tag className="h-8 w-8 text-slate-300" /></div>}</div><div className="absolute inset-x-0 bottom-0 bg-white/95 px-3 py-2"><p className="text-sm font-semibold text-slate-900">{category.name}</p><p className="text-xs text-slate-500">{category.productCount || 0} products</p></div></Link>;
}

export default function StorefrontPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/products'), api.get('/categories')])
      .then(([productResponse, categoryResponse]) => {
        setProducts((productResponse.data || productResponse).products || []);
        setCategories((categoryResponse.data || categoryResponse).categories || []);
      })
      .catch((requestError) => setError(requestError.message || 'Unable to load the store.'))
      .finally(() => setLoading(false));
  }, []);

  return <main className="bg-white">
    <section className="border-b border-slate-200 bg-slate-50"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8"><div><p className="text-sm font-medium text-slate-500">Shop the latest products</p><h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Buyboo</h1></div><Link to="/products" className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-blue-600 hover:text-blue-700">View all products <ArrowRight className="h-4 w-4" /></Link></div></section>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {error && <p className="mb-6 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-950">Shop by category</h2><Link to="/products" className="text-sm font-semibold text-blue-700">See all</Link></div>{loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/3] animate-pulse bg-slate-100" />)}</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{categories.map((category) => <CategoryCard key={category.id} category={category} />)}</div>}</section>
      <section className="mt-12"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-950">Popular products</h2><Link to="/products" className="text-sm font-semibold text-blue-700">See all</Link></div>{loading ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse bg-slate-100" />)}</div> : products.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{products.slice(0, 12).map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="border border-dashed border-slate-300 py-16 text-center text-slate-500">No products available right now.</div>}</section>
    </div>
  </main>;
}
