import { initializeFirebaseAdmin } from './_firebase';
import { getFirestore } from 'firebase-admin/firestore';
import webpush from 'web-push';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('Iniciando envío de notificación push...');
    
    // Inicializar Firebase Admin si no está inicializado
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.error('Error: Firebase Admin no pudo inicializarse');
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    // Configurar Web Push
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidContact = process.env.VAPID_CONTACT_EMAIL;
    
    if (!vapidPublicKey || !vapidPrivateKey || !vapidContact) {
      console.error('Error: Faltan claves VAPID o información de contacto');
      return res.status(500).json({ error: 'Configuración incompleta del servidor' });
    }
    
    webpush.setVapidDetails(
      `mailto:${vapidContact}`,
      vapidPublicKey,
      vapidPrivateKey
    );
    
    // Extraer datos de la solicitud
    const { 
      title, 
      body, 
      icon = '/badge.png',
      tag = 'default-notification', 
      url = '/',
      shopId,
      role,
      email,
      data = {}
    } = req.body;
    
    // Validar datos requeridos
    if (!title || !body) {
      console.error('Error: Faltan campos requeridos en la solicitud');
      return res.status(400).json({ error: 'Faltan campos requeridos: title y body son obligatorios' });
    }
    
    const db = getFirestore();
    const subscriptionsRef = db.collection('webPushSubscriptions');
    
    // Crear query base
    let query = subscriptionsRef.where('active', '==', true);
    
    // Filtros opcionales
    if (shopId) {
      console.log(`Filtrando por shopId: ${shopId}`);
      query = query.where('shopId', '==', shopId);
    }
    
    if (role) {
      console.log(`Filtrando por role: ${role}`);
      query = query.where('role', '==', role);
    }
    
    if (email) {
      console.log(`Filtrando por email: ${email}`);
      query = query.where('email', '==', email);
    }
    
    console.log('Ejecutando consulta para encontrar suscripciones...');
    
    // Obtener suscripciones
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log('No se encontraron suscripciones con los criterios especificados');
      return res.status(404).json({ 
        message: 'No se encontraron suscripciones para los destinatarios especificados',
        filters: { shopId, role, email },
        success: false
      });
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
      const userId = doc.data().userId;
      
      console.log(`Intentando enviar notificación a suscripción: ${doc.id} (Usuario: ${userId})`);
      
      try {
        const result = await webpush.sendNotification(subscription, payload);
        console.log(`Notificación enviada a ${userId} (${doc.id}) - Status ${result.statusCode}`);
        results.push({ 
          subscriptionId: doc.id, 
          userId: userId, 
          status: 'success',
          statusCode: result.statusCode
        });
        successCount++;
      } catch (error) {
        console.error(`Error al enviar notificación a ${userId} (${doc.id}):`, error);
        
        // Si el error es porque la suscripción ya no es válida (410 GONE)
        if (error.statusCode === 410) {
          console.log(`Suscripción no válida, marcando como inactiva: ${doc.id}`);
          await doc.ref.update({ 
            active: false, 
            lastError: error.message, 
            lastErrorAt: new Date().toISOString() 
          });
        }
        
        results.push({ 
          subscriptionId: doc.id, 
          userId: userId, 
          status: 'error',
          statusCode: error.statusCode,
          message: error.message
        });
        errorCount++;
      }
    }
    
    console.log(`Notificaciones enviadas: ${successCount}, errores: ${errorCount}`);
    
    return res.status(200).json({ 
      success: successCount > 0,
      totalSent: successCount,
      totalErrors: errorCount,
      message: `Se enviaron ${successCount} notificaciones con ${errorCount} errores`,
      results
    });
  } catch (error) {
    console.error('Error general al enviar notificaciones:', error);
    return res.status(500).json({ error: 'Error al enviar notificaciones', message: error.message });
  }
} 