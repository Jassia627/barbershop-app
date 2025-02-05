import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format, addDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, User, Phone, Mail } from 'lucide-react';
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
    email: '',
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

      const q = query(
        collection(db, "appointments"),
        where("barberId", "==", selectedBarber.id),
        where("date", ">=", Timestamp.fromDate(startOfDay)),
        where("date", "<=", Timestamp.fromDate(endOfDay)),
        where("status", "in", ["pending", "confirmed"])
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data().time);
    } catch (error) {
      console.error("Error fetching taken slots:", error);
      return [];
    }
  };

  const getAvailableTimeSlots = async () => {
    if (!selectedBarber || !selectedDate || schedules.length === 0) return [];

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
        
        if (!takenSlots.includes(slot1)) timeSlots.push(slot1);
        if (!takenSlots.includes(slot2)) timeSlots.push(slot2);
      }
    }

    return timeSlots;
  };

  const getWhatsAppLink = (phone, message) => {
    const formattedPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!selectedBarber || !selectedDate || !selectedTime) {
      toast.error("Por favor selecciona barbero, fecha y hora");
      return;
    }

    try {
      const [hours, minutes] = selectedTime.split(':');
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const appointmentData = {
        barberId: selectedBarber.id,
        barberName: selectedBarber.name,
        shopId,
        clientName: formData.name,
        clientPhone: formData.phone,
        clientEmail: formData.email,
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Agenda tu Cita
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Selecciona tu barbero preferido y el horario que mejor te convenga
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Selecciona tu Barbero
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {barbers.map((barber) => (
              <button
                key={barber.id}
                onClick={() => setSelectedBarber(barber)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedBarber?.id === barber.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {barber.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {barber.expertise || 'Barbero Profesional'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedBarber && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Selecciona el Día
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {availableDates.map((date) => (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    selectedDate?.toDateString() === date.toDateString()
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {format(date, 'EEEE', { locale: es })}
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {format(date, 'd')}
                  </p>
                  {isToday(date) && (
                    <span className="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900/20 dark:text-blue-400">
                      Hoy
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedDate && selectedBarber && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Horarios Disponibles
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {availableTimeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedTime === time
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <Clock className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">{time}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTime && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Tus Datos
            </h2>
            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre completo
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                  <User className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teléfono
                </label>
                <div className="mt-1 relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                  <Phone className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="mt-1 relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
               
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notas adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  className="block w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                ¡Cita agendada exitosamente!
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Tu cita ha sido registrada y está pendiente de confirmación.
              </p>
              <a
                href={getWhatsAppLink(
                  selectedBarber.phone,
                  `Hola, acabo de agendar una cita para el ${format(selectedDate, 'dd/MM/yyyy')} a las ${selectedTime}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
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
                    email: '',
                    notes: ''
                  });
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
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