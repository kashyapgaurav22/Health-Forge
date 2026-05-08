import { useLocation, Link } from 'react-router-dom';
import { FiCheckCircle, FiHome, FiShoppingBag } from 'react-icons/fi';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const location = useLocation();
  const paymentId = location.state?.paymentId || 'N/A';
  const paymentMethod = location.state?.paymentMethod || 'online';
  const orderId = location.state?.orderId || 'N/A';

  return (
    <div className="success-page">
      <div className="container">
        <div className="success-card glass-card animate-scale-in">
          <div className="success-icon-wrapper">
            <FiCheckCircle size={64} className="success-icon" />
          </div>
          <h1 className="success-title">
            {paymentMethod === 'manual' ? 'Order Placed (Action Required)' : 'Payment Successful!'}
          </h1>
          <p className="success-subtitle">
            {paymentMethod === 'manual' 
              ? 'Please complete your bank transfer to confirm the order.'
              : 'Your order has been placed and is being processed.'}
          </p>

          <div className="success-details">
            {paymentMethod === 'manual' ? (
              <div className="detail-row">
                <span className="detail-label">Order Reference ID</span>
                <span className="detail-value">HF-{orderId}</span>
              </div>
            ) : (
              <div className="detail-row">
                <span className="detail-label">Payment ID</span>
                <span className="detail-value">{paymentId}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className={`detail-value badge ${paymentMethod === 'manual' ? 'badge-accent' : 'badge-success'}`}>
                {paymentMethod === 'manual' ? 'Awaiting Transfer' : 'Confirmed'}
              </span>
            </div>
          </div>

          {paymentMethod === 'manual' && (
            <div className="bank-details-box" style={{ textAlign: 'left', background: 'var(--bg-card)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>Bank Transfer Details</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>Account Name: <strong style={{ color: 'var(--text-primary)' }}>Health Forge Pvt Ltd</strong></p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>Account No: <strong style={{ color: 'var(--text-primary)' }}>12345678901234</strong></p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>IFSC Code: <strong style={{ color: 'var(--text-primary)' }}>HDFC0001234</strong></p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>Branch: <strong style={{ color: 'var(--text-primary)' }}>Chandigarh</strong></p>
              <div style={{ padding: 'var(--space-md)', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                Please transfer the total amount and email the receipt along with your Order Reference ID to <strong>support@healthforge.in</strong> or WhatsApp to <strong>+91 9931758152</strong>.
              </div>
            </div>
          )}

          <div className="success-actions">
            <Link to="/" className="btn btn-secondary" id="success-home">
              <FiHome size={18} /> Back to Home
            </Link>
            <Link to="/products" className="btn btn-primary" id="success-shop">
              <FiShoppingBag size={18} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
