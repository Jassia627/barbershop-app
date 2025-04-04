import { messaging } from '../firebase/config';
import { db } from '../firebase/config';
import { getToken, onMessage } from 'firebase/messaging';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { logDebug, logError } from '../utils/logger';
import toast from 'react-hot-toast';

// Public VAPID key
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
    
    await setDoc(userTokenRef, {
      uid: user.uid,
      fcmToken: token,
      role: user.role || 'client',
      shopId: user.shopId || null,
      lastUpdated: serverTimestamp(),
      platform: 'web',
      userAgent: navigator.userAgent
    }, { merge: true });
    
    logDebug('Token FCM guardado exitosamente', token.slice(0, 10) + '...');
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
    // Verificar si el servicio de mensajería está disponible
    if (!messaging) {
      logDebug('El servicio de mensajería de Firebase no está disponible');
      return false;
    }

    // Solicitar permiso para notificaciones
    logDebug('Solicitando permiso para notificaciones push...');
    
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      logDebug('Este navegador no soporta notificaciones push');
      return false;
    }
    
    // Verificar permiso de notificaciones
    const permission = await Notification.requestPermission();
    logDebug('Estado del permiso de notificaciones:', permission);
    
    if (permission !== 'granted') {
      toast.error('Para recibir notificaciones push, acepta los permisos');
      return false;
    }
    
    // Obtener token FCM
    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
    });
    
    if (!token) {
      logDebug('No se pudo obtener el token FCM');
      return false;
    }
    
    logDebug('Token FCM obtenido:', token.slice(0, 10) + '...');
    
    // Guardar token en Firestore
    await saveTokenToFirestore(user, token);
    
    // Configurar manejo de mensajes en primer plano
    onMessage(messaging, (payload) => {
      logDebug('Mensaje recibido en primer plano:', payload);
      
      const { notification } = payload;
      
      if (notification) {
        // Mostrar notificación usando react-hot-toast
        toast.success(notification.body, {
          duration: 6000,
          icon: '🔔',
          style: {
            background: '#4CAF50',
            color: '#fff',
            fontWeight: 'bold',
            padding: '16px',
          },
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
    logError('Error al inicializar notificaciones push:', error);
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
    // Crear documento de notificación en Firestore
    // Esto activará la Cloud Function que enviará la notificación push
    await addDoc(collection(db, 'notifications'), {
      title,
      body,
      shopId,
      data,
      createdAt: serverTimestamp(),
      sent: false,
      platform: 'web'
    });
    
    logDebug(`Notificación programada para envío: ${title}`);
    return true;
  } catch (error) {
    logError('Error al enviar notificación push:', error);
    return false;
  }
}; 