// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

// Páginas públicas
import Login from '../pages/Login';
import Register from '../pages/Register';
import BookingPage from '../pages/client/BookingPage';
import NotFound from '../pages/NotFound';

// Páginas de administrador
import AdminDashboard from '../pages/admin/Dashboard';
import AdminNewHaircut from '../pages/admin/AdminNewHaircut';
import BarbersManagement from '../pages/admin/BarbersManagement';
import ServicesManagement from '../pages/admin/ServicesManagement';
import HaircutApprovals from '../pages/admin/HaircutApprovals';
import Inventory from '../pages/admin/Inventory';
import Expenses from '../pages/admin/Expenses';
import AdminScheduleManagement from '../pages/admin/ScheduleManagement';
import AppointmentsManagement from '../pages/admin/AppointmentsManagement';

// Páginas de barbero
import BarberDashboard from '../pages/barber/Dashboard';
import NewHaircut from '../pages/barber/NewHaircut';
import Profile from '../pages/barber/Profile';
import Services from '../pages/barber/Services';
import BarberSchedule from '../pages/barber/ScheduleManagement';

const AppRoutes = () => {
 const { user, loading } = useAuth();

 if (loading) {
   return <div className="flex justify-center items-center min-h-screen">
     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
   </div>;
 }

 if (!user) {
   return (
     <Routes>
       <Route path="/login" element={<Login />} />
       <Route path="/register" element={<Register />} />
       <Route path="/book/:shopId" element={<BookingPage />} />
       <Route path="*" element={<Navigate to="/login" replace />} />
     </Routes>
   );
 }

 return (
   <Routes>
     <Route path="/" element={<Layout />}>
       <Route index element={
         <Navigate to={user.role === 'admin' ? '/admin' : '/barber'} replace />
       } />

       {/* Rutas de Administrador */}
       {user.role === 'admin' && (
         <>
           <Route path="/admin" element={<AdminDashboard />} />
           <Route path="/admin/schedules" element={<AdminScheduleManagement />} />
           <Route path="/admin/barbers" element={<BarbersManagement />} />
           <Route path="/admin/services" element={<ServicesManagement />} />
           <Route path="/admin/approvals" element={<HaircutApprovals />} />
           <Route path="/admin/inventory" element={<Inventory />} />
           <Route path="/admin/expenses" element={<Expenses />} />
           <Route path="/admin/new-haircut" element={<AdminNewHaircut />} />
           <Route path="/admin/appointments" element={<AppointmentsManagement />} />
           <Route path="/book/:shopId" element={<BookingPage />} />
         </>
       )}

       {/* Rutas de Barbero */}
       {user.role === 'barber' && (
         <>
           <Route path="/barber" element={<BarberDashboard />} />
           <Route path="/barber/schedule" element={<BarberSchedule />} />
           <Route path="/barber/new-haircut" element={<NewHaircut />} />
           <Route path="/barber/profile" element={<Profile />} />
           <Route path="/barber/services" element={<Services />} />
         </>
       )}

       <Route path="*" element={<NotFound />} />
     </Route>
   </Routes>
 );
};

export default AppRoutes;