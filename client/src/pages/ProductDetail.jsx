import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiPackage, FiArrowLeft, FiMinus, FiPlus, FiCheck } from 'react-icons/fi';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getProduct(id);
        setProduct(data.product);
      } catch (err) {
        toast.error('Product not found');
        navigate('/products');
      }
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    setAdding(true);
    const success = await addToCart(product.id, quantity);
    setAdding(false);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } else {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) return <Loader />;
  if (!product) return null;

  return (
    <div className="product-detail-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)} id="back-btn">
          <FiArrowLeft size={18} /> Back
        </button>

        <div className="product-detail animate-fade-in-up">
          <div className="product-detail-image">
            <img
              src={product.image_url}
              alt={product.name}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" fill="%231a2332"><rect width="500" height="500"/><text x="250" y="250" text-anchor="middle" fill="%234a5568" font-size="16" font-family="sans-serif">No Image</text></svg>');
              }}
            />
          </div>

          <div className="product-detail-info">
            {product.category_name && (
              <span className="badge badge-primary">{product.category_name}</span>
            )}
            <h1 className="detail-title">{product.name}</h1>
            <div className="detail-price">
              <span className="price-symbol">₹</span>
              <span className="price-value">{parseFloat(product.price).toLocaleString('en-IN')}</span>
            </div>

            <div className={`detail-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
              <FiPackage size={16} />
              {product.stock > 0 ? `${product.stock} units in stock` : 'Out of stock'}
            </div>

            <p className="detail-description">{product.description}</p>

            {product.stock > 0 && (
              <div className="detail-actions">
                <div className="quantity-control">
                  <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} id="detail-qty-minus">
                    <FiMinus size={16} />
                  </button>
                  <span className="qty-value">{quantity}</span>
                  <button className="qty-btn" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} id="detail-qty-plus">
                    <FiPlus size={16} />
                  </button>
                </div>

                <button 
                  className={`btn btn-lg ${added ? 'btn-success' : 'btn-primary'}`} 
                  onClick={handleAddToCart} 
                  disabled={adding || added} 
                  id="detail-add-to-cart"
                >
                  {added ? (
                    <>
                      <FiCheck size={18} /> Added to Cart
                    </>
                  ) : (
                    <>
                      <FiShoppingCart size={18} />
                      {adding ? 'Adding...' : 'Add to Cart'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
