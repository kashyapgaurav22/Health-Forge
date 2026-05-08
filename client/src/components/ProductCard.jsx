import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiPackage, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    const success = await addToCart(product.id);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } else {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <Link to={`/products/${product.id}`} className="product-card glass-card" id={`product-card-${product.id}`}>
      <div className="product-card-image">
        <img 
          src={product.image_url} 
          alt={product.name}
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" fill="%231a2332"><rect width="300" height="300"/><text x="150" y="150" text-anchor="middle" fill="%234a5568" font-size="14" font-family="sans-serif">No Image</text></svg>');
          }}
        />
        {product.category_name && (
          <span className="product-card-category badge badge-primary">
            {product.category_name}
          </span>
        )}
      </div>

      <div className="product-card-body">
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-desc">
          {product.description?.substring(0, 80)}...
        </p>

        <div className="product-card-footer">
          <div className="product-card-price">
            <span className="price-symbol">₹</span>
            <span className="price-value">{parseFloat(product.price).toLocaleString('en-IN')}</span>
          </div>

          <div className="product-card-meta">
            <span className={`stock-indicator ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
              <FiPackage size={12} />
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>
        </div>

        <button
          className={`btn btn-full product-card-btn ${added ? 'btn-success' : 'btn-primary'}`}
          onClick={handleAddToCart}
          disabled={product.stock <= 0 || added}
          id={`add-to-cart-${product.id}`}
        >
          {added ? (
            <>
              <FiCheck size={16} /> Added!
            </>
          ) : (
            <>
              <FiShoppingCart size={16} />
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </>
          )}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
