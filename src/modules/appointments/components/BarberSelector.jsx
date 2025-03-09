import React from 'react';
import { User } from 'lucide-react';

const BarberSelector = ({ barbers, selectedBarber, onSelect }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {barbers.map((barber) => (
      <button
        key={barber.id}
        onClick={() => onSelect(barber)}
        className={`group relative p-6 rounded-xl transition-all transform hover:scale-105 ${selectedBarber?.id === barber.id ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg'}`}
      >
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <User className={`w-8 h-8 ${selectedBarber?.id === barber.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
          </div>
          <div className="ml-4 text-left">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{barber.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{barber.expertise || 'Barbero Profesional'}</p>
          </div>
        </div>
      </button>
    ))}
  </div>
);

export default BarberSelector;