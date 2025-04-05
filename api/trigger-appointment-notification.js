const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { format } = require('date-fns');
const { es } = require('date-fns/locale');
const fetch = require('node-fetch');

// Inicializar Firebase Admin
let admin;
try {
  admin = initializeApp({
    credential: require('firebase-admin').credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
} catch (error) {
  console.error('Error inicializando Firebase Admin:', error);
}

const db = getFirestore();

export default async function handler(req, res) {
  // Este endpoint puede ser activado por un webhook o cron job
  try {
    console.log('[APPOINTMENT-NOTIFICATION] Procesando solicitud...');
    const { appointmentId } = req.query;
    
    if (!appointmentId) {
      console.error('[APPOINTMENT-NOTIFICATION] Error: ID de cita no proporcionado');
      return res.status(400).json({ error: 'ID de cita no proporcionado' });
    }
    
    // Obtener los datos de la cita
    console.log(`[APPOINTMENT-NOTIFICATION] Buscando cita con ID: ${appointmentId}`);
    const appointmentRef = db.collection('appointments').doc(appointmentId);
    const appointmentSnapshot = await appointmentRef.get();
    
    if (!appointmentSnapshot.exists) {
      console.error(`[APPOINTMENT-NOTIFICATION] Error: Cita con ID ${appointmentId} no encontrada`);
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    const appointmentData = appointmentSnapshot.data();
    console.log(`[APPOINTMENT-NOTIFICATION] Datos de cita encontrados:`, appointmentData);
    
    // Comprobar si la notificación ya fue enviada
    if (appointmentData.notificationSent) {
      console.log(`[APPOINTMENT-NOTIFICATION] La notificación para la cita ${appointmentId} ya fue enviada anteriormente`);
      return res.status(200).json({ 
        success: false, 
        message: 'La notificación para esta cita ya fue enviada' 
      });
    }
    
    // Formatear fecha
    let formattedDate = 'fecha no especificada';
    try {
      if (appointmentData.date) {
        const dateObject = appointmentData.date.toDate();
        formattedDate = format(dateObject, 'dd/MM/yyyy HH:mm', { locale: es });
        console.log(`[APPOINTMENT-NOTIFICATION] Fecha formateada: ${formattedDate}`);
      }
    } catch (error) {
      console.error('[APPOINTMENT-NOTIFICATION] Error al formatear fecha:', error);
    }
    
    // Crear el payload de notificación
    const notificationData = {
      shopId: appointmentData.shopId,
      role: 'admin', // Importante: enviar solo a administradores
      title: '🔔 ¡Nueva Cita!',
      body: `${appointmentData.clientName || 'Un cliente'} ha solicitado una cita para ${formattedDate}`,
      data: {
        appointmentId,
        type: 'new_appointment',
        url: '/admin/appointments'
      }
    };
    
    console.log('[APPOINTMENT-NOTIFICATION] Datos de notificación:', notificationData);
    
    // Obtener directamente las suscripciones y enviar notificaciones
    try {
      // Buscar suscripciones de administradores para esta tienda
      const subscriptionsSnapshot = await db.collection('webPushSubscriptions')
        .where('active', '==', true)
        .where('shopId', '==', appointmentData.shopId)
        .where('role', '==', 'admin')
        .get();
      
      if (subscriptionsSnapshot.empty) {
        console.log(`[APPOINTMENT-NOTIFICATION] No se encontraron suscripciones para la tienda ${appointmentData.shopId}`);
        
        // Marcar como notificada de todos modos para evitar reintentos infinitos
        await appointmentRef.update({
          notificationSent: true,
          notificationSentAt: new Date(),
          notificationStatus: 'no-subscribers'
        });
        
        return res.status(200).json({
          success: false,
          message: 'No se encontraron suscripciones para enviar notificaciones',
          notificationMarked: true
        });
      }
      
      console.log(`[APPOINTMENT-NOTIFICATION] Se encontraron ${subscriptionsSnapshot.size} suscripciones para notificar`);
      
      // Configurar Web Push
      const webpush = require('web-push');
      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const vapidContact = process.env.VAPID_CONTACT_EMAIL || 'contacto@barbershop.com';
      
      if (!vapidPublicKey || !vapidPrivateKey) {
        throw new Error('Faltan claves VAPID necesarias para enviar notificaciones');
      }
      
      webpush.setVapidDetails(
        `mailto:${vapidContact}`,
        vapidPublicKey,
        vapidPrivateKey
      );
      
      // Preparar payload para notificación
      const payload = JSON.stringify({
        title: notificationData.title,
        body: notificationData.body,
        icon: '/badge.png',
        tag: 'appointment-notification',
        url: notificationData.data.url,
        ...notificationData.data,
        timestamp: new Date().toISOString()
      });
      
      // Enviar notificaciones a cada suscripción
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      
      for (const doc of subscriptionsSnapshot.docs) {
        try {
          const subscription = doc.data().subscription;
          const userId = doc.data().userId;
          
          console.log(`[APPOINTMENT-NOTIFICATION] Enviando a usuario ${userId}, suscripción: ${doc.id}`);
          
          const result = await webpush.sendNotification(subscription, payload);
          console.log(`[APPOINTMENT-NOTIFICATION] Notificación enviada con éxito: ${result.statusCode}`);
          
          results.push({
            subscriptionId: doc.id,
            userId: userId,
            status: 'success'
          });
          
          successCount++;
        } catch (error) {
          console.error(`[APPOINTMENT-NOTIFICATION] Error al enviar notificación:`, error);
          
          // Si es un error 410 GONE, marcar la suscripción como inactiva
          if (error.statusCode === 410) {
            await doc.ref.update({
              active: false,
              lastError: error.message,
              lastErrorAt: new Date().toISOString()
            });
          }
          
          results.push({
            subscriptionId: doc.id,
            status: 'error',
            message: error.message
          });
          
          errorCount++;
        }
      }
      
      // Actualizar la cita para marcar que se envió la notificación
      console.log(`[APPOINTMENT-NOTIFICATION] Actualizando estado de notificación para cita ${appointmentId}`);
      await appointmentRef.update({
        notificationSent: true,
        notificationSentAt: new Date(),
        notificationStatus: successCount > 0 ? 'success' : 'all-failed',
        notificationStats: {
          totalSuccess: successCount,
          totalErrors: errorCount
        }
      });
      
      return res.status(200).json({
        success: successCount > 0,
        message: `Se enviaron ${successCount} notificaciones con ${errorCount} errores`,
        totalSent: successCount,
        totalErrors: errorCount,
        results
      });
      
    } catch (notificationError) {
      console.error('[APPOINTMENT-NOTIFICATION] Error al enviar notificación:', notificationError);
      
      // Marcar la cita como notificada de todos modos
      try {
        await appointmentRef.update({
          notificationSent: true,
          notificationSentAt: new Date(),
          notificationError: notificationError.message,
          notificationStatus: 'error'
        });
      } catch (updateError) {
        console.error('[APPOINTMENT-NOTIFICATION] Error al actualizar estado de notificación:', updateError);
      }
      
      return res.status(500).json({ 
        success: false, 
        error: 'Error al enviar notificación, pero la cita fue marcada como notificada',
        message: notificationError.message
      });
    }
  } catch (error) {
    console.error('[APPOINTMENT-NOTIFICATION] Error general:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error al procesar notificación: ' + error.message 
    });
  }
} 