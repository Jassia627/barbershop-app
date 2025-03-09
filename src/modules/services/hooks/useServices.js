// src/modules/services/hooks/useServices.js
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth';
import { 
  fetchServices, 
  createService, 
  updateService, 
  deleteService, 
  fetchPendingHaircuts, 
  updateHaircutStatus,
  fetchAllHaircuts,
  fetchBarbers
} from '../services/serviceService';
import { toast } from 'react-hot-toast';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';
import { logDebug, logError } from '../../../core/utils/logger';

export const useServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [pendingHaircuts, setPendingHaircuts] = useState([]);
  const [allHaircuts, setAllHaircuts] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!user || !user.shopId) {
        logDebug("No hay usuario o shopId disponible");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        logDebug("Cargando servicios para shopId:", user.shopId);
        const serviceData = await fetchServices(user.shopId);
        if (isMounted) setServices(serviceData);
        
        // Cargar cortes pendientes tanto para admin como para barberos
        try {
          // Para admin: todos los cortes pendientes de la tienda
          // Para barbero: solo sus cortes pendientes
          const haircutData = user.role === 'admin' 
            ? await fetchPendingHaircuts(user.shopId)
            : await fetchPendingHaircuts(user.shopId, user.uid);
          
          logDebug(`Cortes pendientes cargados (${user.role}):`, haircutData.length);
          if (isMounted) setPendingHaircuts(haircutData);
        } catch (error) {
          logError("Error al cargar cortes pendientes");
          toast.error("Error al cargar cortes pendientes");
        }
        
        // Cargar todos los cortes confirmados tanto para admin como para barberos
        try {
          // Para admin: todos los cortes confirmados de la tienda
          // Para barbero: solo sus cortes confirmados
          const allHaircutsData = user.role === 'admin'
            ? await fetchAllHaircuts(user.shopId)
            : await fetchAllHaircuts(user.shopId, user.uid);
          
          logDebug(`Cortes confirmados cargados (${user.role}):`, allHaircutsData.length);
          if (isMounted) setAllHaircuts(allHaircutsData);
        } catch (error) {
          logError("Error al cargar historial de cortes");
          toast.error("Error al cargar historial de cortes");
        }
        
        if (user.role === 'admin') {
          try {
            const barbersData = await fetchBarbers(user.shopId);
            logDebug("Barberos cargados:", barbersData.length);
            if (isMounted) setBarbers(barbersData);
          } catch (error) {
            logError("Error al cargar barberos");
            toast.error("Error al cargar barberos");
          }
        }
      } catch (error) {
        logError("Error al cargar datos");
        if (isMounted) toast.error("Error al cargar datos");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  const saveService = async (serviceData, serviceId = null) => {
    try {
      const data = {
        ...serviceData,
        shopId: user.shopId,
        active: true,
        updatedAt: new Date().toISOString()
      };
      if (serviceId) {
        await updateService(serviceId, data);
        setServices(prev => prev.map(s => s.id === serviceId ? { ...s, ...data } : s));
        toast.success("Servicio actualizado");
      } else {
        data.createdAt = new Date().toISOString();
        const docRef = await createService(data);
        setServices(prev => [...prev, { id: docRef.id, ...data }]);
        toast.success("Servicio creado");
      }
      return true;
    } catch (error) {
      toast.error("Error al guardar servicio");
      return false;
    }
  };

  const deleteService = async (serviceId) => {
    try {
      await deleteService(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast.success("Servicio eliminado");
    } catch (error) {
      toast.error("Error al eliminar servicio");
    }
  };

  // Función para recargar los cortes confirmados
  const reloadConfirmedHaircuts = async () => {
    if (!user || !user.shopId) return;
    
    try {
      logDebug("Recargando cortes confirmados para:", user.role, user.uid);
      
      // Para admin: todos los cortes confirmados de la tienda
      // Para barbero: solo sus cortes confirmados
      const allHaircutsData = user.role === 'admin'
        ? await fetchAllHaircuts(user.shopId)
        : await fetchAllHaircuts(user.shopId, user.uid);
      
      logDebug("Cortes confirmados recargados:", allHaircutsData.length);
      setAllHaircuts(allHaircutsData);
    } catch (error) {
      logError("Error al recargar cortes confirmados");
      toast.error("Error al recargar cortes confirmados");
    }
  };

  const approveHaircut = async (haircutId) => {
    try {
      await updateHaircutStatus(haircutId, 'confirmed');
      
      // Encontrar el corte en pendingHaircuts antes de eliminarlo
      const approvedHaircut = pendingHaircuts.find(h => h.id === haircutId);
      
      // Eliminar de pendingHaircuts
      setPendingHaircuts(prev => prev.filter(h => h.id !== haircutId));
      
      // Recargar los cortes confirmados para asegurar que se muestre el recién aprobado
      await reloadConfirmedHaircuts();
      
      toast.success("Corte aprobado");
    } catch (error) {
      logError("Error al aprobar corte");
      toast.error("Error al aprobar corte");
    }
  };

  const rejectHaircut = async (haircutId) => {
    try {
      await updateHaircutStatus(haircutId, 'rejected');
      setPendingHaircuts(prev => prev.filter(h => h.id !== haircutId));
      toast.success("Corte rechazado");
    } catch (error) {
      toast.error("Error al rechazar corte");
    }
  };

  const saveHaircut = async (haircutData) => {
    try {
      if (!user || !user.shopId) {
        toast.error("Error: No se puede identificar la barbería");
        return false;
      }

      const newHaircut = {
        ...haircutData,
        shopId: user.shopId,
        barberId: user.uid,
        barberName: user.name,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      await addDoc(collection(db, "haircuts"), newHaircut);
      toast.success("Corte registrado con éxito");
      return true;
    } catch (error) {
      logError("Error al registrar corte");
      toast.error("Error al registrar corte");
      return false;
    }
  };

  return { 
    services, 
    pendingHaircuts, 
    allHaircuts,
    barbers,
    loading, 
    saveService, 
    deleteService, 
    approveHaircut, 
    rejectHaircut,
    saveHaircut,
    reloadConfirmedHaircuts
  };
};