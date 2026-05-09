import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminOrders from './pages/AdminOrders';
import AdminProducts from './pages/AdminProducts';
import AdminRoles from './pages/AdminRoles';
import AdminCoupons from './pages/AdminCoupons';
import AdminUsers from './pages/AdminUsers';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1F2937',
              color: '#F9FAFB',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '0.9rem',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#1F2937' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#1F2937' } },
          }}
        />
        <Routes>
          {/* Admin Login */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} /> {/* Admins shouldn't really signup here, redirect to login */}

          {/* Admin Routes */}
          <Route path="/" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminAnalytics />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="roles" element={<AdminRoles />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="users" element={<AdminUsers />} />
              {/* Backward compatibility with /admin prefix if needed, but here / is the root */}
              <Route path="admin/*" element={<AdminAnalytics />} /> 
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
