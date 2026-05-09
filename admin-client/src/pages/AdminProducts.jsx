import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { MdAdd, MdEdit, MdDelete, MdUploadFile, MdDownload } from 'react-icons/md';
import toast from 'react-hot-toast';
import './AdminPages.css';

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', category_slug: '', image_url: '' };

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const csvRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories'),
      ]);
      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data.categories);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAddModal = () => {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_slug: product.category_slug || '',
      image_url: product.image_url || '',
    });
    setImagePreview(product.image_url || '');
    setImageFile(null);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('stock', form.stock);
      formData.append('category_slug', form.category_slug);
      if (imageFile) {
        formData.append('image', imageFile);
      } else {
        formData.append('image_url', form.image_url);
      }

      if (editProduct) {
        await api.put(`/admin/products/${editProduct.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product updated!');
      } else {
        await api.post('/admin/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product created!');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product deleted!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete product');
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return toast.error('Please select a CSV file');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await api.post('/admin/products/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Bulk upload done! ${res.data.successCount} added, ${res.data.failCount} failed.`);
      setCsvFile(null);
      csvRef.current.value = '';
      fetchData();
    } catch (err) {
      toast.error('CSV upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const header = 'name,description,price,image_url,category_slug,stock\n';
    const sample = 'Sample Scalpel,A very sharp scalpel,499.00,https://example.com/img.jpg,scalpels-blades,100\n';
    const blob = new Blob([header + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    a.click();
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Bulk Upload Card */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header" style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Bulk CSV Upload</h3>
          <button onClick={downloadCsvTemplate} className="admin-btn admin-btn-outline">
            <MdDownload size={18} /> Download Template
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label className="csv-upload-label">
            <MdUploadFile size={20} />
            {csvFile ? csvFile.name : 'Choose CSV File'}
            <input ref={csvRef} type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} style={{ display: 'none' }} />
          </label>
          <button
            onClick={handleCsvUpload}
            className="admin-btn admin-btn-primary"
            disabled={!csvFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Products'}
          </button>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            CSV columns: name, description, price, image_url, category_slug, stock
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-input"
            style={{ minWidth: '280px' }}
          />
          <button onClick={openAddModal} className="admin-btn admin-btn-primary">
            <MdAdd size={20} /> Add Product
          </button>
        </div>

        {loading ? (
          <div className="admin-loading-state">Loading products...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td>
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={e => { e.target.src = 'https://via.placeholder.com/50x50?text=No+Img'; }}
                      />
                    </td>
                    <td style={{ fontWeight: 500, maxWidth: '220px' }}>{product.name}</td>
                    <td>
                      <span className="category-badge">{product.category_name || '—'}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(product.price).toLocaleString()}</td>
                    <td>
                      <span style={{ color: product.stock < 10 ? '#ef4444' : '#059669', fontWeight: 600 }}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEditModal(product)} className="admin-btn admin-btn-outline" style={{ padding: '6px 10px' }}>
                          <MdEdit size={16} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="admin-btn" style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none' }}>
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="admin-modal-header">
              <h2>{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setModalOpen(false)} className="admin-modal-close">✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div className="admin-form-grid">
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Product Name *</label>
                  <input className="admin-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Description</label>
                  <textarea className="admin-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ resize: 'vertical' }} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Price (₹) *</label>
                  <input className="admin-input" type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Stock *</label>
                  <input className="admin-input" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
                </div>
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Category *</label>
                  <select className="admin-input" value={form.category_slug} onChange={e => setForm({...form, category_slug: e.target.value})} required>
                    <option value="">Select a category</option>
                    {categories.map(c => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Product Image</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <label className="csv-upload-label" style={{ marginBottom: '8px' }}>
                        <MdUploadFile size={20} />
                        {imageFile ? imageFile.name : 'Upload Image (Cloudinary)'}
                        <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                      </label>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0' }}>Or paste an image URL below</p>
                      <input
                        className="admin-input"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={form.image_url}
                        onChange={e => setForm({...form, image_url: e.target.value})}
                        style={{ marginTop: '8px' }}
                      />
                    </div>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="admin-btn admin-btn-outline">Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={uploading}>
                  {uploading ? 'Saving...' : (editProduct ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
