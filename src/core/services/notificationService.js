import { logDebug, logError } from '../utils/logger';
import { collection, query, where, orderBy, onSnapshot, Timestamp, limit } from 'firebase/firestore';
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

    // Verificar que estamos en un contexto seguro (HTTPS o localhost)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      logDebug("Las notificaciones requieren HTTPS o localhost");
      return;
    }

    if (Notification.permission === "granted") {
      logDebug(`Enviando notificación: ${title} - ${body}`);
      
      // Crear la notificación
      const notification = new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        requireInteraction: true,
        silent: false,
        tag: 'appointment-notification', // Para agrupar notificaciones similares
        vibrate: [200, 100, 200]
      });

      // Configurar el evento onclick
      notification.onclick = () => {
        logDebug('Notificación clickeada, redirigiendo...');
        window.focus();
        
        // Si hay un callback específico, ejecutarlo
        if (onClick && typeof onClick === 'function') {
          onClick();
        } else {
          // Comportamiento por defecto: redireccionar a la página de citas
          const adminAppointmentsPath = '/admin/appointments';
          if (window.location.pathname !== adminAppointmentsPath) {
            window.location.href = adminAppointmentsPath;
          }
        }
      };
      
      // Reproducir un sonido para llamar más la atención
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.7;
        audio.play().catch(err => logDebug('No se pudo reproducir sonido de notificación:', err));
      } catch (audioErr) {
        logDebug('Error al reproducir sonido:', audioErr);
      }
      
      return notification;
    } else if (Notification.permission !== "denied") {
      logDebug("Solicitando permiso para mostrar notificaciones");
      requestPermission().then(granted => {
        if (granted) {
          sendNotification(title, body, onClick);
        }
      });
    } else {
      logDebug("Permisos de notificación denegados por el usuario");
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

  logDebug('Configurando notificaciones para admin:', user.email, 'Shop ID:', user.shopId);

  // Solicitar permiso inmediatamente de forma asíncrona
  requestPermission().then(granted => {
    if (granted) {
      logDebug('✅ Permisos de notificación concedidos');
    } else {
      logDebug('❌ Permisos de notificación denegados o pendientes');
    }
  });

  // Calcular la fecha de hace 8 horas (para incluir citas más antiguas al iniciar)
  const hoursAgo = new Date();
  hoursAgo.setHours(hoursAgo.getHours() - 8);

  // Configurar el listener de Firestore - Optimizado para respuesta rápida
  logDebug('Iniciando listener de Firestore para citas pendientes en tienda:', user.shopId);
  
  // Verificación de seguridad para shopId
  if (!user.shopId) {
    logError('⚠️ Error: ShopId no definido para el usuario admin');
    return null;
  }
  
  try {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'appointments'),
        where('shopId', '==', user.shopId),
        where('status', '==', 'pending'),
        where('createdAt', '>=', Timestamp.fromDate(hoursAgo)),
        orderBy('createdAt', 'desc'),
        limit(30) // Limitamos para mejor rendimiento
      ),
      {
        includeMetadataChanges: true, // Incluye cambios de metadatos para actualizaciones más rápidas
      },
      (snapshot) => {
        // Verificar si los datos son del servidor y no de la caché
        const source = snapshot.metadata.fromCache ? "caché local" : "servidor";
        logDebug(`📥 Procesando ${snapshot.docChanges().length} cambios en citas (fuente: ${source})`);
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const appointment = change.doc.data();
            const appointmentId = change.doc.id;
            
            // Evitar notificaciones duplicadas
            if (!notifiedAppointments.has(appointmentId)) {
              notifiedAppointments.add(appointmentId);
              
              // Verificar si es una cita reciente (menos de 20 minutos)
              const appointmentTime = appointment.createdAt.toDate();
              const now = new Date();
              const diffInMinutes = (now - appointmentTime) / (1000 * 60);
              
              if (diffInMinutes <= 20) {
                logDebug(`🔔 Enviando notificación para cita de ${appointment.clientName} (ID: ${appointmentId})`);
                
                const formattedDate = format(appointment.date.toDate(), 'dd/MM/yyyy', { locale: es });
                const formattedTime = appointment.time || 'horario a confirmar';
                
                sendNotification(
                  '¡Nueva Cita Pendiente! 📅',
                  `${appointment.clientName} ha solicitado una cita para el ${formattedDate} a las ${formattedTime}`,
                  () => {
                    window.location.href = '/admin/appointments';
                  }
                );
              } else {
                logDebug(`Cita de ${appointment.clientName} no es reciente (${diffInMinutes.toFixed(1)} minutos de antigüedad)`);
              }
            }
          }
        });
      },
      (error) => {
        logError('⚠️ Error en el listener de citas:', error);
        // Intentar reconectar después de un error
        setTimeout(() => {
          logDebug('🔄 Intentando reconectar listener después de error');
          setupAppointmentNotifications(user);
        }, 3000); // Reconectar rápidamente
      }
    );
    
    logDebug('✅ Listener de notificaciones configurado exitosamente');
    return unsubscribe;
  } catch (setupError) {
    logError('🛑 Error al configurar el listener de notificaciones:', setupError);
    return () => {}; // Retornar una función vacía para evitar errores
  }
}; 