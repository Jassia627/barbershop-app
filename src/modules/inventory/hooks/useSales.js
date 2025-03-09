import { useState, useEffect } from 'react';
import { useAuth } from '../../auth';
import { fetchSales, createSale, cancelSale } from '../services/salesService';
import { toast } from 'react-hot-toast';

export const useSales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    todaySales: 0,
    todayRevenue: 0
  });

  useEffect(() => {
    const loadSales = async () => {
      if (!user) {
        console.error("Usuario no disponible para cargar ventas");
        setError("No se pudo cargar las ventas: usuario no autenticado");
        setLoading(false);
        return;
      }
      
      try {
        // Información detallada para depuración
        console.log("Información de usuario para cargar ventas:", {
          uid: user.uid,
          email: user.email,
          role: user.role,
          shopId: user.shopId
        });
        
        // Verificar si el usuario es admin
        const isAdmin = user.role === 'admin';
        console.log("¿El usuario es admin?", isAdmin);
        
        if (!isAdmin && !user.shopId) {
          console.error("Usuario no admin sin shopId asignado");
          setError("No se pudo cargar las ventas: usuario sin tienda asignada");
          setLoading(false);
          return;
        }
        
        console.log("Intentando cargar ventas para shopId:", user.shopId);
        
        try {
          const salesData = await fetchSales(user.shopId);
          console.log("Ventas cargadas:", salesData.length);
          setSales(salesData);
          
          // Calcular estadísticas
          calculateStats(salesData);
          
          setError(null);
        } catch (error) {
          // Manejar específicamente errores de formato de fecha
          if (error.message && error.message.includes("toDate is not a function")) {
            console.error("Error de formato de fecha en las ventas:", error);
            toast.error("Error al procesar fechas de ventas. Contacte al administrador.", { duration: 5000 });
          } else {
            console.error("Error al cargar ventas:", error);
            
            let errorMessage = "Error al cargar ventas";
            
            // Manejar específicamente el error de permisos
            if (error.code === 'permission-denied') {
              errorMessage = `Error de permisos: El usuario ${user.email} (${user.role}) no tiene acceso a la colección de ventas`;
            }
            
            toast.error(errorMessage, { duration: 5000 });
          }
          
          // Establecer ventas como array vacío para evitar errores en la interfaz
          setSales([]);
          setError(error);
        }
      } catch (error) {
        console.error("Error general al cargar ventas:", error);
        toast.error("Error inesperado al cargar ventas", { duration: 5000 });
        setSales([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSales();
  }, [user]);

  // Calcular estadísticas de ventas
  const calculateStats = (salesData) => {
    if (!salesData || salesData.length === 0) {
      setStats({
        totalSales: 0,
        totalRevenue: 0,
        todaySales: 0,
        todayRevenue: 0
      });
      return;
    }
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let totalSales = 0;
      let totalRevenue = 0;
      let todaySales = 0;
      let todayRevenue = 0;
      
      salesData.forEach(sale => {
        if (sale.status !== 'cancelled') {
          // Total de ventas
          totalSales++;
          totalRevenue += sale.total || 0;
          
          // Ventas de hoy
          try {
            const saleDate = new Date(sale.createdAt);
            saleDate.setHours(0, 0, 0, 0);
            
            if (saleDate.getTime() === today.getTime()) {
              todaySales++;
              todayRevenue += sale.total || 0;
            }
          } catch (error) {
            console.warn("Error al procesar fecha de venta:", error);
          }
        }
      });
      
      setStats({
        totalSales,
        totalRevenue,
        todaySales,
        todayRevenue
      });
    } catch (error) {
      console.error("Error al calcular estadísticas:", error);
      // Establecer valores por defecto en caso de error
      setStats({
        totalSales: 0,
        totalRevenue: 0,
        todaySales: 0,
        todayRevenue: 0
      });
    }
  };

  // Registrar una nueva venta
  const registerSale = async (saleData) => {
    if (!user) {
      toast.error("No se puede registrar la venta: usuario no autenticado");
      return false;
    }
    
    // Verificar si el usuario es admin
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
      toast.error("No tienes permisos para registrar ventas. Se requiere rol de administrador.");
      return false;
    }
    
    try {
      const data = {
        ...saleData,
        shopId: user.shopId,
        sellerName: user.name || user.email,
        sellerId: user.uid
      };
      
      console.log("Registrando venta con datos:", data);
      
      const newSale = await createSale(data);
      setSales(prev => [newSale, ...prev]);
      
      // Actualizar estadísticas
      calculateStats([newSale, ...sales]);
      
      toast.success("Venta registrada con éxito");
      return true;
    } catch (error) {
      console.error("Error al registrar venta:", error);
      
      let errorMessage = "Error al registrar venta";
      
      // Manejar específicamente el error de permisos
      if (error.code === 'permission-denied') {
        errorMessage = `Error de permisos: El usuario ${user.email} (${user.role}) no tiene permisos para registrar ventas`;
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  // Cancelar una venta
  const cancelSaleById = async (saleId) => {
    if (!user) {
      toast.error("No se puede cancelar la venta: usuario no autenticado");
      return false;
    }
    
    // Verificar si el usuario es admin
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
      toast.error("No tienes permisos para cancelar ventas. Se requiere rol de administrador.");
      return false;
    }
    
    try {
      await cancelSale(saleId);
      
      // Actualizar el estado local
      setSales(prev => prev.map(sale => 
        sale.id === saleId 
          ? { ...sale, status: 'cancelled' } 
          : sale
      ));
      
      // Recalcular estadísticas
      calculateStats(sales.map(sale => 
        sale.id === saleId 
          ? { ...sale, status: 'cancelled' } 
          : sale
      ));
      
      toast.success("Venta cancelada con éxito");
      return true;
    } catch (error) {
      console.error("Error al cancelar venta:", error);
      toast.error("Error al cancelar venta: " + error.message);
      return false;
    }
  };

  return { 
    sales, 
    loading, 
    error, 
    stats,
    registerSale,
    cancelSale: cancelSaleById
  };
}; 