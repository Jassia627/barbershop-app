// src/modules/dashboard/pages/AdminDashboard.jsx
import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import StatsCard from '../components/StatsCard';
import Chart from '../components/Chart';
import ShareBookingLink from '../../shared/components/ShareBookingLink';
import { DollarSign, Scissors, Users, TrendingDown } from 'lucide-react';

const AdminDashboard = () => {
  const { stats, loading } = useDashboard();

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Panel de Administración</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Ventas Totales"
          value={`$${stats.totalSales.toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatsCard
          title="Cortes Realizados"
          value={stats.totalHaircuts}
          icon={Scissors}
          color="bg-blue-500"
        />
        <StatsCard
          title="Gastos Totales"
          value={`$${stats.totalExpenses.toLocaleString()}`}
          icon={TrendingDown}
          color="bg-red-500"
        />
        <StatsCard
          title="Barberos Activos"
          value={stats.activeBarbers}
          icon={Users}
          color="bg-purple-500"
        />
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart data={stats.salesChartData} dataKey="value" title="Ventas por Día" />
        <ShareBookingLink />
      </div>
    </div>
  );
};

export default AdminDashboard;