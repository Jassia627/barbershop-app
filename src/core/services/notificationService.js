import { logDebug, logError } from '../utils/logger';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { initializePushNotifications, sendPushNotificationToAdmins } from './pushNotificationService';

// Variables para controlar las notificaciones
const notifiedAppointments = new Set();
let notificationInterval = null;
let isCheckingAppointments = false;
let pushNotificationsInitialized = false;

// Detectar si es dispositivo móvil
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Solicitar permiso de notificaciones
const requestPermission = async () => {
  try {
    if (!("Notification" in window)) {
      console.log("Este navegador no soporta notificaciones nativas");
      return false;
    }

    if (Notification.permission === "granted") {
      console.log("Permiso de notificaciones ya otorgado");
      return true;
    }

    const permission = await Notification.requestPermission();
    console.log('Estado del permiso de notificaciones:', permission);
    
    if (permission !== 'granted') {
      toast.error("Para recibir notificaciones, acepta los permisos");
    }
    
    return permission === 'granted';
  } catch (error) {
    console.error('Error al solicitar permiso:', error);
    return false;
  }
};

// Reproducir sonido de notificación
const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log('No se pudo reproducir sonido:', e));
  } catch (e) {
    console.log('Error al reproducir sonido:', e);
  }
};

// Enviar una notificación
export const sendNotification = (title, body, onClick) => {
  try {
    console.log(`NOTIFICACIÓN: ${title} - ${body}`);
    
    // Intentar reproducir sonido
    playNotificationSound();
    
    // Mostrar toast más llamativo para móviles
    if (isMobileDevice()) {
      toast(body, {
        duration: 8000,
        icon: '🔔',
        style: {
          background: '#ff5c5c',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold',
          padding: '16px',
          borderRadius: '10px',
        },
      });
    } else {
      // Toast normal para escritorio
      toast(body, {
        duration: 5000,
        icon: '🔔',
      });
    }
    
    // Mostrar notificación nativa si hay permiso (principalmente para escritorio)
    if (!isMobileDevice() && Notification.permission === "granted") {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/logo.png',
          requireInteraction: true,
          silent: false,
        });

        if (onClick) {
          notification.onclick = () => {
            window.focus();
            onClick();
          };
        }
      } catch (notifError) {
        console.error('Error al mostrar notificación nativa:', notifError);
      }
    }
  } catch (error) {
    console.error('Error al mostrar notificación:', error);
  }
};

