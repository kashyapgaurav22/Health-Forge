import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, verifyPayment, createManualOrder } from '../services/api';
import toast from 'react-hot-toast';
import { FiLock, FiCreditCard } from 'react-icons/fi';
import './Checkout.css';

const Checkout = () => {
  const { items, cartTotal, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');

  const gstAmount = Math.round(cartTotal * 0.18);
  const finalTotal = cartTotal + gstAmount;

  const isOnlineAllowed = finalTotal < 100000;
  const isManualAllowed = finalTotal >= 20000;

  useEffect(() => {
    if (finalTotal >= 100000) {
      setPaymentMethod('manual');
    } else if (finalTotal < 20000) {
      setPaymentMethod('online');
    } else {
      setPaymentMethod('manual'); // Bank transfer preferred for 20k-1L
    }
  }, [finalTotal]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setProcessing(true);

    if (paymentMethod === 'manual') {
      try {
        const { data } = await createManualOrder();
        await refreshCart();
        toast.success('Order placed successfully!');
        navigate('/order-success', {
          state: { paymentMethod: 'manual', orderId: data.db_order_id }
        });
      } catch (err) {
        console.error('Manual order error:', err);
        toast.error(err.response?.data?.message || 'Failed to place order');
        setProcessing(false);
      }
      return;
    }

    try {
      // Create order on backend
      const { data } = await createOrder();

      if (data.order_id && data.order_id.startsWith('order_dummy_')) {
        // Mock Razorpay flow for testing
        setTimeout(async () => {
          try {
            await verifyPayment({
              razorpay_order_id: data.order_id,
              razorpay_payment_id: `pay_dummy_${Date.now()}`,
              razorpay_signature: `dummy_signature`,
            });
            await refreshCart();
            toast.success('Payment successful! (Test Mode)');
            navigate('/order-success', {
              state: { paymentId: `pay_dummy_${Date.now()}`, paymentMethod: 'online' },
            });
          } catch (err) {
            toast.error('Payment verification failed');
            setProcessing(false);
          }
        }, 1500);
        return;
      }

      // Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway');
        setProcessing(false);
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'Health Forge',
        description: 'Surgical Equipment Purchase',
        order_id: data.order_id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#0FCEDC',
        },
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await refreshCart();
            toast.success('Payment successful!');
            navigate('/order-success', {
              state: { paymentId: response.razorpay_payment_id },
            });
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast('Payment cancelled', { icon: '⚠️' });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.response?.data?.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title animate-fade-in-up">Checkout</h1>

        <div className="checkout-layout animate-fade-in-up">
          <div className="checkout-items glass-card">
            <h3 className="checkout-section-title">Order Review</h3>
            {items.map((item) => (
              <div className="checkout-item" key={item.id}>
                <div className="checkout-item-image">
                  <img src={item.image_url} alt={item.name} onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
                <div className="checkout-item-info">
                  <p className="checkout-item-name">{item.name}</p>
                  <p className="checkout-item-qty">Qty: {item.quantity}</p>
                </div>
                <p className="checkout-item-price">
                  ₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          <div className="checkout-summary glass-card">
            <h3 className="checkout-section-title">Payment Method</h3>
            <div className="payment-methods">
              <label className={`payment-method-label ${!isOnlineAllowed ? 'disabled' : ''}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="online" 
                  checked={paymentMethod === 'online'} 
                  onChange={() => setPaymentMethod('online')}
                  disabled={!isOnlineAllowed}
                />
                <div className="method-info">
                  <span className="method-name">Online Payment</span>
                  {finalTotal >= 100000 && <span className="method-note">Disabled for orders over ₹1L</span>}
                </div>
              </label>

              <label className={`payment-method-label ${!isManualAllowed ? 'disabled' : ''}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="manual" 
                  checked={paymentMethod === 'manual'} 
                  onChange={() => setPaymentMethod('manual')}
                  disabled={!isManualAllowed}
                />
                <div className="method-info">
                  <span className="method-name">Bank Transfer (NEFT/RTGS)</span>
                  {finalTotal < 20000 && <span className="method-note">Available for orders above ₹20k</span>}
                  {finalTotal >= 20000 && finalTotal < 100000 && <span className="method-note preferred">Preferred</span>}
                </div>
              </label>
            </div>

            <h3 className="checkout-section-title" style={{ marginTop: 'var(--space-xl)' }}>Payment Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free-shipping">FREE</span>
            </div>
            <div className="summary-row">
              <span>GST (18%)</span>
              <span>₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row summary-total">
              <span>Total Amount</span>
              <span>₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>

            <button
              className="btn btn-accent btn-full btn-lg pay-btn"
              onClick={handlePayment}
              disabled={processing || items.length === 0 || !paymentMethod}
              id="pay-btn"
            >
              <FiCreditCard size={20} />
              {processing 
                ? 'Processing...' 
                : paymentMethod === 'manual' 
                  ? 'Request Invoice & Bank Details' 
                  : `Pay ₹${finalTotal.toLocaleString('en-IN')}`}
            </button>

            <p className="secure-note">
              <FiLock size={14} /> Secured by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
