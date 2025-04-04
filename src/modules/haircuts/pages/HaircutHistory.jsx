import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth';
import { fetchHaircutHistory } from '../../appointments/services/appointmentService';
import { ArrowLeft, Calendar, Search, Clock, Filter, X, SortDesc, ChevronDown, BarChart2, User, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../../core/context/ThemeContext';
import { toast } from 'react-hot-toast';

const HaircutHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [forceReload, setForceReload] = useState(0); // Para forzar recargas
  const { theme } = useTheme();

  // Verificar si necesitamos forzar recarga basado en query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const shouldForceReload = queryParams.get('forceReload') === 'true';
    const comesFromAppointments = queryParams.get('from') === 'appointments';
    
    if (shouldForceReload && comesFromAppointments) {
      console.log('[DEBUG] HaircutHistory: Forzando recarga por parámetros de URL');
      // Mostrar un toast de que estamos cargando datos recientes
      toast.success('Cargando datos recientes del historial...', {
        duration: 4000,
        icon: '🔄'
      });
      
      // Eliminar los query params para evitar recargas adicionales si el usuario refresca la página
      navigate(location.pathname, { replace: true });
      
      // Forzar recarga después de un breve retraso para dar tiempo a que se guarden los datos
      setTimeout(() => {
        setForceReload(prev => prev + 1);
      }, 1000);
    }
  }, [location.search, navigate, location.pathname]);

  // Efecto principal para cargar datos
  useEffect(() => {
    loadHistory();
    
    // Configurar evento de visibilidad para recargar cuando la página vuelve a estar visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[DEBUG] Página de historial visible nuevamente - recargando datos');
        loadHistory();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpiar evento al desmontar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, location.key, forceReload]); // location.key cambia cuando se navega a esta página

  const loadHistory = async () => {
    try {
      setLoading(true);
      console.log('[DEBUG] HaircutHistory: Cargando historial para shopId:', user.shopId);
      
      // Esperar más tiempo para asegurar que los datos se hayan guardado en Firestore
      console.log('[DEBUG] HaircutHistory: Esperando 3 segundos para dar tiempo a que Firestore se actualice...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('[DEBUG] HaircutHistory: Realizando petición de datos...');
      const data = await fetchHaircutHistory(user.shopId, user.role === 'barber' ? user.uid : null);
      console.log('[DEBUG] HaircutHistory: Datos recibidos:', data?.length || 0, 'registros');
      
      if (!data || data.length === 0) {
        console.log('[DEBUG] HaircutHistory: No se encontraron datos en el historial');
        setHistory([]);
        return;
      }
      
      // Ordenar por fecha de creación (createdAt) de más reciente a más antiguo
      const sortedData = data.sort((a, b) => {
        // Primero intentamos con createdAt (que ya viene como Date desde el servicio)
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.date);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.date);
        return dateB - dateA;
      });
      
      console.log('[DEBUG] HaircutHistory: Primeros 3 registros ordenados:', 
        sortedData.slice(0, 3).map(item => ({
          id: item.id,
          cliente: item.clientName,
          servicio: item.serviceName,
          fecha: item.date?.toISOString(),
          creado: item.createdAt
        }))
      );
      
      setHistory(sortedData);
    } catch (error) {
      console.error('Error al cargar el historial:', error);
      toast.error(`Error al cargar el historial: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para forzar una recarga
  const forceReloadData = () => {
    setForceReload(prev => prev + 1);
    toast.success('Actualizando historial...', {
      duration: 4000,
      icon: '🔄'
    });
  };

  // Filtrado por fecha
  const getFilteredByDate = () => {
    if (dateFilter === 'all') return history;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    return history.filter(item => {
      const itemDate = item.createdAt ? new Date(item.createdAt) : new Date(item.date);
      switch(dateFilter) {
        case 'today':
          return itemDate >= today;
        case 'week':
          return itemDate >= weekAgo;
        case 'month':
          return itemDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  // Filtrado por texto
  const filteredHistory = getFilteredByDate().filter(item => 
    item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estadísticas básicas
  const totalAmount = filteredHistory.reduce((sum, item) => sum + (item.price || 0), 0);
  const uniqueClients = [...new Set(filteredHistory.map(item => item.clientName.toLowerCase()))].length;
  const uniqueServices = [...new Set(filteredHistory.map(item => item.serviceName.toLowerCase()))].length;

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="relative">
          <div className={`animate-spin rounded-full h-16 w-16 border-4 ${
            theme === 'dark'
              ? 'border-blue-500 border-t-transparent'
              : 'border-blue-600 border-t-transparent'
          }`}></div>
          <div className={`absolute inset-0 flex items-center justify-center text-sm ${
            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          }`}>
            Cargando
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-4`}>
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            
            <button
              onClick={forceReloadData}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-all"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Cargando...' : 'Actualizar'}</span>
            </button>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Historial de Cortes
          </h1>
          <p className="text-lg sm:text-xl text-blue-100">
            {user.role === 'barber' ? 'Tus cortes realizados' : 'Todos los cortes'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-green-900/20 text-green-500' 
                  : 'bg-green-100 text-green-600'
              }`}>
                <BarChart2 className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Total de ingresos</p>
                <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  ${totalAmount.toLocaleString('es-CO')}
                </h3>
              </div>
            </div>
          </div>
          
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-blue-900/20 text-blue-500' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <Calendar className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Cortes realizados</p>
                <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {filteredHistory.length}
                </h3>
              </div>
            </div>
          </div>
          
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-purple-900/20 text-purple-500' 
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  <User className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Clientes únicos</p>
                  <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {uniqueClients}
                  </h3>
                </div>
              </div>
              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {uniqueServices} servicios
              </div>
            </div>
          </div>
        </div>
        
        {/* Buscador y filtros */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-6`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por cliente, barbero o servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white focus:ring-blue-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors`}
              >
                <Filter className="h-4 w-4" />
                <span>Filtrar por fecha</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isFilterOpen && (
                <div className={`absolute top-full right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                } border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="py-1">
                    <button 
                      onClick={() => { setDateFilter('all'); setIsFilterOpen(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        theme === 'dark' 
                          ? 'hover:bg-gray-600 text-gray-200' 
                          : 'hover:bg-gray-100 text-gray-700'
                      } ${dateFilter === 'all' ? theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50' : ''}`}
                    >
                      Todos los registros
                    </button>
                    <button 
                      onClick={() => { setDateFilter('today'); setIsFilterOpen(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        theme === 'dark' 
                          ? 'hover:bg-gray-600 text-gray-200' 
                          : 'hover:bg-gray-100 text-gray-700'
                      } ${dateFilter === 'today' ? theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50' : ''}`}
                    >
                      Hoy
                    </button>
                    <button 
                      onClick={() => { setDateFilter('week'); setIsFilterOpen(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        theme === 'dark' 
                          ? 'hover:bg-gray-600 text-gray-200' 
                          : 'hover:bg-gray-100 text-gray-700'
                      } ${dateFilter === 'week' ? theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50' : ''}`}
                    >
                      Última semana
                    </button>
                    <button 
                      onClick={() => { setDateFilter('month'); setIsFilterOpen(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        theme === 'dark' 
                          ? 'hover:bg-gray-600 text-gray-200' 
                          : 'hover:bg-gray-100 text-gray-700'
                      } ${dateFilter === 'month' ? theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50' : ''}`}
                    >
                      Último mes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Chip con el filtro activo */}
          {dateFilter !== 'all' && (
            <div className="mt-3 flex">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                theme === 'dark'
                  ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}>
                <Calendar className="h-3 w-3" />
                <span>
                  {dateFilter === 'today' ? 'Hoy' : 
                   dateFilter === 'week' ? 'Última semana' : 
                   dateFilter === 'month' ? 'Último mes' : ''}
                </span>
                <button 
                  onClick={() => setDateFilter('all')}
                  className="ml-1 hover:bg-blue-200/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Lista de cortes */}
        <div className="space-y-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div 
                key={item.id} 
                className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'} 
                  rounded-lg shadow-md p-4 sm:p-6 transition-all duration-200 border-l-4 ${
                    item.price > 50000 
                      ? theme === 'dark' ? 'border-green-500' : 'border-green-600'
                      : item.price > 30000
                        ? theme === 'dark' ? 'border-blue-500' : 'border-blue-600'
                        : theme === 'dark' ? 'border-purple-500' : 'border-purple-600'
                  }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                  <div>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {item.clientName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <div className="flex items-center">
                        <Calendar className={`h-3.5 w-3.5 mr-1.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {format(item.date, "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Clock className={`h-3.5 w-3.5 mr-1.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {format(item.date, "HH:mm", { locale: es })}
                        </p>
                      </div>
                      {item.createdAt && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          Registrado: {format(new Date(item.createdAt), "d MMM, HH:mm", { locale: es })}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    theme === 'dark'
                      ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                      : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    ${item.price?.toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Barbero</p>
                    <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.barberName}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Servicio</p>
                    {item.serviceName ? (
                      <p className={`font-medium ${
                        theme === 'dark' 
                          ? 'text-blue-400 bg-blue-900/20 inline-block px-2 py-0.5 rounded' 
                          : 'text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded'
                      }`}>
                        {item.serviceName}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <p className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Servicio no especificado</p>
                        <button
                          onClick={() => {
                            console.log('Detalles del registro:', item);
                            toast.error(`Registro con servicio faltante - ID: ${item.id}`);
                          }}
                          className={`text-xs px-2 py-1 rounded ${
                            theme === 'dark' 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Ver detalles en consola
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8 text-center`}>
              <Calendar className={`h-16 w-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                No hay registros
              </h3>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'Aún no hay cortes registrados'}
              </p>
              <button 
                onClick={() => { setSearchTerm(''); setDateFilter('all'); }}
                className={`mt-4 px-4 py-2 rounded-md text-sm font-medium ${
                  theme === 'dark'
                    ? 'bg-blue-700 text-white hover:bg-blue-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } transition-colors`}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HaircutHistory; 