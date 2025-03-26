import { logDebug, logError } from '../utils/logger';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Variables para controlar las notificaciones
const notifiedAppointments = new Set();

// Solicitar permiso de notificaciones
const requestPermission = async () => {
  try {
    if (!("Notification" in window)) {
      logDebug("Este navegador no soporta notificaciones");
      return false;
    }

    if (Notification.permission === "granted") {
      logDebug("Permiso de notificaciones ya otorgado");
      return true;
    }

    const permission = await Notification.requestPermission();
    logDebug('Estado del permiso de notificaciones:', permission);
    return permission === 'granted';
  } catch (error) {
    logError('Error al solicitar permiso:', error);
    return false;
  }
};

// Enviar una notificación
export const sendNotification = (title, body, onClick) => {
  try {
    if (!("Notification" in window)) {
      logDebug("Este navegador no soporta notificaciones");
      return;
    }

    if (Notification.permission === "granted") {
      logDebug(`Enviando notificación: ${title} - ${body}`);
      const notification = new Notification(title, {
        body,
        icon: '/logo.png',
        requireInteraction: true
      });

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
        };
      }
    } else {
      logDebug("No hay permiso para mostrar notificaciones");
    }
  } catch (error) {
    logError('Error al mostrar notificación:', error);
  }
};

export const setupAppointmentNotifications = (user) => {
  // Verificar si el usuario es admin
  if (user?.role !== 'admin') {
    logDebug('Usuario no es admin, no se configurarán notificaciones');
    return null;
  }

  logDebug('Configurando notificaciones para admin:', user.email);

  // Solicitar permiso inmediatamente
  const hasPermission = requestPermission();
  if (!hasPermission) {
    logDebug('Sin permiso para notificaciones, intentando solicitar');
    requestPermission();
  }

  // Calcular la fecha de hace 2 horas (para incluir citas más antiguas al iniciar)
  const twoHoursAgo = new Date();
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

  // Configurar el listener de Firestore
  logDebug('Iniciando listener de Firestore para citas pendientes');
  return onSnapshot(
    query(
      collection(db, 'appointments'),
      where('shopId', '==', user.shopId),
      where('status', '==', 'pending'),
      where('createdAt', '>=', Timestamp.fromDate(twoHoursAgo)),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => {
      logDebug(`Procesando ${snapshot.docChanges().length} cambios en citas`);
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const appointment = change.doc.data();
          const appointmentId = change.doc.id;
          
          logDebug('Cita detectada:', appointmentId, appointment);
          
          // Evitar notificaciones duplicadas
          if (!notifiedAppointments.has(appointmentId)) {
            notifiedAppointments.add(appointmentId);
            
            logDebug('Enviando notificación para nueva cita:', appointmentId);
            sendNotification(
              '¡Nueva Cita!',
              `${appointment.clientName} ha solicitado una cita para ${format(appointment.date.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
              () => {
                window.location.href = '/admin/appointments';
              }
            );
          } else {
            logDebug('Cita ya notificada anteriormente:', appointmentId);
          }
        }
      });
    },
    (error) => {
      logError('Error en el listener de citas:', error);
      // Intentar reconectar después de un error
      setTimeout(() => {
        logDebug('Intentando reconectar listener después de error');
        setupAppointmentNotifications(user);
      }, 5000);
    }
  );
}; 