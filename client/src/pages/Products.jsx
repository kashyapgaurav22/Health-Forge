import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { FiSearch, FiX } from 'react-icons/fi';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await getCategories();
        setCategories(data.categories);
      } catch (err) {
        console.error(err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (activeCategory) params.category = activeCategory;
        if (search) params.search = search;
        const { data } = await getProducts(params);
        setProducts(data.products);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    const debounce = setTimeout(loadProducts, 300);
    return () => clearTimeout(debounce);
  }, [activeCategory, search]);

  const handleCategoryClick = (slug) => {
    if (slug === activeCategory) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header animate-fade-in-up">
          <h1 className="page-title">Our Products</h1>
          <p className="page-subtitle">Browse our catalog of premium surgical instruments</p>
        </div>

        <div className="products-toolbar">
          <div className="search-box" id="search-box">
            <FiSearch size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search instruments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="search-input"
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                <FiX size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="products-layout">
          <aside className="category-sidebar" id="category-sidebar">
            <h3 className="sidebar-title">Categories</h3>
            <ul className="category-list">
              <li>
                <button
                  className={`category-filter-btn ${!activeCategory ? 'active' : ''}`}
                  onClick={() => handleCategoryClick('')}
                  id="filter-all"
                >
                  All Products
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    className={`category-filter-btn ${activeCategory === cat.slug ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(cat.slug)}
                    id={`filter-${cat.slug}`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <main className="products-main">
            {loading ? (
              <Loader />
            ) : products.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="products-grid stagger-children">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;
