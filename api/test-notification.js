const { initializeFirebaseAdmin } = require('./_firebase');
const { getFirestore } = require('firebase-admin/firestore');
const webpush = require('web-push');

// Endpoint para probar notificaciones push
module.exports = async function handler(req, res) {
  // Establecer encabezados CORS y tipo de contenido
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Content-Type', 'application/json');
  
  // Manejar solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).send(JSON.stringify({ error: 'Método no permitido' }));
  }

  try {
    console.log('[TEST-NOTIFICATION] Iniciando prueba de notificación push');
    
    // Inicializar Firebase Admin
    console.log('[TEST-NOTIFICATION] Inicializando Firebase Admin...');
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.error('[TEST-NOTIFICATION] Error: Firebase Admin no pudo inicializarse');
      return res.status(500).send(JSON.stringify({ 
        error: 'Error interno del servidor: Firebase Admin no inicializado' 
      }));
    }
    
    // Configurar Web Push
    console.log('[TEST-NOTIFICATION] Configurando Web Push...');
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidContact = process.env.VAPID_CONTACT_EMAIL || 'contacto@barbershop.com';
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[TEST-NOTIFICATION] Error: Faltan claves VAPID');
      return res.status(500).send(JSON.stringify({ 
        error: 'Configuración incompleta del servidor',
        details: {
          vapidPublicKey: !!vapidPublicKey,
          vapidPrivateKey: !!vapidPrivateKey,
          vapidContact: !!vapidContact
        }
      }));
    }
    
    // Configurar Web Push
    webpush.setVapidDetails(
      `mailto:${vapidContact}`,
      vapidPublicKey,
      vapidPrivateKey
    );
    
    console.log('[TEST-NOTIFICATION] Obteniendo suscripciones activas...');
    
    // Obtener todas las suscripciones web push activas
    const db = getFirestore();
    const subscriptionsSnapshot = await db.collection('webPushSubscriptions')
      .where('active', '==', true)
      .limit(10)
      .get();
    
    if (subscriptionsSnapshot.empty) {
      console.log('[TEST-NOTIFICATION] No se encontraron suscripciones activas');
      return res.status(404).send(JSON.stringify({ 
        message: 'No se encontraron suscripciones para enviar la notificación de prueba',
        success: false
      }));
    }
    
    console.log(`[TEST-NOTIFICATION] Se encontraron ${subscriptionsSnapshot.size} suscripciones activas`);
    
    // Datos de la notificación de prueba
    const notificationPayload = JSON.stringify({
      title: 'Notificación de Prueba',
      body: 'Esta es una notificación de prueba enviada desde el endpoint de prueba',
      icon: '/badge.png',
      tag: 'test-notification',
      url: '/',
      timestamp: new Date().toISOString()
    });
    
    // Enviar notificaciones a cada suscripción
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    console.log('[TEST-NOTIFICATION] Enviando notificaciones a todas las suscripciones...');
    
    for (const doc of subscriptionsSnapshot.docs) {
      try {
        const subscription = doc.data().subscription;
        console.log(`[TEST-NOTIFICATION] Enviando a suscripción: ${doc.id}`);
        
        // Enviar notificación
        const result = await webpush.sendNotification(subscription, notificationPayload);
        
        console.log(`[TEST-NOTIFICATION] Notificación enviada exitosamente a ${doc.id} con status ${result.statusCode}`);
        results.push({
          subscriptionId: doc.id,
          status: 'success',
          statusCode: result.statusCode
        });
        successCount++;
      } catch (error) {
        console.error(`[TEST-NOTIFICATION] Error al enviar notificación a ${doc.id}:`, error);
        
        // Si el error es porque la suscripción ya no es válida (410 GONE)
        if (error.statusCode === 410) {
          console.log(`[TEST-NOTIFICATION] Suscripción no válida, marcando como inactiva: ${doc.id}`);
          await doc.ref.update({ 
            active: false, 
            lastError: error.message, 
            lastErrorAt: new Date().toISOString() 
          });
        }
        
        results.push({
          subscriptionId: doc.id,
          status: 'error',
          statusCode: error.statusCode,
          message: error.message
        });
        errorCount++;
      }
    }
    
    console.log(`[TEST-NOTIFICATION] Proceso completado. Éxitos: ${successCount}, Errores: ${errorCount}`);
    
    return res.status(200).send(JSON.stringify({
      success: successCount > 0,
      totalSent: successCount,
      totalErrors: errorCount,
      message: `Se enviaron ${successCount} notificaciones con ${errorCount} errores`,
      results: results
    }));
  } catch (error) {
    console.error('[TEST-NOTIFICATION] Error general:', error);
    return res.status(500).send(JSON.stringify({ 
      error: 'Error al enviar notificaciones de prueba',
      message: error.message || 'Error desconocido',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }));
  }
} 