import { logDebug, logError } from '../utils/logger';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

let notificationPermission = false;

const NOTIFICATION_ICON = '/bb.png'; // Usando el logo existente

export const requestNotificationPermission = async () => {
  try {
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      logDebug('Este navegador no soporta notificaciones de escritorio');
      return false;
    }

    // Verificar si estamos en HTTPS (excepto en localhost)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      logDebug('Las notificaciones web requieren HTTPS');
      return false;
    }

    // Solicitar permiso
    const permission = await Notification.requestPermission();
    notificationPermission = permission === 'granted';
    
    // Guardar el permiso en localStorage para futuras referencias
    if (notificationPermission) {
      localStorage.setItem('notificationPermission', 'granted');
    }
    
    return notificationPermission;
  } catch (error) {
    logError('Error al solicitar permiso de notificaciones:', error);
    return false;
  }
};

export const sendNotification = async ({ title, body, onClick = null }) => {
  try {
    // Verificar si tenemos permiso guardado
    const savedPermission = localStorage.getItem('notificationPermission');
    
    if (!notificationPermission && !savedPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        logDebug('No se tienen permisos para enviar notificaciones');
        return;
      }
    }

    // Verificar si el navegador está enfocado
    if (document.visibilityState === 'visible') {
      logDebug('La página está visible, no se envía notificación');
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_ICON,
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200]
    });

    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }

    // Reproducir un sonido de notificación
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.play();
    } catch (audioError) {
      logDebug('No se pudo reproducir el sonido de notificación:', audioError);
    }

  } catch (error) {
    logError('Error al enviar notificación:', error);
  }
};

export const setupAppointmentNotifications = (user) => {
  if (!user || user.role !== 'admin') return;

  // Solicitar permisos inmediatamente al configurar
  requestNotificationPermission();
  
  // Verificar periódicamente el estado de los permisos
  setInterval(() => {
    if (Notification.permission === 'granted' && !notificationPermission) {
      notificationPermission = true;
      localStorage.setItem('notificationPermission', 'granted');
    }
  }, 60000); // Verificar cada minuto

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