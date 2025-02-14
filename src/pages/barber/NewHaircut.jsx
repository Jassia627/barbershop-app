// src/pages/barber/NewHaircut.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Scissors,
  Clock,
  User,
  ArrowLeft,
  Check,
  ChevronDown,
  Wallet,
  CreditCard,
  SendHorizontal,
  DollarSign
} from 'lucide-react';

// Componente del ComboBox
const ServiceSelect = ({ services, selectedService, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 
          rounded-xl p-4 flex items-center justify-between hover:border-blue-500 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 
            flex items-center justify-center">
            <Scissors className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <span className="block text-sm text-gray-500 dark:text-gray-400">
              Servicio seleccionado
            </span>
            <span className="block font-medium text-gray-900 dark:text-white">
              {selectedService ? selectedService.name : 'Seleccionar servicio'}
            </span>
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 
            ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* Lista desplegable */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl 
          shadow-lg border border-gray-200 dark:border-gray-700 py-2 max-h-[300px] overflow-y-auto">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => {
                onSelect(service);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 
                dark:hover:bg-gray-700/50 transition-colors ${
                  selectedService?.id === service.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${selectedService?.id === service.id 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  {selectedService?.id === service.id ? (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Scissors className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div className="text-left">
                  <span className="block font-medium text-gray-900 dark:text-white">
                    {service.name}
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-1" />
                      {service.duration} min
                    </div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      ${service.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente principal
const NewHaircut = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentData = location.state || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    clientName: appointmentData.clientName || '',
    paymentMethod: 'cash'
  });

  useEffect(() => {
    if (user?.shopId) {
      fetchServices();
    }
  }, [user?.shopId]);

  const fetchServices = async () => {
    try {
      const q = query(
        collection(db, "services"),
        where("shopId", "==", user.shopId),
        where("active", "==", true)
      );
      const querySnapshot = await getDocs(q);
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesData);
      
      if (appointmentData.serviceId) {
        const service = servicesData.find(s => s.id === appointmentData.serviceId);
        setSelectedService(service);
      }
    } catch (error) {
      toast.error("Error al cargar los servicios");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !formData.clientName.trim()) {
      toast.error("Selecciona un servicio y nombre del cliente");
      return;
    }

    setSaving(true);
    try {
      const haircutData = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        clientName: formData.clientName.trim(),
        paymentMethod: formData.paymentMethod,
        barberId: user.uid,
        barberName: user.name,
        shopId: user.shopId,
        shopName: user.shopName,
        createdAt: new Date().toISOString(),
        status: 'pending',
        approvalStatus: 'pending',
        appointmentId: appointmentData.appointmentId || null
      };

      await addDoc(collection(db, "haircuts"), haircutData);
      toast.success("¡Servicio registrado con éxito! ✂️");
      navigate('/barber');
    } catch (error) {
      toast.error("Error al registrar el servicio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Scissors className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            Cargando servicios...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {saving && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  Guardando servicio
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Un momento por favor...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/barber')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nuevo Servicio
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {user.name}
            </span>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="space-y-6">
          {/* Nombre del Cliente */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Datos del Cliente
            </h2>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-transparent 
                focus:border-blue-500 outline-none transition-colors"
              placeholder="Nombre del cliente"
            />
          </div>

          {/* Selector de Servicio */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-blue-600" />
              Seleccionar Servicio
            </h2>
            <ServiceSelect
              services={services}
              selectedService={selectedService}
              onSelect={setSelectedService}
            />
          </div>

          {/* Método de Pago */}
          {selectedService && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Método de Pago
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'cash', name: 'Efectivo', icon: Wallet },
                  { id: 'card', name: 'Tarjeta', icon: CreditCard },
                  { id: 'transfer', name: 'Transferencia', icon: SendHorizontal }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setFormData({...formData, paymentMethod: method.id})}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200
                      ${formData.paymentMethod === method.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <method.icon className={`w-6 h-6 ${
                      formData.paymentMethod === method.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400'
                    }`} />
                    <span className="font-medium text-sm">
                      {method.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Total y Botón de Registro */}
          {selectedService && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex justify-between items-center mb-4">
                <span className="text-blue-100">Total a cobrar</span>
                <span className="text-3xl font-bold">
                  ${selectedService.price.toLocaleString()}
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!formData.clientName.trim() || saving}
                className="w-full py-4 bg-white text-blue-600 rounded-xl font-semibold
                  hover:bg-blue-50 transition-colors flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Scissors className="w-5 h-5" />
                {saving ? 'Guardando...' : 'Registrar Servicio'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewHaircut;