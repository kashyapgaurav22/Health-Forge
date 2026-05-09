import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdEdit, MdPerson } from 'react-icons/md';
import toast from 'react-hot-toast';
import './AdminPages.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assignModal, setAssignModal] = useState(null); // { userId, currentRoleId }
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/roles'),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAssignModal = (user) => {
    setAssignModal(user);
    setSelectedRoleId(user.role_id || '');
  };

  const handleAssignRole = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${assignModal.id}/role`, {
        role_id: selectedRoleId || null,
      });
      toast.success('Role assigned!');
      setAssignModal(null);
      fetchData();
    } catch {
      toast.error('Failed to assign role');
    } finally {
      setSaving(false);
    }
  };

  const getRoleName = (roleId) => {
    if (!roleId) return null;
    const role = roles.find(r => r.id === roleId);
    return role?.name;
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="admin-input"
              style={{ minWidth: '300px' }}
            />
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{filteredUsers.length} users</span>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">Loading users...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Admin Role</th>
                  <th>Assign Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const roleName = getRoleName(user.role_id);
                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500 }}>{user.name}</span>
                        </div>
                      </td>
                      <td style={{ color: '#64748b' }}>{user.email}</td>
                      <td style={{ color: '#64748b' }}>
                        {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        {roleName ? (
                          <span className="status-pill" style={{ background: '#dbeafe', color: '#2563eb' }}>{roleName}</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Regular User</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => openAssignModal(user)}
                          className="admin-btn admin-btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          <MdEdit size={16} /> Assign
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Role Modal */}
      {assignModal && (
        <div className="admin-modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="admin-modal-header">
              <h2>Assign Role</h2>
              <button onClick={() => setAssignModal(null)} className="admin-modal-close">✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                  {assignModal.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{assignModal.name}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{assignModal.email}</p>
                </div>
              </div>

              <div className="admin-form-group" style={{ marginBottom: '24px' }}>
                <label className="admin-label">Select Admin Role</label>
                <select
                  className="admin-input"
                  value={selectedRoleId}
                  onChange={e => setSelectedRoleId(e.target.value)}
                >
                  <option value="">— Regular User (No admin access) —</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
                  Assigning a role gives this user access to the admin dashboard based on role permissions.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setAssignModal(null)} className="admin-btn admin-btn-outline">Cancel</button>
                <button onClick={handleAssignRole} className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Assign Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
