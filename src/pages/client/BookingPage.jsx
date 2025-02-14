// src/pages/client/BookingPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format, addDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  MessageCircle,
  Scissors as ScissorsIcon,
  Check,
  AlertCircle
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-hot-toast';

const BookingPage = () => {
  const { shopId } = useParams();
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    fetchBarbers();
  }, [shopId]);

  useEffect(() => {
    if (selectedBarber) {
      fetchBarberSchedule();
    }
  }, [selectedBarber]);

  useEffect(() => {
    const loadTimeSlots = async () => {
      if (selectedBarber && selectedDate) {
        const slots = await getAvailableTimeSlots();
        setAvailableTimeSlots(slots);
      }
    };
    loadTimeSlots();
  }, [selectedBarber, selectedDate]);

  const fetchBarbers = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("shopId", "==", shopId),
        where("role", "==", "barber"),
        where("status", "==", "active")
      );
      
      const querySnapshot = await getDocs(q);
      const barbersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBarbers(barbersData);
    } catch (error) {
      console.error("Error al cargar barberos:", error);
      toast.error("Error al cargar los barberos disponibles");
    } finally {
      setLoading(false);
    }
  };

  const fetchBarberSchedule = async () => {
    try {
      const q = query(
        collection(db, "schedules"),
        where("barberId", "==", selectedBarber.id),
        where("active", "==", true)
      );
      const snapshot = await getDocs(q);
      const scheduleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchedules(scheduleData);
    } catch (error) {
      console.error("Error al cargar horarios:", error);
      toast.error("Error al cargar los horarios disponibles");
    }
  };

  const fetchTakenSlots = async (date) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
  
      // Consulta más simple que solo usa barberId
      const q = query(
        collection(db, "appointments"),
        where("barberId", "==", selectedBarber.id)
      );
  
      const snapshot = await getDocs(q);
      
      // Filtramos las citas en el cliente
      const takenTimes = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          const appointmentDate = data.date.toDate();
          const status = data.status;
          
          // Verificamos que la cita sea del mismo día y tenga un estado válido
          return appointmentDate >= startOfDay &&
                 appointmentDate <= endOfDay &&
                 (status === 'pending' || status === 'confirmed');
        })
        .map(doc => doc.data().time);
  
      return takenTimes;
    } catch (error) {
      console.error("Error al obtener horarios ocupados:", error);
      toast.error("Error al verificar disponibilidad");
      return [];
    }
  };
  
  const getAvailableTimeSlots = async () => {
    if (!selectedBarber || !selectedDate || schedules.length === 0) return [];
  
    try {
      const schedule = schedules[0];
      const dayOfWeek = format(selectedDate, 'EEE', { locale: es }).toUpperCase();
      
      if (schedule.daysOff?.includes(dayOfWeek)) return [];
  
      const takenSlots = await fetchTakenSlots(selectedDate);
  
      const startHour = parseInt(schedule.startTime.split(':')[0]);
      const endHour = parseInt(schedule.endTime.split(':')[0]);
      const breakStartHour = parseInt(schedule.breakStart.split(':')[0]);
      const breakEndHour = parseInt(schedule.breakEnd.split(':')[0]);
      
      const timeSlots = [];
  
      for (let hour = startHour; hour < endHour; hour++) {
        if (hour < breakStartHour || hour >= breakEndHour) {
          const slot1 = `${hour.toString().padStart(2, '0')}:00`;
          const slot2 = `${hour.toString().padStart(2, '0')}:30`;
          
          if (!takenSlots.includes(slot1)) {
            timeSlots.push(slot1);
          }
          if (!takenSlots.includes(slot2)) {
            timeSlots.push(slot2);
          }
        }
      }
  
      return timeSlots;
    } catch (error) {
      console.error("Error al obtener horarios disponibles:", error);
      toast.error("Error al cargar los horarios disponibles");
      return [];
    }
  };

  const getWhatsAppMessage = () => {
    const message = `🌟 ¡Hola! Acabo de agendar una cita ✨\n\n` +
      `📅 Fecha: ${format(selectedDate, 'EEEE d MMMM', { locale: es })}\n` +
      `⏰ Hora: ${selectedTime}\n` +
      `💈 Barbero: ${selectedBarber.name}\n` +
      `👤 Cliente: ${formData.name}\n\n` +
      `✨ ¡Gracias! 🙏`;
    return message;
  };

  const getWhatsAppLink = (phone, message) => {
    const formattedPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/+57${formattedPhone}?text=${encodedMessage}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBarber || !selectedDate || !selectedTime) {
      toast.error("Por favor selecciona barbero, fecha y hora");
      return;
    }

    try {
      const appointmentDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const appointmentData = {
        barberId: selectedBarber.id,
        barberName: selectedBarber.name,
        shopId,
        clientName: formData.name,
        clientPhone: formData.phone,
        date: Timestamp.fromDate(appointmentDate),
        time: selectedTime,
        notes: formData.notes,
        status: 'pending',
        createdAt: Timestamp.fromDate(new Date())
      };

      await addDoc(collection(db, "appointments"), appointmentData);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error al agendar cita:", error);
      toast.error("Error al agendar la cita");
    }
  };

  const availableDates = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <ScissorsIcon className="inline-block w-10 h-10 mb-2 text-blue-600 dark:text-blue-400" />
            <span className="block">Agenda tu Cita</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            ¡Reserva tu hora con los mejores profesionales!
          </p>
        </div>

        {/* Selección de Barbero */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <User className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Elige tu Barbero
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map((barber) => (
              <button
                key={barber.id}
                onClick={() => setSelectedBarber(barber)}
                className={`group relative p-6 rounded-xl transition-all transform hover:scale-105 ${
                  selectedBarber?.id === barber.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 shadow-blue-500/20'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <User className={`w-8 h-8 ${
                        selectedBarber?.id === barber.id 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {barber.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {barber.expertise || 'Barbero Profesional'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selección de Fecha */}
        {selectedBarber && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              Selecciona el Día
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {availableDates.map((date) => (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`p-4 rounded-xl text-center transition-all transform hover:scale-105 ${
                    selectedDate?.toDateString() === date.toDateString()
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                    {format(date, 'EEEE', { locale: es })}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                    {format(date, 'd')}
                  </p>
                  {isToday(date) && (
                    <span className="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400 rounded-full mt-1">
                      Hoy
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selección de Hora */}
        {selectedDate && selectedBarber && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              Elige tu Horario
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {availableTimeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`p-4 rounded-xl text-center transition-all transform hover:scale-105 ${
                    selectedTime === time
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Clock className={`h-6 w-6 mx-auto mb-2 ${
                    selectedTime === time 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400'
                  }`} />
                  <span className="text-base font-medium text-gray-900 dark:text-white">
                    {time}
                  </span>
                </button>
              ))}
              {availableTimeSlots.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay horarios disponibles para este día
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulario de Datos */}
        {selectedTime && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <User className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              Tus Datos
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ingresa tu nombre"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono (WhatsApp) *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ingresa tu número de WhatsApp"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas o preferencias (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="¿Alguna preferencia especial?"
                />
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal de Éxito */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full transform transition-all">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  ¡Reserva Exitosa! 🎉
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Tu cita ha sido registrada y está pendiente de confirmación.
                </p>
              </div>

              <a
                href={getWhatsAppLink(selectedBarber.phone, getWhatsAppMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-xl mb-4 hover:bg-green-600 transform transition-all hover:scale-105"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contactar por WhatsApp
              </a>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSelectedBarber(null);
                  setSelectedDate(new Date());
                  setSelectedTime(null);
                  setFormData({
                    name: '',
                    phone: '',
                    notes: ''
                  });
                }}
                className="w-full px-6 py-3 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transform transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;