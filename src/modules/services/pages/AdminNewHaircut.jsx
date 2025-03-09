// src/modules/services/pages/AdminNewHaircut.jsx
import React, { useState, useEffect } from 'react';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../../auth';
import { useNavigate } from 'react-router-dom';
import ServiceSelect from '../components/ServiceSelect';
import { ArrowLeft, User, Calendar, Filter, Search, Clock, AlertCircle, Scissors, DollarSign, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';
import { logDebug, logError } from '../../../core/utils/logger';

const AdminNewHaircut = () => {
  const { services, allHaircuts, barbers, loading, reloadConfirmedHaircuts } = useServices();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [clientName, setClientName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [filteredHaircuts, setFilteredHaircuts] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [barberFilter, setBarberFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Verificar que el usuario sea admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setError("Solo los administradores pueden acceder a esta página");
    } else {
      setError(null);
      // Recargar cortes confirmados al montar el componente
      if (user && user.shopId) {
        reloadConfirmedHaircuts();
      }
    }
  }, [user, reloadConfirmedHaircuts]);

  // Inicializar filteredHaircuts cuando allHaircuts cambie
  useEffect(() => {
    logDebug("allHaircuts actualizado:", allHaircuts?.length || 0);
    if (allHaircuts && Array.isArray(allHaircuts)) {
      setFilteredHaircuts(allHaircuts);
    }
  }, [allHaircuts]);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    if (!allHaircuts || !Array.isArray(allHaircuts)) {
      logDebug("No hay cortes disponibles para filtrar");
      return;
    }
    
    logDebug("Aplicando filtros - Fecha:", dateFilter, "Barbero:", barberFilter);
    let filtered = [...allHaircuts];
    
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
    
    // Filtrar por barbero
    if (barberFilter) {
      filtered = filtered.filter(haircut => {
        if (barberFilter === 'admin') {
          return haircut.barberName === 'Administrador';
        } else {
          return haircut.barberId === barberFilter;
        }
      });
    }
    
    logDebug("Resultados filtrados:", filtered.length);
    setFilteredHaircuts(filtered);
  }, [allHaircuts, dateFilter, barberFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService || !clientName.trim()) {
      toast.error("Selecciona un servicio y nombre del cliente");
      return;
    }
    
    if (!user || !user.shopId) {
      toast.error("Error: No se puede identificar la barbería");
      return;
    }
    
    setSaving(true);
    try {
      const newHaircut = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        clientName: clientName.trim(),
        shopId: user.shopId,
        barberId: null, // Admin no asigna barbero específico
        barberName: 'Administrador',
        createdAt: new Date().toISOString(),
        status: 'confirmed'
      };
      
      logDebug("Registrando nuevo corte:", newHaircut);
      await addDoc(collection(db, "haircuts"), newHaircut);
      toast.success("Corte registrado con éxito");
      setClientName('');
      setSelectedService(null);
      
      // Recargar los cortes confirmados en lugar de recargar toda la página
      await reloadConfirmedHaircuts();
    } catch (error) {
      logError("Error al registrar corte");
      toast.error("Error al registrar corte");
    }
    setSaving(false);
  };

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
    setBarberFilter('');
  };

  // Función para obtener el nombre del barbero para mostrar en el selector
  const getBarberDisplayName = (barber) => {
    if (!barber) return "";
    
    // Priorizar nombre completo si existe
    if (barber.firstName && barber.lastName) {
      return `${barber.firstName} ${barber.lastName}`;
    }
    
    // Luego displayName
    if (barber.displayName) {
      return barber.displayName;
    }
    
    // Luego nombre
    if (barber.name) {
      return barber.name;
    }
    
    // Por último, correo electrónico
    return barber.email || "Barbero sin nombre";
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col justify-center items-center min-h-screen p-4">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-red-500">{error}</h2>
      <button 
        onClick={() => navigate(-1)} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Volver
      </button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registrar Nuevo Corte</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de registro */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" /> Datos del Cliente
            </h2>
            <div className="relative">
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full p-3 pl-10 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Nombre del cliente"
              />
              <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-blue-500" /> Seleccionar Servicio
            </h2>
            {Array.isArray(services) && services.length > 0 ? (
              <ServiceSelect services={services} selectedService={selectedService} onSelect={setSelectedService} />
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <Scissors className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No hay servicios disponibles</p>
                <p className="text-sm mt-2">Agrega servicios desde el panel de administración</p>
              </div>
            )}
          </div>
          
          {selectedService && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" /> Resumen
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium">Servicio:</span>
                  <span>{selectedService.name}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium">Cliente:</span>
                  <span>{clientName || "Sin especificar"}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium">Precio:</span>
                  <span className="text-green-600 font-bold">${selectedService.price}</span>
                </div>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full mt-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="h-4 w-4" />
                    <span>Registrar Corte</span>
                  </>
                )}
              </button>
            </div>
          )}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrar por barbero</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <select
                      value={barberFilter}
                      onChange={(e) => setBarberFilter(e.target.value)}
                      className="w-full p-2 pl-10 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    >
                      <option value="">Todos los barberos</option>
                      <option value="admin">Administrador</option>
                      {Array.isArray(barbers) && barbers.map(barber => (
                        <option key={barber.id} value={barber.id}>
                          {getBarberDisplayName(barber)}
                        </option>
                      ))}
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
                      <span className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 py-1 px-2 rounded-full text-xs font-medium">
                        ${haircut.price || 0}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <span>{haircut.clientName || "Sin nombre"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Scissors className="h-3.5 w-3.5 text-gray-400" />
                        <span>{haircut.barberName || "No asignado"}</span>
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
    </div>
  );
};

export default AdminNewHaircut;