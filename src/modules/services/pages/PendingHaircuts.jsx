// src/modules/services/pages/PendingHaircuts.jsx
import React from 'react';
import { useServices } from '../hooks/useServices';
import HaircutCard from '../components/HaircutCard';

const PendingHaircuts = () => {
  const { pendingHaircuts, loading, approveHaircut, rejectHaircut } = useServices();

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Cortes Pendientes de Aprobación</h1>
      <div className="space-y-4">
        {pendingHaircuts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No hay cortes pendientes de aprobación.</p>
        ) : (
          pendingHaircuts.map(haircut => (
            <HaircutCard
              key={haircut.id}
              haircut={haircut}
              onApprove={approveHaircut}
              onReject={rejectHaircut}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PendingHaircuts;