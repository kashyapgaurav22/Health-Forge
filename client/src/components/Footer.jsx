import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer" id="main-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <div className="footer-brand">
              <span className="brand-icon">⚕️</span>
              <span className="brand-text">Health<span className="brand-accent">Forge</span></span>
            </div>
            <p className="footer-tagline">
              Premium surgical instruments and medical supplies for healthcare professionals. 
              Trusted by leading hospitals across India.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/cart">Cart</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Categories</h4>
            <ul className="footer-links">
              <li><Link to="/products?category=scalpels-blades">Scalpels & Blades</Link></li>
              <li><Link to="/products?category=forceps-clamps">Forceps & Clamps</Link></li>
              <li><Link to="/products?category=diagnostic-instruments">Diagnostics</Link></li>
              <li><Link to="/products?category=ppe-disposables">PPE & Disposables</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-contact">
              <li><FiMail size={14} /> support@healthforge.in</li>
              <li><FiPhone size={14} /> +91 9931758152</li>
              <li><FiMapPin size={14} /> Chandigarh </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Health Forge. All rights reserved.</p>
          <div className="footer-badges">
            <span className="trust-badge">🔒 Secure Payments</span>
            <span className="trust-badge">✅ ISO Certified</span>
            <span className="trust-badge">🚚 Pan-India Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
