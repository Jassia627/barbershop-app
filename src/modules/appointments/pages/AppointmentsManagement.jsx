// src/modules/appointments/pages/AppointmentsManagement.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../hooks/useAppointments';
import BarberSelector from '../components/BarberSelector';
import AppointmentCard from '../components/AppointmentCard';
import { Calendar } from 'lucide-react';

const AppointmentsManagement = () => {
  const navigate = useNavigate();
  const { barbers, appointments = [], selectedBarber, loading, filterAppointments, approveAppointment, cancelAppointment } = useAppointments();
  
  console.log("AppointmentsManagement: Renderizando, appointments:", appointments, "barbers:", barbers, "loading:", loading);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Citas</h1>
        <button
          onClick={() => navigate('/admin/schedules')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Calendar className="h-5 w-5" />
          Administrar Horarios
        </button>
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Seleccionar Barbero</h2>
        <BarberSelector
          barbers={[{ id: null, name: 'Todos los barberos' }, ...barbers]}
          selectedBarber={selectedBarber}
          onSelect={(barber) => filterAppointments(barber?.id)}
        />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Citas {selectedBarber ? `de ${selectedBarber.name}` : 'de Todos los Barberos'}
        </h2>
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No hay citas pendientes o confirmadas.</p>
          ) : (
            appointments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onApprove={approveAppointment}
                onCancel={cancelAppointment}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsManagement;