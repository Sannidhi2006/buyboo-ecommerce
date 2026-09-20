import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
  Layers,
} from 'lucide-react';
import api from '../../services/api';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    brandId: '',
    price: '',
    stock: '',
    description: '',
    imageUrl: '',
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      // Include inactive products for admin management
      const [prodRes, catRes, brandRes] = await Promise.all([
        api.get('/products?include_inactive=true'),
        api.get('/categories'),
        api.get('/brands'),
      ]);

      setProducts(prodRes.data?.products || []);
      setCategories(catRes.data?.categories || []);
      setBrands(brandRes.data?.brands || []);
    } catch (err) {
      setError(err.message || 'Failed to load catalog data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsOnly = async () => {
    try {
      const res = await api.get('/products?include_inactive=true');
      setProducts(res.data?.products || []);
    } catch (err) {
      setError(err.message || 'Failed to refresh product list');
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
      brandId: brands[0]?.id ? String(brands[0].id) : '',
      price: '',
      stock: '10',
      description: '',
      imageUrl: '',
      isActive: true,
    });
    setSelectedFile(null);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setForm({
      name: prod.name || '',
      categoryId: String(prod.categoryId || prod.category?.id || ''),
      brandId: String(prod.brandId || prod.brand?.id || ''),
      price: String(prod.price || ''),
      stock: String(prod.stock !== undefined ? prod.stock : ''),
      description: prod.description || '',
      imageUrl: prod.imageUrl || '',
      isActive: prod.isActive !== undefined ? prod.isActive : true,
    });
    setSelectedFile(null);
    setFormError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    if (!form.categoryId) {
      setFormError('Please select a category.');
      return;
    }
    if (!form.brandId) {
      setFormError('Please select a brand.');
      return;
    }
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) {
      setFormError('Price must be a valid positive number.');
      return;
    }
    if (form.stock === '' || isNaN(parseInt(form.stock, 10)) || parseInt(form.stock, 10) < 0) {
      setFormError('Stock must be a non-negative whole number.');
      return;
    }
    if (!form.description.trim()) {
      setFormError('Product description is required.');
      return;
    }
    if (!editingProduct && !selectedFile && !form.imageUrl.trim()) {
      setFormError('Product image is required (upload a file or provide an image URL).');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('categoryId', form.categoryId);
      formData.append('brandId', form.brandId);
      formData.append('price', parseFloat(form.price).toFixed(2));
      formData.append('stock', parseInt(form.stock, 10));
      formData.append('description', form.description.trim());
      formData.append('isActive', form.isActive);

      if (selectedFile) {
        formData.append('image', selectedFile);
      } else if (form.imageUrl) {
        formData.append('imageUrl', form.imageUrl.trim());
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        setSuccessMsg(`Product "${form.name}" updated successfully.`);
      } else {
        await api.post('/products', formData);
        setSuccessMsg(`Product "${form.name}" created successfully.`);
      }

      handleCloseModal();
      await fetchProductsOnly();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    setError('');
    try {
      await api.delete(`/products/${id}`);
      setSuccessMsg('Product deleted successfully.');
      setDeleteConfirmId(null);
      await fetchProductsOnly();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete product.');
      setDeleteConfirmId(null);
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory ? String(p.categoryId) === String(filterCategory) : true;
    const matchesBrand = filterBrand ? String(p.brandId) === String(filterBrand) : true;

    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-400" />
              Product Inventory Management
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-10">
            Create, update, monitor inventory stock levels, and control active status.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 mb-6 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Brand Filter */}
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-400 font-medium ml-2">
            Showing <span className="text-white font-bold">{filteredProducts.length}</span> of{' '}
            {products.length}
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800/50 border border-slate-700/70 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading product catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            No products found matching your current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Image</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Brand</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-sm">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-900"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80';
                        }}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white line-clamp-1">{p.name}</div>
                      <div className="text-xs font-mono text-slate-500 line-clamp-1">{p.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                        {p.category?.name || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                        {p.brand?.name || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      ₹{parseFloat(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          p.stock > 10
                            ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                            : p.stock > 0
                            ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20'
                            : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        {/* Active vs Inactive */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            p.isActive
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        {/* In Stock vs Out of Stock */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            p.inStock
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {p.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Product Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sony WH-1000XM5 Noise Cancelling Headphones"
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Brand <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={form.brandId}
                    onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Price (INR ₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 2999.00"
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Stock Quantity <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="e.g. 25"
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed technical specifications and selling points..."
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                />
              </div>

              {/* Image Input Options */}
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/60 space-y-3">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-400" />
                  Product Image (File or Direct URL)
                </div>

                <div>
                  <label className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/90 border border-dashed border-slate-600 hover:border-blue-500 rounded-xl text-xs text-slate-300 hover:text-white transition">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>{selectedFile ? selectedFile.name : 'Upload JPEG, PNG, or WebP'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="mt-1 text-xs text-rose-400 hover:underline"
                    >
                      Clear selected file
                    </button>
                  )}
                </div>

                <div className="text-center text-[11px] text-slate-500 uppercase tracking-wider">
                  — or enter image url —
                </div>

                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="prod-isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700 focus:ring-blue-500"
                />
                <label htmlFor="prod-isActive" className="text-xs font-medium text-slate-300 cursor-pointer">
                  Is Product Active (Visible on public storefront)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/80">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : editingProduct ? (
                    'Save Changes'
                  ) : (
                    'Create Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-rose-500/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="inline-flex p-3 rounded-full bg-rose-500/10 text-rose-400 mb-3">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Product?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete this product? This action will remove the product and
              any associated local image files.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
