// src/modules/barbers/pages/ScheduleManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import BarberCard from '../components/BarberCard';
import ScheduleForm from '../components/ScheduleForm';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { fetchBarbers, fetchSchedules, saveSchedule } from '../../appointments/services/appointmentService';
import { toast } from 'react-hot-toast';

const ScheduleManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [formData, setFormData] = useState({ id: '', barberId: '', startTime: '09:00', endTime: '18:00', daysOff: [] });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBarbers = async () => {
      try {
        // Si el usuario es barbero, solo puede gestionar su propio horario
        if (user.role === 'barber') {
          const barberData = [{ id: user.uid, name: user.name || user.email.split('@')[0], ...user }];
          setBarbers(barberData);
          setSelectedBarber(barberData[0]); // Seleccionar automáticamente al barbero
        } else if (user.role === 'admin') {
          // Si es admin, puede gestionar todos los barberos
          let barberData = await fetchBarbers(user.shopId);
          setBarbers(barberData);
        } else {
          // Si no es barbero ni admin, mostrar error
          setError("No tienes permisos para gestionar horarios");
        }
      } catch (error) {
        console.error("Error al cargar barberos:", error);
        toast.error("Error al cargar barberos");
      } finally {
        setLoading(false);
      }
    };
    loadBarbers();
  }, [user]);

  useEffect(() => {
    const loadExistingSchedule = async () => {
      if (selectedBarber) {
        try {
          const scheduleData = await fetchSchedules(selectedBarber.id);
          if (scheduleData.length > 0) {
            const { id, startTime, endTime, daysOff } = scheduleData[0];
            setFormData({ id, barberId: selectedBarber.id, startTime, endTime, daysOff });
          } else {
            setFormData({ id: '', barberId: selectedBarber.id, startTime: '09:00', endTime: '18:00', daysOff: [] });
          }
        } catch (error) {
          console.error("Error al cargar horario existente:", error);
          toast.error("Error al cargar horario existente");
        }
      }
    };
    loadExistingSchedule();
  }, [selectedBarber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar que el usuario tenga permisos para modificar este horario
    if (user.role === 'barber' && selectedBarber.id !== user.uid) {
      toast.error("No tienes permisos para modificar el horario de otro barbero");
      return;
    }
    
    setSaving(true);
    try {
      const scheduleData = { ...formData, barberId: selectedBarber.id };
      await saveSchedule(scheduleData);
      toast.success("Horario guardado con éxito");
      navigate(user.role === 'admin' ? '/admin' : '/barber');
    } catch (error) {
      console.error("Error al guardar horario:", error);
      toast.error("Error al guardar horario");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Horarios</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Horarios</h1>
      </div>
      {!selectedBarber && user.role === 'admin' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {barbers.map(barber => (
            <BarberCard
              key={barber.id}
              barber={barber}
              isSelected={false}
              onSelect={() => setSelectedBarber(barber)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Horario de {selectedBarber.name}</h2>
          <ScheduleForm formData={formData} setFormData={setFormData} onSubmit={handleSubmit} saving={saving} />
          {user.role === 'admin' && (
            <button
              onClick={() => setSelectedBarber(null)}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Volver a Lista
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;