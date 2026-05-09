import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdAdd, MdEdit, MdDelete, MdCheck } from 'react-icons/md';
import toast from 'react-hot-toast';
import './AdminPages.css';

const ALL_PERMISSIONS = [
  { key: 'view_analytics', label: 'View Analytics', description: 'See revenue charts and platform statistics' },
  { key: 'manage_orders', label: 'Manage Orders', description: 'View and update order statuses' },
  { key: 'manage_products', label: 'Manage Products', description: 'Add, edit, delete products and bulk upload via CSV' },
  { key: 'manage_coupons', label: 'Manage Coupons', description: 'Create, edit, and delete discount codes' },
  { key: 'manage_users', label: 'Manage Users', description: 'View users and assign roles to them' },
  { key: 'manage_roles', label: 'Manage Roles', description: 'Create and edit roles with permissions (Super Admin only)' },
];

const EMPTY_FORM = { name: '', permissions: [] };

const AdminRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/roles');
      setRoles(res.data);
    } catch (err) {
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const openAddModal = () => {
    setEditRole(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditRole(role);
    setForm({ name: role.name, permissions: role.permissions || [] });
    setModalOpen(true);
  };

  const togglePermission = (key) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Role name is required');
    setSaving(true);
    try {
      if (editRole) {
        await api.put(`/admin/roles/${editRole.id}`, form);
        toast.success('Role updated!');
      } else {
        await api.post('/admin/roles', form);
        toast.success('Role created!');
      }
      setModalOpen(false);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this role? Any user assigned to it will lose permissions.')) return;
    try {
      await api.delete(`/admin/roles/${id}`);
      toast.success('Role deleted');
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3 style={{ margin: 0, color: '#1e293b' }}>Manage Roles</h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Create roles and define exactly what each role can access in the dashboard.
            </p>
          </div>
          <button onClick={openAddModal} className="admin-btn admin-btn-primary">
            <MdAdd size={20} /> Create Role
          </button>
        </div>

        {loading ? (
          <div className="admin-loading-state">Loading roles...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {roles.map(role => (
              <div key={role.id} className="role-card">
                <div className="role-card-header">
                  <div>
                    <h3 className="role-name">{role.name}</h3>
                    <span className="role-perms-count">{(role.permissions || []).length} permissions</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEditModal(role)} className="admin-btn admin-btn-outline" style={{ padding: '6px 10px' }}>
                      <MdEdit size={16} />
                    </button>
                    <button onClick={() => handleDelete(role.id)} className="admin-btn" style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none' }}>
                      <MdDelete size={16} />
                    </button>
                  </div>
                </div>
                <div className="role-perms-list">
                  {ALL_PERMISSIONS.map(p => (
                    <div key={p.key} className={`role-perm-item ${(role.permissions || []).includes(p.key) ? 'active' : 'inactive'}`}>
                      <MdCheck size={14} />
                      <span>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {roles.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                No roles created yet. Create one to get started.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Role Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="admin-modal-header">
              <h2>{editRole ? `Edit Role: ${editRole.name}` : 'Create New Role'}</h2>
              <button onClick={() => setModalOpen(false)} className="admin-modal-close">✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div className="admin-form-group" style={{ marginBottom: '24px' }}>
                <label className="admin-label">Role Name *</label>
                <input
                  className="admin-input"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Inventory Manager, Support Agent..."
                  required
                  disabled={editRole?.name === 'Admin'}
                />
                {editRole?.name === 'Admin' && (
                  <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '4px' }}>The Admin role name cannot be changed.</p>
                )}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Permissions</label>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                  Select what this role can do in the admin dashboard.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ALL_PERMISSIONS.map(perm => (
                    <label
                      key={perm.key}
                      className={`permission-toggle ${form.permissions.includes(perm.key) ? 'active' : ''}`}
                      onClick={() => togglePermission(perm.key)}
                    >
                      <div className="permission-toggle-checkbox">
                        {form.permissions.includes(perm.key) && <MdCheck size={14} />}
                      </div>
                      <div>
                        <div className="permission-label">{perm.label}</div>
                        <div className="permission-desc">{perm.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="admin-btn admin-btn-outline">Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editRole ? 'Update Role' : 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoles;
