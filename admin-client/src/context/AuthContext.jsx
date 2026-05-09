import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hf_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const { data } = await getMe();
          setUser(data.user);
        } catch {
          // Token expired or invalid
          localStorage.removeItem('hf_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const loginUser = (userData, tokenValue) => {
    localStorage.setItem('hf_token', tokenValue);
    setToken(tokenValue);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('hf_token');
    setToken(null);
    setUser(null);
  };

  const permissions = user?.permissions || [];
  const hasPermission = (perm) => permissions.includes(perm);
  const isStaff = permissions.length > 0;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user,
      permissions,
      hasPermission,
      isStaff,
      login: loginUser,
      logout: logoutUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
