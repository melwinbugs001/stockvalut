import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function DashboardCharts({ categorySummary }) {
  // Use only top 5 categories for the chart
  const data = categorySummary.slice(0, 5).map(c => ({
    name: c.name,
    stock: c.stock,
    value: c.value
  }));

  if (data.length === 0) {
    return null;
  }

  return (
    <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="#cbd5e1" />
          <YAxis stroke="#cbd5e1" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          <Bar dataKey="stock" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Stock Quantity" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DashboardCharts;
