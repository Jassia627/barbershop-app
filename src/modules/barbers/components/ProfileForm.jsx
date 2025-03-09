import React, { useState } from 'react';
import { User, Mail, Phone, Save } from 'lucide-react';

const ProfileForm = ({ user, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tu nombre completo"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            value={user.email}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md bg-gray-100 dark:bg-gray-800"
            placeholder="Tu correo electrónico"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">El correo electrónico no se puede cambiar</p>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tu número de teléfono"
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-5 h-5" />
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  );
};

export default ProfileForm; 