import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiDollarSign, FiShoppingBag, FiBox, FiAlertTriangle } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading analytics...</div>;
  if (!data) return <div style={{ padding: '20px' }}>Error loading data.</div>;

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div style={{ padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: `${color}20`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} />
      </div>
      <div>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{title}</p>
        <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem', color: '#1e293b' }}>{value}</h3>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '30px' }}>
      <h2 style={{ margin: '0 0 30px 0', color: '#0f172a' }}>Dashboard Overview</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard title="Total Revenue" value={`Rs. ${data.revenue.toLocaleString('en-IN')}`} icon={FiDollarSign} color="#10b981" />
        <StatCard title="Active Orders" value={data.activeOrders} icon={FiShoppingBag} color="#3b82f6" />
        <StatCard title="Total Products" value={data.totalProducts} icon={FiBox} color="#8b5cf6" />
        <StatCard title="Low Stock Items" value={data.lowStock} icon={FiAlertTriangle} color="#f59e0b" />
      </div>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>Revenue Overview</h3>
        {data.revenueData && data.revenueData.length > 0 ? (
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="value" fill="#0FCEDC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            Not enough data to display charts yet.
          </div>
        )}
      </div>
    </div>
  );
}
