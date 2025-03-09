// src/modules/services/components/ServiceCard.jsx
import React from 'react';
import { Scissors, Edit, Trash2, Clock, DollarSign } from 'lucide-react';

const ServiceCard = ({ service, onEdit, onDelete, animationDelay = 0 }) => (
  <div 
    className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in-up group"
    style={{ animationDelay: `${animationDelay}ms` }}
  >
    <div className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
          <Scissors className="h-6 w-6 text-blue-600 dark:text-blue-400" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.name}</h3>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={2.5} />
          <span className="text-lg font-medium text-green-600 dark:text-green-400">${service.price.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" strokeWidth={2.5} />
          <span>{service.duration} minutos</span>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => onEdit(service)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
        >
          <Edit className="h-4 w-4" strokeWidth={2.5} />
          <span>Editar</span>
        </button>
        <button
          onClick={() => onDelete(service.id)}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2.5} />
          <span>Eliminar</span>
        </button>
      </div>
    </div>
    
    <style jsx="true">{`
      @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in-up {
        animation: fade-in-up 0.5s ease-out forwards;
        animation-fill-mode: backwards;
      }
    `}</style>
  </div>
);

export default ServiceCard;