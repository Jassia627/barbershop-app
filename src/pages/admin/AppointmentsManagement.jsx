import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  User, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Filter,
  Search,
  Scissors,
  AlertTriangle,
  CheckSquare,
  CalendarIcon,
  Users,
  RefreshCcw,
  Phone,
  Menu
} from 'lucide-react';

const statusColors = {
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-800 dark:text-yellow-400',
    icon: AlertTriangle,
  },
  confirmed: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-800 dark:text-green-400',
    icon: CheckCircle,
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-800 dark:text-red-400',
    icon: XCircle,
  },
  completed: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-800 dark:text-blue-400',
    icon: CheckSquare,
  }
};

const statusTranslations = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada'
};

const getConfirmationMessage = (appointment, shopName) => {
  return `✨ ¡Hola ${appointment.clientName}! 

🎉 Tu cita ha sido confirmada:

📅 Fecha: ${format(appointment.date, 'EEEE d MMMM', { locale: es })}
⏰ Hora: ${appointment.time}
💈 Barbero: ${appointment.barberName}
📍 Barbería: ${shopName}

⚡️ Recordatorios importantes:
• Llega 5 minutos antes de tu cita
• Si necesitas cancelar, avísanos con anticipación
• Trae una referencia si tienes un corte específico en mente

🙌 ¡Te esperamos para darte el mejor servicio!

#BarberStyle 💇‍♂️✨`;
};

const getReminderMessage = (appointment) => {
  return `🔔 ¡Hola ${appointment.clientName}!

⏰ ¡Recordatorio de tu cita para hoy!

📅 Hora: ${appointment.time}
💈 Barbero: ${appointment.barberName}

⭐️ Tips para tu visita:
• Llega 5 minutos antes
• El local tiene estacionamiento disponible
• Puedes pagar con efectivo o tarjeta

🎯 ¡Te esperamos para dejarte increíble!

#BarberStyle 💈✨`;
};

