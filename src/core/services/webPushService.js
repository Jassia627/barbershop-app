import { logDebug, logError } from '../utils/logger';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';

// Variable para almacenar información de suscripción
let pushSubscription = null;
let publicVapidKey = null;

/**
 * Convierte una cadena base64 URL-safe a un Uint8Array
 * Necesario para las claves VAPID
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Obtiene la clave pública VAPID desde el servidor
 */
export const getVapidPublicKey = async () => {
  try {
    if (publicVapidKey) {
      logDebug('Usando clave VAPID en caché:', publicVapidKey.slice(0, 10) + '...');
      return publicVapidKey;
    }
    
    logDebug('Solicitando clave VAPID al servidor...');
    const response = await fetch('/api/get-vapid-key');
    
    if (!response.ok) {
      const errorText = await response.text();
      logError(`Error HTTP ${response.status}: ${errorText}`);
      throw new Error(`Error al obtener clave VAPID: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.publicKey) {
      throw new Error('El servidor no devolvió una clave VAPID válida');
    }
    
    publicVapidKey = data.publicKey;
    logDebug('Clave VAPID recibida:', publicVapidKey.slice(0, 10) + '...');
    
    return publicVapidKey;
  } catch (error) {
    logError('Error al obtener clave VAPID pública:', error);
    throw error;
  }
};

/**
 * Registra el service worker para Web Push
 */
export const registerWebPushServiceWorker = async () => {
  try {
    // Verificar si el navegador soporta service workers
    if (!('serviceWorker' in navigator)) {
      logDebug('Este navegador no soporta Service Workers');
      throw new Error('Este navegador no soporta Service Workers');
    }
    
    logDebug('Registrando service worker para Web Push...');
    
    // Registrar el service worker
    const registration = await navigator.serviceWorker.register('/webpush-sw.js');
    logDebug('Service Worker de Web Push registrado:', registration.scope);
    
    // Esperar a que el service worker esté activo
    if (registration.installing) {
      logDebug('Service Worker está instalándose...');
      
      // Esperar a que el Service Worker esté listo
      await new Promise((resolve) => {
        registration.installing.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            logDebug('Service Worker activado');
            resolve();
          }
        });
      });
    }
    
    return registration;
  } catch (error) {
    logError('Error al registrar Service Worker de Web Push:', error);
    throw error;
  }
};

/**
 * Solicita permiso para notificaciones push
 */
export const requestPushPermission = async () => {
  try {
    if (!('Notification' in window)) {
      logDebug('Este navegador no soporta notificaciones');
      throw new Error('Este navegador no soporta notificaciones');
    }
    
    logDebug('Estado actual del permiso de notificaciones:', Notification.permission);
    
    if (Notification.permission === 'granted') {
      logDebug('Permiso de notificaciones ya concedido');
      return true;
    }
    
    if (Notification.permission === 'denied') {
      logDebug('Permiso de notificaciones denegado previamente');
      toast.error('Las notificaciones están bloqueadas en tu navegador. Debes habilitarlas en la configuración.', {
        duration: 5000,
        icon: '🔔',
      });
      throw new Error('Permiso de notificaciones denegado previamente. Debes habilitarlas en la configuración del navegador.');
    }
    
    // Solicitar permiso
    logDebug('Solicitando permiso de notificaciones...');
    const permission = await Notification.requestPermission();
    logDebug('Resultado de solicitud de permiso:', permission);
    
    if (permission !== 'granted') {
      toast.error('Para recibir notificaciones, acepta los permisos');
      throw new Error('Permiso de notificaciones denegado por el usuario');
    }
    
    return true;
  } catch (error) {
    logError('Error al solicitar permiso de notificaciones:', error);
    throw error;
  }
};

/**
 * Suscribe al usuario a las notificaciones push
 */
export const subscribeToPushNotifications = async (user) => {
  try {
    if (!user || !user.uid) {
      logDebug('Usuario inválido para suscripción push');
      throw new Error('Usuario inválido o no autenticado');
    }
    
    logDebug('Iniciando proceso de suscripción para usuario:', user.uid);
    
    // Verificar permisos primero
    await requestPushPermission();
    logDebug('Permiso de notificaciones concedido');
    
    // Obtener clave pública VAPID
    const vapidPublicKey = await getVapidPublicKey();
    logDebug('Clave VAPID obtenida correctamente');
    
    // Registrar service worker si aún no está registrado
    const swRegistration = await registerWebPushServiceWorker();
    logDebug('Service Worker registrado correctamente');
    
    try {
      // Convertir clave VAPID a Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      logDebug('Clave VAPID convertida correctamente');
      
      // Verificar si ya existe una suscripción
      const existingSubscription = await swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        logDebug('Ya existe una suscripción, cancelándola para crear una nueva');
        await existingSubscription.unsubscribe();
      }
      
      // Suscribirse a Push
      logDebug('Solicitando suscripción Push...');
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      
      logDebug('Suscripción Push creada exitosamente');
      
      // Guardar suscripción localmente
      pushSubscription = subscription;
      
      // Obtener token de autenticación
      logDebug('Obteniendo token de autenticación...');
      const idToken = await auth.currentUser.getIdToken();
      
      // Preparar datos para enviar al servidor
      const subscriptionData = JSON.parse(JSON.stringify(subscription));
      
      // Enviar suscripción al servidor
      logDebug('Enviando suscripción al servidor...');
      const response = await fetch('/api/save-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          subscription: subscriptionData,
          shopId: user.shopId,
          role: user.role
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logError(`Error al guardar suscripción: ${response.status} ${response.statusText}. Detalles: ${errorText}`);
        throw new Error(`Error al guardar suscripción: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      logDebug('Respuesta del servidor:', responseData);
      
      logDebug('Proceso de suscripción completado exitosamente');
      toast.success('Notificaciones activadas correctamente');
      
      // Enviar una notificación de prueba
      setTimeout(() => {
        try {
          new Notification('Notificaciones activadas', {
            body: 'Las notificaciones están configuradas correctamente.',
            icon: '/badge.png'
          });
        } catch (e) {
          logError('Error al mostrar notificación de prueba:', e);
        }
      }, 1000);
      
      return true;
    } catch (subscriptionError) {
      logError('Error al suscribirse a push:', subscriptionError);
      
      if (subscriptionError.name === 'NotAllowedError') {
        toast.error('El permiso para notificaciones fue denegado');
        throw new Error('Permiso denegado al intentar suscribirse');
      } else if (subscriptionError.name === 'AbortError') {
        toast.error('La suscripción fue cancelada');
        throw new Error('Proceso de suscripción cancelado');
      } else {
        toast.error('Error al activar notificaciones: ' + subscriptionError.message);
        throw subscriptionError;
      }
    }
  } catch (error) {
    logError('Error en proceso de suscripción push:', error);
    throw error;
  }
};

/**
 * Inicializa el sistema de notificaciones web push
 */
export const initializeWebPushNotifications = async (user) => {
  try {
    if (!user || !user.uid) {
      logDebug('Usuario inválido para inicializar notificaciones push');
      return false;
    }
    
    logDebug('Inicializando notificaciones Web Push para:', user.uid);
    
    // Los administradores deben recibir notificaciones
    if (user.role === 'admin') {
      return await subscribeToPushNotifications(user);
    } else {
      logDebug('Usuario no es admin, no se configurarán notificaciones push');
      return false;
    }
  } catch (error) {
    logError('Error al inicializar notificaciones web push:', error);
    return false;
  }
}; 