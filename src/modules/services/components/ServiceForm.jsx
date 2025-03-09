// src/modules/services/components/ServiceForm.jsx
import React from 'react';
import { DollarSign, Clock, Scissors, Type } from 'lucide-react';

const ServiceForm = ({ formData, setFormData, onSubmit, saving }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="mb-6 flex justify-center">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
          <Scissors className="h-10 w-10 text-blue-600 dark:text-blue-400" strokeWidth={2} />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="group">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre del Servicio</label>
          <div className="relative">
            <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" strokeWidth={2} />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Ej. Corte Clásico"
              required
            />
          </div>
        </div>
        
        <div className="group">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Precio</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" strokeWidth={2} />
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
              className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="0"
              required
              min="0"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Precio en pesos colombianos</p>
        </div>
        
        <div className="group">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duración (minutos)</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" strokeWidth={2} />
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="30"
              required
              min="5"
              step="5"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Tiempo estimado para completar el servicio</p>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Guardando...
          </>
        ) : (
          <>
            <Scissors className="h-5 w-5" strokeWidth={2} />
            Guardar Servicio
          </>
        )}
      </button>
    </form>
  );
};

export default ServiceForm;