import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdEdit, MdPeople, MdAdminPanelSettings } from 'react-icons/md';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import './AdminPages.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [assignModal, setAssignModal] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get(`/admin/users?page=${page}&limit=20&sort=${sort}&order=${sortOrder}&search=${search}`),
        api.get('/admin/roles'),
      ]);
      setUsers(usersRes.data.users);
      setPagination(usersRes.data.pagination);
      setRoles(rolesRes.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(1); }, [sort, sortOrder]);

  const handleSearch = (e) => { e.preventDefault(); fetchData(1); };

  const openAssignModal = (user) => { setAssignModal(user); setSelectedRoleId(user.role_id || ''); };

  const handleAssignRole = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${assignModal.id}/role`, { role_id: selectedRoleId || null });
      toast.success('Role assigned!');
      setAssignModal(null);
      fetchData(pagination.page);
    } catch { toast.error('Failed to assign role'); }
    finally { setSaving(false); }
  };

  const totalUsers = pagination.total;
  const adminCount = users.filter(u => u.role_name).length;

  return (
    <div>
      {/* Stats Row */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(15,206,220,0.12)', color: '#0FCEDC' }}><MdPeople size={24} /></div>
          <div>
            <p className="admin-stat-label">Total Users</p>
            <p className="admin-stat-value">{totalUsers}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}><MdAdminPanelSettings size={24} /></div>
          <div>
            <p className="admin-stat-label">Staff / Admins</p>
            <p className="admin-stat-value">{adminCount}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <form onSubmit={handleSearch} className="admin-filter-bar">
            <input type="text" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)}
              className="admin-input" style={{ minWidth: '240px', width: 'auto' }} />
            <button type="submit" className="admin-btn admin-btn-outline" style={{ padding: '8px 16px' }}>Search</button>
            <select value={sort} onChange={e => setSort(e.target.value)} className="admin-input" style={{ minWidth: '140px', width: 'auto' }}>
              <option value="created_at">Sort: Joined</option>
              <option value="name">Sort: Name</option>
              <option value="total_spent">Sort: Spent</option>
              <option value="order_count">Sort: Orders</option>
            </select>
            <button type="button" onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
              className="admin-btn admin-btn-outline" style={{ padding: '8px 12px', fontSize: '0.82rem' }}>
              {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </form>
          <span className="text-muted" style={{ fontSize: '0.82rem' }}>Showing {users.length} of {pagination.total}</span>
        </div>

        {loading ? (
          <div className="admin-loading-state">Loading users...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr><th>User</th><th>Email</th><th>Joined</th><th>Orders</th><th>Total Spent</th><th>Role</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="admin-user-avatar" style={{
                          background: user.role_name ? 'rgba(167,139,250,0.15)' : 'rgba(15,206,220,0.12)',
                          color: user.role_name ? '#a78bfa' : '#0FCEDC',
                        }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.name}</span>
                      </div>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.88rem' }}>{user.email}</td>
                    <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                      {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td><span className="font-semibold text-primary">{user.order_count}</span></td>
                    <td>
                      <span className="font-semibold" style={{ color: user.total_spent > 0 ? '#34d399' : 'var(--text-muted)' }}>
                        {parseFloat(user.total_spent) > 0 ? `₹${parseFloat(user.total_spent).toLocaleString('en-IN')}` : '₹0'}
                      </span>
                    </td>
                    <td>
                      {user.role_name ? (
                        <span className="status-pill" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>{user.role_name}</span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.82rem' }}>User</span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => openAssignModal(user)} className="admin-btn admin-btn-outline"
                        style={{ padding: '5px 10px', fontSize: '0.78rem' }}>
                        <MdEdit size={14} /> Role
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="7" className="admin-loading-state">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination.total > 0 && (
          <Pagination currentPage={pagination.page} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={fetchData} />
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
            <div className="admin-modal-body">
              <div className="assign-user-card">
                <div className="admin-user-avatar" style={{ width: '44px', height: '44px', fontSize: '1.1rem', background: 'rgba(15,206,220,0.12)', color: '#0FCEDC' }}>
                  {assignModal.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{assignModal.name}</p>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.82rem' }}>{assignModal.email}</p>
                  <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
                    {assignModal.order_count} orders · ₹{parseFloat(assignModal.total_spent).toLocaleString('en-IN')} spent
                  </p>
                </div>
              </div>

              <div className="admin-form-group" style={{ marginBottom: '24px' }}>
                <label className="admin-label">Select Admin Role</label>
                <select className="admin-input" value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)}>
                  <option value="">— Regular User (No admin access) —</option>
                  {roles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                </select>
                <p className="admin-form-hint">Assigning a role gives this user access to the admin dashboard.</p>
              </div>

              <div className="admin-modal-footer">
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
