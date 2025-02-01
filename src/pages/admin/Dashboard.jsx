// src\pages\admin\Dashboard.jsx
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Calendar,
  DollarSign,
  Scissors,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import formatMoney from "../../utils/format";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
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
    fetchDashboardData();
  }, [user?.shopId]);

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
      const totalBarbers = barbersSnapshot.size;
      const activeBarbers = barbersSnapshot.docs.filter(
        (doc) => doc.data().status === "active"
      ).length;
      const pendingBarbers = barbersSnapshot.docs.filter(
        (doc) => doc.data().status === "pending"
      ).length;

      // Consulta de servicios
      const servicesQuery = query(
        collection(db, "haircuts"),
        where("shopId", "==", user.shopId)
      );
      
      const servicesSnapshot = await getDocs(servicesQuery);
      const allServices = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

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

      setRecentServices(completedServices.slice(0, 5));
      setPendingServices(pendingServicesData.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  };


  const translatePaymentMethod = (method) => {
    const methods = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia'
    };
    return methods[method] || method;
  };
  
  const ServiceList = ({ services, isPending }) => (
    <div className={`rounded-lg shadow-lg p-6 transition-colors duration-200 ${
      theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
    }`}>
      <h3 className="text-lg font-semibold mb-4 text-yellow-500">
        {isPending ? "Servicios Pendientes" : "Servicios Completados Recientes"}
      </h3>
      
      {/* Tabla para pantallas medianas y grandes */}
      <div className="hidden md:block overflow-x-auto bg-white dark:bg-gray-800 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Cliente
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Servicio
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Barbero
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Método de Pago
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Precio
            </th>
            <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {services.map((service) => (
            <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {service.clientName}
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {service.serviceName}
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {service.barberName}
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${service.paymentMethod === 'cash' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                    : service.paymentMethod === 'card' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}
                >
                  {translatePaymentMethod(service.paymentMethod)}
                </span>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-500">
                {formatMoney(service.price)}
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {format(new Date(service.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: es,
                })}
              </td>
            </tr>
          ))}
          {services.length === 0 && (
            <tr>
              <td 
                colSpan="6" 
                className="px-4 sm:px-6 py-4 text-center text-gray-500 dark:text-gray-400"
              >
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
          <p className="text-center text-gray-400 py-4">
            No hay servicios {isPending ? "pendientes" : "completados"}.
          </p>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="bg-gray-700 border border-gray-600 rounded-lg shadow-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-200">{service.clientName}</p>
                  <p className="text-sm text-gray-400">{service.serviceName}</p>
                  <p className="text-sm text-gray-400">Barbero: {service.barberName}</p>
                </div>
                <p className="text-lg font-semibold text-yellow-500">
                  {formatMoney(service.price)}
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${service.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' : 
                    service.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' : 
                    'bg-yellow-100 text-yellow-800'}`}>
                  {translatePaymentMethod(service.paymentMethod)}
                </span>
                <span className="text-gray-400">
                  {format(new Date(service.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen transition-colors duration-200 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
          theme === 'dark' ? 'border-white' : 'border-indigo-600'
        }`} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className={`text-2xl font-bold mb-2 transition-colors duration-200 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Dashboard
        </h1>
        <p className={`transition-colors duration-200 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {user?.shopName}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Barberos Activos",
            value: `${stats.activeBarbers} / ${stats.totalBarbers}`,
            icon: Users,
            color: "blue",
            subtitle: `${stats.pendingBarbers} pendientes`
          },
          {
            title: "Servicios Hoy",
            value: stats.todayServices,
            icon: Scissors,
            color: "green",
            subtitle: `${formatMoney(stats.todayEarnings)}`
          },
          {
            title: "Servicios Mensuales",
            value: stats.monthlyServices,
            icon: Calendar,
            color: "purple",
            subtitle: `${formatMoney(stats.monthlyEarnings)}`
          },
          {
            title: "Servicios Pendientes",
            value: pendingServices.length,
            icon: AlertCircle,
            color: "yellow",
            subtitle: "Por aprobar"
          }
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`rounded-lg shadow-lg p-6 transition-colors duration-200 ${
                theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold mt-1 transition-colors duration-200 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {card.value}
                  </p>
                  <p className={`text-sm transition-colors duration-200 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {card.subtitle}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-opacity-10 
                  ${card.color === 'blue' && (theme === 'dark' ? 'bg-blue-400 text-blue-400' : 'bg-blue-500 text-blue-500')}
                  ${card.color === 'green' && (theme === 'dark' ? 'bg-green-400 text-green-400' : 'bg-green-500 text-green-500')}
                  ${card.color === 'purple' && (theme === 'dark' ? 'bg-purple-400 text-purple-400' : 'bg-purple-500 text-purple-500')}
                  ${card.color === 'yellow' && (theme === 'dark' ? 'bg-yellow-400 text-yellow-400' : 'bg-yellow-500 text-yellow-500')}
                `}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        <ServiceList services={pendingServices} isPending={true} />
        <ServiceList services={recentServices} isPending={false} />
      </div>
    </div>
  );
};

export default AdminDashboard;