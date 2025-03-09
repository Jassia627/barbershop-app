// src/modules/barbers/pages/BarbersManagement.jsx
import React, { useState, useEffect } from 'react';
import { useBarbers } from '../hooks/useBarbers';
import BarberCard from '../components/BarberCard';
import BarberForm from '../components/BarberForm';
import BarberStatus from '../components/BarberStatus';
import { toast } from 'react-hot-toast';
import { updateBarber, updateBarberStatus } from '../services/barberService';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  CheckCircle, 
  XCircle, 
  ToggleLeft, 
  ToggleRight,
  X,
  Phone,
  Mail,
  Filter,
  RefreshCw,
  Trash2
} from 'lucide-react';

const BarbersManagement = () => {
  const { barbers, setBarbers, loading, saveBarber, approveBarber, deleteBarber } = useBarbers();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mounted, setMounted] = useState(false);

  // Efecto para la animación de entrada inicial
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBarber) {
        const updatedData = { name: formData.name, phone: formData.phone };
        const updatedBarber = await updateBarber(editingBarber.id, updatedData);
        setBarbers(prev => prev.map(b => b.id === editingBarber.id ? { ...b, ...updatedBarber } : b));
        toast.success("Barbero actualizado con éxito");
        setEditingBarber(null);
        closeModal();
      } else {
        const success = await saveBarber(formData);
        if (success) {
          toast.success("Barbero añadido con éxito");
          closeModal();
        }
      }
      setFormData({ name: '', email: '', password: '', phone: '' });
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (barber) => {
    setEditingBarber(barber);
    setFormData({ name: barber.name, email: barber.email, password: '', phone: barber.phone || '' });
    setIsModalOpen(true);
  };

  const toggleBarberStatus = async (barberId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateBarberStatus(barberId, newStatus);
      setBarbers(prev => prev.map(b => b.id === barberId ? { ...b, status: newStatus } : b));
      toast.success(`Barbero ${newStatus === 'active' ? 'activado' : 'desactivado'} con éxito`);
    } catch (error) {
      toast.error(`Error al cambiar estado: ${error.message}`);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBarber(null);
    setFormData({ name: '', email: '', password: '', phone: '' });
  };

  const handleDelete = async (barberId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este barbero? Esta acción no se puede deshacer.')) {
      const success = await deleteBarber(barberId);
      if (success) {
        closeModal();
      }
    }
  };

  const filteredBarbers = barbers.filter(barber => {
    const matchesSearch = barber.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         barber.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || barber.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-500 animate-pulse" />
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
              <Users className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <span>Gestión de Barberos</span>
          </h1>
          
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <UserPlus className="h-5 w-5" strokeWidth={2.5} />
            <span>Agregar Barbero</span>
          </button>
        </div>
        
        {/* Filtros y búsqueda */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 mb-8 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-auto md:flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Buscar barberos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === 'all' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === 'active' 
                      ? 'bg-green-500 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === 'pending' 
                      ? 'bg-yellow-500 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Pendientes
                </button>
              </div>
              
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title="Limpiar filtros"
              >
                <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Lista de barberos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
            </div>
            <span>Lista de Barberos</span>
            <span className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {filteredBarbers.length}
            </span>
          </h2>
          
          {filteredBarbers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/20 rounded-xl">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No hay barberos que coincidan con tu búsqueda</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm max-w-md mx-auto">
                Intenta cambiar los filtros o agrega un nuevo barbero usando el botón "Agregar Barbero".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBarbers.map((barber, index) => (
                <div 
                  key={barber.id} 
                  className="bg-gray-50 dark:bg-gray-700/30 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${250 + index * 50}ms` }}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-full ${
                        barber.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        <Users className="h-6 w-6" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{barber.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <BarberStatus status={barber.status} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Mail className="h-4 w-4 text-gray-400" strokeWidth={2.5} />
                        <span className="text-sm">{barber.email}</span>
                      </div>
                      {barber.phone && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Phone className="h-4 w-4 text-gray-400" strokeWidth={2.5} />
                          <span className="text-sm">{barber.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(barber)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
                      >
                        <Edit className="h-4 w-4" strokeWidth={2.5} />
                        <span>Editar</span>
                      </button>
                      
                      {barber.status === 'pending' && (
                        <button
                          onClick={() => approveBarber(barber.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" strokeWidth={2.5} />
                          <span>Aprobar</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => toggleBarberStatus(barber.id, barber.status)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                          barber.status === 'active' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/30' 
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/30'
                        }`}
                        disabled={barber.status === 'pending'}
                      >
                        {barber.status === 'active' ? (
                          <>
                            <ToggleLeft className="h-4 w-4" strokeWidth={2.5} />
                            <span>Desactivar</span>
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4" strokeWidth={2.5} />
                            <span>Activar</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(barber.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para agregar/editar barbero */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingBarber ? 'Editar Barbero' : 'Agregar Nuevo Barbero'}
              </h2>
              <button 
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-6">
              <BarberForm 
                formData={formData} 
                setFormData={setFormData} 
                onSubmit={handleSubmit} 
                saving={saving} 
                isEditing={!!editingBarber} 
              />
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

export default BarbersManagement;