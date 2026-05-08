import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import Loader from '../components/Loader';
import { FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import './Cart.css';

const Cart = () => {
  const { items, loading, cartTotal } = useCart();

  if (loading) return <Loader />;

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title animate-fade-in-up">Your Cart</h1>

        {items.length === 0 ? (
          <div className="empty-state animate-scale-in">
            <span className="empty-icon">🛒</span>
            <h3>Your cart is empty</h3>
            <p>Browse our products and add instruments to your cart</p>
            <Link to="/products" className="btn btn-primary" id="empty-cart-shop">
              <FiShoppingBag size={18} /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="cart-layout animate-fade-in-up">
            <div className="cart-items-list">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            <div className="cart-summary glass-card">
              <h3 className="summary-title">Order Summary</h3>
              <div className="summary-row">
                <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="free-shipping">FREE</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <Link to="/checkout" className="btn btn-primary btn-full btn-lg" id="proceed-checkout">
                Proceed to Checkout <FiArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
