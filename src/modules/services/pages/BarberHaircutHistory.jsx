import React, { useState, useEffect } from 'react';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../../auth';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, Filter, ArrowLeft, Scissors, DollarSign, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { logDebug, logError } from '../../../core/utils/logger';

const BarberHaircutHistory = () => {
  const { allHaircuts, pendingHaircuts, loading, reloadConfirmedHaircuts } = useServices();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para filtros
  const [filteredHaircuts, setFilteredHaircuts] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Cargar cortes al montar el componente
  useEffect(() => {
    if (user && user.shopId) {
      loadHaircuts();
    }
  }, [user]);

  const loadHaircuts = async () => {
    try {
      setRefreshing(true);
      await reloadConfirmedHaircuts();
      logDebug("Cortes recargados con éxito");
    } catch (error) {
      logError("Error al cargar cortes");
      toast.error("Error al cargar cortes");
    } finally {
      setRefreshing(false);
    }
  };

  // Inicializar filteredHaircuts cuando allHaircuts o pendingHaircuts cambien
  useEffect(() => {
    // Combinar cortes confirmados y pendientes
    const combinedHaircuts = [
      ...(Array.isArray(allHaircuts) ? allHaircuts : []),
      ...(Array.isArray(pendingHaircuts) ? pendingHaircuts : [])
    ];
    
    logDebug("Cortes combinados:", combinedHaircuts.length);
    setFilteredHaircuts(combinedHaircuts);
  }, [allHaircuts, pendingHaircuts]);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    // Combinar cortes confirmados y pendientes
    const combinedHaircuts = [
      ...(Array.isArray(allHaircuts) ? allHaircuts : []),
      ...(Array.isArray(pendingHaircuts) ? pendingHaircuts : [])
    ];
    
    if (combinedHaircuts.length === 0) {
      return;
    }
    
    let filtered = [...combinedHaircuts];
    
    // Filtrar por fecha
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toISOString().split('T')[0];
      filtered = filtered.filter(haircut => {
        if (!haircut.createdAt) return false;
        try {
          const haircutDate = new Date(haircut.createdAt).toISOString().split('T')[0];
          return haircutDate === filterDate;
        } catch (error) {
          logError("Error al procesar fecha");
          return false;
        }
      });
    }
    
    // Filtrar por estado
    if (statusFilter) {
      filtered = filtered.filter(haircut => haircut.status === statusFilter);
    }
    
    logDebug("Resultados filtrados:", filtered.length);
    setFilteredHaircuts(filtered);
  }, [allHaircuts, pendingHaircuts, dateFilter, statusFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      logError("Error al formatear fecha");
      return "Fecha inválida";
    }
  };

  const resetFilters = () => {
    setDateFilter('');
    setStatusFilter('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 py-1 px-2 rounded-full text-xs font-medium">Confirmado</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 py-1 px-2 rounded-full text-xs font-medium">Pendiente</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 py-1 px-2 rounded-full text-xs font-medium">Rechazado</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 py-1 px-2 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/barber" className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Historial de Cortes</h1>
        <button 
          onClick={loadHaircuts}
          disabled={refreshing}
          className="ml-auto p-2 bg-blue-100 dark:bg-blue-900 rounded-full shadow hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          title="Recargar cortes"
        >
          <RefreshCw className={`h-5 w-5 text-blue-600 dark:text-blue-300 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Historial de cortes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" /> Historial de Cortes
          </h2>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
            title="Mostrar/ocultar filtros"
          >
            <Filter className="h-5 w-5 text-blue-500" />
          </button>
        </div>
        
        {/* Filtros */}
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrar por fecha</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full p-2 pl-10 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrar por estado</label>
                <div className="relative">
                  <Scissors className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 pl-10 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="">Todos los estados</option>
                    <option value="confirmed">Confirmados</option>
                    <option value="pending">Pendientes</option>
                    <option value="rejected">Rechazados</option>
                  </select>
                </div>
              </div>
            </div>
            <button 
              onClick={resetFilters}
              className="mt-3 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-sm transition-all flex items-center gap-1"
            >
              <Filter className="h-3 w-3" /> Limpiar filtros
            </button>
          </div>
        )}
        
        {/* Lista de cortes */}
        <div className="overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {refreshing && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}
          
          {!Array.isArray(filteredHaircuts) || filteredHaircuts.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>{loading ? "Cargando cortes..." : "No hay cortes que coincidan con los filtros"}</p>
              {!loading && (
                <p className="text-sm mt-2">Intenta cambiar los filtros o registra un nuevo corte</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHaircuts.map(haircut => (
                <div key={haircut.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-blue-600 dark:text-blue-400">{haircut.serviceName || "Servicio sin nombre"}</h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 py-1 px-2 rounded-full text-xs font-medium">
                        ${haircut.price || 0}
                      </span>
                      {getStatusBadge(haircut.status)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span>{haircut.clientName || "Sin nombre"}</span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>{formatDate(haircut.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarberHaircutHistory; 