// src/modules/appointments/pages/AppointmentsManagement.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../hooks/useAppointments';
import AppointmentCard from '../components/AppointmentCard';
import { Calendar, CheckSquare, XCircle, AlertTriangle, CheckCircle, Scissors, MessageCircle, Filter, ChevronLeft, ChevronRight, ArrowUp, Users, Menu, X as XIcon, SlidersHorizontal, RefreshCcw, Moon, Sun, History } from 'lucide-react';
import { useTheme } from '../../../core/context/ThemeContext';

const AppointmentsManagement = () => {
  const navigate = useNavigate();
  const { barbers, appointments = [], selectedBarber, loading, filterAppointments, approveAppointment, cancelAppointment, finishAppointment } = useAppointments();
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 10;
  const [showFilters, setShowFilters] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Ordenar y filtrar citas
  const filteredAndSortedAppointments = useMemo(() => {
    return appointments
      .filter(appointment => filterStatus === 'all' || appointment.status === filterStatus)
      .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
  }, [appointments, filterStatus]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredAndSortedAppointments.length / appointmentsPerPage);
  const paginatedAppointments = filteredAndSortedAppointments.slice(
    (currentPage - 1) * appointmentsPerPage,
    currentPage * appointmentsPerPage
  );

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
    const totalCount = appointments.length;
    
    return {
      pendingCount,
      confirmedCount,
      totalCount
    };
  }, [appointments]);

  // Resetear filtros
  const resetFilters = () => {
    filterAppointments(null);
    setFilterStatus('all');
    setCurrentPage(1);
  };

  if (loading) return (
    <div className={`flex justify-center items-center min-h-screen ${
      theme === 'dark'
        ? 'bg-gradient-to-b from-gray-900 to-gray-800'
        : 'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      <div className="relative">
        <div className={`animate-spin rounded-full h-16 w-16 border-4 ${
          theme === 'dark'
            ? 'border-blue-500 border-t-transparent'
            : 'border-blue-400 border-t-transparent'
        }`}></div>
        <div className={`absolute inset-0 flex items-center justify-center text-sm ${
          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
        }`}>
          Cargando
        </div>
      </div>
    </div>
  );

  const statusColors = {
    pending: {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-500',
      icon: AlertTriangle,
    },
    confirmed: {
      bg: 'bg-green-500/20',
      text: 'text-green-500',
      icon: CheckCircle,
    },
    cancelled: {
      bg: 'bg-red-500/20',
      text: 'text-red-500',
      icon: XCircle,
    },
    completed: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-500',
      icon: CheckSquare,
    },
    pending_review: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-500',
      icon: Scissors,
    },
    finished: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-500',
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

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className={`min-h-screen animate-fadeIn ${theme === 'dark' 
      ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white' 
      : 'bg-gradient-to-b from-gray-50 via-gray-100 to-white text-gray-900'}`}>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header con título y botón de acción */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <div>
            <div className="flex items-center justify-between w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                <span className={`${theme === 'dark' 
                  ? 'bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600' 
                  : 'text-blue-700'}`}>Gestión de Citas</span>
              </h1>
              
              {/* Botón móvil para mostrar/ocultar filtros - Ahora es más evidente */}
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`sm:hidden flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-blue-600/80 text-white border border-blue-500' 
                    : 'bg-blue-500 text-white border border-blue-400 shadow-sm'
                }`}
              >
                {showFilters ? (
                  <>
                    <XIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">Cerrar filtros</span>
                  </>
                ) : (
                  <>
                    <Filter className="h-4 w-4" />
                    <span className="text-xs font-medium">Filtrar</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center flex-wrap gap-2 mt-2">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Administra y visualiza citas
              </p>
              <div className="flex gap-1 ml-2">
                <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-md ${
                  theme === 'dark' 
                    ? 'bg-blue-900/40 text-blue-400 border border-blue-500/30' 
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {stats.pendingCount} pendientes
                </span>
                <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-md ${
                  theme === 'dark' 
                    ? 'bg-green-900/40 text-green-400 border border-green-500/30' 
                    : 'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  {stats.confirmedCount} confirmadas
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
            <button
              onClick={resetFilters}
              className={`flex items-center justify-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 text-sm flex-1 sm:flex-auto ${
                theme === 'dark' 
                  ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700' 
                  : 'bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50'
              }`}
            >
              <RefreshCcw className="h-4 w-4" />
              <span className="sm:inline hidden">Resetear</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/haircut-history')}
              className={`flex items-center justify-center gap-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg transition-all duration-300 shadow-md flex-1 sm:flex-auto ${
                theme === 'dark' 
                  ? 'bg-purple-600/80 text-white hover:bg-purple-700/80' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <Scissors className="h-4 w-4" />
              <span className="text-sm sm:text-base">Ver Historial</span>
            </button>
            
        <button
          onClick={() => navigate('/admin/schedules')}
              className={`flex items-center justify-center gap-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg transition-all duration-300 shadow-md flex-1 sm:flex-auto ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-900/20' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-blue-500/20'
              }`}
            >
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Horarios</span>
        </button>
      </div>
        </div>

        {/* Stats Cards - solo visibles en tablets y desktop */}
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`rounded-xl p-4 border shadow-lg ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' 
              : 'bg-white border-gray-200/50'
          }`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-yellow-900/20 text-yellow-500' 
                  : 'bg-yellow-100 text-yellow-600'
              }`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Citas Pendientes</p>
                <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.pendingCount}</h3>
              </div>
            </div>
          </div>
          
          <div className={`rounded-xl p-4 border shadow-lg ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' 
              : 'bg-white border-gray-200/50'
          }`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-green-900/20 text-green-500' 
                  : 'bg-green-100 text-green-600'
              }`}>
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Citas Confirmadas</p>
                <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.confirmedCount}</h3>
              </div>
            </div>
          </div>
          
          <div className={`rounded-xl p-4 border shadow-lg ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' 
              : 'bg-white border-gray-200/50'
          }`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-blue-900/20 text-blue-500' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total de Citas</p>
                <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.totalCount}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Mobile - solo visibles en móvil */}
        <div className="grid grid-cols-3 sm:hidden gap-2 mb-4">
          <div className={`rounded-lg p-2 border ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' 
              : 'bg-white border-gray-200/50'
          }`}>
            <div className="flex flex-col items-center justify-center">
              <AlertTriangle className={`h-4 w-4 mb-1 ${theme === 'dark' ? 'text-yellow-500' : 'text-yellow-600'}`} />
              <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Pendientes</p>
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.pendingCount}</h3>
            </div>
          </div>
          
          <div className={`rounded-lg p-2 border ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' 
              : 'bg-white border-gray-200/50'
          }`}>
            <div className="flex flex-col items-center justify-center">
              <CheckCircle className={`h-4 w-4 mb-1 ${theme === 'dark' ? 'text-green-500' : 'text-green-600'}`} />
              <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Confirmadas</p>
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.confirmedCount}</h3>
            </div>
          </div>
          
          <div className={`rounded-lg p-2 border ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' 
              : 'bg-white border-gray-200/50'
          }`}>
            <div className="flex flex-col items-center justify-center">
              <Users className={`h-4 w-4 mb-1 ${theme === 'dark' ? 'text-blue-500' : 'text-blue-600'}`} />
              <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.totalCount}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Panel lateral con filtros - En móvil debe aparecer arriba */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden sm:block'} order-1`}>
            <div className={`rounded-xl border shadow-lg p-4 sm:p-6 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' 
                : 'bg-white border-gray-200/50'
            } ${!showFilters ? 'mb-0' : 'mb-4'} sm:mb-6`}>
              <h2 className={`text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <Filter className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                Filtros
              </h2>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Selector de barbero */}
                <div>
                  <h3 className={`text-sm font-medium mb-2 sm:mb-3 flex items-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <span>Barbero</span>
                    <span className={`ml-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>({barbers.length})</span>
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-2 gap-2 sm:gap-3">
                    <button
                      key="all-barbers"
                      onClick={() => filterAppointments(null)}
                      className={`relative p-2 sm:p-3 flex items-center justify-center rounded-lg transition-all ${
                        !selectedBarber
                          ? theme === 'dark'
                            ? 'bg-blue-900/40 border border-blue-500/50 text-blue-400 shadow-md shadow-blue-900/10 selected-pulse'
                            : 'bg-blue-100 border border-blue-300 text-blue-700 shadow-md shadow-blue-100/50 selected-pulse'
                          : theme === 'dark'
                            ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700/80'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full mb-1 sm:mb-2 flex items-center justify-center ${
                          theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
                        }`}>
                          <Users className={`h-3.5 w-3.5 sm:h-5 sm:w-5 ${
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                          }`} />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium truncate w-full text-center">
                          Todos
                        </span>
                      </div>
                    </button>
                    
                    {barbers.map(barber => (
                      <button
                        key={barber.id}
                        onClick={() => filterAppointments(barber.id)}
                        className={`relative p-2 sm:p-3 flex items-center justify-center rounded-lg transition-all ${
                          selectedBarber?.id === barber.id 
                            ? theme === 'dark'
                              ? 'bg-blue-900/40 border border-blue-500/50 text-blue-400 shadow-md shadow-blue-900/10 selected-pulse'
                              : 'bg-blue-100 border border-blue-300 text-blue-700 shadow-md shadow-blue-100/50 selected-pulse'
                            : theme === 'dark'
                              ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700/80'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full mb-1 sm:mb-2 flex items-center justify-center relative overflow-hidden ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                          }`}>
                            {barber.photoURL ? (
                              <img src={barber.photoURL} alt={barber.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className={`text-sm sm:text-lg font-medium ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {barber.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                            
                            {selectedBarber?.id === barber.id && (
                              <div className={`absolute inset-0 flex items-center justify-center ${
                                theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-200/40'
                              }`}>
                                <CheckCircle className={`h-3.5 w-3.5 sm:h-5 sm:w-5 ${
                                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                }`} />
                              </div>
                            )}
                          </div>
                          <span className={`text-[10px] sm:text-xs font-medium truncate w-full text-center ${
                            selectedBarber?.id === barber.id
                              ? theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
                              : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {barber.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
      </div>
                
                {/* Selector de estado */}
      <div>
                  <h3 className={`text-sm font-medium mb-2 sm:mb-3 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Estado de la cita</h3>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1); // Resetear a primera página al cambiar filtro
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                      theme === 'dark'
                        ? 'bg-gray-800 border border-gray-700 text-white focus:border-blue-500'
                        : 'bg-white border border-gray-300 text-gray-900 focus:border-blue-400'
                    }`}
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

                {/* Información de filtros activos */}
                <div className={`pt-3 mt-2 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className={`flex flex-col text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="font-medium mb-2 sm:mb-3">Filtros activos:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedBarber && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          theme === 'dark'
                            ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          <span className="mr-1 sm:mr-1.5">Barbero:</span>
                          <span className="font-semibold">{selectedBarber.name}</span>
                        </span>
                      )}
                      {filterStatus !== 'all' && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          theme === 'dark'
                            ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30'
                            : 'bg-purple-100 text-purple-700 border border-purple-200'
                        }`}>
                          <span className="mr-1 sm:mr-1.5">Estado:</span>
                          <span className="font-semibold">{statusTranslations[filterStatus]}</span>
                        </span>
                      )}
                      {(!selectedBarber && filterStatus === 'all') && (
                        <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Ningún filtro aplicado</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3 order-2">
            <div className={`rounded-xl border shadow-lg p-4 sm:p-6 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' 
                : 'bg-white border-gray-200/50'
            }`}>
              <h2 className={`text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center justify-between ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="flex items-center">
                  <Calendar className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className="truncate max-w-[150px] sm:max-w-full">
                    Citas {selectedBarber ? `de ${selectedBarber.name}` : 'de Todos'}
                  </span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {filteredAndSortedAppointments.length}
                  </span>
                </div>
                
                <button 
                  onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                  className={`flex items-center justify-center p-1.5 rounded-md border transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-700 text-gray-400 hover:bg-gray-700/70 hover:text-white'
                      : 'border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
        </h2>

              <div className="space-y-3 sm:space-y-4 custom-scrollbar overflow-y-auto max-h-[calc(100vh-220px)] sm:max-h-[calc(100vh-250px)]">
                {paginatedAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                    <div className={`p-4 sm:p-6 rounded-full mb-4 ${
                      theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'
                    }`}>
                      <Calendar className={`h-8 w-8 sm:h-12 sm:w-12 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                    <p className={`text-base sm:text-lg font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      No hay citas que coincidan con los filtros.
                    </p>
                    <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      Intenta cambiar los filtros o seleccionar otro barbero.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {paginatedAppointments.map(appointment => (
                        <div key={appointment.id} className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <AppointmentCard
                appointment={appointment}
                onApprove={approveAppointment}
                onCancel={cancelAppointment}
                            onFinish={finishAppointment}
                            theme={theme}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Paginación mejorada */}
                    {totalPages > 1 && (
                      <div className={`mt-6 sm:mt-8 pt-3 sm:pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                          <p className={`text-xs sm:text-sm text-center sm:text-left ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Mostrando <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{((currentPage - 1) * appointmentsPerPage) + 1}</span> - <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{Math.min(currentPage * appointmentsPerPage, filteredAndSortedAppointments.length)}</span> de <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{filteredAndSortedAppointments.length}</span> citas
                          </p>
                          <div className="flex items-center">
                            <button 
                              onClick={goToPrevPage} 
                              disabled={currentPage <= 1}
                              className={`mr-1 sm:mr-2 p-1.5 sm:p-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                                theme === 'dark'
                                  ? 'border-gray-700 hover:bg-gray-700 text-gray-400'
                                  : 'border-gray-300 hover:bg-gray-100 text-gray-500'
                              }`}
                              aria-label="Página anterior"
                            >
                              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                            
                            <div className="flex gap-1">
                              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                // En móvil, mostrar menos páginas
                                const isSmallScreen = window.innerWidth < 640;
                                
                                // Si hay muchas páginas, mostrar solo algunas (lógica de paginación)
                                let pagesToShow;
                                if (totalPages <= 5) {
                                  pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
                                } else if (currentPage <= 3) {
                                  pagesToShow = [1, 2, 3, 4, '...', totalPages];
                                } else if (currentPage >= totalPages - 2) {
                                  pagesToShow = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                                } else {
                                  pagesToShow = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
                                }
                                
                                // En móvil, mostrar un conjunto más reducido
                                if (isSmallScreen) {
                                  if (totalPages <= 3) {
                                    pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
                                  } else if (currentPage === 1) {
                                    pagesToShow = [1, 2, '...', totalPages];
                                  } else if (currentPage === totalPages) {
                                    pagesToShow = [1, '...', totalPages - 1, totalPages];
                                  } else {
                                    pagesToShow = [1, '...', currentPage, '...', totalPages];
                                  }
                                }
                                
                                // Solo mostrar los elementos que toquen en esta iteración
                                return pagesToShow[i];
                              }).map((page, index) => {
                                if (page === '...') {
                                  return (
                                    <span key={`ellipsis-${index}`} className={`min-w-[32px] sm:min-w-[40px] h-8 sm:h-10 flex items-center justify-center ${
                                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      ...
                                    </span>
                                  );
                                }
                                
                                return (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    disabled={page === currentPage}
                                    className={`min-w-[32px] sm:min-w-[40px] h-8 sm:h-10 rounded-md transition-all duration-200 text-sm ${
                                      page === currentPage
                                        ? theme === 'dark'
                                          ? 'bg-blue-600 text-white font-medium'
                                          : 'bg-blue-500 text-white font-medium'
                                        : theme === 'dark'
                                          ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
                                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <button 
                              onClick={goToNextPage} 
                              disabled={currentPage >= totalPages}
                              className={`ml-1 sm:ml-2 p-1.5 sm:p-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                                theme === 'dark'
                                  ? 'border-gray-700 hover:bg-gray-700 text-gray-400'
                                  : 'border-gray-300 hover:bg-gray-100 text-gray-500'
                              }`}
                              aria-label="Página siguiente"
                            >
                              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Botón flotante para mostrar filtros en móvil */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`fixed bottom-6 right-6 z-50 sm:hidden p-3 rounded-full shadow-lg ${
          theme === 'dark'
            ? 'bg-blue-600 text-white shadow-blue-900/30'
            : 'bg-blue-500 text-white shadow-blue-400/30'
        } transition-all duration-300 ${showFilters ? 'rotate-180' : ''}`}
      >
        {showFilters ? 
          <XIcon className="h-6 w-6" /> : 
          <Filter className="h-6 w-6" />
        }
      </button>
    </div>
  );
};

export default AppointmentsManagement;