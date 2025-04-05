// src/modules/appointments/services/appointmentService.js
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';
import { format } from 'date-fns';
import { logDebug, logError } from '../../../core/utils/logger';
import { sendNotification } from '../../../core/services/notificationService';
import { es } from 'date-fns/locale';

export const fetchBarbers = async (shopId) => {
  const q = query(
    collection(db, "users"),
    where("shopId", "==", shopId),
    where("role", "==", "barber"),
    where("status", "==", "active")
  );
  const snapshot = await getDocs(q);
  const barbers = snapshot.docs.map(doc => {
    const data = doc.data();
    console.log("fetchBarbers: Datos del barbero:", { id: doc.id, ...data }); // Log para depurar
    return { id: doc.id, ...data };
  });
  return barbers;
};

export const fetchSchedules = async (barberId) => {
  const q = query(
    collection(db, "schedules"),
    where("barberId", "==", barberId),
    where("active", "==", true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fetchTakenSlots = async (barberId, date) => {
  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);
  const q = query(
    collection(db, "appointments"),
    where("barberId", "==", barberId),
    where("date", ">=", Timestamp.fromDate(new Date(startOfDay))),
    where("date", "<=", Timestamp.fromDate(new Date(endOfDay))),
    where("status", "in", ["pending", "confirmed"])
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().time);
};

export const fetchAppointments = async (shopId, barberId = null) => {
  try {
    let constraints = [
      where("shopId", "==", shopId),
      where("status", "in", ["pending", "confirmed", "completed", "pending_review", "finished"])
    ];
    
    if (barberId) {
      constraints.push(where("barberId", "==", barberId));
    }
    
    const q = query(
      collection(db, "appointments"), 
      ...constraints
    );
    
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => {
      const data = doc.data();
      // Generar mensaje de WhatsApp
      const whatsappMessage = `Hola, tienes una cita programada para el ${format(data.date.toDate(), 'dd/MM/yyyy')} a las ${data.time} con el barbero ${data.barberName}. Estado: ${getStatusText(data.status)}`;
      
      return {
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        whatsappMessage
      };
    });

    // Ordenamos los resultados en memoria
    return appointments.sort((a, b) => a.date - b.date);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    if (error.code === 'failed-precondition') {
      console.log("Para crear el índice necesario, visita:", error.message.split("You can create it here: ")[1]);
    }
    throw error;
  }
};

// Función auxiliar para obtener el texto del estado
const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmada';
    case 'completed':
      return 'Completada';
    case 'pending_review':
      return 'Pendiente de revisión';
    case 'finished':
      return 'Finalizada';
    default:
      return 'Desconocido';
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    // Asegurarnos de que la fecha sea un Timestamp
    const appointment = {
      ...appointmentData,
      date: appointmentData.date instanceof Date ? Timestamp.fromDate(appointmentData.date) : Timestamp.fromMillis(appointmentData.date),
      createdAt: Timestamp.now(),
      status: 'pending',
      notificationSent: false,  // Marcador para seguimiento de notificaciones
      needsAttention: true      // Marca que necesita atención del administrador
    };

    logDebug('Guardando nueva cita en Firestore:', appointment);
    const docRef = await addDoc(collection(db, "appointments"), appointment);
    const appointmentId = docRef.id;
    logDebug(`Cita creada con ID: ${appointmentId}`);
    
    // Enviar notificación usando el endpoint
    if (appointment.shopId) {
      try {
        logDebug('Preparando notificación para la nueva cita...');
        
        // Intentamos enviar directamente una notificación a través de nuestra API
        const notificationData = {
          title: '🔔 Nueva Cita',
          body: `${appointment.clientName || 'Un cliente'} ha reservado ${appointment.service} para ${format(appointment.date.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
          shopId: appointment.shopId,
          role: 'admin', // Solo enviar a administradores
          data: {
            appointmentId: appointmentId,
            type: 'new_appointment',
            url: `/admin/appointments?id=${appointmentId}`
          }
        };
        
        logDebug('Enviando notificación directa mediante toast:', notificationData);
        // Enviar notificación local en la interfaz si el usuario está usando la app
        sendNotification(
          notificationData.title,
          notificationData.body,
          () => {
            window.location.href = notificationData.data.url;
          }
        );
        
        // Intentar activar el endpoint de notificaciones directamente
        logDebug('Activando endpoint trigger-appointment-notification...');
        fetch(`/api/trigger-appointment-notification?appointmentId=${appointmentId}`)
          .then(response => {
            if (!response.ok) {
              logError('Error en respuesta de notificación:', response.status, response.statusText);
              return response.text().then(text => {
                logError('Detalles del error:', text);
                throw new Error(`Error ${response.status}: ${text}`);
              });
            }
            return response.json();
          })
          .then(data => {
            logDebug('Respuesta de notificación push:', data);
          })
          .catch(error => {
            logError('Error al enviar solicitud de notificación push:', error);
          });

        logDebug('Solicitud de notificación de cita enviada');
      } catch (notifError) {
        logError('Error al solicitar notificación de cita:', notifError);
        // Continuamos aunque falle la notificación
      }
    }

    return { id: docRef.id, ...appointment };
  } catch (error) {
    logError('Error al crear la cita:', error);
    throw error;
  }
};

export const updateAppointmentStatus = async (appointmentId, status, additionalData = {}) => {
  try {
    if (!appointmentId) {
      throw new Error('ID de cita no proporcionado');
    }

    const appointmentRef = doc(db, "appointments", appointmentId);
    const updateData = {
      status,
      updatedAt: Timestamp.now(),
      ...additionalData
    };

    if (status === 'completed') {
      updateData.completedAt = Timestamp.now();
    } else if (status === 'finished') {
      updateData.finishedAt = Timestamp.now();
    }

    await updateDoc(appointmentRef, updateData);
    return true;
  } catch (error) {
    console.error("Error al actualizar el estado de la cita:", error);
    throw new Error(`Error al actualizar la cita: ${error.message}`);
  }
};

export const saveSchedule = async (scheduleData) => {
  const { id, ...data } = scheduleData;
  if (id) {
    await updateDoc(doc(db, "schedules", id), { ...data, updatedAt: Timestamp.now(), daysOff: data.daysOff || [] });
    return { id, ...data };
  } else {
    const docRef = await addDoc(collection(db, "schedules"), {
      ...data,
      createdAt: Timestamp.now(),
      active: true,
      daysOff: data.daysOff || []
    });
    return { id: docRef.id, ...data };
  }
};

// Función para guardar el historial de cortes
export const saveHaircutHistory = async (appointmentData) => {
  try {
    console.log("[DEBUG] Intentando guardar en historial:", appointmentData);
    
    // Comprobar si la cita tiene todos los campos necesarios
    const requiredFields = ['appointmentId', 'barberId', 'barberName', 'clientName', 'shopId'];
    const missingFields = requiredFields.filter(field => !appointmentData[field]);
    
    if (missingFields.length > 0) {
      const errorMsg = `Faltan campos requeridos en la cita: ${missingFields.join(', ')}`;
      console.error("Error al guardar historial:", errorMsg);
      throw new Error(errorMsg);
    }
    
    // Si el precio o serviceName no están definidos, usar valores predeterminados
    const price = appointmentData.price || 0;
    let serviceName = appointmentData.serviceName || '';
    
    // Si no hay serviceName, intentar obtenerlo del serviceId
    if (!serviceName && appointmentData.serviceId) {
      console.log("[DEBUG] No hay serviceName, intentando recuperarlo desde serviceId:", appointmentData.serviceId);
      try {
        // Aquí podríamos consultar a Firestore para obtener el nombre del servicio
        // pero por ahora usamos un valor descriptivo
        serviceName = `Servicio ID: ${appointmentData.serviceId}`;
      } catch (serviceError) {
        console.error("[DEBUG] Error al recuperar servicio por ID:", serviceError);
      }
    }
    
    // Si después de todo no hay serviceName, usar valor por defecto
    if (!serviceName) {
      serviceName = 'Servicio no especificado';
    }
    
    // Crear objeto con toda la información necesaria
    const historyData = {
      appointmentId: appointmentData.appointmentId || appointmentData.id,
      barberId: appointmentData.barberId,
      barberName: appointmentData.barberName,
      clientName: appointmentData.clientName,
      serviceName: serviceName,
      serviceId: appointmentData.serviceId || null, // Guardar el ID del servicio para referencia
      price: price,
      date: appointmentData.date instanceof Date ? 
             appointmentData.date : 
             (appointmentData.date?.toDate ? appointmentData.date.toDate() : new Date()),
      shopId: appointmentData.shopId,
      createdAt: Timestamp.now(),
      status: appointmentData.status || 'completed'
    };
    
    console.log("[DEBUG] Datos a guardar en historial:", JSON.stringify(historyData, null, 2));
    
    // Guardar en Firestore
    const docRef = await addDoc(collection(db, "haircut_history"), historyData);
    console.log("[DEBUG] Historial guardado con ID:", docRef.id);
    
    // Verificar que se guardó correctamente
    const docSnap = await getDoc(doc(db, "haircut_history", docRef.id));
    if (docSnap.exists()) {
      console.log("[DEBUG] Verificación: Documento guardado correctamente:", docSnap.data());
    } else {
      console.error("[DEBUG] Verificación: No se pudo obtener el documento recién creado");
    }
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al guardar el historial de cortes:", error);
    throw error;
  }
};

// Función para obtener el historial de cortes
export const fetchHaircutHistory = async (shopId, barberId = null) => {
  try {
    console.log("[DEBUG] fetchHaircutHistory - Inicio con parámetros:", { shopId, barberId });
    
    if (!shopId) {
      console.error("fetchHaircutHistory - ERROR: shopId es obligatorio");
      throw new Error("ID de tienda es obligatorio para obtener el historial");
    }
    
    let constraints = [where("shopId", "==", shopId)];
    
    if (barberId) {
      console.log("[DEBUG] fetchHaircutHistory - Filtrando por barbero:", barberId);
      constraints.push(where("barberId", "==", barberId));
    }
    
    const q = query(
      collection(db, "haircut_history"),
      ...constraints,
      orderBy("date", "desc")
    );
    
    console.log("[DEBUG] fetchHaircutHistory - Ejecutando consulta");
    const snapshot = await getDocs(q);
    console.log("[DEBUG] fetchHaircutHistory - Documentos encontrados:", snapshot.docs.length);
    
    const result = snapshot.docs.map(doc => {
      const data = doc.data();
      let dateValue;
      
      try {
        // Intentar convertir date a objeto Date si es un timestamp
        dateValue = data.date?.toDate ? data.date.toDate() : new Date(data.date);
      } catch (dateError) {
        console.error("[DEBUG] fetchHaircutHistory - Error al convertir fecha:", dateError);
        dateValue = new Date(); // Usar fecha actual como fallback
      }
      
      return {
        id: doc.id,
        ...data,
        date: dateValue
      };
    });
    
    console.log("[DEBUG] fetchHaircutHistory - Datos procesados:", result.length);
    return result;
  } catch (error) {
    console.error("Error al obtener el historial de cortes:", error);
    throw error;
  }
};