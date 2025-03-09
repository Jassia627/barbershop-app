// src/modules/barbers/components/BarberForm.jsx
import React from 'react';
import { User, Mail, Phone, Lock, Scissors } from 'lucide-react';

const BarberForm = ({ formData, setFormData, onSubmit, saving, isEditing = false }) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="mb-6 flex justify-center">
      <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
        <Scissors className="h-10 w-10 text-blue-600 dark:text-blue-400" strokeWidth={2} />
      </div>
    </div>
    
    <div className="space-y-4">
      <div className="group">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" strokeWidth={2} />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Nombre del barbero"
            required
          />
        </div>
      </div>
      
      <div className="group">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" strokeWidth={2} />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${isEditing ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
            placeholder="Correo del barbero"
            required
            disabled={isEditing} // No permitir editar email si es edición
          />
          {isEditing && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">El email no se puede modificar</p>
          )}
        </div>
      </div>
      
      {!isEditing && (
        <div className="group">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" strokeWidth={2} />
            <input
              type="password"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Contraseña del barbero"
              required={!isEditing}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Mínimo 6 caracteres</p>
        </div>
      )}
      
      <div className="group">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Teléfono</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" strokeWidth={2} />
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Teléfono del barbero"
          />
        </div>
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
        isEditing ? 'Actualizar Barbero' : 'Agregar Barbero'
      )}
    </button>
  </form>
);

export default BarberForm;