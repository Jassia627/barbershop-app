import { logDebug, logError } from '../utils/logger';
import toast from 'react-hot-toast';

// Variable para almacenar información de suscripción
let pushSubscription = null;
let publicVapidKey = null;

/**
 * Obtiene la clave pública VAPID desde el servidor directamente
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
export const registerServiceWorker = async () => {
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
export const requestNotificationPermission = async () => {
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
 * Guarda una suscripción en el servidor
 */
export const saveSubscription = async (subscription, userData) => {
  try {
    const { shopId, role, email } = userData;
    
    const response = await fetch('/api/save-direct-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: JSON.parse(JSON.stringify(subscription)),
        shopId,
        role,
        email,
        userAgent: navigator.userAgent
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al guardar suscripción: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    logError('Error al guardar suscripción:', error);
    throw error;
  }
};

/**
 * Subscribir a notificaciones push sin depender de Firebase Auth
 */
export const subscribeDirectToPush = async (userData) => {
  try {
    logDebug('Iniciando suscripción directa a notificaciones push...');
    
    // Verificar datos de usuario
    if (!userData || !userData.email || !userData.shopId) {
      throw new Error('Datos de usuario incompletos');
    }
    
    // Solicitar permiso
    await requestNotificationPermission();
    
    // Obtener clave VAPID
    const vapidKey = await getVapidPublicKey();
    
    // Registrar service worker
    const swRegistration = await registerServiceWorker();
    
    // Convertir clave VAPID a Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);
    
    // Verificar si ya existe una suscripción
    const existingSubscription = await swRegistration.pushManager.getSubscription();
    if (existingSubscription) {
      logDebug('Ya existe una suscripción, cancelándola para crear una nueva');
      await existingSubscription.unsubscribe();
    }
    
    // Crear nueva suscripción
    logDebug('Creando nueva suscripción...');
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
    
    logDebug('Suscripción creada correctamente');
    
    // Guardar la suscripción en el servidor
    await saveSubscription(subscription, userData);
    
    // Guardar localmente
    pushSubscription = subscription;
    
    // Notificación de prueba
    setTimeout(() => {
      try {
        new Notification('Notificaciones activadas', {
          body: 'Las notificaciones push han sido activadas correctamente.',
          icon: '/badge.png'
        });
      } catch (e) {
        logError('Error al mostrar notificación de prueba:', e);
      }
    }, 1000);
    
    return true;
  } catch (error) {
    logError('Error al suscribirse a notificaciones push:', error);
    throw error;
  }
};

/**
 * Función para convertir una cadena base64 a Uint8Array (necesario para web-push)
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
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