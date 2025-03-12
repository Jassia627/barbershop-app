import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { useAppointments } from '../hooks/useAppointments';
import { ArrowLeft, Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import AppointmentCard from '../components/AppointmentCard';

const BarberAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    appointments, 
    loading, 
    completeAppointment, 
    cancelAppointment,
    approveAppointment,
    finishAppointment,
    filterAppointments 
  } = useAppointments();
  const [filter, setFilter] = useState('today');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    filterAppointments(user.uid);
  }, [user.uid]);

  // Obtener la fecha actual formateada
  const getCurrentDate = () => {
    return format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  };

  // Filtrar citas según el filtro seleccionado
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = appointment.date;
    switch (filter) {
      case 'today':
        return isToday(appointmentDate);
      case 'tomorrow':
        return isTomorrow(appointmentDate);
      case 'week':
        return isThisWeek(appointmentDate, { weekStartsOn: 1 });
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con mensaje de bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-4">
        <div className="container mx-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors mb-4"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-4xl font-bold mb-2">
            ¡Bienvenido, {user.name}!
          </h1>
          <p className="text-xl text-blue-100">
            Tus citas para {getCurrentDate()}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtrar citas</h2>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              <button
                onClick={() => setFilter('today')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  filter === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setFilter('tomorrow')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  filter === 'tomorrow'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Mañana
              </button>
              <button
                onClick={() => setFilter('week')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  filter === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Esta semana
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Todas
              </button>
            </div>
          )}
        </div>

        {/* Lista de citas */}
        <div className="space-y-6">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onApprove={approveAppointment}
                onCancel={cancelAppointment}
                onComplete={completeAppointment}
                onFinish={finishAppointment}
                isBarber={true}
              />
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No hay citas programadas
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'today' ? 'No tienes citas para hoy' :
                 filter === 'tomorrow' ? 'No tienes citas para mañana' :
                 filter === 'week' ? 'No tienes citas para esta semana' :
                 'No tienes citas programadas'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarberAppointments; 