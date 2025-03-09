import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { useAppointments } from '../hooks/useAppointments';
import { ArrowLeft, Calendar, Clock, User, Phone, Check, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, isAfter, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const BarberAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { appointments, loading, approveAppointment, cancelAppointment } = useAppointments();
  const [filter, setFilter] = useState('today'); // 'today', 'tomorrow', 'week', 'all'
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtrar citas según el filtro seleccionado
  const filteredAppointments = appointments.filter(appointment => {
    if (appointment.barberId !== user.uid) return false;
    
    const appointmentDate = parseISO(appointment.date);
    const today = startOfDay(new Date());
    
    switch (filter) {
      case 'today':
        return isToday(appointmentDate);
      case 'tomorrow':
        return isTomorrow(appointmentDate);
      case 'week':
        return isThisWeek(appointmentDate) && isAfter(appointmentDate, today);
      case 'all':
      default:
        return true;
    }
  });
  
  // Agrupar citas por fecha
  const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
    const date = format(parseISO(appointment.date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(appointment);
    return groups;
  }, {});
  
  // Ordenar las fechas
  const sortedDates = Object.keys(groupedAppointments).sort();
  
  // Manejar la aprobación de una cita
  const handleApprove = async (appointmentId) => {
    const success = await approveAppointment(appointmentId);
    if (success) {
      toast.success('Cita confirmada con éxito');
    }
  };
  
  // Manejar la cancelación de una cita
  const handleCancel = async (appointmentId) => {
    if (window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      const success = await cancelAppointment(appointmentId);
      if (success) {
        toast.success('Cita cancelada con éxito');
      }
    }
  };
  
  // Obtener el color según el estado de la cita
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };
  
  // Obtener el texto según el estado de la cita
  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'cancelled':
        return 'Cancelada';
      case 'pending':
      default:
        return 'Pendiente';
    }
  };
  
  // Formatear fecha para mostrar
  const formatDateHeader = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return 'Hoy';
    } else if (isTomorrow(date)) {
      return 'Mañana';
    } else {
      return format(date, "EEEE d 'de' MMMM", { locale: es });
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Citas</h1>
      </div>
      
      {/* Filtros */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <button
              onClick={() => setFilter('today')}
              className={`p-2 rounded-lg border ${
                filter === 'today' 
                  ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-200' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFilter('tomorrow')}
              className={`p-2 rounded-lg border ${
                filter === 'tomorrow' 
                  ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-200' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
              }`}
            >
              Mañana
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`p-2 rounded-lg border ${
                filter === 'week' 
                  ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-200' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
              }`}
            >
              Esta semana
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`p-2 rounded-lg border ${
                filter === 'all' 
                  ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-200' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
              }`}
            >
              Todas
            </button>
          </div>
        )}
      </div>
      
      {/* Lista de citas */}
      <div className="space-y-6">
        {sortedDates.length > 0 ? (
          sortedDates.map(date => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-600 text-white p-3">
                <h3 className="font-semibold capitalize">
                  {formatDateHeader(date)}
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {groupedAppointments[date].map(appointment => (
                  <div key={appointment.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {appointment.time}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                              {getStatusText(appointment.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {appointment.serviceName} - ${appointment.price?.toLocaleString() || 0}
                          </p>
                          <div className="mt-2 flex flex-col">
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <User className="h-4 w-4" />
                              <span>{appointment.clientName}</span>
                            </div>
                            {appointment.clientPhone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                <Phone className="h-4 w-4" />
                                <span>{appointment.clientPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {appointment.status === 'pending' && (
                        <div className="flex gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleApprove(appointment.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 rounded-lg transition-colors"
                          >
                            <Check className="h-4 w-4" />
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleCancel(appointment.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'today' ? 'No tienes citas para hoy' :
               filter === 'tomorrow' ? 'No tienes citas para mañana' :
               filter === 'week' ? 'No tienes citas para esta semana' :
               'No tienes citas programadas'}
            </p>
            <button
              onClick={() => navigate('/barber')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Volver al panel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarberAppointments; 