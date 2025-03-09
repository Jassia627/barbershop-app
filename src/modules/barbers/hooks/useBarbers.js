// src/modules/barbers/hooks/useBarbers.js
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth';
import { fetchBarbers, addBarber, updateBarberStatus, deleteBarber as deleteBarberService } from '../services/barberService';
import { toast } from 'react-hot-toast';

export const useBarbers = () => {
  const { user } = useAuth();
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBarbers = async () => {
      try {
        const barberData = await fetchBarbers(user.shopId);
        setBarbers(barberData);
      } catch (error) {
        toast.error("Error al cargar barberos");
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'admin') {
      loadBarbers();
    }
  }, [user]);

  const saveBarber = async (barberData) => {
    try {
      const data = await addBarber(barberData, user.shopId);
      setBarbers(prev => [...prev, data]);
      return true;
    } catch (error) {
      toast.error(error.message || "Error al añadir barbero");
      return false;
    }
  };

  const approveBarber = async (barberId) => {
    try {
      await updateBarberStatus(barberId, 'active');
      setBarbers(prev => prev.map(b => b.id === barberId ? { ...b, status: 'active' } : b));
      toast.success("Barbero aprobado");
    } catch (error) {
      toast.error("Error al aprobar barbero");
    }
  };

  const deleteBarber = async (barberId) => {
    try {
      await deleteBarberService(barberId);
      setBarbers(prev => prev.filter(b => b.id !== barberId));
      toast.success("Barbero eliminado con éxito");
      return true;
    } catch (error) {
      toast.error("Error al eliminar barbero");
      return false;
    }
  };

  return { barbers, setBarbers, loading, saveBarber, approveBarber, deleteBarber };
};