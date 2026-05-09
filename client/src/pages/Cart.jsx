import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import Loader from '../components/Loader';
import { FiShoppingBag, FiArrowRight, FiTag, FiX } from 'react-icons/fi';
import API from '../services/api';
import toast from 'react-hot-toast';
import './Cart.css';

const Cart = () => {
  const { items, loading, cartTotal } = useCart();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount_percentage }
  const [couponLoading, setCouponLoading] = useState(false);

  const discountAmount = appliedCoupon
    ? Math.round((cartTotal * appliedCoupon.discount_percentage) / 100)
    : 0;
  const finalTotal = cartTotal - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await API.post('/coupons/validate', { code: couponCode.trim() });
      setAppliedCoupon(res.data);
      toast.success(`🎉 ${res.data.message} — ${res.data.discount_percentage}% off!`);
      setCouponCode('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.success('Coupon removed');
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { coupon: appliedCoupon, discountAmount, finalTotal } });
  };

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

              {/* Coupon section */}
              <div className="coupon-section">
                {appliedCoupon ? (
                  <div className="coupon-applied">
                    <div className="coupon-applied-left">
                      <FiTag size={16} color="#16a34a" />
                      <span className="coupon-applied-code">{appliedCoupon.code}</span>
                      <span className="coupon-applied-value">({appliedCoupon.discount_percentage}% off)</span>
                    </div>
                    <button className="coupon-remove-btn" onClick={handleRemoveCoupon} title="Remove coupon">
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="coupon-input-row">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="coupon-input"
                      id="coupon-input"
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <button
                      className="coupon-apply-btn"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      id="apply-coupon-btn"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              <div className="summary-row">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>

              {appliedCoupon && (
                <div className="summary-row" style={{ color: '#16a34a' }}>
                  <span>Discount ({appliedCoupon.discount_percentage}%)</span>
                  <span style={{ fontWeight: 600 }}>−₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="summary-row">
                <span>Shipping</span>
                <span className="free-shipping">FREE</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="btn btn-primary btn-full btn-lg"
                id="proceed-checkout"
              >
                Proceed to Checkout <FiArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
