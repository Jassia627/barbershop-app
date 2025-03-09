// src/modules/dashboard/hooks/useDashboard.js
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth';
import { fetchAdminStats, fetchBarberStats } from '../services/dashboardService';
import { toast } from 'react-hot-toast';

export const useDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalHaircuts: 0,
    salesChartData: [],
    totalExpenses: 0,
    activeBarbers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user || !user.shopId) {
        console.log("No hay usuario o shopId disponible");
        setLoading(false);
        return;
      }

      try {
        console.log("Cargando estadísticas para:", user.role, user.uid);
        let statsData;
        
        if (user.role === 'admin') {
          // Cargar estadísticas para administradores
          statsData = await fetchAdminStats(user.shopId);
        } else if (user.role === 'barber') {
          // Cargar estadísticas para barberos
          statsData = await fetchBarberStats(user.shopId, user.uid);
        }
        
        if (statsData) {
          console.log("Estadísticas cargadas:", statsData);
          setStats(statsData);
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        toast.error("Error al cargar estadísticas");
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [user]);

  return { stats, loading };
};