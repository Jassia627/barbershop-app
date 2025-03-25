import { logDebug, logError } from '../utils/logger';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

let notificationPermission = false;

export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      logDebug('Este navegador no soporta notificaciones de escritorio');
      return false;
    }

    const permission = await Notification.requestPermission();
    notificationPermission = permission === 'granted';
    return notificationPermission;
  } catch (error) {
    logError('Error al solicitar permiso de notificaciones:', error);
    return false;
  }
};

export const sendNotification = async ({ title, body, onClick = null }) => {
  try {
    if (!notificationPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }

    const notification = new Notification(title, {
      body,
      icon: '/logo.png', // Asegúrate de tener este archivo en la carpeta public
      badge: '/logo.png',
      requireInteraction: true
    });

    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }
  } catch (error) {
    logError('Error al enviar notificación:', error);
  }
};

export const setupAppointmentNotifications = (user) => {
  if (!user || user.role !== 'admin') return;

  // Solicitar permiso al iniciar
  requestNotificationPermission();

  // Configurar listener para nuevas citas
  const unsubscribe = onSnapshot(
    query(
      collection(db, 'appointments'),
      where('shopId', '==', user.shopId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const appointment = change.doc.data();
          sendNotification({
            title: '¡Nueva Cita Pendiente!',
            body: `${appointment.clientName} ha solicitado una cita para ${format(appointment.date.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
            onClick: () => {
              window.location.href = '/admin/appointments';
            }
          });
        }
      });
    },
    (error) => {
      logError('Error al escuchar nuevas citas:', error);
    }
  );

  return unsubscribe;
}; 