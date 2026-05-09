import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdRefresh, MdVisibility } from 'react-icons/md';
import toast from 'react-hot-toast';
import './AdminPages.css';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'];

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', color: '#d97706' },
  processing: { bg: '#dbeafe', color: '#2563eb' },
  shipped: { bg: '#e0e7ff', color: '#4f46e5' },
  delivered: { bg: '#d1fae5', color: '#059669' },
  cancelled: { bg: '#fee2e2', color: '#dc2626' },
  failed: { bg: '#fee2e2', color: '#dc2626' },
  paid: { bg: '#d1fae5', color: '#059669' },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data);
    } catch (err) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Order status updated!');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const viewDetails = async (order) => {
    try {
      const res = await api.get(`/admin/orders/${order.id}`);
      setOrderDetails(res.data);
      setDetailsModalOpen(true);
    } catch (err) {
      toast.error('Failed to load order details');
    }
  };

  const filteredOrders = orders.filter(o =>
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
    String(o.id).includes(search)
  );

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by customer, email or order ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="admin-input"
              style={{ minWidth: '300px' }}
            />
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{filteredOrders.length} orders</span>
          </div>
          <button onClick={fetchOrders} className="admin-btn admin-btn-outline">
            <MdRefresh size={18} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="admin-loading-state">Loading orders...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <span className="order-id-badge">#{order.id}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{order.customer_name}</td>
                    <td style={{ color: '#64748b' }}>{order.customer_email}</td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>₹{parseFloat(order.total_amount).toLocaleString()}</td>
                    <td style={{ color: '#64748b' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className="status-select"
                        style={{
                          background: STATUS_COLORS[order.status]?.bg || '#f1f5f9',
                          color: STATUS_COLORS[order.status]?.color || '#475569',
                        }}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button onClick={() => viewDetails(order)} className="admin-btn admin-btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                        <MdVisibility size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {detailsModalOpen && orderDetails && (
        <div className="admin-modal-overlay" onClick={() => setDetailsModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="admin-modal-header">
              <h2>Order #{orderDetails.id} Details</h2>
              <button onClick={() => setDetailsModalOpen(false)} className="admin-modal-close">✕</button>
            </div>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <span className="detail-label">Customer</span>
                  <span className="detail-value">{orderDetails.customer_name}</span>
                </div>
                <div>
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{orderDetails.customer_email}</span>
                </div>
                <div>
                  <span className="detail-label">Status</span>
                  <span className="detail-value" style={{ color: STATUS_COLORS[orderDetails.status]?.color }}>{orderDetails.status}</span>
                </div>
                <div>
                  <span className="detail-label">Total</span>
                  <span className="detail-value" style={{ fontWeight: 700 }}>₹{parseFloat(orderDetails.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: '#1e293b' }}>Items</h3>
              {orderDetails.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontWeight: 500 }}>{item.name}</span>
                  <div style={{ display: 'flex', gap: '24px', color: '#64748b' }}>
                    <span>Qty: {item.quantity}</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{parseFloat(item.price).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
