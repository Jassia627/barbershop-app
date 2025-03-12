import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { fetchHaircutHistory } from '../../appointments/services/appointmentService';
import { ArrowLeft, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const HaircutHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchHaircutHistory(user.shopId, user.role === 'barber' ? user.uid : null);
      setHistory(data);
    } catch (error) {
      console.error('Error al cargar el historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => 
    item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-4">
        <div className="container mx-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors mb-4"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-4xl font-bold mb-2">
            Historial de Cortes
          </h1>
          <p className="text-xl text-blue-100">
            {user.role === 'barber' ? 'Tus cortes realizados' : 'Todos los cortes'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Buscador */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por cliente, barbero o servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Lista de cortes */}
        <div className="space-y-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.clientName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(item.date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full text-sm">
                    ${item.price?.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Barbero</p>
                    <p className="text-gray-900 dark:text-white">{item.barberName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Servicio</p>
                    <p className="text-gray-900 dark:text-white">{item.serviceName}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No hay registros
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'Aún no hay cortes registrados'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HaircutHistory; 