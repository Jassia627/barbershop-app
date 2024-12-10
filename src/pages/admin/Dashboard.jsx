import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiUsers, FiActivity, FiCalendar, FiClock } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBarbers: 0,
    activeBarbers: 0,
    pendingBarbers: 0,
    todayServices: 0,
    todayEarnings: 0,
    monthlyServices: 0,
    monthlyEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentServices, setRecentServices] = useState([]);
  const [pendingServices, setPendingServices] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.shopId) return;

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Consulta de barberos
        const barbersQuery = query(
          collection(db, "users"),
          where("role", "==", "barber"),
          where("shopId", "==", user.shopId)
        );
        const barbersSnapshot = await getDocs(barbersQuery);
        const barberIds = barbersSnapshot.docs.map((doc) => doc.id);
        const totalBarbers = barbersSnapshot.size;
        const activeBarbers = barbersSnapshot.docs.filter(
          (doc) => doc.data().status === "active"
        ).length;
        const pendingBarbers = barbersSnapshot.docs.filter(
          (doc) => doc.data().status === "pending"
        ).length;

        // Consulta de todos los servicios de la tienda
        const servicesQuery = query(
          collection(db, "haircuts"),
          where("shopId", "==", user.shopId)
        );
        
        const servicesSnapshot = await getDocs(servicesQuery);
        const allServices = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filtrar servicios en memoria
        const todayStart = today.toISOString();
        const monthStart = firstDayOfMonth.toISOString();

        const completedServices = allServices.filter(
          service => 
            service.status === "completed" && 
            service.createdAt >= todayStart
        );

        const pendingServicesData = allServices.filter(
          service => service.status === "pending"
        );

        const monthlyServices = allServices.filter(
          service => 
            service.status === "completed" && 
            service.createdAt >= monthStart
        );

        const todayEarnings = completedServices.reduce((sum, service) => sum + (service.price || 0), 0);
        const monthlyEarnings = monthlyServices.reduce((sum, service) => sum + (service.price || 0), 0);

        setStats({
          totalBarbers,
          activeBarbers,
          pendingBarbers,
          todayServices: completedServices.length,
          todayEarnings,
          monthlyServices: monthlyServices.length,
          monthlyEarnings,
        });

        // Ordenar servicios por fecha
        const sortedCompletedServices = completedServices
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        
        const sortedPendingServices = pendingServicesData
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setRecentServices(sortedCompletedServices);
        setPendingServices(sortedPendingServices);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Error al cargar los datos del dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.shopId]);

  const ServiceList = ({ services, isPending }) => (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">
        {isPending ? "Servicios Pendientes" : "Servicios Completados Recientes"}
      </h3>
      
      {/* Tabla para pantallas medianas y grandes */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Servicio
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Barbero
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.map((service) => (
              <tr key={service.id}>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{service.clientName}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{service.serviceName}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{service.barberName}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">${service.price?.toFixed(2)}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  {format(new Date(service.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })}
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 sm:px-6 py-4 text-center text-gray-500">
                  No hay servicios {isPending ? "pendientes" : "completados"}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas para móviles */}
      <div className="md:hidden space-y-4">
        {services.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            No hay servicios {isPending ? "pendientes" : "completados"}.
          </p>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="bg-white border rounded-lg shadow-sm p-2 space-y-1"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{service.clientName}</p>
                  <p className="text-xs text-gray-600">{service.serviceName}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  ${service.price?.toFixed(2)}
                </p>
              </div>
              <div className="pt-1 border-t border-gray-100 text-xs text-gray-600">
                <p>Barbero: {service.barberName}</p>
                <p>{format(new Date(service.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <motion.div
          className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "mirror" }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <motion.h1
        className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 sm:mb-10 text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {user?.shopName || "Dashboard"}
      </motion.h1>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-10">
        {[
          {
            icon: <FiUsers className="text-indigo-500 text-2xl sm:text-4xl" />,
            title: "Barberos",
            value: `${stats.activeBarbers} / ${stats.totalBarbers}`,
            subtitle: `${stats.pendingBarbers} pendientes`,className
          },
          {
            icon: <FiActivity className="text-green-500 text-2xl sm:text-4xl" />,
            title: "Servicios Hoy",
            value: stats.todayServices,
            subtitle: `${stats.todayEarnings.toFixed(2)}`,
          },
          {
            icon: <FiCalendar className="text-purple-500 text-2xl sm:text-4xl" />,
            title: "Servicios Mensuales",
            value: stats.monthlyServices,
            subtitle: `${stats.monthlyEarnings.toFixed(2)}`,
          },
          {
            icon: <FiClock className="text-orange-500 text-2xl sm:text-4xl" />,
            title: "Servicios Pendientes",
            value: pendingServices.length,
            subtitle: "Por aprobar",
          },
        ].map((card, index) => (
          <motion.div
            key={index}
            className="bg-white shadow-lg rounded-xl p-3 sm:p-6 hover:shadow-xl transition-shadow duration-300"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
          >
            <div className="flex items-center space-x-2 sm:space-x-4">
              {card.icon}
              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-600">{card.title}</h3>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs sm:text-sm text-gray-500">{card.subtitle}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Servicios Pendientes */}
      <ServiceList services={pendingServices} isPending={true} />

      {/* Servicios Completados Recientes */}
      <ServiceList services={recentServices} isPending={false} />
    </div>
  );
};

export default AdminDashboard;