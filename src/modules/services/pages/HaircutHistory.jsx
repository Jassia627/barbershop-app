import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../modules/auth';
import { fetchHaircuts, getHaircutStats } from '../services/serviceService';
import { Calendar, Search, Filter, Download, ArrowLeft, Scissors, DollarSign, TrendingUp, Users, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportToExcel } from '../../../core/utils/excelExport';

const HaircutHistory = () => {
  const { user } = useAuth();
  const [haircuts, setHaircuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadHaircuts();
  }, [user?.shopId, searchTerm, dateRange, statusFilter]);

  const loadHaircuts = async () => {
    try {
      setLoading(true);
      const filters = {
        shopId: user?.shopId,
        searchTerm,
        ...dateRange,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };

      const [haircutsData, statsData] = await Promise.all([
        fetchHaircuts(filters),
        getHaircutStats(user?.shopId, filters)
      ]);

      setHaircuts(haircutsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar el historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataToExport = haircuts.map(haircut => ({
      'Fecha': format(new Date(haircut.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }),
      'Cliente': haircut.clientName,
      'Barbero': haircut.barberName,
      'Servicio': haircut.serviceName,
      'Precio': haircut.price,
      'Estado': getStatusText(haircut.status)
    }));

    exportToExcel(dataToExport, 'Historial_de_Cortes');
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'completed': 'Completado',
      'pending_review': 'Pendiente de Revisión',
      'finished': 'Finalizado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'pending_review': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'finished': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <button 
            onClick={() => window.history.back()} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors mb-3 sm:mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Historial de Cortes
          </h1>
          <p className="text-lg sm:text-xl text-blue-100">
            {user?.role === 'barber' ? 'Tus cortes realizados' : 'Todos los cortes de la barbería'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 sm:-mt-8">
        {/* Tarjetas de estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total de Cortes</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</h3>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Scissors className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Ingresos</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    ${stats.totalEarnings?.toLocaleString()}
                  </h3>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Promedio</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    ${stats.total ? Math.round(stats.totalEarnings / stats.total) : 0}
                  </h3>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Barberos</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.topBarbers?.length || 0}
                  </h3>
                </div>
                <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel principal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          {/* Barra de herramientas */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              {/* Búsqueda */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por cliente, barbero o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-sm sm:text-base"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Filter size={18} />
                  <span>Filtros</span>
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Download size={18} />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            {/* Panel de filtros */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-sm"
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-sm"
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-sm"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="pending">Pendientes</option>
                      <option value="completed">Completados</option>
                      <option value="pending_review">Pendientes de Revisión</option>
                      <option value="finished">Finalizados</option>
                      <option value="cancelled">Cancelados</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vista móvil: Cards */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <div className="p-4 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : haircuts.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    No se encontraron cortes
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    {searchTerm || dateRange.startDate || dateRange.endDate || statusFilter !== 'all' 
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'Registra tu primer corte para comenzar'}
                  </p>
                </div>
              ) : (
                haircuts.map((haircut) => (
                  <div key={haircut.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{haircut.clientName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{haircut.serviceName}</p>
                      </div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        ${haircut.price}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(haircut.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Users className="h-4 w-4" />
                        <span>{haircut.barberName}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(haircut.status)}`}>
                        {getStatusText(haircut.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vista desktop: Tabla */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Barbero
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : haircuts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg">
                        No se encontraron cortes
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        {searchTerm || dateRange.startDate || dateRange.endDate || statusFilter !== 'all' 
                          ? 'Intenta ajustar los filtros de búsqueda'
                          : 'Registra tu primer corte para comenzar'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  haircuts.map((haircut) => (
                    <tr 
                      key={haircut.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {format(new Date(haircut.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {haircut.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {haircut.barberName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {haircut.serviceName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                        ${haircut.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(haircut.status)}`}>
                          {getStatusText(haircut.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HaircutHistory; 