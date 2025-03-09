// src/modules/services/components/ServiceSelect.jsx
import React, { useState } from 'react';
import { ChevronDown, Scissors } from 'lucide-react';

const ServiceSelect = ({ services, selectedService, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-transparent focus:border-blue-500 flex justify-between items-center"
      >
        <span className="text-gray-900 dark:text-white">{selectedService ? selectedService.name : 'Seleccionar servicio'}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {services.map(service => (
            <button
              key={service.id}
              onClick={() => {
                onSelect(service);
                setIsOpen(false);
              }}
              className={`w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedService?.id === service.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{service.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">${service.price.toLocaleString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceSelect;