import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { MdTrendingUp, MdShoppingCart, MdInventory, MdWarning, MdPeople, MdReceipt, MdSchedule } from 'react-icons/md';
import './AdminPages.css';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'all', label: 'All Time' },
];

const STAT_CONFIG = [
  { key: 'revenue', icon: MdTrendingUp, color: '#0FCEDC', label: 'Revenue', format: v => `₹${(v || 0).toLocaleString('en-IN')}`, filtered: true },
  { key: 'totalOrders', icon: MdReceipt, color: '#a78bfa', label: 'Total Orders', format: v => v || 0, filtered: true },
  { key: 'activeOrders', icon: MdShoppingCart, color: '#34d399', label: 'Active Orders', format: v => v || 0, filtered: true },
  { key: 'totalProducts', icon: MdInventory, color: '#fbbf24', label: 'Products', format: v => v || 0, filtered: false },
  { key: 'lowStock', icon: MdWarning, color: '#f87171', label: 'Low Stock', format: v => v || 0, filtered: false },
  { key: 'totalUsers', icon: MdPeople, color: '#38bdf8', label: 'Total Users', format: v => v || 0, filtered: false },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px', padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ margin: '0 0 6px', color: '#9CA3AF', fontSize: '0.8rem' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: '2px 0', color: entry.color, fontSize: '0.88rem', fontWeight: 600 }}>
          {entry.name}: {entry.name === 'Revenue' ? `₹${parseFloat(entry.value || 0).toLocaleString('en-IN')}` : entry.value}
        </p>
      ))}
    </div>
  );
};

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [error, setError] = useState(null);

  const fetchAnalytics = async (p) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/admin/analytics?period=${p}`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(period); }, [period]);

  if (loading && !data) return <div className="admin-loading-state">Loading analytics...</div>;
  if (error && !data) return <div className="admin-loading-state" style={{ color: 'var(--error)' }}>{error}</div>;
  if (!data) return <div className="admin-loading-state">Failed to load analytics data.</div>;

  const isFiltered = period !== 'all';

  return (
    <div>
      {/* Period Filter Tabs */}
      <div className="admin-period-tabs">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`admin-period-btn ${period === p.key ? 'active' : ''}`}
          >
            {p.label}
          </button>
        ))}
        {loading && <span className="admin-updating">Updating...</span>}
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {STAT_CONFIG.map(stat => (
          <div key={stat.key} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={26} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <p className="admin-stat-label">{stat.label}</p>
                {isFiltered && !stat.filtered && (
                  <span className="stat-scope-badge">
                    <MdSchedule size={10} /> All Time
                  </span>
                )}
              </div>
              <p className="admin-stat-value">{stat.format(data[stat.key])}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="admin-card">
        <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>
          Revenue Overview — {PERIODS.find(p => p.key === period)?.label}
        </h3>
        <div style={{ height: '380px', width: '100%' }}>
          {data.revenueData?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(v) => v === 0 ? '₹0' : `₹${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15,206,220,0.04)' }} />
                <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: '0.85rem' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#0FCEDC" radius={[6, 6, 0, 0]} />
                <Bar dataKey="orders" name="Orders" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty-state">
              <div className="chart-empty-icon">
                <MdTrendingUp size={48} />
              </div>
              <p className="chart-empty-title">No revenue data</p>
              <p className="chart-empty-desc">
                {period === 'today'
                  ? 'No paid orders recorded today yet.'
                  : period === '7d'
                  ? 'No paid orders in the last 7 days.'
                  : period === '30d'
                  ? 'No paid orders in the last 30 days.'
                  : 'No paid orders recorded yet. Revenue will appear here once orders are completed.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
