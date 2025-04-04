// src/modules/appointments/hooks/useAppointments.js
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth';
import { 
  fetchBarbers, 
  fetchSchedules, 
  fetchTakenSlots, 
  fetchAppointments, 
  createAppointment, 
  updateAppointmentStatus,
  saveHaircutHistory
} from '../services/appointmentService';
import { fetchServices } from '../../services/services/serviceService';
import { format, addMinutes, isValid, startOfDay, toDate, parseISO } from 'date-fns'; // Reimportar format
import { toast } from 'react-hot-toast';
import { logDebug, logError } from '../../../core/utils/logger';
import { Timestamp, addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';

export const useAppointments = (shopIdParam) => {
  const { user } = useAuth();
  const shopId = shopIdParam || user?.shopId;
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Inicialización explícita
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      logDebug("useAppointments: Iniciando carga de datos, user:", user, "shopId:", shopId);
      if (!shopId) {
        logError("useAppointments: shopId no definido");
        toast.error("No se proporcionó un ID de barbería");
        setLoading(false);
        return;
      }
      try {
        const barberData = await fetchBarbers(shopId);
        logDebug("useAppointments: Barbers cargados:", barberData.map(b => ({ id: b.id, name: b.name, phone: b.phone })));
        setBarbers(barberData);

        const serviceData = await fetchServices(shopId);
        logDebug("useAppointments: Services cargados:", serviceData);
        setServices(serviceData);

        if (user?.role === 'admin') {
          const appointmentData = await fetchAppointments(shopId);
          logDebug("useAppointments: Appointments cargados:", appointmentData);
          setAppointments(appointmentData);
        }
      } catch (error) {
        logError("useAppointments: Error al cargar datos iniciales");
        toast.error("Error al cargar datos iniciales");
      } finally {
        setLoading(false);
        logDebug("useAppointments: Carga inicial finalizada, loading:", false);
      }
    };
    loadData();
  }, [shopId, user]);

  useEffect(() => {
    const loadSchedulesAndSlots = async () => {
      logDebug("useAppointments: Iniciando loadSchedulesAndSlots, selectedBarber:", selectedBarber, "selectedDate:", selectedDate, "tipo:", typeof selectedDate);
      if (selectedBarber) {
        // Validar y corregir selectedDate
        let normalizedDate = selectedDate;
        if (!isValid(selectedDate)) {
          logError("useAppointments: selectedDate no es válido, intentando corregir:", selectedDate);
          normalizedDate = new Date(); // Fallback a la fecha actual
          setSelectedDate(normalizedDate);
        } else {
          normalizedDate = startOfDay(selectedDate); // Normalizar al inicio del día
        }
        logDebug("useAppointments: Fecha normalizada antes de toDate:", normalizedDate, "tipo:", typeof normalizedDate);

        // Convertir a Date válido con manejo de errores
        let validDate;
        try {
          validDate = toDate(normalizedDate);
          if (!isValid(validDate)) {
            logError("useAppointments: Fecha no válida después de toDate, forzando nueva fecha:", normalizedDate, validDate);
            validDate = new Date(); // Forzar una fecha válida
            setSelectedDate(validDate);
          }
        } catch (e) {
          logError("useAppointments: Error al convertir fecha con toDate, usando fecha actual como fallback");
          validDate = new Date();
          setSelectedDate(validDate);
        }
        logDebug("useAppointments: Fecha validada antes de format:", validDate, "tipo:", typeof validDate);

        try {
          setLoading(true);
          logDebug("useAppointments: Cargando horarios para barbero:", selectedBarber.id, "en fecha:", validDate);
          const scheduleData = await fetchSchedules(selectedBarber.id);
          logDebug("useAppointments: Schedules cargados:", JSON.stringify(scheduleData, null, 2));
          setSchedules(scheduleData.length > 0 ? scheduleData : []);

          const takenSlots = await fetchTakenSlots(selectedBarber.id, validDate);
          logDebug("useAppointments: Taken slots:", takenSlots);

          const defaultSchedule = { startTime: '09:00', endTime: '18:00', daysOff: [] };
          const scheduleToUse = scheduleData[0] || defaultSchedule;
          const slots = generateTimeSlots(scheduleToUse, takenSlots, validDate);
          logDebug("useAppointments: Available time slots calculados:", slots);
          setAvailableTimeSlots(slots.length > 0 ? slots : []);
        } catch (error) {
          logError("useAppointments: Error al cargar horarios o franjas horarias");
          if (error.message.includes("requires an index")) {
            toast.error("Se requiere un índice en Firestore para cargar horarios. Contacta al administrador.");
          } else {
            toast.error("Error al cargar horarios");
          }
          setAvailableTimeSlots([]);
        } finally {
          setLoading(false);
          logDebug("useAppointments: Carga de horarios finalizada, loading:", false);
        }
      } else {
        logDebug("useAppointments: No hay barbero seleccionado, reiniciando availableTimeSlots");
        setAvailableTimeSlots([]);
      }
    };
    loadSchedulesAndSlots();
  }, [selectedBarber, selectedDate]);

  const generateTimeSlots = (schedule, takenSlots, date) => {
    logDebug("generateTimeSlots: Procesando schedule:", schedule, "para fecha recibida:", date, "tipo:", typeof date, "toString:", date?.toString());
    if (!schedule || !schedule.startTime || !schedule.endTime) {
      logDebug("generateTimeSlots: Horario no definido, usando valores por defecto");
      return [];
    }
    // Convertir y validar fecha con manejo de errores robusto
    let validDate;
    try {
      validDate = toDate(date);
      if (!isValid(validDate)) {
        logError("generateTimeSlots: Fecha inválida después de toDate:", date, "convertida a:", validDate, "toString:", validDate?.toString());
        validDate = new Date(); // Fallback a fecha actual
      }
    } catch (e) {
      logError("generateTimeSlots: Error al convertir fecha con toDate:", e, "fecha recibida:", date, "usando fecha actual como fallback");
      validDate = new Date();
    }
    logDebug("generateTimeSlots: Fecha validada antes de procesar:", validDate, "tipo:", typeof validDate, "toString:", validDate.toString());

    // Obtener el día de la semana usando el método nativo de JavaScript
    const dayOfWeekNum = validDate.getDay(); // 0 = domingo, 6 = sábado
    const dayOfWeek = {
      0: 'DOM',
      1: 'LUN',
      2: 'MAR',
      3: 'MIÉ',
      4: 'JUE',
      5: 'VIE',
      6: 'SAB'
    }[dayOfWeekNum] || 'MAR'; // Fallback a 'MAR' si falla
    logDebug("generateTimeSlots: Día de la semana calculado con getDay:", dayOfWeek, "número:", dayOfWeekNum);

    const { startTime, endTime, daysOff = [] } = schedule;

    // Normalizar daysOff - convertir a mayúsculas y eliminar espacios
    const normalizedDaysOff = Array.isArray(daysOff) 
      ? daysOff.map(day => day.toUpperCase().trim()) 
      : [];
    logDebug("generateTimeSlots: Normalized daysOff:", normalizedDaysOff);

    // Verificar si el día actual está en la lista de días no laborables
    const isNonWorkingDay = normalizedDaysOff.includes(dayOfWeek);
    logDebug("generateTimeSlots: ¿Es día no laborable? (", dayOfWeek, "in", normalizedDaysOff, "):", isNonWorkingDay);

    // Si es un día no laborable, no generar slots
    if (isNonWorkingDay) {
      logDebug("generateTimeSlots: Día no laborable detectado, no se generan slots");
      return [];
    }

    const slots = [];
    let currentTime = new Date(validDate);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(validDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    logDebug("generateTimeSlots: Rango de tiempo - Inicio:", currentTime, "Fin:", endDateTime);

    while (currentTime < endDateTime) {
      let timeString;
      try {
        timeString = format(currentTime, 'HH:mm'); // Usar format para horas
        logDebug("generateTimeSlots: Tiempo formateado:", timeString);
      } catch (timeFormatError) {
        logError("generateTimeSlots: Error al formatear tiempo:", timeFormatError, "usando fallback");
        timeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`; // Fallback nativo
      }
      if (!takenSlots.includes(timeString)) {
        slots.push(timeString);
      }
      currentTime = addMinutes(currentTime, 30);
    }
    logDebug("generateTimeSlots: Slots generados:", slots);
    return slots;
  };

  const saveAppointment = async (appointmentData) => {
    try {
      logDebug("useAppointments: Guardando cita con datos:", appointmentData);
      await createAppointment(appointmentData);
      toast.success("Cita reservada con éxito. Pendiente de aprobación.", { duration: 4000 });
      return true;
    } catch (error) {
      logError("useAppointments: Error al reservar cita");
      toast.error("Error al reservar cita: " + error.message, { duration: 4000 });
      return false;
    }
  };

  const filterAppointments = async (barberId = null) => {
    try {
      setLoading(true);
      const appointmentsData = await fetchAppointments(shopId, barberId);
      setAppointments(appointmentsData);
      setSelectedBarber(barberId ? barbers.find(b => b.id === barberId) : null);
    } catch (error) {
      logError("useAppointments: Error al filtrar citas");
      toast.error("Error al filtrar citas", { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const approveAppointment = async (appointmentId) => {
    try {
      await updateAppointmentStatus(appointmentId, 'confirmed');
      toast.success('Cita confirmada con éxito');
      await filterAppointments();
      return true;
    } catch (error) {
      logError("useAppointments: Error al aprobar cita", error);
      toast.error("Error al confirmar la cita: " + error.message);
      return false;
    }
  };

  const completeAppointment = async (appointmentId) => {
    try {
      await updateAppointmentStatus(appointmentId, 'pending_review');
      toast.success('Cita marcada como completada');
      await filterAppointments();
      return true;
    } catch (error) {
      logError("useAppointments: Error al completar cita", error);
      toast.error("Error al marcar la cita como completada: " + error.message);
      return false;
    }
  };

  const finishAppointment = async (appointment) => {
    try {
      logDebug("useAppointments: Iniciando finalización de cita:", appointment.id);
      console.log("DATOS COMPLETOS DE LA CITA A FINALIZAR:", appointment);
      
      // Validar que tengamos todos los datos necesarios
      if (!appointment || !appointment.id) {
        const errorMsg = "No se puede finalizar: datos de cita incompletos";
        logError("useAppointments:", errorMsg);
        toast.error(errorMsg);
        return false;
      }
      
      // Verificar que tengamos serviceName en la cita
      if (!appointment.serviceName) {
        console.warn("No se encontró serviceName en la cita. Los datos actuales son:", 
                    { serviceId: appointment.serviceId, serviceName: appointment.serviceName });
        
        // Si tenemos serviceId pero no serviceName, intentar obtener el servicio
        if (appointment.serviceId && services.length > 0) {
          const matchingService = services.find(s => s.id === appointment.serviceId);
          if (matchingService) {
            console.log("Se encontró el servicio por ID:", matchingService);
            appointment.serviceName = matchingService.name;
            appointment.price = matchingService.price || appointment.price || 0;
          }
        }
      }
      
      // Primero actualizamos el estado de la cita
      logDebug("useAppointments: Actualizando estado a 'finished'");
      await updateAppointmentStatus(appointment.id, 'finished', {
        serviceName: appointment.serviceName || 'Servicio no especificado',
        price: appointment.price || 0
      });
      
      // Crear el objeto para guardar en el historial con datos por defecto si faltan
      const historyData = {
        appointmentId: appointment.id,
        barberId: appointment.barberId || user.uid,
        barberName: appointment.barberName || "Barbero",
        clientName: appointment.clientName || "Cliente",
        serviceName: appointment.serviceName || "Servicio no especificado",
        price: appointment.price || 0,
        serviceId: appointment.serviceId || null,
        date: appointment.date instanceof Date ? 
               appointment.date : 
               (appointment.date?.toDate ? appointment.date.toDate() : new Date()),
        shopId: appointment.shopId || user.shopId,
        createdAt: serverTimestamp() // Usar serverTimestamp para mejor consistencia
      };
      
      console.log("GUARDANDO DIRECTAMENTE EN HISTORIAL:", JSON.stringify(historyData, null, 2));
      
      // Intento guardar de dos maneras diferentes para asegurar que los datos se guarden correctamente
      let haircutRecordId;
      
      try {
        // Intento 1: Guardar con saveHaircutHistory
        console.log("INTENTO 1: Usando saveHaircutHistory");
        const result = await saveHaircutHistory(historyData); // Pasamos directamente historyData en lugar de appointment
        console.log("Resultado de saveHaircutHistory:", result);
      } catch (saveError) {
        console.error("ERROR EN INTENTO 1:", saveError);
        
        try {
          // Intento 2: Guardar directamente en la colección
          console.log("INTENTO 2: Guardando directamente en la colección");
          const docRef = await addDoc(collection(db, "haircut_history"), historyData);
          haircutRecordId = docRef.id;
          console.log("HISTORIAL GUARDADO CON ID:", haircutRecordId);
        } catch (directSaveError) {
          console.error("ERROR EN INTENTO 2:", directSaveError);
          throw new Error("No se pudo guardar el historial de cortes: " + directSaveError.message);
        }
      }
      
      // Intento 3: Verificar que los datos se guardaron correctamente
      try {
        console.log("INTENTO 3: Verificando que los datos se guardaron correctamente");
        if (haircutRecordId) {
          const docRef = doc(db, "haircut_history", haircutRecordId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            console.log("VERIFICACIÓN EXITOSA - Datos guardados:", docSnap.data());
          } else {
            console.error("VERIFICACIÓN FALLIDA - No se encontró el documento recién creado");
          }
        } else {
          console.log("No se puede verificar porque el ID no está disponible (se usó saveHaircutHistory)");
        }
      } catch (verifyError) {
        console.error("Error al verificar los datos guardados:", verifyError);
      }
      
      // Primera notificación: aviso general
      toast.success('Cita finalizada y guardada exitosamente', {
        duration: 3000,
        position: 'top-center'
      });
      
      // Segunda notificación: instrucción para ver el historial
      setTimeout(() => {
        toast.success(
          'Puedes ver el registro en el historial de cortes', 
          { 
            duration: 3000,
            icon: '📊',
            style: {
              borderLeft: '4px solid #8B5CF6',
              padding: '16px',
              color: '#1F2937',
            }
          }
        );
      }, 3500);

      // Tercera notificación: con enlace al historial
      setTimeout(() => {
        toast.success(
          'Haz clic aquí para ir al historial', 
          {
            duration: 8000,
            icon: '👆',
            style: {
              background: '#8B5CF6',
              color: 'white',
              padding: '16px',
              cursor: 'pointer'
            },
            onClick: () => {
              window.location.href = '/admin/haircut-history?forceReload=true&from=appointments';
            }
          }
        );
      }, 7000);
      
      await filterAppointments();
      return true;
    } catch (error) {
      logError("useAppointments: Error al finalizar cita", error);
      console.error("ERROR DETALLADO:", error);
      toast.error("Error al finalizar la cita: " + error.message);
      // A pesar del error, aún refrescamos la lista para reflejar cualquier cambio parcial
      try {
        await filterAppointments();
      } catch (refreshError) {
        logError("useAppointments: Error adicional al refrescar citas", refreshError);
      }
      return false;
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      return false;
    }

    try {
      await updateAppointmentStatus(appointmentId, 'cancelled');
      toast.success('Cita cancelada con éxito');
      await filterAppointments();
      return true;
    } catch (error) {
      logError("useAppointments: Error al cancelar cita", error);
      toast.error("Error al cancelar la cita: " + error.message);
      return false;
    }
  };

  return {
    barbers,
    services,
    schedules,
    appointments,
    availableTimeSlots,
    selectedBarber,
    setSelectedBarber,
    selectedDate,
    setSelectedDate,
    loading,
    saveAppointment,
    filterAppointments,
    approveAppointment,
    cancelAppointment,
    completeAppointment,
    finishAppointment
  };
};