const getWhatsAppLink = (phone, message) => {
  const formattedPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/+57${formattedPhone}?text=${encodedMessage}`;
};

// Componente para la tarjeta móvil
const AppointmentCard = ({ appointment, onStatusChange, shopName }) => {
  const StatusIcon = statusColors[appointment.status].icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {appointment.clientName}
          </h3>
          <a 
            href={`tel:${appointment.clientPhone}`}
            className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1"
          >
            <Phone className="w-4 h-4" />
            {appointment.clientPhone}
          </a>
        </div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
          statusColors[appointment.status].bg} ${statusColors[appointment.status].text
        }`}>
          <StatusIcon className="w-4 h-4 mr-1" />
          {statusTranslations[appointment.status]}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{format(appointment.date, 'dd MMM', { locale: es })}</span>
        </div>
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-2" />
          <span>{appointment.time}</span>
        </div>
        <div className="flex items-center text-gray-600 dark:text-gray-400 col-span-2">
          <User className="w-4 h-4 mr-2" />
          <span>{appointment.barberName}</span>
        </div>
      </div>

      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {appointment.status === 'pending' && (
            <>
              <button
                onClick={() => onStatusChange(appointment.id, 'confirmed')}
                className="flex items-center justify-center px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirmar
              </button>
              <button
                onClick={() => onStatusChange(appointment.id, 'cancelled')}
                className="flex items-center justify-center px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancelar
              </button>
            </>
          )}
          {appointment.status === 'confirmed' && (
            <>
              <button
                onClick={() => onStatusChange(appointment.id, 'completed')}
                className="flex items-center justify-center px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg"
              >
                <CheckSquare className="w-4 h-4 mr-1" />
                Completar
              </button>
              <button
                onClick={() => onStatusChange(appointment.id, 'cancelled')}
                className="flex items-center justify-center px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancelar
              </button>
            </>
          )}
          <a
            href={getWhatsAppLink(
              appointment.clientPhone,
              appointment.status === 'pending' 
                ? getConfirmationMessage(appointment, shopName)
                : getReminderMessage(appointment)
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 flex items-center justify-center px-3 py-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg mt-2"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
};

// Componente StatsCard
const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className={`p-2 sm:p-3 rounded-full ${color.bg}`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color.text}`} />
      </div>
    </div>
  </div>
);

const AppointmentsManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [filterBarber, setFilterBarber] = useState('all');
  const [barbers, setBarbers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
  });

  useEffect(() => {
    if (user?.shopId) {
      fetchAppointments();
      fetchBarbers();
    }
  }, [user?.shopId]);

  const fetchBarbers = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("shopId", "==", user.shopId),
        where("role", "==", "barber")
      );
      
      const querySnapshot = await getDocs(q);
      const barbersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBarbers(barbersData);
    } catch (error) {
      console.error("Error fetching barbers:", error);
      toast.error("Error al cargar los barberos");
    }
  };

  // En AppointmentsManagement.jsx

const fetchAppointments = async () => {
  if (!user?.shopId) return;

  try {
    // Consulta más simple que solo usa shopId
    const q = query(
      collection(db, "appointments"),
      where("shopId", "==", user.shopId)
    );
    
    const querySnapshot = await getDocs(q);
    const appointmentsData = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
      };
    });

    // Ordenar los datos en el cliente
    const sortedAppointments = appointmentsData.sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Calcular estadísticas
    const todayAppointments = sortedAppointments.filter(apt => isToday(apt.date));
    const pendingCount = sortedAppointments.filter(apt => apt.status === 'pending').length;
    const confirmedCount = sortedAppointments.filter(apt => apt.status === 'confirmed').length;
    const completedCount = sortedAppointments.filter(apt => apt.status === 'completed').length;
    const cancelledCount = sortedAppointments.filter(apt => apt.status === 'cancelled').length;

    setStats({
      total: sortedAppointments.length,
      pending: pendingCount,
      confirmed: confirmedCount,
      completed: completedCount,
      cancelled: cancelledCount,
      today: todayAppointments.length,
    });
    
    setAppointments(sortedAppointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    toast.error("Error al cargar las citas");
  } finally {
    setLoading(false);
  }
};

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, {
        status: newStatus,
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: user.uid
      });

      const updatedAppointments = appointments.map(appointment => 
        appointment.id === appointmentId 
          ? { ...appointment, status: newStatus }
          : appointment
      );
      
      setAppointments(updatedAppointments);
      fetchAppointments(); // Actualizar estadísticas
      toast.success(`Cita ${statusTranslations[newStatus].toLowerCase()} exitosamente`, {
        icon: newStatus === 'confirmed' ? '✅' : newStatus === 'completed' ? '🎉' : '❌'
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Error al actualizar la cita");
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filterStatus !== 'all' && appointment.status !== filterStatus) return false;
    if (filterBarber !== 'all' && appointment.barberId !== filterBarber) return false;
    if (filterDate === 'today' && !isToday(appointment.date)) return false;
    if (filterDate === 'week' && !isThisWeek(appointment.date)) return false;
    if (filterDate === 'month' && !isThisMonth(appointment.date)) return false;

    const searchTermLower = searchTerm.toLowerCase();
    return (
      appointment.clientName.toLowerCase().includes(searchTermLower) ||
      appointment.clientPhone.includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Calendar className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              Gestión de Citas
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{user?.shopName}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => navigate('/admin/schedules')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Clock className="w-5 h-5" />
              <span className="sm:hidden lg:inline">Gestionar Horarios</span>
            </button>
            <button
              onClick={() => fetchAppointments()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <RefreshCcw className="w-5 h-5" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Estadísticas Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatsCard
            title="Total"
            value={stats.total}
            icon={Calendar}
            color={{ bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' }}
          />
          <StatsCard
            title="Hoy"
            value={stats.today}
            icon={CalendarIcon}
            color={{ bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' }}
          />
          <StatsCard
            title="Pendientes"
            value={stats.pending}
            icon={AlertTriangle}
            color={{ bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400' }}
          />
          <StatsCard
            title="Confirmadas"
            value={stats.confirmed}
            icon={CheckCircle}
            color={{ bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' }}
          />
          <StatsCard
            title="Completadas"
            value={stats.completed}
            icon={CheckSquare}
            color={{ bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' }}
          />
          <StatsCard
            title="Canceladas"
            value={stats.cancelled}
            icon={XCircle}
            color={{ bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' }}
          />
        </div>

        {/* Filtros Responsive */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="sm:hidden flex items-center justify-center p-2 rounded-lg border border-gray-300 dark:border-gray-600"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filtros expandibles en móvil */}
          <div className={`mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 ${isFilterOpen ? 'block' : 'hidden sm:grid'}`}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
            </select>

            <select
              value={filterBarber}
              onChange={(e) => setFilterBarber(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="all">Todos los barberos</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>
        </div>

       {/* Lista de Citas Responsive */}
<div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-900">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Cliente
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Fecha y Hora
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Barbero
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Estado
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {filteredAppointments.map((appointment) => {
          const StatusIcon = statusColors[appointment.status].icon;
          return (
            <tr key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {appointment.clientName}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {appointment.clientPhone}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {format(appointment.date, 'EEEE dd MMM', { locale: es })}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {appointment.time}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 dark:text-white">
                  {appointment.barberName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[appointment.status].bg} ${statusColors[appointment.status].text
                }`}>
                  <StatusIcon className="w-4 h-4 mr-2" />
                  {statusTranslations[appointment.status]}
                </div>
              </td>
              <td className="px-6 py-4 space-x-2">
                {appointment.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                      className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Confirmar
                    </button>
                    <a
                      href={getWhatsAppLink(
                        appointment.clientPhone,
                        getConfirmationMessage(appointment, user.shopName)
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-3 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      WhatsApp
                    </a>
                    <button
                      onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                      className="flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancelar
                    </button>
                  </div>
                )}
                {appointment.status === 'confirmed' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusChange(appointment.id, 'completed')}
                      className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      <CheckSquare className="w-4 h-4 mr-1" />
                      Completar
                    </button>
                    <a
                      href={getWhatsAppLink(
                        appointment.clientPhone,
                        getReminderMessage(appointment)
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-3 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Recordar
                    </a>
                    <button
                      onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                      className="flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancelar
                    </button>
                  </div>
                )}
              </td>
            </tr>
          );
        })}      </tbody>
    </table>
  </div>
</div>

        {/* Vista de tarjetas para móvil */}
        <div className="md:hidden space-y-4">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onStatusChange={handleStatusChange}
              shopName={user.shopName}
            />
          ))}
        </div>

        {/* Estado vacío */}
        {filteredAppointments.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay citas</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No se encontraron citas que coincidan con los filtros seleccionados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsManagement;