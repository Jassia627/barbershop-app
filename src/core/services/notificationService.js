import { logDebug, logError } from '../utils/logger';
import { collection, query, where, orderBy, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Set para rastrear las citas ya notificadas
const notifiedAppointments = new Set();

// Solicitar permiso de notificaciones
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    logDebug('Estado del permiso de notificaciones:', permission);
    return permission === 'granted';
  } catch (error) {
    logError('Error al solicitar permiso:', error);
    return false;
  }
};

// Enviar una notificación
export const sendNotification = async ({ title, body, onClick = null }) => {
  try {
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      logError('Este navegador no soporta notificaciones');
      return;
    }

    // Verificar el permiso actual
    if (Notification.permission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        logError('Permiso de notificaciones denegado');
        return;
      }
    }

    logDebug('Enviando notificación:', { title, body });
    const notification = new Notification(title, {
      body,
      icon: '/logo.png',
      requireInteraction: true,
      vibrate: [200, 100, 200]
    });

    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
      };
    }
  } catch (error) {
    logError('Error al mostrar notificación:', error);
  }
};

// Verificar citas recientes
const checkRecentAppointments = async (shopId) => {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now - 60000); // 1 minuto atrás

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('shopId', '==', shopId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(appointmentsQuery);
    
    snapshot.docs.forEach((doc) => {
      const appointment = doc.data();
      const appointmentTime = appointment.createdAt.toDate();
      
      // Verificar si la cita ya fue notificada
      if (!notifiedAppointments.has(doc.id) && appointmentTime > oneMinuteAgo) {
        logDebug('Verificando cita reciente:', {
          appointment,
          appointmentTime,
          oneMinuteAgo,
          isRecent: appointmentTime > oneMinuteAgo
        });

        sendNotification({
          title: '¡Nueva Cita!',
          body: `${appointment.clientName} ha solicitado una cita para ${format(appointment.date.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
          onClick: () => {
            window.location.href = '/admin/appointments';
          }
        });

        // Marcar la cita como notificada
        notifiedAppointments.add(doc.id);
      }
    });
  } catch (error) {
    logError('Error al verificar citas recientes:', error);
  }
};

export const setupAppointmentNotifications = (user) => {
  if (!user || user.role !== 'admin') {
    logDebug('Usuario no es admin:', user);
    return null;
  }

  logDebug('Configurando notificaciones para admin:', user);

  // Solicitar permiso inmediatamente
  requestNotificationPermission();

  // Verificar citas recientes al iniciar sesión
  checkRecentAppointments(user.shopId);

  // Configurar el listener de Firestore para nuevas citas
  const unsubscribe = onSnapshot(
    query(
      collection(db, 'appointments'),
      where('shopId', '==', user.shopId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => {
      logDebug('Cambios detectados en citas:', {
        cambios: snapshot.docChanges().length,
        cambiosDetallados: snapshot.docChanges().map(change => ({
          tipo: change.type,
          id: change.doc.id,
          datos: change.doc.data()
        }))
      });

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !notifiedAppointments.has(change.doc.id)) {
          const appointment = change.doc.data();
          const appointmentTime = appointment.createdAt.toDate();
          const now = new Date();
          const diffInSeconds = (now - appointmentTime) / 1000;
          
          logDebug('Nueva cita detectada:', {
            appointment,
            diffInSeconds,
            appointmentTime,
            now,
            isRecent: diffInSeconds <= 60
          });
          
          // Enviar notificación para todas las citas nuevas
          sendNotification({
            title: '¡Nueva Cita!',
            body: `${appointment.clientName} ha solicitado una cita para ${format(appointment.date.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
            onClick: () => {
              window.location.href = '/admin/appointments';
            }
          });

          // Marcar la cita como notificada
          notifiedAppointments.add(change.doc.id);
        }
      });
    },
    (error) => {
      logError('Error en el listener:', error);
      // Intentar reconectar el listener
      logDebug('Intentando reconectar el listener...');
      unsubscribe();
      setupAppointmentNotifications(user);
    }
  );

  return unsubscribe;
}; 