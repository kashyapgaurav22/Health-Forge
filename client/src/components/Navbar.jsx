import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiShoppingCart, FiLogOut, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" id="navbar-brand">
          <span className="brand-icon">⚕️</span>
          <span className="brand-text">Health<span className="brand-accent">Forge</span></span>
        </Link>

        <button 
          className="navbar-toggle" 
          onClick={() => setMobileOpen(!mobileOpen)}
          id="navbar-toggle"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" id="nav-home" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link to="/products" className="nav-link" id="nav-products" onClick={() => setMobileOpen(false)}>Products</Link>

          {isAuthenticated ? (
            <>
              <Link to="/cart" className="nav-link cart-link" id="nav-cart" onClick={() => setMobileOpen(false)}>
                <FiShoppingCart size={20} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <div className="nav-user" id="nav-user-info">
                <FiUser size={16} />
                <span className="nav-greeting">Dr. {user?.name?.split(' ')[0]}</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout} id="nav-logout">
                <FiLogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <div className="nav-auth-buttons">
              <Link to="/login" className="btn btn-secondary btn-sm" id="nav-login" onClick={() => setMobileOpen(false)}>
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm" id="nav-signup" onClick={() => setMobileOpen(false)}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
