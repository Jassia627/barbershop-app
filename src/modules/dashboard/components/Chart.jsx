// src/modules/dashboard/components/Chart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Chart = ({ data, dataKey, title }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default Chart;