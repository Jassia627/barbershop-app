// src/modules/services/pages/NewHaircut.jsx
import React, { useState } from 'react';
import { useServices } from '../hooks/useServices';
import { useNavigate } from 'react-router-dom';
import ServiceSelect from '../components/ServiceSelect';
import { ArrowLeft, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { logDebug, logError } from '../../../core/utils/logger';

const NewHaircut = () => {
  const { services, loading, saveHaircut } = useServices();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [clientName, setClientName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService || !clientName.trim()) {
      toast.error("Selecciona un servicio y nombre del cliente");
      return;
    }
    setSaving(true);
    logDebug("Guardando corte:", { service: selectedService, clientName });
    const success = await saveHaircut({
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      clientName: clientName.trim()
    });
    if (success) navigate('/barber');
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Corte</h1>
      </div>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" /> Datos del Cliente
          </h2>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full p-3 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            placeholder="Nombre del cliente"
          />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Seleccionar Servicio</h2>
          <ServiceSelect services={services} selectedService={selectedService} onSelect={setSelectedService} />
        </div>
        {selectedService && (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Registrar Corte'}
          </button>
        )}
      </div>
    </div>
  );
};

export default NewHaircut;