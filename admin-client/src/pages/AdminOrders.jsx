import { useState, useEffect } from 'react';
import api from '../services/api';
import { MdRefresh, MdVisibility, MdLocalShipping, MdCheckCircle, MdCancel, MdContentCopy } from 'react-icons/md';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import './AdminPages.css';

const STATUS_FLOW = ['pending', 'accepted', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = {
  pending: 'Pending', paid: 'Paid', accepted: 'Accepted', processing: 'Processing',
  out_for_delivery: 'Out for Delivery', shipped: 'Shipped',
  delivered: 'Delivered', cancelled: 'Cancelled', failed: 'Failed',
  manual_verification: 'Manual Verify'
};
const STATUS_COLORS = {
  pending: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  paid: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
  accepted: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
  processing: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
  out_for_delivery: { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
  shipped: { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
  delivered: { bg: 'rgba(52,211,153,0.15)', color: '#34d399' },
  cancelled: { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  failed: { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  manual_verification: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

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

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="admin-filter-bar">
            <input type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}
              className="admin-input" style={{ minWidth: '240px', width: 'auto' }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-input" style={{ minWidth: '160px', width: 'auto' }}>
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <span className="text-muted" style={{ fontSize: '0.88rem' }}>{filteredOrders.length} orders</span>
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
                  <th>#ID</th><th>Customer</th><th>Amount</th><th>Date & Time</th>
                  <th>Status</th><th>Delivery PIN</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map(order => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <tr key={order.id}>
                      <td><span className="order-id-badge">#{order.id}</span></td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{order.customer_name}</div>
                          <div className="text-muted" style={{ fontSize: '0.78rem' }}>{order.customer_email}</div>
                        </div>
                      </td>
                      <td className="font-semibold text-primary">₹{parseFloat(order.total_amount).toLocaleString()}</td>
                      <td className="text-muted" style={{ fontSize: '0.82rem' }}>{formatDateTime(order.created_at)}</td>
                      <td>
                        <span className="status-pill" style={{
                          background: STATUS_COLORS[order.status]?.bg || 'rgba(255,255,255,0.05)',
                          color: STATUS_COLORS[order.status]?.color || 'var(--text-secondary)',
                        }}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td>
                        {order.delivery_pin ? (
                          <span className="font-mono font-bold text-accent" style={{ fontSize: '0.95rem', letterSpacing: '2px', color: '#a78bfa' }}>
                            {order.delivery_pin}
                          </span>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button onClick={() => viewDetails(order)} className="admin-btn admin-btn-outline" style={{ padding: '5px 10px', fontSize: '0.78rem' }}>
                            <MdVisibility size={14} /> View
                          </button>
                          {nextStatus && (
                            <button onClick={() => handleStatusChange(order.id, nextStatus)}
                              className="admin-btn admin-btn-primary" style={{ padding: '5px 10px', fontSize: '0.78rem' }}>
                              {nextStatus === 'accepted' && <><MdCheckCircle size={14} /> Accept</>}
                              {nextStatus === 'out_for_delivery' && <><MdLocalShipping size={14} /> Ship</>}
                              {nextStatus === 'delivered' && <><MdCheckCircle size={14} /> Deliver</>}
                            </button>
                          )}
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button onClick={() => handleStatusChange(order.id, 'cancelled')}
                              className="admin-btn admin-btn-danger" style={{ padding: '5px 10px', fontSize: '0.78rem' }}>
                              <MdCancel size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan="7" className="admin-loading-state">No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredOrders.length > 0 && (
          <Pagination currentPage={currentPage} totalItems={filteredOrders.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
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
            <div className="admin-detail-grid">
              <div>
                <span className="detail-label">Customer</span>
                <p className="detail-value" style={{ fontWeight: 600 }}>{orderDetails.customer_name}</p>
                <p className="text-muted" style={{ fontSize: '0.82rem' }}>{orderDetails.customer_email}</p>
              </div>
              <div>
                <span className="detail-label">Created</span>
                <p className="detail-value">{formatDateTime(orderDetails.created_at)}</p>
              </div>
              <div>
                <span className="detail-label">Status</span>
                <p style={{ margin: '4px 0 0' }}>
                  <span className="status-pill" style={{
                    background: STATUS_COLORS[orderDetails.status]?.bg,
                    color: STATUS_COLORS[orderDetails.status]?.color,
                  }}>{STATUS_LABELS[orderDetails.status] || orderDetails.status}</span>
                </p>
              </div>
              <div>
                <span className="detail-label">Total</span>
                <p className="detail-value font-bold" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                  ₹{parseFloat(orderDetails.total_amount).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Delivery PIN */}
            {orderDetails.delivery_pin && (
              <div className="delivery-pin-section">
                <MdLocalShipping size={24} style={{ color: '#a78bfa' }} />
                <div>
                  <span className="detail-label" style={{ color: '#a78bfa' }}>DELIVERY PIN</span>
                  <p className="delivery-pin-value">{orderDetails.delivery_pin}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(orderDetails.delivery_pin); toast.success('PIN copied!'); }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa' }}>
                  <MdContentCopy size={20} />
                </button>
              </div>
            )}

            {/* Status Timeline */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'var(--font-heading)' }}>Order Progress</h4>
              <div className="order-timeline">
                {STATUS_FLOW.map((s, i) => {
                  const currentIdx = STATUS_FLOW.indexOf(orderDetails.status);
                  const isActive = STATUS_FLOW.indexOf(orderDetails.status) >= i || 
                    (orderDetails.status === 'paid' && i === 0) || 
                    (orderDetails.status === 'manual_verification' && i === 0);
                  const isCurrent = orderDetails.status === s;
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <div className="timeline-step">
                        <div className={`timeline-dot ${isActive ? 'active' : 'inactive'} ${isCurrent ? 'current' : ''}`}>{i + 1}</div>
                        <span className={`timeline-label ${isActive ? 'active' : 'inactive'}`}>{STATUS_LABELS[s]}</span>
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={`timeline-connector ${isActive && i < currentIdx ? 'active' : 'inactive'}`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
              {orderDetails.status === 'cancelled' && (
                <div className="order-cancelled-banner">❌ This order has been cancelled</div>
              )}
            </div>

            {/* Items */}
            <div style={{ padding: '20px 24px' }}>
              <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'var(--font-heading)' }}>
                Items ({orderDetails.items?.length || 0})
              </h4>
              {orderDetails.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {item.image_url && <img src={item.image_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />}
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span className="text-muted">×{item.quantity}</span>
                    <span className="font-semibold text-primary" style={{ minWidth: '70px', textAlign: 'right' }}>₹{parseFloat(item.price).toLocaleString()}</span>
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
