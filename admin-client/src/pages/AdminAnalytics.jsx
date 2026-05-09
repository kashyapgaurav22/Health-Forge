import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { MdTrendingUp, MdShoppingCart, MdInventory, MdWarning } from 'react-icons/md';

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/admin/analytics');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div>Loading analytics...</div>;
  if (!data) return <div>Failed to load analytics data.</div>;

  return (
    <div className="admin-analytics">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 0 }}>
          <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '12px' }}>
            <MdTrendingUp size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Total Revenue</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              ₹{data.revenue?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 0 }}>
          <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px' }}>
            <MdShoppingCart size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Active Orders</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {data.activeOrders || 0}
            </p>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 0 }}>
          <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '12px' }}>
            <MdInventory size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Total Products</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {data.totalProducts || 0}
            </p>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 0 }}>
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px' }}>
            <MdWarning size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Low Stock Items</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {data.lowStock || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: '24px', color: '#1e293b' }}>Revenue Overview (Last 6 Months)</h3>
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `₹${value}`} />
              <Tooltip 
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
