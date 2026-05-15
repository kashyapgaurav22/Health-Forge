import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { MdTrendingUp, MdShoppingCart, MdInventory, MdWarning, MdPeople, MdReceipt } from 'react-icons/md';
import './AdminPages.css';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'all', label: 'All Time' },
];

const STAT_CONFIG = [
  { key: 'revenue', icon: MdTrendingUp, color: '#0FCEDC', label: 'Revenue', format: v => `₹${v?.toLocaleString('en-IN') || 0}` },
  { key: 'totalOrders', icon: MdReceipt, color: '#a78bfa', label: 'Total Orders', format: v => v || 0 },
  { key: 'activeOrders', icon: MdShoppingCart, color: '#34d399', label: 'Active Orders', format: v => v || 0 },
  { key: 'totalProducts', icon: MdInventory, color: '#fbbf24', label: 'Products', format: v => v || 0 },
  { key: 'lowStock', icon: MdWarning, color: '#f87171', label: 'Low Stock', format: v => v || 0 },
  { key: 'totalUsers', icon: MdPeople, color: '#38bdf8', label: 'Total Users', format: v => v || 0 },
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
          {entry.name}: {entry.name === 'Revenue' ? `₹${parseFloat(entry.value).toLocaleString('en-IN')}` : entry.value}
        </p>
      ))}
    </div>
  );
};

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchAnalytics = async (p) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/analytics?period=${p}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(period); }, [period]);

  if (loading && !data) return <div className="admin-loading-state">Loading analytics...</div>;
  if (!data) return <div className="admin-loading-state">Failed to load analytics data.</div>;

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
            <div>
              <p className="admin-stat-label">{stat.label}</p>
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
                  tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15,206,220,0.04)' }} />
                <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: '0.85rem' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#0FCEDC" radius={[6, 6, 0, 0]} />
                <Bar dataKey="orders" name="Orders" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              No revenue data for this period
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
