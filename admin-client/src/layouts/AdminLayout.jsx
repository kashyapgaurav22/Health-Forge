import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiTrendingUp, FiShoppingBag, FiBox, FiTag, FiUsers, FiLogOut, FiMenu } from 'react-icons/fi';
import toast from 'react-hot-toast';

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
  ];

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside 
        style={{ 
          width: sidebarOpen ? '250px' : '70px', 
          background: '#0f172a', 
          color: 'white',
          transition: 'width 0.3s',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50
        }}
      >
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center', borderBottom: '1px solid #1e293b' }}>
          {sidebarOpen && <h2 style={{ margin: 0, color: '#0FCEDC', fontSize: '1.2rem', whiteSpace: 'nowrap' }}>Health Forge Admin</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
            <FiMenu size={24} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {navLinks.map((link) => (
            <NavLink 
              key={link.to}
              to={link.to} 
              end={link.to === '/admin'}
              style={({ isActive }) => ({
                display: 'flex', 
                alignItems: 'center', 
                padding: '12px 20px', 
                color: isActive ? '#0FCEDC' : '#94a3b8', 
                background: isActive ? 'rgba(15, 206, 220, 0.1)' : 'transparent',
                borderRight: isActive ? '3px solid #0FCEDC' : '3px solid transparent',
                textDecoration: 'none', 
                gap: '15px',
                transition: 'all 0.2s'
              })}
            >
              <link.icon size={20} style={{ minWidth: '20px' }}/>
              {sidebarOpen && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #1e293b' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '15px', background: 'none', border: 'none', 
              color: '#ef4444', cursor: 'pointer', width: '100%', padding: '12px 0', fontSize: '1rem'
            }}
          >
            <FiLogOut size={20} style={{ minWidth: '20px' }}/>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0FCEDC', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{user.name}</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Administrator</p>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', minHeight: 'calc(100vh - 120px)' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
