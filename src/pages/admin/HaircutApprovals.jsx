// src/pages/admin/HaircutApprovals.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Check, X, Clock, DollarSign, Calendar, CreditCard, User, Scissors, FileText } from 'lucide-react';
import formatMoney from '../../utils/format'; 

const HaircutApprovals = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingServices();
  }, [user?.shopId]);

  const fetchPendingServices = async () => {
    if (!user?.shopId) return;

    try {
      const q = query(
        collection(db, "haircuts"),
        where("shopId", "==", user.shopId),
        where("approvalStatus", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesData);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Error al cargar los servicios pendientes");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (serviceId, approved) => {
    try {
      const serviceRef = doc(db, "haircuts", serviceId);
      const updateData = {
        approvalStatus: approved ? 'approved' : 'rejected',
        status: approved ? 'completed' : 'rejected',
        approvedAt: new Date().toISOString(),
        approvedBy: user.uid,
        approvedByName: user.name
      };

      await updateDoc(serviceRef, updateData);
      setServices(services.filter(service => service.id !== serviceId));
      toast.success(`Servicio ${approved ? 'aprobado' : 'rechazado'} exitosamente`);
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Error al actualizar el servicio");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 
          ${theme === 'dark' ? 'border-white' : 'border-blue-600'}`}
        />
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 max-w-7xl transition-colors duration-200
      ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}
    >
      <div className="flex items-center gap-4 mb-8">
        <h1 className={`text-3xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Aprobación de Servicios
        </h1>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
          ${theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}
        >
          {services.length} pendientes
        </span>
      </div>

      {services.length === 0 ? (
        <div className={`rounded-lg shadow-md p-12 flex flex-col items-center justify-center
          ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
        >
          <Check className="w-12 h-12 text-green-500 mb-4" />
          <p className={theme === 'dark' ? 'text-xl text-gray-300' : 'text-xl text-gray-500'}>
            No hay servicios pendientes de aprobación
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div 
              key={service.id} 
              className={`rounded-lg shadow-md hover:shadow-lg transition-all
                ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className={`text-xl font-semibold
                    ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                  >
                    {service.serviceName}
                  </h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full 
                    text-xs font-medium ${
                      theme === 'dark' 
                        ? 'bg-yellow-900/30 text-yellow-400' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    Pendiente
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 
                    ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">Cliente: {service.clientName}</span>
                  </div>
                  <div className={`flex items-center gap-2 
                    ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    <Scissors className="w-4 h-4" />
                    <span className="text-sm">Barbero: {service.barberName}</span>
                  </div>
                  <div className={`flex items-center gap-2 
                    ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Precio: {formatMoney(service.price)}</span>
                  </div>
                  <div className={`flex items-center gap-2 
                    ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {format(new Date(service.createdAt), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 
                    ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">Método: {service.paymentMethod}</span>
                  </div>
                  {service.notes && (
                    <div className={`flex items-start gap-2 
                      ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      <FileText className="w-4 h-4 mt-1" />
                      <span className="text-sm">{service.notes}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleApproval(service.id, true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                        bg-green-600 dark:bg-green-500 text-white rounded-md 
                        hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleApproval(service.id, false)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                        bg-red-600 dark:bg-red-500 text-white rounded-md 
                        hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HaircutApprovals;