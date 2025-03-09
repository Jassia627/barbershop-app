// src/modules/dashboard/pages/BarberDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useAppointments } from '../../appointments/hooks/useAppointments';
import { useServices } from '../../services/hooks/useServices';
import StatsCard from '../components/StatsCard';
import Chart from '../components/Chart';
import ShareBookingLink from '../../shared/components/ShareBookingLink';
import { 
  DollarSign, 
  Scissors, 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  Phone, 
  MessageSquare,
  CalendarDays,
  BarChart3,
  History,
  ChevronRight
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { logError, logDebug } from '../../../core/utils/logger';

const BarberDashboard = () => {
  const { stats, loading: statsLoading } = useDashboard();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { allHaircuts, pendingHaircuts, loading: haircutsLoading } = useServices();
  const [mounted, setMounted] = useState(false);
  
  // Efecto para la animación de entrada inicial
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Filtrar citas para hoy
  const todayAppointments = appointments.filter(appointment => {
    if (!appointment.date) return false;
    try {
      const appointmentDate = parseISO(appointment.date);
      return isToday(appointmentDate);
    } catch (error) {
      logError("Error al parsear fecha");
      return false;
    }
  }).sort((a, b) => {
    // Ordenar por hora
    return a.time.localeCompare(b.time);
  });
  
  // Obtener el color según el estado de la cita
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    }
  };
  
  // Obtener el icono según el estado de la cita
  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" strokeWidth={2.5} />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" strokeWidth={2.5} />;
      case 'pending':
      default:
        return <AlertCircle className="h-4 w-4" strokeWidth={2.5} />;
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

  const loading = statsLoading || appointmentsLoading || haircutsLoading;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Scissors className="h-6 w-6 text-blue-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Obtener los últimos cortes confirmados (máximo 3)
  const recentConfirmedHaircuts = allHaircuts && allHaircuts.length > 0 
    ? allHaircuts.slice(0, 3) 
    : [];

  // Obtener los últimos cortes pendientes (máximo 3)
  const recentPendingHaircuts = pendingHaircuts && pendingHaircuts.length > 0 
    ? pendingHaircuts.slice(0, 3) 
    : [];

  // Formatear el valor de las ganancias
  const formattedSales = stats && typeof stats.totalSales === 'number' 
    ? `$${stats.totalSales.toLocaleString()}`
    : '$0';

  logDebug("Renderizando dashboard con stats:", stats);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
    <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in-down" style={{ animationDelay: '100ms' }}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="bg-blue-500 dark:bg-blue-600 p-2 rounded-lg shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <span>Mi Panel</span>
          </h1>
          
          <div className="flex flex-wrap gap-2">
            <Link 
              to="/barber/new-haircut" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Scissors className="h-4 w-4" strokeWidth={2.5} />
              <span>Nuevo Corte</span>
            </Link>
            <Link 
              to="/barber/appointments" 
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Calendar className="h-4 w-4" strokeWidth={2.5} />
              <span>Mis Citas</span>
            </Link>
          </div>
        </div>
        
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <StatsCard
              title="Mis Ganancias"
              value={formattedSales}
              icon={DollarSign}
              color="bg-gradient-to-r from-green-500 to-emerald-600"
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <StatsCard
              title="Cortes Realizados"
              value={allHaircuts ? allHaircuts.length : 0}
              icon={Scissors}
              color="bg-gradient-to-r from-blue-500 to-indigo-600"
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <StatsCard
              title="Cortes Pendientes"
              value={pendingHaircuts ? pendingHaircuts.length : 0}
              icon={History}
              color="bg-gradient-to-r from-yellow-500 to-amber-600"
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <StatsCard
              title="Citas Hoy"
              value={todayAppointments.length}
              icon={CalendarDays}
              color="bg-gradient-to-r from-purple-500 to-fuchsia-600"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-6">
            {/* Citas de hoy */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                  </div>
                  <span>Citas para Hoy</span>
                </h2>
                <Link 
                  to="/barber/appointments" 
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  <span>Ver todas</span>
                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
              </div>
              
              {todayAppointments.length > 0 ? (
                <div className="space-y-4">
                  {todayAppointments.map((appointment, index) => (
                    <div 
                      key={appointment.id} 
                      className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:shadow-md transition-all duration-300 hover:translate-x-1 group"
                      style={{ animationDelay: `${400 + index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900 dark:text-white text-lg">
                                {appointment.time}
                              </p>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                                {getStatusIcon(appointment.status)}
                                {getStatusText(appointment.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                              {appointment.serviceName} - <span className="text-green-600 dark:text-green-400">${appointment.price?.toLocaleString() || 0}</span>
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                <User className="h-4 w-4" strokeWidth={2.5} />
                                <span>{appointment.clientName}</span>
                              </div>
                              {appointment.clientPhone && (
                                <a 
                                  href={`tel:${appointment.clientPhone}`}
                                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <Phone className="h-4 w-4" strokeWidth={2.5} />
                                  <span>{appointment.clientPhone}</span>
                                </a>
                              )}
                              {appointment.clientPhone && (
                                <a 
                                  href={`https://wa.me/${appointment.clientPhone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:underline"
                                >
                                  <MessageSquare className="h-4 w-4" strokeWidth={2.5} />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/20 rounded-xl">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No tienes citas programadas para hoy</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm max-w-md mx-auto">
                    Cuando tengas citas programadas para hoy, aparecerán aquí. Puedes ver todas tus citas en la sección "Mis Citas".
                  </p>
                </div>
              )}
            </div>
            
            {/* Gráfico de ganancias */}
            {stats.salesChartData && stats.salesChartData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Ganancias por Día
                  </h2>
          </div>
          <Chart data={stats.salesChartData} dataKey="value" title="Ganancias por Día" />
              </div>
            )}
          </div>
          
          {/* Columna derecha */}
          <div className="space-y-6">
            {/* Cortes Realizados */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                    <Scissors className="h-5 w-5 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                  </div>
                  <span>Cortes Realizados</span>
                </h2>
                <Link 
                  to="/barber/haircuts" 
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  <span>Ver todos</span>
                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
              </div>
              
              {recentConfirmedHaircuts.length > 0 ? (
                <div className="space-y-3">
                  {recentConfirmedHaircuts.map((haircut, index) => (
                    <div 
                      key={haircut.id} 
                      className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:shadow-md transition-all duration-300 hover:translate-x-1"
                      style={{ animationDelay: `${550 + index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full shadow-sm">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {haircut.serviceName || "Servicio sin nombre"}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                              ${haircut.price?.toLocaleString() || 0}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <User className="h-4 w-4" strokeWidth={2.5} />
                              <span>{haircut.clientName || "Cliente sin nombre"}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {haircut.createdAt ? new Date(haircut.createdAt).toLocaleDateString() : "Fecha no disponible"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/20 rounded-xl">
                  <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-gray-500 dark:text-gray-400">No tienes cortes realizados aún</p>
                </div>
              )}
            </div>
            
            {/* Cortes Pendientes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" strokeWidth={2.5} />
                  </div>
                  <span>Cortes Pendientes</span>
                </h2>
                <Link 
                  to="/barber/haircuts" 
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  <span>Ver todos</span>
                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
              </div>
              
              {recentPendingHaircuts.length > 0 ? (
                <div className="space-y-3">
                  {recentPendingHaircuts.map((haircut, index) => (
                    <div 
                      key={haircut.id} 
                      className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:shadow-md transition-all duration-300 hover:translate-x-1"
                      style={{ animationDelay: `${650 + index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-full shadow-sm">
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {haircut.serviceName || "Servicio sin nombre"}
                            </p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                              ${haircut.price?.toLocaleString() || 0}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <User className="h-4 w-4" strokeWidth={2.5} />
                              <span>{haircut.clientName || "Cliente sin nombre"}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {haircut.createdAt ? new Date(haircut.createdAt).toLocaleDateString() : "Fecha no disponible"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/20 rounded-xl">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-gray-500 dark:text-gray-400">No tienes cortes pendientes de aprobación</p>
        </div>
      )}
            </div>
            
            {/* Compartir enlace de reserva */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Compartir Enlace de Reserva
                </h2>
              </div>
        <ShareBookingLink />
            </div>
          </div>
        </div>
      </div>
      
      {/* Estilos para las animaciones */}
      <style jsx="true">{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out forwards;
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BarberDashboard;