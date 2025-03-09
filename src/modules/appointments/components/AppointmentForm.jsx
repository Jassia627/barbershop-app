// src/modules/appointments/components/AppointmentForm.jsx
import React from 'react';
import { User, Phone } from 'lucide-react';

const AppointmentForm = ({ formData, setFormData, onSubmit, saving, services }) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Cliente</label>
      <div className="relative mt-1">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={formData.clientName}
          onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          placeholder="Tu nombre"
          required
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono del Cliente</label>
      <div className="relative mt-1">
        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="tel"
          value={formData.clientPhone || ''}
          onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
          className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          placeholder="Tu teléfono"
          required
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Servicio</label>
      <select
        value={formData.serviceId || ''}
        onChange={(e) => {
          const selectedService = services.find(s => s.id === e.target.value);
          setFormData({ ...formData, serviceId: e.target.value, serviceName: selectedService?.name, price: selectedService?.price });
        }}
        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
        required
      >
        <option value="">Selecciona un servicio</option>
        {services.map(service => (
          <option key={service.id} value={service.id}>{service.name} - ${service.price.toLocaleString()}</option>
        ))}
      </select>
    </div>
    <button
      type="submit"
      disabled={saving}
      className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      {saving ? 'Reservando...' : 'Reservar Cita'}
    </button>
  </form>
);

export default AppointmentForm;