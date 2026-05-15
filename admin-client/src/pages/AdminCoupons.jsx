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
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(15,206,220,0.12)', color: '#0FCEDC' }}><MdLocalOffer size={26} /></div>
          <div>
            <p className="admin-stat-label">Total Coupons</p>
            <p className="admin-stat-value">{coupons.length}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}><MdToggleOn size={26} /></div>
          <div>
            <p className="admin-stat-label">Active</p>
            <p className="admin-stat-value">{coupons.filter(c => c.is_active && !isExpired(c.expires_at)).length}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}><MdToggleOff size={26} /></div>
          <div>
            <p className="admin-stat-label">Inactive / Expired</p>
            <p className="admin-stat-value">{coupons.filter(c => !c.is_active || isExpired(c.expires_at)).length}</p>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>All Coupons</h3>
          <button onClick={openCreate} className="admin-btn admin-btn-primary"><MdAdd size={20} /> Create Coupon</button>
        </div>

        {loading ? (
          <div className="admin-loading-state">Loading coupons...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr><th>Code</th><th>Discount</th><th>Max Discount</th><th>Min Order</th><th>Uses</th><th>Status</th><th>Expires</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {paginatedCoupons.map(coupon => {
                  const expired = isExpired(coupon.expires_at);
                  return (
                    <tr key={coupon.id}>
                      <td><span className="coupon-code-badge">{coupon.code}</span></td>
                      <td><span className="font-bold text-accent" style={{ fontSize: '0.95rem' }}>{coupon.discount_percentage}% OFF</span></td>
                      <td className="text-muted">
                        {coupon.max_discount_amount ? `₹${parseFloat(coupon.max_discount_amount).toLocaleString()}` : <span className="text-muted" style={{ opacity: 0.5 }}>No cap</span>}
                      </td>
                      <td className="text-muted">
                        {parseFloat(coupon.min_order_amount) > 0 ? `₹${parseFloat(coupon.min_order_amount).toLocaleString()}` : <span style={{ opacity: 0.5 }}>None</span>}
                      </td>
                      <td className="text-muted">{coupon.usage_count || 0}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}</td>
                      <td>
                        {expired ? (
                          <span className="status-pill" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>Expired</span>
                        ) : coupon.is_active ? (
                          <span className="status-pill" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>Active</span>
                        ) : (
                          <span className="status-pill" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>Inactive</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: expired ? '#f87171' : 'var(--text-muted)' }}>
                        {coupon.expires_at
                          ? new Date(coupon.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : <span className="text-muted" style={{ opacity: 0.5 }}>No expiry</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button onClick={() => openEdit(coupon)} className="admin-btn admin-btn-outline" style={{ padding: '5px 10px' }}><MdEdit size={16} /></button>
                          <button onClick={() => handleToggle(coupon)} title={coupon.is_active ? 'Deactivate' : 'Activate'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: coupon.is_active ? '#34d399' : 'var(--text-muted)' }}>
                            {coupon.is_active ? <MdToggleOn size={26} /> : <MdToggleOff size={26} />}
                          </button>
                          <button onClick={() => handleDelete(coupon.id)} className="admin-btn admin-btn-danger" style={{ padding: '5px 10px' }}><MdDelete size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {coupons.length === 0 && (
                  <tr><td colSpan="8" className="admin-loading-state">No coupons yet. Create one!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && coupons.length > 0 && (
          <Pagination currentPage={currentPage} totalItems={coupons.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
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
            <form onSubmit={handleSubmit} className="admin-modal-body">
              <div className="admin-form-grid">
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Coupon Code *</label>
                  <input className="admin-input font-mono" value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SUMMER25" required
                    style={{ letterSpacing: '2px', fontSize: '1.05rem', textTransform: 'uppercase' }} />
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
                  <p className="admin-form-hint">Cap the maximum discount amount</p>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Min Order (₹)</label>
                  <input className="admin-input" type="number" min="0" value={form.min_order_amount}
                    onChange={e => setForm({ ...form, min_order_amount: e.target.value })} placeholder="e.g. 1000" />
                  <p className="admin-form-hint">Minimum cart value to use coupon</p>
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
              <div className="admin-modal-footer">
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
