import { messaging, initMessaging, db } from '../../firebase/config';
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

// Public VAPID key - Clave pública VAPID para Web Push
const VAPID_KEY = 'BM2dgOLr9a2cHD34NBlCRw_wBfdCdUgK7GsZMqbNxSUi_Mj5vVhRYUw0--nUmpIL9XRRU6Vfvep8-i7b0rMOX10';

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
      platform: 'web',
      isPWA: window.matchMedia('(display-mode: standalone)').matches,
      userAgent: navigator.userAgent
    };
    
    logDebug('Guardando token FCM:', tokenData);
    
    await setDoc(userTokenRef, tokenData, { merge: true });
    
    logDebug('Token FCM guardado exitosamente', token.slice(0, 10) + '...');
    
    // Imprimir un toast para confirmar (solo en modo desarrollo)
    if (process.env.NODE_ENV === 'development') {
      toast.success('FCM Token guardado', { duration: 2000 });
    }
    
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
    
    // Inicializar messaging si no está disponible
    let messagingInstance = messaging;
    if (!messagingInstance) {
      logDebug('Messaging no inicializado, intentando inicializar...');
      messagingInstance = await initMessaging();
    }

    // Verificar si el servicio de mensajería está disponible
    if (!messagingInstance) {
      logError('El servicio de mensajería de Firebase no está disponible');
      
      // Notificar al usuario en modo PWA
      if (window.matchMedia('(display-mode: standalone)').matches) {
        toast.error('Las notificaciones no están disponibles en este dispositivo');
      }
      
      return false;
    }

    // Solicitar permiso para notificaciones
    logDebug('Solicitando permiso para notificaciones push...');
    
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      logDebug('Este navegador no soporta notificaciones push');
      
      if (window.matchMedia('(display-mode: standalone)').matches) {
        toast.error('Tu dispositivo no soporta notificaciones push');
      }
      
      return false;
    }
    
    // Verificar permiso de notificaciones
    const permission = await Notification.requestPermission();
    logDebug('Estado del permiso de notificaciones:', permission);
    
    if (permission !== 'granted') {
      // Mostrar mensaje solo en PWA
      if (window.matchMedia('(display-mode: standalone)').matches) {
        toast.error('Para recibir notificaciones, acepta los permisos');
      }
      return false;
    }
    
    // Asegurarnos de tener el service worker registrado
    let serviceWorkerRegistration;
    try {
      serviceWorkerRegistration = await navigator.serviceWorker.ready;
      logDebug('Service Worker listo:', serviceWorkerRegistration.scope);
    } catch (error) {
      logError('Error al obtener el Service Worker:', error);
      return false;
    }
    
    // Obtener token FCM
    logDebug('Obteniendo token FCM...');
    const tokenOptions = { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration
    };
    
    logDebug('Token options:', tokenOptions);
    
    const token = await getToken(messagingInstance, tokenOptions);
    
    if (!token) {
      logError('No se pudo obtener el token FCM');
      if (window.matchMedia('(display-mode: standalone)').matches) {
        toast.error('No se pudo configurar las notificaciones');
      }
      return false;
    }
    
    logDebug('Token FCM obtenido:', token.slice(0, 10) + '...');
    
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
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
      toast.success('Notificaciones configuradas correctamente');
    }
    
    logDebug('Sistema de notificaciones push inicializado correctamente');
    return true;
  } catch (error) {
    logError('Error al inicializar notificaciones push:', error);
    return false;
  }
};

/**
 * Envía una notificación directa a través de FCM sin usar Cloud Functions
 * @param {string} tokenId - Token FCM del destinatario
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo de la notificación
 * @param {Object} data - Datos adicionales
 */
export const sendDirectNotification = async (tokenId, title, body, data = {}) => {
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=AAAA4pu7GR0:APA91bEOqP7JdPb3n8D3HFZLwAXEjw7RJsn3BK0cw1gTWLz3p3vwQHFTv2LNSgJm7g4MoXKQeIB-i8x_0x3w2XQXJzxyvDrmT9yXQZtlsVhP-3qf4Nf_DsS9j6pJiafMYv1B3CJScJAz`
      },
      body: JSON.stringify({
        to: tokenId,
        notification: {
          title,
          body,
          icon: '/Rojo negro.png',
          click_action: data.url || '/'
        },
        data
      })
    });
    
    const result = await response.json();
    logDebug('Respuesta FCM:', result);
    return result.success === 1;
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
    // Primero, crear documento de notificación en Firestore
    await addDoc(collection(db, 'notifications'), {
      title,
      body,
      shopId,
      data,
      createdAt: serverTimestamp(),
      sent: false,
      platform: 'web',
      isPWA: window.matchMedia('(display-mode: standalone)').matches
    });
    
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
    
    // Enviar notificación a cada token encontrado
    const sendPromises = tokensSnapshot.docs.map(doc => {
      const tokenData = doc.data();
      if (tokenData.fcmToken) {
        return sendDirectNotification(tokenData.fcmToken, title, body, data);
      }
      return Promise.resolve(false);
    });
    
    const results = await Promise.all(sendPromises);
    const successCount = results.filter(Boolean).length;
    
    logDebug(`Notificaciones enviadas: ${successCount}/${results.length}`);
    return successCount > 0;
  } catch (error) {
    logError('Error al enviar notificación push:', error);
    return false;
  }
}; 