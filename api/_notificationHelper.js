import { getFirestore } from 'firebase-admin/firestore';
import webpush from 'web-push';
import { initializeFirebaseAdmin } from './_firebase';

// Inicializa las configuraciones necesarias para enviar notificaciones
export const initializeNotifications = () => {
  try {
    // Verificar Firebase Admin
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.error('Error: Firebase Admin no pudo inicializarse');
      return false;
    }
    
    // Configurar Web Push
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidContact = process.env.VAPID_CONTACT_EMAIL;
    
    if (!vapidPublicKey || !vapidPrivateKey || !vapidContact) {
      console.error('Error: Faltan claves VAPID o información de contacto');
      return false;
    }
    
    webpush.setVapidDetails(
      `mailto:${vapidContact}`,
      vapidPublicKey,
      vapidPrivateKey
    );
    
    return true;
  } catch (error) {
    console.error('Error al inicializar configuración de notificaciones:', error);
    return false;
  }
};

// Envía notificaciones a usuarios específicos
export const sendNotification = async ({
  title, 
  body, 
  icon = '/badge.png',
  tag = 'default-notification', 
  url = '/',
  shopId,
  role,
  email,
  data = {}
}) => {
  try {
    // Inicializar configuraciones
    const initialized = initializeNotifications();
    if (!initialized) {
      throw new Error('No se pudo inicializar la configuración de notificaciones');
    }
    
    if (!title || !body) {
      throw new Error('Título y cuerpo son campos obligatorios para la notificación');
    }
    
    const db = getFirestore();
    const subscriptionsRef = db.collection('push_subscriptions');
    
    // Crear query base
    let query = subscriptionsRef.where('active', '==', true);
    
    // Filtros opcionales
    if (shopId) {
      query = query.where('shopId', '==', shopId);
    }
    
    if (role) {
      query = query.where('role', '==', role);
    }
    
    if (email) {
      query = query.where('email', '==', email);
    }
    
    // Obtener suscripciones
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log('No se encontraron suscripciones con los criterios especificados');
      return { 
        success: false,
        message: 'No se encontraron suscripciones para los destinatarios especificados',
        totalSent: 0,
        totalErrors: 0
      };
    }
    
    console.log(`Se encontraron ${snapshot.size} suscripciones para enviar`);
    
    // Preparar payload de la notificación
    const payload = JSON.stringify({
      title,
      body,
      icon,
      tag,
      url,
      ...data,
      timestamp: new Date().toISOString()
    });
    
    // Enviar notificaciones
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const doc of snapshot.docs) {
      const subscription = doc.data().subscription;
      
      try {
        const result = await webpush.sendNotification(subscription, payload);
        console.log(`Notificación enviada a ${doc.data().email} (${doc.id}) - Status ${result.statusCode}`);
        results.push({ 
          subscriptionId: doc.id, 
          email: doc.data().email, 
          status: 'success',
          statusCode: result.statusCode
        });
        successCount++;
      } catch (error) {
        console.error(`Error al enviar notificación a ${doc.data().email} (${doc.id}):`, error);
        
        // Si el error es porque la suscripción ya no es válida (410 GONE)
        if (error.statusCode === 410) {
          console.log(`Suscripción no válida, marcando como inactiva: ${doc.id}`);
          await doc.ref.update({ active: false, lastError: error.message, lastErrorAt: new Date().toISOString() });
        }
        
        results.push({ 
          subscriptionId: doc.id, 
          email: doc.data().email, 
          status: 'error',
          statusCode: error.statusCode,
          message: error.message
        });
        errorCount++;
      }
    }
    
    console.log(`Notificaciones enviadas: ${successCount}, errores: ${errorCount}`);
    
    // Registrar el evento de notificación en Firestore
    try {
      await db.collection('notification_logs').add({
        title,
        body,
        icon,
        url,
        shopId: shopId || null,
        targetRole: role || null,
        targetEmail: email || null,
        sentAt: new Date().toISOString(),
        totalSent: successCount,
        totalErrors: errorCount,
        results: results.map(r => ({
          email: r.email,
          status: r.status,
          statusCode: r.statusCode,
          message: r.message || null
        }))
      });
    } catch (logError) {
      console.error('Error al registrar log de notificación:', logError);
    }
    
    return { 
      success: successCount > 0,
      totalSent: successCount,
      totalErrors: errorCount,
      message: `Se enviaron ${successCount} notificaciones con ${errorCount} errores`,
      results
    };
  } catch (error) {
    console.error('Error general al enviar notificaciones:', error);
    return { 
      success: false, 
      error: error.message,
      totalSent: 0,
      totalErrors: 1
    };
  }
}; 