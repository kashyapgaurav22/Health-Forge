import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdAdd, MdDelete, MdToggleOn, MdToggleOff, MdLocalOffer } from 'react-icons/md';
import toast from 'react-hot-toast';
import './AdminPages.css';

const EMPTY_FORM = { code: '', discount_percentage: '', is_active: true, expires_at: '' };

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/coupons', {
        ...form,
        expires_at: form.expires_at || null,
      });
      toast.success('Coupon created!');
      setModalOpen(false);
      setForm(EMPTY_FORM);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon) => {
    try {
      await api.put(`/coupons/${coupon.id}`, { is_active: !coupon.is_active });
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
      toast.success(`Coupon ${!coupon.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon permanently?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const isExpired = (date) => date && new Date(date) < new Date();

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="admin-card" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'rgba(59,130,246,0.1)', borderRadius: '10px', color: '#3b82f6' }}>
            <MdLocalOffer size={28} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Total Coupons</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{coupons.length}</p>
          </div>
        </div>
        <div className="admin-card" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', color: '#10b981' }}>
            <MdToggleOn size={28} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Active</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{coupons.filter(c => c.is_active && !isExpired(c.expires_at)).length}</p>
          </div>
        </div>
        <div className="admin-card" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: '#ef4444' }}>
            <MdToggleOff size={28} />
          </div>
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
          <button onClick={() => setModalOpen(true)} className="admin-btn admin-btn-primary">
            <MdAdd size={20} /> Create Coupon
          </button>
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
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => {
                  const expired = isExpired(coupon.expires_at);
                  return (
                    <tr key={coupon.id}>
                      <td>
                        <span className="coupon-code-badge">{coupon.code}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#3b82f6' }}>
                          {coupon.discount_percentage}% OFF
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
                      <td style={{ color: expired ? '#ef4444' : '#64748b' }}>
                        {coupon.expires_at
                          ? new Date(coupon.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : <span style={{ color: '#94a3b8' }}>No expiry</span>}
                      </td>
                      <td style={{ color: '#64748b' }}>
                        {new Date(coupon.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleToggle(coupon)}
                            title={coupon.is_active ? 'Deactivate' : 'Activate'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: coupon.is_active ? '#10b981' : '#94a3b8' }}
                          >
                            {coupon.is_active ? <MdToggleOn size={28} /> : <MdToggleOff size={28} />}
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="admin-btn"
                            style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none' }}
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {coupons.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No coupons yet. Create one!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="admin-modal-header">
              <h2>Create Coupon</h2>
              <button onClick={() => setModalOpen(false)} className="admin-modal-close">✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '24px' }}>
              <div className="admin-form-grid">
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Coupon Code *</label>
                  <input
                    className="admin-input"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SUMMER25"
                    required
                    style={{ fontFamily: 'monospace', letterSpacing: '2px', fontSize: '1.1rem', textTransform: 'uppercase' }}
                  />
                </div>
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Discount Percentage (1–100) *</label>
                  <input
                    className="admin-input"
                    type="number"
                    min="1"
                    max="100"
                    value={form.discount_percentage}
                    onChange={e => setForm({ ...form, discount_percentage: e.target.value })}
                    placeholder="e.g. 15"
                    required
                  />
                </div>
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Expiry Date (Optional)</label>
                  <input
                    className="admin-input"
                    type="date"
                    value={form.expires_at}
                    onChange={e => setForm({ ...form, expires_at: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="permission-toggle" style={{ cursor: 'pointer' }} onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
                    <div className={`permission-toggle-checkbox ${form.is_active ? 'checked' : ''}`}>
                      {form.is_active && <span>✓</span>}
                    </div>
                    <div>
                      <div className="permission-label">Activate immediately</div>
                      <div className="permission-desc">Coupon will be usable right away at checkout</div>
                    </div>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="admin-btn admin-btn-outline">Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Coupon'}
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