// Verificar todas las citas - enfoque simple
const checkAppointments = async (user) => {
  if (isCheckingAppointments) {
    return;
  }
  
  try {
    isCheckingAppointments = true;
    
    if (!user || !user.shopId) {
      console.error('Usuario inválido para verificar citas');
      isCheckingAppointments = false;
      return;
    }
    
    // Obtener TODAS las citas (sin filtros)
    const appointmentsCollection = collection(db, 'appointments');
    const snapshot = await getDocs(appointmentsCollection);
    
    console.log(`Se encontraron ${snapshot.docs.length} citas en total`);
    
    if (snapshot.docs.length === 0) {
      isCheckingAppointments = false;
      return;
    }
    
    // Calcular timestamp de hace 5 minutos
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    // Filtrar en memoria citas pendientes, recientes y de la tienda correcta
    const relevantAppointments = snapshot.docs.filter(doc => {
      try {
        const appointment = doc.data();
        
        // Verificar shopId
        if (appointment.shopId !== user.shopId) return false;
        
        // Verificar status
        if (appointment.status !== 'pending') return false;
        
        // Verificar timestamp si existe
        if (appointment.createdAt) {
          try {
            const createdAt = appointment.createdAt.toDate();
            return createdAt >= fiveMinutesAgo;
          } catch (e) {
            return false;
          }
        }
        
        // Si no hay createdAt, no podemos filtrar por tiempo
        return false;
      } catch (e) {
        return false;
      }
    });
    
    console.log(`Se encontraron ${relevantAppointments.length} citas relevantes`);
    
    // Procesar citas relevantes
    relevantAppointments.forEach(doc => {
      const appointment = doc.data();
      const appointmentId = doc.id;
      
      // Si ya notificamos esta cita antes, la ignoramos
      if (notifiedAppointments.has(appointmentId)) {
        return;
      }
      
      console.log('¡NUEVA CITA DETECTADA!', appointment);
      
      // Marcar como notificada
      notifiedAppointments.add(appointmentId);
      
      // Formatear fecha
      let formattedDate = 'fecha no disponible';
      try {
        if (appointment.date) {
          formattedDate = format(appointment.date.toDate(), 'dd/MM/yyyy HH:mm', { locale: es });
        }
      } catch (dateError) {
        console.error('Error al formatear fecha:', dateError);
      }
      
      // Crear mensaje de notificación
      const notificationTitle = '¡Nueva Cita!';
      const notificationBody = `${appointment.clientName || 'Un cliente'} ha solicitado una cita para ${formattedDate}`;
      
      // Enviar notificación local
      sendNotification(
        notificationTitle,
        notificationBody,
        () => {
          window.location.href = '/admin/appointments';
        }
      );
      
      // También enviar notificación push para dispositivos móviles
      sendPushNotificationToAdmins(
        user.shopId, 
        notificationTitle, 
        notificationBody, 
        {
          appointmentId,
          url: '/admin/appointments',
          type: 'new_appointment'
        }
      ).catch(e => console.error('Error al enviar notificación push:', e));
      
      // Para móviles, mostrar una segunda notificación para llamar más la atención
      if (isMobileDevice()) {
        setTimeout(() => {
          toast.success('¡Tienes una nueva solicitud de cita!', {
            duration: 5000,
            icon: '📱',
            style: {
              background: '#4CAF50',
              color: '#fff',
              fontWeight: 'bold',
            },
          });
        }, 1000);
      }
    });
    
  } catch (error) {
    console.error('Error al verificar citas:', error);
    toast.error("Error al verificar citas");
  } finally {
    isCheckingAppointments = false;
  }
};

// Configurar sistema de notificaciones
export const setupAppointmentNotifications = (user) => {
  try {
    console.log('Iniciando configuración de notificaciones para:', user);
    
    // Verificación básica
    if (!user) {
      console.error('No hay usuario para configurar notificaciones');
      return null;
    }
    
    // Verificar si el usuario es admin
    if (user.role !== 'admin') {
      console.log('Usuario no es admin, no se configurarán notificaciones');
      return null;
    }
    
    // Verificar shopId
    if (!user.shopId) {
      console.error('Usuario admin sin shopId');
      toast.error("Error: No se puede identificar tu barbería");
      return null;
    }

    // Limpiar intervalo anterior si existe
    if (notificationInterval) {
      clearInterval(notificationInterval);
      notificationInterval = null;
    }

    // Inicializar notificaciones push (incluye solicitud de permiso)
    if (!pushNotificationsInitialized) {
      initializePushNotifications(user)
        .then(success => {
          pushNotificationsInitialized = success;
          console.log('Inicialización de notificaciones push:', success ? 'exitosa' : 'fallida');
        })
        .catch(error => {
          console.error('Error al inicializar notificaciones push:', error);
        });
    }
    
    // Para navegadores de escritorio, solicitar permiso para notificaciones nativas
    if (!isMobileDevice()) {
      requestPermission();
    }
    
    // Toast para confirmar que el sistema está funcionando
    toast.success("Sistema de notificaciones activado", {
      duration: 3000,
      icon: '✅',
    });
    
    // Mostrar mensaje específico para móviles
    if (isMobileDevice()) {
      setTimeout(() => {
        toast('Mantén esta pestaña abierta para recibir notificaciones', {
          duration: 5000,
          icon: '📱',
          style: {
            background: '#2196F3',
            color: '#fff',
          },
        });
      }, 2000);
    }
    
    // Verificar citas inmediatamente
    setTimeout(() => {
      checkAppointments(user);
    }, 2000);
    
    // Configurar verificación periódica cada 10 segundos
    notificationInterval = setInterval(() => {
      checkAppointments(user);
    }, 10000);
    
    // Función de limpieza
    return () => {
      if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
      }
    };
  } catch (error) {
    console.error('Error al configurar notificaciones:', error);
    toast.error("Error al configurar notificaciones");
    return null;
  }
}; 