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
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
