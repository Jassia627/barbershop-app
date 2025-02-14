// src/pages/barber/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "react-hot-toast";
import {
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  User,
  Phone,
  MessageCircle,
  AlertTriangle,
  Scissors,
  CalendarDays,
  TrendingUp,
  Filter,
  Search,
  DollarSign
} from "lucide-react";

const BarberDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    todayAppointments: 0,
    todayEarnings: 0,
    monthEarnings: 0
  });

  useEffect(() => {
    if (user?.uid) {
      fetchAppointments();
    }
  }, [user?.uid]);

// En BarberDashboard.jsx, modificar fetchAppointments:

const fetchAppointments = async () => {
  try {
    // Obtener citas
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("barberId", "==", user.uid)
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      date: doc.data().date.toDate()
    }));

    // Obtener servicios completados y aprobados
    const haircutsQuery = query(
      collection(db, "haircuts"),
      where("barberId", "==", user.uid)
    );
    const haircutsSnapshot = await getDocs(haircutsQuery);
    const haircutsData = haircutsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: new Date(doc.data().createdAt)
    }));

    // Ordenar por fecha de creación
    const sortedAppointments = appointmentsData.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Calcular estadísticas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    // Filtrar servicios completados y aprobados
    const completedHaircuts = haircutsData.filter(
      haircut => haircut.status === 'completed' && haircut.approvalStatus === 'approved'
    );

    // Calcular ingresos
    const todayHaircuts = completedHaircuts.filter(haircut => {
      const haircutDate = new Date(haircut.createdAt);
      return haircutDate.toDateString() === today.toDateString();
    });

    const monthHaircuts = completedHaircuts.filter(haircut => {
      const haircutDate = new Date(haircut.createdAt);
      return haircutDate.getMonth() === thisMonth && 
             haircutDate.getFullYear() === thisYear;
    });

    const stats = {
      pending: sortedAppointments.filter(apt => apt.status === 'pending').length,
      confirmed: sortedAppointments.filter(apt => apt.status === 'confirmed').length,
      completed: sortedAppointments.filter(apt => apt.status === 'completed').length,
      todayAppointments: sortedAppointments.filter(apt => isToday(apt.date)).length,
      todayEarnings: todayHaircuts.reduce((sum, haircut) => sum + (haircut.price || 0), 0),
      monthEarnings: monthHaircuts.reduce((sum, haircut) => sum + (haircut.price || 0), 0),
      pendingServices: haircutsData.filter(
        haircut => haircut.approvalStatus === 'pending'
      ).length
    };

    setStats(stats);
    setAppointments(sortedAppointments);
  } catch (error) {
    console.error("Error al cargar las citas:", error);
    toast.error("Error al cargar los datos");
  } finally {
    setLoading(false);
  }
};

  const handleAppointmentAction = async (appointmentId, newStatus) => {
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, {
        status: newStatus,
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: user.uid
      });

      toast.success(
        newStatus === 'confirmed' ? '¡Cita confirmada! 🎉' :
        newStatus === 'completed' ? '¡Servicio completado! ✨' :
        'Cita cancelada'
      );

      fetchAppointments();
    } catch (error) {
      console.error("Error al actualizar la cita:", error);
      toast.error("Error al actualizar la cita");
    }
  };

  const getWhatsAppLink = (phone, message) => {
    const formattedPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  };

  const getStatusInfo = (status) => {
    const statusConfig = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        icon: AlertTriangle,
        text: 'Pendiente'
      },
      confirmed: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        icon: CheckCircle,
        text: 'Confirmada'
      },
      completed: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        icon: Clock,
        text: 'Completada'
      },
      cancelled: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        icon: XCircle,
        text: 'Cancelada'
      }
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesSearch = 
      appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.clientPhone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Bienvenida y Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ¡Bienvenido, {user.name}! 👋
        </h1>
        <p className="text-blue-100">
          Gestiona tus citas y mantén tu agenda al día
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm text-blue-100">Citas Pendientes</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm text-blue-100">Citas Hoy</p>
            <p className="text-2xl font-bold">{stats.todayAppointments}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm text-blue-100">Ingresos Hoy</p>
            <p className="text-2xl font-bold">${stats.todayEarnings.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm text-blue-100">Ingresos del Mes</p>
            <p className="text-2xl font-bold">${stats.monthEarnings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Citas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-blue-500" />
            Tus Citas
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredAppointments.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No hay citas que mostrar</p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const statusInfo = getStatusInfo(appointment.status);
              const isToday = new Date(appointment.date).toDateString() === new Date().toDateString();
              
              return (
                <div key={appointment.id} 
                  className={`p-6 transition-all hover:bg-gray-50 dark:hover:bg-gray-700
                    ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-3">
                      {/* Información del Cliente */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {appointment.clientName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {appointment.clientPhone}
                          </p>
                        </div>
                      </div>

                      {/* Fecha y Hora */}
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Calendar className="h-5 w-5" />
                          <span>
                            {format(appointment.date, "EEEE d 'de' MMMM", { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Clock className="h-5 w-5" />
                          <span>{appointment.time}</span>
                        </div>
                        {appointment.price && (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <DollarSign className="h-5 w-5" />
                            <span>${appointment.price.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Estado */}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        <statusInfo.icon className="h-4 w-4" />
                        {statusInfo.text}
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center gap-2">
                      {appointment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAppointmentAction(appointment.id, 'confirmed')}
                            className="px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="h-5 w-5" />
                            <span className="hidden sm:inline">Confirmar</span>
                          </button>
                          <button
                            onClick={() => handleAppointmentAction(appointment.id, 'cancelled')}
                            className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"
                          >
                            <XCircle className="h-5 w-5" />
                            <span className="hidden sm:inline">Cancelar</span>
                          </button>
                        </>
                      )}
                      {appointment.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => {
                              // Primero marcamos como completada la cita
                              handleAppointmentAction(appointment.id, 'completed');
                              // Navegamos a la página de registro de servicio
                              navigate('/barber/new-haircut', {
                                state: {
                                  clientName: appointment.clientName,
                                  serviceId: appointment.serviceId,
                                  serviceName: appointment.serviceName,
                                  appointmentId: appointment.id,
                                  price: appointment.price
                                }
                              });
                            }}
                            className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2"
                          >
                            <Scissors className="h-5 w-5" />
                            <span className="hidden sm:inline">Registrar Servicio</span>
                          </button>
                          <a
                            href={getWhatsAppLink(
                              appointment.clientPhone,
                              `¡Hola ${appointment.clientName}! Te recuerdo tu cita para hoy a las ${appointment.time}`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-2"
                          >
                            <MessageCircle className="h-5 w-5" />
                            <span className="hidden sm:inline">Recordar</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      {appointment.notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BarberDashboard;