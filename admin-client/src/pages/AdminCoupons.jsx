import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdAdd, MdDelete, MdEdit, MdToggleOn, MdToggleOff, MdLocalOffer } from 'react-icons/md';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import './AdminPages.css';

const EMPTY_FORM = { code: '', discount_percentage: '', is_active: true, expires_at: '', max_discount_amount: '', min_order_amount: '', max_uses: '', per_user_limit: '1' };

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchCoupons = async () => {
    setLoading(true);
    try { const res = await api.get('/coupons'); setCoupons(res.data); }
    catch { toast.error('Failed to load coupons'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => { setEditCoupon(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (coupon) => {
    setEditCoupon(coupon);
    setForm({
      code: coupon.code,
      discount_percentage: coupon.discount_percentage,
      is_active: coupon.is_active,
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '',
      max_discount_amount: coupon.max_discount_amount || '',
      min_order_amount: coupon.min_order_amount || '',
      max_uses: coupon.max_uses || '',
      per_user_limit: coupon.per_user_limit || '1',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        expires_at: form.expires_at || null,
        max_discount_amount: form.max_discount_amount || null,
        min_order_amount: form.min_order_amount || 0,
        max_uses: form.max_uses || null,
        per_user_limit: form.per_user_limit || 1,
      };
      if (editCoupon) {
        await api.put(`/coupons/${editCoupon.id}`, payload);
        toast.success('Coupon updated!');
      } else {
        await api.post('/coupons', payload);
        toast.success('Coupon created!');
      }
      setModalOpen(false); setForm(EMPTY_FORM); fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    } finally { setSaving(false); }
  };

  const handleToggle = async (coupon) => {
    try {
      await api.put(`/coupons/${coupon.id}`, { is_active: !coupon.is_active });
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
      toast.success(`Coupon ${!coupon.is_active ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update coupon'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon permanently?')) return;
    try { await api.delete(`/coupons/${id}`); toast.success('Coupon deleted'); fetchCoupons(); }
    catch { toast.error('Failed to delete coupon'); }
  };

  const isExpired = (date) => date && new Date(date) < new Date();

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCoupons = coupons.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="admin-card" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'rgba(59,130,246,0.1)', borderRadius: '10px', color: '#3b82f6' }}><MdLocalOffer size={28} /></div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Total Coupons</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{coupons.length}</p>
          </div>
        </div>
        <div className="admin-card" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', color: '#10b981' }}><MdToggleOn size={28} /></div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Active</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{coupons.filter(c => c.is_active && !isExpired(c.expires_at)).length}</p>
          </div>
        </div>
        <div className="admin-card" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: '#ef4444' }}><MdToggleOff size={28} /></div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Inactive / Expired</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{coupons.filter(c => !c.is_active || isExpired(c.expires_at)).length}</p>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 style={{ margin: 0, color: '#1e293b' }}>All Coupons</h3>
          <button onClick={openCreate} className="admin-btn admin-btn-primary"><MdAdd size={20} /> Create Coupon</button>
        </div>

        {loading ? (
          <div className="admin-loading-state">Loading coupons...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Max Discount</th>
                  <th>Min Order</th>
                  <th>Uses</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCoupons.map(coupon => {
                  const expired = isExpired(coupon.expires_at);
                  return (
                    <tr key={coupon.id}>
                      <td><span className="coupon-code-badge">{coupon.code}</span></td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#3b82f6' }}>
                          {coupon.discount_percentage}% OFF
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>
                        {coupon.max_discount_amount ? `₹${parseFloat(coupon.max_discount_amount).toLocaleString()}` : <span style={{ color: '#cbd5e1' }}>No cap</span>}
                      </td>
                      <td style={{ color: '#64748b' }}>
                        {parseFloat(coupon.min_order_amount) > 0 ? `₹${parseFloat(coupon.min_order_amount).toLocaleString()}` : <span style={{ color: '#cbd5e1' }}>None</span>}
                      </td>
                      <td>
                        <span style={{ color: '#64748b' }}>
                          {coupon.usage_count || 0}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
                        </span>
                      </td>
                      <td>
                        {expired ? (
                          <span className="status-pill" style={{ background: '#fee2e2', color: '#dc2626' }}>Expired</span>
                        ) : coupon.is_active ? (
                          <span className="status-pill" style={{ background: '#d1fae5', color: '#059669' }}>Active</span>
                        ) : (
                          <span className="status-pill" style={{ background: '#f1f5f9', color: '#64748b' }}>Inactive</span>
                        )}
                      </td>
                      <td style={{ color: expired ? '#ef4444' : '#64748b', fontSize: '0.85rem' }}>
                        {coupon.expires_at
                          ? new Date(coupon.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : <span style={{ color: '#94a3b8' }}>No expiry</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button onClick={() => openEdit(coupon)} className="admin-btn admin-btn-outline" style={{ padding: '5px 10px' }}>
                            <MdEdit size={16} />
                          </button>
                          <button onClick={() => handleToggle(coupon)} title={coupon.is_active ? 'Deactivate' : 'Activate'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: coupon.is_active ? '#10b981' : '#94a3b8' }}>
                            {coupon.is_active ? <MdToggleOn size={26} /> : <MdToggleOff size={26} />}
                          </button>
                          <button onClick={() => handleDelete(coupon.id)} className="admin-btn"
                            style={{ padding: '5px 10px', background: '#fee2e2', color: '#dc2626', border: 'none' }}>
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {coupons.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No coupons yet. Create one!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && coupons.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={coupons.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="admin-modal-header">
              <h2>{editCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button onClick={() => setModalOpen(false)} className="admin-modal-close">✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div className="admin-form-grid">
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Coupon Code *</label>
                  <input className="admin-input" value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SUMMER25" required
                    style={{ fontFamily: 'monospace', letterSpacing: '2px', fontSize: '1.1rem', textTransform: 'uppercase' }} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Discount % *</label>
                  <input className="admin-input" type="number" min="1" max="100" value={form.discount_percentage}
                    onChange={e => setForm({ ...form, discount_percentage: e.target.value })} placeholder="e.g. 15" required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Max Discount (₹)</label>
                  <input className="admin-input" type="number" min="0" value={form.max_discount_amount}
                    onChange={e => setForm({ ...form, max_discount_amount: e.target.value })} placeholder="e.g. 500" />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0' }}>Cap the maximum discount amount</p>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Min Order (₹)</label>
                  <input className="admin-input" type="number" min="0" value={form.min_order_amount}
                    onChange={e => setForm({ ...form, min_order_amount: e.target.value })} placeholder="e.g. 1000" />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0' }}>Minimum cart value to use coupon</p>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Total Max Uses</label>
                  <input className="admin-input" type="number" min="1" value={form.max_uses}
                    onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Per User Limit</label>
                  <input className="admin-input" type="number" min="1" value={form.per_user_limit}
                    onChange={e => setForm({ ...form, per_user_limit: e.target.value })} placeholder="1" />
                </div>
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Expiry Date</label>
                  <input className="admin-input" type="date" value={form.expires_at}
                    onChange={e => setForm({ ...form, expires_at: e.target.value })} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="permission-toggle" style={{ cursor: 'pointer' }} onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
                    <div className={`permission-toggle-checkbox ${form.is_active ? 'checked' : ''}`}>
                      {form.is_active && <span>✓</span>}
                    </div>
                    <div>
                      <div className="permission-label">Active</div>
                      <div className="permission-desc">Coupon is usable at checkout</div>
                    </div>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="admin-btn admin-btn-outline">Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editCoupon ? 'Update Coupon' : 'Create Coupon')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
