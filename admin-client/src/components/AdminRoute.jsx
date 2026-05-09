import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const AdminRoute = ({ requiredPermission }) => {
  const { isAuthenticated, loading, hasPermission, isStaff } = useAuth();

  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // If a specific permission is required, check it
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  // Must be staff (have at least one admin permission)
  if (!isStaff) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column' }}>
        <h2>Access Denied 🛑</h2>
        <p>Your account does not have administrative privileges.</p>
        <button className="btn btn-primary" onClick={() => window.location.href = '/'}>Go Back</button>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminRoute;
