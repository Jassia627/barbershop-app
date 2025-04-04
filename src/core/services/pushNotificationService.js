import { messaging, initMessaging, db, auth } from '../../firebase/config';
import { getToken, onMessage } from 'firebase/messaging';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { logDebug, logError } from '../utils/logger';
import toast from 'react-hot-toast';
import { saveUserToken, getUserTokens } from './userService';
import sendNotification from '../../api/send-notification';

// Public VAPID key - Clave pública VAPID para Web Push
// Esta clave necesita ser generada correctamente desde la consola de Firebase
const VAPID_KEY = 'BM2dgOLr9a2cHD34NBlCRw_wBfdCdUgK7GsZMqbNxSUi_Mj5vVhRYUw0--nUmpIL9XRRU6Vfvep8-i7b0rMOX10';

// Detección de dispositivo móvil
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Guarda el token FCM del usuario en Firestore
 * @param {Object} user - Usuario actual
 * @param {string} token - Token FCM
 */
export const saveTokenToFirestore = async (user, token) => {
  if (!user || !user.uid || !token) {
    logError('saveTokenToFirestore: Usuario o token inválido', { 
      hasUser: !!user, 
      hasUid: user?.uid ? true : false, 
      hasToken: !!token 
    });
    return false;
  }

  try {
    const userTokenRef = doc(db, 'userTokens', user.uid);
    
    // Datos a guardar
    const tokenData = {
      uid: user.uid,
      fcmToken: token,
      role: user.role || 'client',
      shopId: user.shopId || null,
      lastUpdated: serverTimestamp(),
      platform: isMobileDevice() ? 'mobile' : 'web',
      isPWA: window.matchMedia('(display-mode: standalone)').matches,
      userAgent: navigator.userAgent
    };
    
    logDebug('Guardando token FCM:', tokenData);
    
    await setDoc(userTokenRef, tokenData, { merge: true });
    
    logDebug('Token FCM guardado exitosamente', token.slice(0, 10) + '...');
    
    // Imprimir un toast para confirmar
    toast.success('Notificaciones activadas', { duration: 2000 });
    
    return true;
  } catch (error) {
    logError('Error al guardar token FCM:', error);
    return false;
  }
};

/**
 * Inicializa las notificaciones push
 * @param {Object} user - Usuario actual
 */
export const initializePushNotifications = async (user) => {
  // Verificar si el usuario es válido
  if (!user || !user.uid) {
    logDebug('initializePushNotifications: Usuario inválido');
    return false;
  }

  try {
    logDebug('Iniciando configuración de notificaciones push', user);
    
    // Comprobar si el dispositivo es móvil
    const isMobile = isMobileDevice();
    logDebug('Tipo de dispositivo:', isMobile ? 'Móvil' : 'Desktop');
    
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      logDebug('Este navegador no soporta notificaciones push');
      toast.error('Tu dispositivo no soporta notificaciones push');
      return false;
    }
    
    // Verificar permiso de notificaciones
    const permission = await Notification.requestPermission();
    logDebug('Estado del permiso de notificaciones:', permission);
    
    if (permission !== 'granted') {
      toast.error('Para recibir notificaciones, acepta los permisos');
      return false;
    }
    
    // Asegurarnos de tener el service worker registrado
    let serviceWorkerRegistration;
    try {
      // Obtener el service worker ya registrado
      serviceWorkerRegistration = await navigator.serviceWorker.ready;
      logDebug('Service Worker listo:', serviceWorkerRegistration.scope);
    } catch (error) {
      logError('Error al obtener el Service Worker:', error);
      return false;
    }
    
    // Inicializar messaging si no está disponible
    let messagingInstance = messaging;
    if (!messagingInstance) {
      logDebug('Messaging no inicializado, intentando inicializar...');
      messagingInstance = await initMessaging();
    }

    // Verificar si el servicio de mensajería está disponible
    if (!messagingInstance) {
      logError('El servicio de mensajería de Firebase no está disponible');
      toast.error('Las notificaciones no están disponibles en este dispositivo');
      return false;
    }
    
    try {
      // Obtener token FCM - Primero intentamos sin la clave VAPID
      let token;
      
      try {
        logDebug('Intentando obtener token FCM sin VAPID key...');
        token = await getToken(messagingInstance, {
          serviceWorkerRegistration
        });
      } catch (vapidError) {
        logDebug('Error al obtener token sin VAPID, intentando con VAPID key...', vapidError);
        // Si falla, intentamos con la clave VAPID
        token = await getToken(messagingInstance, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration
        });
      }
      
      if (!token) {
        logError('No se pudo obtener el token FCM');
        toast.error('No se pudo configurar las notificaciones');
        return false;
      }
      
      logDebug('Token FCM obtenido:', token.substring(0, 10) + '...');
      
      // Guardar token en Firestore
      await saveTokenToFirestore(user, token);
      
      // Configurar manejo de mensajes en primer plano
      onMessage(messagingInstance, (payload) => {
        logDebug('Mensaje recibido en primer plano:', payload);
        
        const { notification } = payload;
        
        if (notification) {
          // Mostrar notificación usando react-hot-toast
          toast.success(notification.title, {
            duration: 8000,
            icon: '🔔',
            style: {
              background: '#4CAF50',
              color: '#fff',
              fontWeight: 'bold',
              padding: '16px',
            },
            description: notification.body
          });
          
          // Reproducir sonido
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => logDebug('Error al reproducir sonido:', e));
          } catch (e) {
            logDebug('Error al crear objeto de audio:', e);
          }
        }
      });
      
      logDebug('Sistema de notificaciones push inicializado correctamente');
      return true;
    } catch (error) {
      logError('Error al obtener token FCM:', error);
      toast.error('Error con las notificaciones: ' + error.message);
      return false;
    }
  } catch (error) {
    logError('Error al inicializar notificaciones push:', error);
    return false;
  }
};

