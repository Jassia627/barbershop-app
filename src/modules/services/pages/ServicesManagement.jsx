// src/modules/services/pages/ServicesManagement.jsx
import React, { useState, useEffect } from 'react';
import { useServices } from '../hooks/useServices';
import ServiceCard from '../components/ServiceCard';
import ServiceForm from '../components/ServiceForm';
import { 
  Scissors, 
  PlusCircle, 
  Search, 
  Clock, 
  DollarSign, 
  X,
  BarChart3,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ServicesManagement = () => {
  const { services, loading, saveService, deleteService } = useServices();
  const [formData, setFormData] = useState({ name: '', price: 0, duration: 30 });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [mounted, setMounted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Efecto para la animación de entrada inicial
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const success = await saveService(formData, editingId);
    if (success) {
      setFormData({ name: '', price: 0, duration: 30 });
      setEditingId(null);
      closeModal();
      toast.success(editingId ? "Servicio actualizado con éxito" : "Servicio añadido con éxito");
    }
    setSaving(false);
  };

  const handleEdit = (service) => {
    setFormData({ name: service.name, price: service.price, duration: service.duration });
    setEditingId(service.id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (serviceId) => {
    setConfirmDelete(serviceId);
  };

  const confirmDeleteService = async () => {
    if (confirmDelete) {
      await deleteService(confirmDelete);
      setConfirmDelete(null);
      toast.success("Servicio eliminado con éxito");
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (editingId) {
      setEditingId(null);
      setFormData({ name: '', price: 0, duration: 30 });
    }
  };

  // Filtrar y ordenar servicios
  const filteredServices = services
    .filter(service => 
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        return a.price - b.price;
      } else if (sortBy === 'duration') {
        return a.duration - b.duration;
      }
      return 0;
    });

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

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in-down" style={{ animationDelay: '100ms' }}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="bg-blue-500 dark:bg-blue-600 p-2 rounded-lg shadow-lg">
              <Scissors className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <span>Gestión de Servicios</span>
          </h1>
          
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <PlusCircle className="h-5 w-5" strokeWidth={2.5} />
            <span>Agregar Servicio</span>
          </button>
        </div>
        
        {/* Filtros y búsqueda */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 mb-8 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-auto md:flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setSortBy('name')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    sortBy === 'name' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Nombre
                </button>
                <button
                  onClick={() => setSortBy('price')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    sortBy === 'price' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Precio
                </button>
                <button
                  onClick={() => setSortBy('duration')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    sortBy === 'duration' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Duración
                </button>
              </div>
              
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSortBy('name');
                }}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title="Limpiar filtros"
              >
                <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Lista de servicios */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                <Scissors className="h-5 w-5 text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
              </div>
              <span>Servicios Disponibles</span>
              <span className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {filteredServices.length}
              </span>
            </h2>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <BarChart3 className="h-4 w-4" strokeWidth={2.5} />
                <span>Total: {services.length}</span>
              </div>
            </div>
          </div>
          
          {filteredServices.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/20 rounded-xl">
              <Scissors className="h-16 w-16 text-gray-400 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No hay servicios que coincidan con tu búsqueda</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm max-w-md mx-auto">
                Intenta cambiar los filtros o agrega un nuevo servicio usando el botón "Agregar Servicio".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  animationDelay={250 + index * 50}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para agregar/editar servicio */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}
              </h2>
              <button 
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-6">
              <ServiceForm 
                formData={formData} 
                setFormData={setFormData} 
                onSubmit={handleSubmit} 
                saving={saving} 
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmación para eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Confirmar eliminación</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteService}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Estilos para las animaciones */}
      <style jsx="true">{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
        
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

export default ServicesManagement;