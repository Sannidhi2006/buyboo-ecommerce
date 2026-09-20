import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
} from 'lucide-react';
import api from '../../services/api';

const AdminBrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', logoUrl: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/brands');
      setBrands(res.data?.brands || []);
    } catch (err) {
      setError(err.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingBrand(null);
    setForm({ name: '', description: '', logoUrl: '' });
    setSelectedFile(null);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (brand) => {
    setEditingBrand(brand);
    setForm({
      name: brand.name || '',
      description: brand.description || '',
      logoUrl: brand.logoUrl || '',
    });
    setSelectedFile(null);
    setFormError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingBrand(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Brand name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('description', form.description.trim());

      if (selectedFile) {
        formData.append('logo', selectedFile);
      } else if (form.logoUrl) {
        formData.append('logoUrl', form.logoUrl.trim());
      }

      if (editingBrand) {
        await api.put(`/brands/${editingBrand.id}`, formData);
        setSuccessMsg(`Brand "${form.name}" updated successfully.`);
      } else {
        await api.post('/brands', formData);
        setSuccessMsg(`Brand "${form.name}" created successfully.`);
      }

      handleCloseModal();
      await fetchBrands();
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
      await api.delete(`/brands/${id}`);
      setSuccessMsg('Brand deleted successfully.');
      setDeleteConfirmId(null);
      await fetchBrands();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete brand.');
      setDeleteConfirmId(null);
    } finally {
      setDeleting(false);
    }
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
      {/* Top Header */}
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
              <Tag className="w-6 h-6 text-emerald-400" />
              Brand Management
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-10">
            Manage manufacturer labels, designer brands, and authorized suppliers.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add Brand
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

      {/* Search & Stats Bar */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 mb-6 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Total Brands: <span className="text-white font-bold">{brands.length}</span>
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-slate-800/50 border border-slate-700/70 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading brands...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            No brands found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Logo</th>
                  <th className="py-3.5 px-4">Brand</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Products</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-sm">
                {filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-900"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=150&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                          <Tag className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{brand.name}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs px-2 py-1 bg-slate-900/80 rounded-md border border-slate-700/60 text-emerald-300">
                        {brand.slug}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {brand.description || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {brand.productCount ?? 0} item(s)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(brand)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                          title="Edit Brand"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(brand.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
                          title="Delete Brand"
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

      {/* Add / Edit Brand Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                {editingBrand ? 'Edit Brand' : 'Create New Brand'}
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
                  Brand Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sony, Nike, Apple"
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brand overview, origin, and design focus..."
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Upload Brand Logo
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/80 border border-dashed border-slate-600 hover:border-blue-500 rounded-xl text-xs text-slate-300 hover:text-white transition">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>{selectedFile ? selectedFile.name : 'Choose JPEG, PNG, or WebP'}</span>
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
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Or Direct Logo URL
                </label>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/80">
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
                  ) : editingBrand ? (
                    'Save Changes'
                  ) : (
                    'Create Brand'
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
            <h3 className="text-lg font-bold text-white mb-2">Delete Brand?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete this brand? If any products reference it, deletion
              will be safely blocked.
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

export default AdminBrandsPage;