/**
 * Envía una notificación directa a través de FCM usando credenciales de servidor
 * @param {string} tokenId - Token FCM del destinatario
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo de la notificación
 * @param {Object} data - Datos adicionales
 */
export const sendDirectNotification = async (tokenId, title, body, data = {}) => {
  if (!tokenId) {
    logError('Token FCM no válido');
    return false;
  }

  try {
    // Crear la estructura de la notificación
    const notificationPayload = {
      to: tokenId,
      notification: {
        title,
        body,
        icon: '/Rojo negro.png',
        sound: 'default',
        badge: '1',
        click_action: data.url || '/'
      },
      data: {
        ...data,
        url: data.url || '/',
        title,
        body
      },
      // Necesario para iOS
      content_available: true,
      priority: 'high'
    };

    logDebug('Enviando notificación:', notificationPayload);

    // Realizar la solicitud a FCM usando servidor proxy
    // Nota: Para entornos de producción, esto debería enviarse desde un servidor seguro con credenciales adecuadas
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationPayload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      logError('Error al enviar notificación:', errorData);
      return false;
    }
    
    const result = await response.json();
    logDebug('Respuesta FCM:', result);
    
    return result.success === true;
  } catch (error) {
    logError('Error al enviar notificación directa:', error);
    return false;
  }
};

/**
 * Envía una notificación push a todos los administradores de una tienda
 * @param {string} shopId - ID de la tienda
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo de la notificación
 * @param {Object} data - Datos adicionales
 */
export const sendPushNotificationToAdmins = async (shopId, title, body, data = {}) => {
  if (!shopId) {
    logError('sendPushNotificationToAdmins: ShopId inválido');
    return false;
  }

  try {
    // Primero, crear documento de notificación en Firestore para registro
    const notificationRef = await addDoc(collection(db, 'notifications'), {
      title,
      body,
      shopId,
      data,
      createdAt: serverTimestamp(),
      sent: false,
      platform: isMobileDevice() ? 'mobile' : 'web',
      isPWA: window.matchMedia('(display-mode: standalone)').matches
    });
    
    logDebug('Notificación guardada en Firestore:', notificationRef.id);
    
    // El enfoque más seguro es dejar que una Cloud Function maneje el envío de notificaciones
    // ya que tiene las credenciales correctas para hacerlo
    
    // Lo siguiente es solo para depuración y como ejemplo:
    // Obtener todos los tokens de administradores de esta tienda
    const tokensQuery = query(
      collection(db, 'userTokens'),
      where('shopId', '==', shopId),
      where('role', '==', 'admin')
    );
    
    const tokensSnapshot = await getDocs(tokensQuery);
    
    if (tokensSnapshot.empty) {
      logDebug('No se encontraron tokens de administradores para la tienda');
      return false;
    }
    
    logDebug(`Encontrados ${tokensSnapshot.size} tokens de administradores`);
    
    // Nota: En un entorno real, esta parte debería ser manejada por una Cloud Function
    return true;
  } catch (error) {
    logError('Error al enviar notificación push:', error);
    return false;
  }
};

export const sendPushNotification = async (userToken, title, body, data = {}) => {
  try {
    if (!userToken) {
      console.error('No se puede enviar notificación: Token de usuario no proporcionado');
      return false;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('El usuario debe estar autenticado para enviar notificaciones');
      return false;
    }

    const notificationPayload = {
      token: userToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      // Configuración para Android
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      // Configuración para Apple
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            content_available: true,
          },
        },
      },
      // Configuración para Web
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          icon: '/icons/icon-192x192.png',
        },
      },
    };

    // Usar el nuevo endpoint en lugar de la llamada directa a FCM
    const response = await sendNotification(notificationPayload);
    
    if (response.success) {
      console.log('Notificación enviada correctamente:', response.messageId);
      return true;
    } else {
      console.error('Error al enviar la notificación:', response.error);
      return false;
    }
  } catch (error) {
    console.error('Error al enviar la notificación:', error);
    return false;
  }
}; 