// src/modules/dashboard/services/dashboardService.js
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';

export const fetchAdminStats = async (shopId) => {
  // Ventas y cortes desde haircuts
  const haircutsQuery = query(collection(db, "haircuts"), where("shopId", "==", shopId));
  const haircutsSnapshot = await getDocs(haircutsQuery);
  const haircuts = haircutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const totalSales = haircuts.reduce((sum, h) => sum + (h.price || 0), 0);
  const totalHaircuts = haircuts.length;

  // Datos para gráfico (ventas por día)
  const salesByDay = haircuts.reduce((acc, h) => {
    if (!h.createdAt) return acc;
    try {
      const date = new Date(h.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      acc[date] = (acc[date] || 0) + (h.price || 0);
    } catch (error) {
      console.error("Error al procesar fecha:", error);
    }
    return acc;
  }, {});
  const salesChartData = Object.entries(salesByDay).map(([name, value]) => ({ name, value }));

  // Gastos
  const expensesQuery = query(collection(db, "expenses"), where("shopId", "==", shopId));
  const expensesSnapshot = await getDocs(expensesQuery);
  const expenses = expensesSnapshot.docs.map(doc => doc.data());
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Barberos activos
  const barbersQuery = query(
    collection(db, "users"),
    where("shopId", "==", shopId),
    where("role", "==", "barber"),
    where("status", "==", "active")
  );
  const barbersSnapshot = await getDocs(barbersQuery);
  const activeBarbers = barbersSnapshot.docs.length;

  return { totalSales, totalHaircuts, salesChartData, totalExpenses, activeBarbers };
};

export const fetchBarberStats = async (shopId, barberId) => {
  try {
    console.log("Obteniendo estadísticas para barbero:", barberId, "en tienda:", shopId);
    
    // Obtener cortes confirmados del barbero
    const confirmedHaircutsQuery = query(
      collection(db, "haircuts"),
      where("shopId", "==", shopId),
      where("barberId", "==", barberId),
      where("status", "==", "confirmed")
    );
    const confirmedHaircutsSnapshot = await getDocs(confirmedHaircutsQuery);
    const confirmedHaircuts = confirmedHaircutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log("Cortes confirmados encontrados:", confirmedHaircuts.length);
    
    // Calcular ganancias totales
    const totalSales = confirmedHaircuts.reduce((sum, h) => sum + (h.price || 0), 0);
    
    // Datos para gráfico (ventas por día)
    const salesByDay = confirmedHaircuts.reduce((acc, h) => {
      if (!h.createdAt) return acc;
      
      try {
        const date = new Date(h.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        acc[date] = (acc[date] || 0) + (h.price || 0);
      } catch (error) {
        console.error("Error al procesar fecha:", error);
      }
      return acc;
    }, {});
    
    const salesChartData = Object.entries(salesByDay).map(([name, value]) => ({ name, value }));
    
    const result = { 
      totalSales, 
      totalHaircuts: confirmedHaircuts.length, 
      salesChartData,
      // Valores por defecto para otros campos que no aplican a barberos
      totalExpenses: 0,
      activeBarbers: 0
    };
    
    console.log("Estadísticas del barbero:", result);
    return result;
  } catch (error) {
    console.error("Error al obtener estadísticas del barbero:", error);
    return { 
      totalSales: 0, 
      totalHaircuts: 0, 
      salesChartData: [],
      totalExpenses: 0,
      activeBarbers: 0
    };
  }
};