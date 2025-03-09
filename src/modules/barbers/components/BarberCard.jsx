// src/modules/barbers/components/BarberCard.jsx
import React from 'react';
import { User } from 'lucide-react';

const BarberCard = ({ barber, isSelected, onSelect }) => (
  <button
    onClick={() => onSelect(barber)}
    className={`p-4 rounded-lg border transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
  >
    <div className="flex items-center">
      <User className="h-10 w-10 text-gray-400 mr-3" />
      <div className="text-left">
        <p className="font-medium text-gray-900 dark:text-white">{barber.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{barber.email}</p>
      </div>
    </div>
  </button>
);

export default BarberCard;