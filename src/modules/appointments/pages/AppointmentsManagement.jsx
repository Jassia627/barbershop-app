// src/modules/appointments/pages/AppointmentsManagement.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../hooks/useAppointments';
import BarberSelector from '../components/BarberSelector';
import AppointmentCard from '../components/AppointmentCard';
import { Calendar, CheckSquare, XCircle, AlertTriangle, CheckCircle, Scissors, MessageCircle } from 'lucide-react';

const AppointmentsManagement = () => {
  const navigate = useNavigate();
  const { barbers, appointments = [], selectedBarber, loading, filterAppointments, approveAppointment, cancelAppointment } = useAppointments();
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Filtrar las citas según el estado seleccionado
  const filteredAppointments = appointments.filter(appointment => 
    filterStatus === 'all' ? true : appointment.status === filterStatus
  );

  console.log("AppointmentsManagement: Renderizando, appointments:", appointments, "barbers:", barbers, "loading:", loading);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;

  const statusColors = {
    pending: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-800 dark:text-yellow-400',
      icon: AlertTriangle,
    },
    confirmed: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-800 dark:text-green-400',
      icon: CheckCircle,
    },
    cancelled: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      text: 'text-red-800 dark:text-red-400',
      icon: XCircle,
    },
    completed: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-800 dark:text-blue-400',
      icon: CheckSquare,
    },
    pending_review: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      text: 'text-purple-800 dark:text-purple-400',
      icon: Scissors,
    },
    finished: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/20',
      text: 'text-emerald-800 dark:text-emerald-400',
      icon: CheckSquare,
    }
  };

  const statusTranslations = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
    pending_review: 'Esperando Revisión',
    finished: 'Finalizada'
  };

  const handleStatusChange = (id, newStatus) => {
    // Implement the logic to change the status of the appointment
    console.log(`Changing status of appointment ${id} to ${newStatus}`);
  };

  const getWhatsAppLink = (phone, message) => {
    // Implement the logic to get the WhatsApp link
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const getReminderMessage = (appointment) => {
    // Implement the logic to get the reminder message
    return `Recordatorio: Tu cita con ${appointment.barberName} está a punto de comenzar. ¡No te olvides!`;
  };

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
        <div className="mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="pending_review">Esperando Revisión</option>
            <option value="completed">Completadas</option>
            <option value="finished">Finalizadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No hay citas que coincidan con los filtros seleccionados.</p>
          ) : (
            filteredAppointments.map(appointment => (
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