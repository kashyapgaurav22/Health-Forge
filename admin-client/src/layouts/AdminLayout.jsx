import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiTrendingUp, FiShoppingBag, FiBox, FiTag, FiUsers, FiLogOut, FiMenu, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../pages/AdminPages.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/login');
    }
  }, [user]);

  if (!user || user.role !== 'admin') return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const navLinks = [
    { to: '/', icon: FiTrendingUp, label: 'Analytics' },
    { to: '/orders', icon: FiShoppingBag, label: 'Orders' },
    { to: '/products', icon: FiBox, label: 'Inventory' },
    { to: '/coupons', icon: FiTag, label: 'Coupons' },
    { to: '/users', icon: FiUsers, label: 'Users' },
    { to: '/roles', icon: FiShield, label: 'Roles' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="admin-sidebar-header">
          {sidebarOpen && <h2 className="admin-sidebar-brand">Health Forge</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="admin-sidebar-toggle">
            <FiMenu size={22} />
          </button>
        </div>

        <nav className="admin-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              <link.icon size={20} />
              {sidebarOpen && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            <FiLogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-user-info">
            <div className="admin-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="admin-user-name">{user.name}</p>
              <p className="admin-user-role">Administrator</p>
            </div>
          </div>
        </header>

        <div style={{ minHeight: 'calc(100vh - 120px)' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
