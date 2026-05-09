import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdRefresh, MdVisibility, MdLocalShipping, MdCheckCircle, MdCancel, MdContentCopy } from 'react-icons/md';
import toast from 'react-hot-toast';
import './AdminPages.css';

const STATUS_FLOW = ['pending', 'accepted', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = {
  pending: 'Pending', paid: 'Paid', accepted: 'Accepted', processing: 'Processing',
  out_for_delivery: 'Out for Delivery', shipped: 'Shipped',
  delivered: 'Delivered', cancelled: 'Cancelled', failed: 'Failed',
  manual_verification: 'Manual Verify'
};
const STATUS_COLORS = {
  pending: { bg: '#fef3c7', color: '#d97706' },
  paid: { bg: '#dbeafe', color: '#2563eb' },
  accepted: { bg: '#dbeafe', color: '#2563eb' },
  processing: { bg: '#dbeafe', color: '#2563eb' },
  out_for_delivery: { bg: '#e0e7ff', color: '#7c3aed' },
  shipped: { bg: '#e0e7ff', color: '#4f46e5' },
  delivered: { bg: '#d1fae5', color: '#059669' },
  cancelled: { bg: '#fee2e2', color: '#dc2626' },
  failed: { bg: '#fee2e2', color: '#dc2626' },
  manual_verification: { bg: '#fef3c7', color: '#d97706' },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
      const res = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { 
        ...o, status: newStatus, 
        delivery_pin: res.data.delivery_pin || o.delivery_pin,
        status_updated_at: new Date().toISOString()
      } : o));
      if (res.data.delivery_pin) {
        toast.success(`Delivery PIN generated: ${res.data.delivery_pin}`);
      } else {
        toast.success(`Order marked as ${STATUS_LABELS[newStatus]}`);
      }
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

  const getNextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1) {
      // For paid/manual_verification, next is accepted
      if (current === 'paid' || current === 'manual_verification') return 'accepted';
      return null;
    }
    if (idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
    return null;
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + 
      ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}
              className="admin-input" style={{ minWidth: '240px' }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-input" style={{ minWidth: '160px' }}>
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{filteredOrders.length} orders</span>
          </div>
          <button onClick={fetchOrders} className="admin-btn admin-btn-outline"><MdRefresh size={18} /> Refresh</button>
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
                  <th>Amount</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Delivery PIN</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <tr key={order.id}>
                      <td><span className="order-id-badge">#{order.id}</span></td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{order.customer_name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{order.customer_email}</div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>₹{parseFloat(order.total_amount).toLocaleString()}</td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{formatDateTime(order.created_at)}</td>
                      <td>
                        <span className="status-pill" style={{
                          background: STATUS_COLORS[order.status]?.bg || '#f1f5f9',
                          color: STATUS_COLORS[order.status]?.color || '#475569',
                        }}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td>
                        {order.delivery_pin ? (
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: '#7c3aed', letterSpacing: '2px' }}>
                            {order.delivery_pin}
                          </span>
                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button onClick={() => viewDetails(order)} className="admin-btn admin-btn-outline" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                            <MdVisibility size={14} /> View
                          </button>
                          {nextStatus && (
                            <button onClick={() => handleStatusChange(order.id, nextStatus)}
                              className="admin-btn admin-btn-primary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                              {nextStatus === 'accepted' && <><MdCheckCircle size={14} /> Accept</>}
                              {nextStatus === 'out_for_delivery' && <><MdLocalShipping size={14} /> Ship</>}
                              {nextStatus === 'delivered' && <><MdCheckCircle size={14} /> Deliver</>}
                            </button>
                          )}
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button onClick={() => handleStatusChange(order.id, 'cancelled')}
                              className="admin-btn" style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#fee2e2', color: '#dc2626', border: 'none' }}>
                              <MdCancel size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="admin-modal-header">
              <h2>Order #{orderDetails.id}</h2>
              <button onClick={() => setDetailsModalOpen(false)} className="admin-modal-close">✕</button>
            </div>

            {/* Order Info */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Customer</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{orderDetails.customer_name}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{orderDetails.customer_email}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Created</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{formatDateTime(orderDetails.created_at)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Status</span>
                  <p style={{ margin: '4px 0 0' }}>
                    <span className="status-pill" style={{
                      background: STATUS_COLORS[orderDetails.status]?.bg,
                      color: STATUS_COLORS[orderDetails.status]?.color,
                    }}>{STATUS_LABELS[orderDetails.status] || orderDetails.status}</span>
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '1.2rem', color: '#1e293b' }}>₹{parseFloat(orderDetails.total_amount).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Delivery PIN */}
            {orderDetails.delivery_pin && (
              <div style={{ padding: '16px 24px', background: '#f5f3ff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MdLocalShipping size={24} style={{ color: '#7c3aed' }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>DELIVERY PIN</span>
                  <p style={{ margin: '2px 0 0', fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, color: '#7c3aed', letterSpacing: '4px' }}>
                    {orderDetails.delivery_pin}
                  </p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(orderDetails.delivery_pin); toast.success('PIN copied!'); }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed' }}>
                  <MdContentCopy size={20} />
                </button>
              </div>
            )}

            {/* Status Timeline */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px', color: '#1e293b', fontSize: '0.9rem' }}>Order Progress</h4>
              <div style={{ display: 'flex', gap: '0', alignItems: 'center' }}>
                {STATUS_FLOW.map((s, i) => {
                  const currentIdx = STATUS_FLOW.indexOf(orderDetails.status);
                  const isActive = STATUS_FLOW.indexOf(orderDetails.status) >= i || 
                    (orderDetails.status === 'paid' && i === 0) || 
                    (orderDetails.status === 'manual_verification' && i === 0);
                  const isCurrent = orderDetails.status === s;
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: isActive ? '#3b82f6' : '#e2e8f0',
                          color: isActive ? 'white' : '#94a3b8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700,
                          border: isCurrent ? '3px solid #93c5fd' : 'none',
                          boxSizing: 'content-box'
                        }}>{i + 1}</div>
                        <span style={{ fontSize: '0.65rem', color: isActive ? '#1e293b' : '#94a3b8', marginTop: '4px', textAlign: 'center', fontWeight: isCurrent ? 700 : 400 }}>
                          {STATUS_LABELS[s]}
                        </span>
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div style={{ height: '2px', flex: 0.5, background: isActive && i < currentIdx ? '#3b82f6' : '#e2e8f0', marginBottom: '16px' }}></div>
                      )}
                    </div>
                  );
                })}
              </div>
              {orderDetails.status === 'cancelled' && (
                <div style={{ marginTop: '12px', padding: '8px 12px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', fontWeight: 500 }}>
                  ❌ This order has been cancelled
                </div>
              )}
            </div>

            {/* Items */}
            <div style={{ padding: '20px 24px' }}>
              <h4 style={{ margin: '0 0 12px', color: '#1e293b', fontSize: '0.9rem' }}>Items ({orderDetails.items?.length || 0})</h4>
              {orderDetails.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {item.image_url && <img src={item.image_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />}
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', color: '#64748b', alignItems: 'center' }}>
                    <span>×{item.quantity}</span>
                    <span style={{ fontWeight: 600, color: '#1e293b', minWidth: '70px', textAlign: 'right' }}>₹{parseFloat(item.price).toLocaleString()}</span>
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
