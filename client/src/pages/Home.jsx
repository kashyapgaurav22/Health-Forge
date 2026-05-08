import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import { FiShield, FiTruck, FiAward, FiArrowRight } from 'react-icons/fi';
import './Home.css';

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          getProducts({ limit: 6 }),
          getCategories(),
        ]);
        setFeatured(prodRes.data.products);
        setCategories(catRes.data.categories);
      } catch (err) {
        console.error('Failed to load home data:', err);
      }
    };
    load();
  }, []);

  const categoryIcons = {
    'scalpels-blades': '🔪', 'forceps-clamps': '🔧',
    'scissors-shears': '✂️', 'sutures-needles': '🪡',
    'retractors': '🔩', 'diagnostic-instruments': '🩺',
    'ppe-disposables': '🧤',
  };

  return (
    <div className="home-page">
      <section className="hero" id="hero-section">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-text animate-fade-in-up">
            {isAuthenticated ? (
              <p className="hero-greeting" id="hero-greeting">
                Welcome back, <span className="greeting-name">Dr. {user?.name} 👋</span>
              </p>
            ) : (
              <p className="hero-greeting">Trusted by surgeons across India</p>
            )}
            <h1 className="hero-title">
              Premium Surgical
              <br />
              <span className="hero-title-accent">Instruments</span>
            </h1>
            <p className="hero-subtitle">
              Precision-crafted medical equipment for healthcare professionals.
              ISO certified, competitively priced, delivered nationwide.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg" id="hero-cta">
                Browse Products <FiArrowRight size={18} />
              </Link>
              {!isAuthenticated && (
                <Link to="/signup" className="btn btn-secondary btn-lg" id="hero-signup">
                  Create Account
                </Link>
              )}
            </div>
          </div>

          <div className="hero-stats animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Doctors</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Cities</span>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-section" id="trust-section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-card glass-card">
              <div className="trust-icon"><FiShield size={28} /></div>
              <h3>Secure Payments</h3>
              <p>Razorpay-powered checkout with bank-grade encryption</p>
            </div>
            <div className="trust-card glass-card">
              <div className="trust-icon"><FiAward size={28} /></div>
              <h3>ISO Certified</h3>
              <p>All instruments meet international quality standards</p>
            </div>
            <div className="trust-card glass-card">
              <div className="trust-icon"><FiTruck size={28} /></div>
              <h3>Pan-India Delivery</h3>
              <p>Fast shipping to hospitals and clinics nationwide</p>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="categories-section" id="categories-section">
          <div className="container">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Find the right instruments for your specialty</p>
            <div className="categories-grid stagger-children">
              {categories.map((cat) => (
                <Link
                  to={`/products?category=${cat.slug}`}
                  className="category-card glass-card"
                  key={cat.id}
                  id={`category-${cat.slug}`}
                >
                  <span className="category-icon">{categoryIcons[cat.slug] || '🏥'}</span>
                  <span className="category-name">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="featured-section" id="featured-section">
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Featured Products</h2>
                <p className="section-subtitle">Top picks from our catalog</p>
              </div>
              <Link to="/products" className="btn btn-secondary">
                View All <FiArrowRight size={16} />
              </Link>
            </div>
            <div className="products-grid stagger-children">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
