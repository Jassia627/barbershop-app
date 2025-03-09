// src/modules/barbers/components/BarberStatus.jsx
import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const BarberStatus = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-700 dark:text-green-300',
          label: 'Activo'
        };
      case 'pending':
        return {
          icon: AlertCircle,
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          textColor: 'text-yellow-700 dark:text-yellow-300',
          label: 'Pendiente'
        };
      case 'inactive':
        return {
          icon: XCircle,
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-700 dark:text-red-300',
          label: 'Inactivo'
        };
      default:
        return {
          icon: AlertCircle,
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          textColor: 'text-gray-700 dark:text-gray-300',
          label: status || 'Desconocido'
        };
    }
  };

  const { icon: StatusIcon, bgColor, textColor, label } = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor} transition-all duration-300 hover:shadow-sm`}
    >
      <StatusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </span>
  );
};

export default BarberStatus;