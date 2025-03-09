// src/core/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../modules/auth';
import { AppointmentBooking, AppointmentsManagement, BarberAppointments } from '../../modules/appointments';
import { Login, Register } from '../../modules/auth';
import { BarbersManagement, Profile, ScheduleManagement } from '../../modules/barbers';
import { ServicesManagement, NewHaircut, AdminNewHaircut, PendingHaircuts, BarberHaircutHistory } from '../../modules/services';
import { Inventory, Sales } from '../../modules/inventory';
import { Expenses } from '../../modules/expenses';
import { AdminDashboard, BarberDashboard } from '../../modules/dashboard';
import { Navbar } from '../../modules/shared';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { logDebug } from '../utils/logger';

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [defaultShopId, setDefaultShopId] = useState(null);
  const [loadingShop, setLoadingShop] = useState(true);

  // Obtener un ID de tienda válido para redirecciones
  useEffect(() => {
    const fetchDefaultShop = async () => {
      try {
        // Buscar una tienda (usuario con rol admin e isShopOwner)
        const q = query(
          collection(db, "users"),
          where("role", "==", "admin"),
          where("isShopOwner", "==", true),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Usar el ID del primer documento como shopId por defecto
          setDefaultShopId(querySnapshot.docs[0].id);
        } else {
          // Si no hay tiendas, usar un valor por defecto
          logDebug("No se encontraron tiendas en la base de datos");
          setDefaultShopId("default");
        }
      } catch (error) {
        logDebug("Error al obtener tienda por defecto");
        setDefaultShopId("default");
      } finally {
        setLoadingShop(false);
      }
    };
    
    fetchDefaultShop();
  }, []);

  logDebug("AppRoutes: Renderizando, user:", user, "loading:", loading);

  if (loading || loadingShop) {
    logDebug("AppRoutes: Mostrando pantalla de carga");
    return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  }

  logDebug("AppRoutes: Cargando rutas, usuario autenticado:", !!user);

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/book/:shopId" element={<AppointmentBooking />} />

      {/* Rutas autenticadas */}
      {user && (
        <Route path="*" element={<div><Navbar /><div className="container mx-auto p-4"><Routes>
          <Route index element={<Navigate to={user.role === 'admin' ? 'admin' : 'barber'} replace />} />
          {user.role === 'admin' && (
            <>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/barbers" element={<BarbersManagement />} />
              <Route path="admin/appointments" element={<AppointmentsManagement />} />
              <Route path="admin/schedules" element={<ScheduleManagement />} />
              <Route path="admin/services" element={<ServicesManagement />} />
              <Route path="admin/new-haircut" element={<AdminNewHaircut />} />
              <Route path="admin/pending-haircuts" element={<PendingHaircuts />} />
              <Route path="admin/inventory" element={<Inventory />} />
              <Route path="admin/sales" element={<Sales />} />
              <Route path="admin/expenses" element={<Expenses />} />
            </>
          )}
          {user.role === 'barber' && (
            <>
              <Route path="barber" element={<BarberDashboard />} />
              <Route path="barber/profile" element={<Profile />} />
              <Route path="barber/schedule" element={<ScheduleManagement />} />
              <Route path="barber/appointments" element={<BarberAppointments />} />
              <Route path="barber/new-haircut" element={<NewHaircut />} />
              <Route path="barber/haircuts" element={<BarberHaircutHistory />} />
            </>
          )}
        </Routes></div></div>}
        />
      )}

      {/* Ruta por defecto para no autenticados - Redirección al login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;