// src/modules/services/components/HaircutCard.jsx
import React from 'react';
import { User, Scissors, DollarSign } from 'lucide-react';

const HaircutCard = ({ haircut, onApprove, onReject }) => (
  <div className="flex flex-col p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-3 mb-4">
      <User className="h-6 w-6 text-gray-400" />
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{haircut.clientName}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Scissors className="h-4 w-4" /> {haircut.serviceName}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <DollarSign className="h-4 w-4" /> ${haircut.price.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Barbero: {haircut.barberName}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(haircut.createdAt).toLocaleDateString('es-ES')}
        </p>
      </div>
    </div>
    <div className="flex gap-2 mt-auto">
      <button
        onClick={() => onApprove(haircut.id)}
        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
      >
        Aprobar
      </button>
      <button
        onClick={() => onReject(haircut.id)}
        className="flex-1 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
      >
        Rechazar
      </button>
    </div>
  </div>
);

export default HaircutCard;