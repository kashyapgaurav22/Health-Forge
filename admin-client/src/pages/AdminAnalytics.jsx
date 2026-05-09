import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend 
} from 'recharts';
import { MdTrendingUp, MdShoppingCart, MdInventory, MdWarning, MdPeople, MdReceipt } from 'react-icons/md';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'all', label: 'All Time' },
];

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
    <div className="admin-analytics">
      {/* Period Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: period === p.key ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              background: period === p.key ? '#eff6ff' : 'white',
              color: period === p.key ? '#2563eb' : '#64748b',
              fontWeight: period === p.key ? 700 : 500,
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            {p.label}
          </button>
        ))}
        {loading && <span style={{ color: '#94a3b8', fontSize: '0.85rem', alignSelf: 'center', marginLeft: '8px' }}>Updating...</span>}
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard icon={<MdTrendingUp size={28} />} color="#3b82f6" label="Revenue" value={`₹${data.revenue?.toLocaleString('en-IN') || 0}`} />
        <StatCard icon={<MdReceipt size={28} />} color="#8b5cf6" label="Total Orders" value={data.totalOrders || 0} />
        <StatCard icon={<MdShoppingCart size={28} />} color="#10b981" label="Active Orders" value={data.activeOrders || 0} />
        <StatCard icon={<MdInventory size={28} />} color="#f59e0b" label="Products" value={data.totalProducts || 0} />
        <StatCard icon={<MdWarning size={28} />} color="#ef4444" label="Low Stock" value={data.lowStock || 0} />
        <StatCard icon={<MdPeople size={28} />} color="#06b6d4" label="Total Users" value={data.totalUsers || 0} />
      </div>

      {/* Revenue Bar Chart */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px', color: '#1e293b', fontSize: '1rem' }}>
          Revenue Overview — {PERIODS.find(p => p.key === period)?.label}
        </h3>
        <div style={{ height: '380px', width: '100%' }}>
          {data.revenueData?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}
                  formatter={(value, name) => [name === 'revenue' ? `₹${parseFloat(value).toLocaleString('en-IN')}` : value, name === 'revenue' ? 'Revenue' : 'Orders']}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="orders" name="Orders" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              No revenue data for this period
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, color, label, value }) => (
  <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: 0, padding: '20px' }}>
    <div style={{ padding: '14px', background: `${color}15`, color, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <h3 style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</h3>
      <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>{value}</p>
    </div>
  </div>
);

export default AdminAnalytics;
