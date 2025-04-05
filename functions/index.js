const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Importar funciones de webPushService
const webPushService = require('./webPushService');

// Exponer funciones de web-push
exports.saveWebPushSubscription = webPushService.saveSubscription;
exports.sendAppointmentNotification = webPushService.sendAppointmentNotification;
exports.getVapidPublicKey = webPushService.getVapidPublicKey;

/**
 * Función para enviar notificaciones push a los administradores
 * Se activa cuando se crea un nuevo documento en la colección 'notifications'
 */
exports.sendAdminNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    try {
      const notificationData = snapshot.data();
      
      // Si ya está gestionada por web-push, no hacer nada
      if (notificationData.method === 'web-push') {
        console.log('Notificación ya enviada por web-push');
        return null;
      }
      
      // Verificar que la notificación tenga todos los campos necesarios
      if (!notificationData.title || !notificationData.body || !notificationData.shopId) {
        console.error('Datos de notificación incompletos:', notificationData);
        return null;
      }

      console.log('Nueva notificación para enviar:', notificationData);

      // Recuperar tokens FCM de todos los administradores de esta tienda
      const userTokensSnapshot = await admin.firestore()
        .collection('userTokens')
        .where('shopId', '==', notificationData.shopId)
        .where('role', '==', 'admin')
        .get();

      if (userTokensSnapshot.empty) {
        console.log('No se encontraron tokens para administradores de la tienda:', notificationData.shopId);
        return null;
      }

      // Personalizar la notificación según el tipo
      const notificationType = notificationData.data?.type || 'notification';
      let notificationTitle = notificationData.title;
      let notificationBody = notificationData.body;
      let notificationIcon = '/logo.png';
      
      // Si es una notificación de cita nueva, destacarla más
      if (notificationType === 'new_appointment') {
        notificationTitle = `🔔 ${notificationTitle}`;
        notificationIcon = '/appointment_icon.png';
      }

      // Datos de la notificación para Firebase Cloud Messaging
      const message = {
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          url: notificationData.data?.url || '/admin/appointments',
          type: notificationType,
          appointmentId: notificationData.data?.appointmentId || '',
          shopId: notificationData.shopId,
          click_action: 'FLUTTER_NOTIFICATION_CLICK', // Para aplicaciones Flutter
          timestamp: Date.now().toString(), // Añadir timestamp para evitar duplicados
        },
        webpush: {
          notification: {
            icon: notificationIcon,
            badge: '/badge.png',
            actions: [
              {
                action: 'view',
                title: notificationType === 'new_appointment' ? 'Ver cita' : 'Ver detalles'
              }
            ],
            vibrate: [200, 100, 200],
            requireInteraction: true,
          },
          fcmOptions: {
            link: notificationData.data?.url || '/admin/appointments',
          },
          headers: {
            TTL: '86400' // 24 horas en segundos
          }
        },
        // Indicamos prioridad alta para que se muestre de inmediato
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            color: notificationType === 'new_appointment' ? '#4CAF50' : '#2196F3', // Verde para citas, azul para otras
            channelId: notificationType === 'new_appointment' ? 'appointment_channel' : 'general_channel',
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              category: notificationType
            }
          }
        }
      };

      // Extraer los tokens FCM 
      const tokens = [];
      userTokensSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.fcmToken) {
          tokens.push(userData.fcmToken);
        }
      });

      if (tokens.length === 0) {
        console.log('No se encontraron tokens FCM válidos');
        return null;
      }

      console.log(`Enviando notificación a ${tokens.length} dispositivos`);

      // Enviar mensajes a todos los tokens
      const response = await admin.messaging().sendMulticast({
        tokens,
        ...message
      });

      console.log('Resultado del envío:', response);
      
      // Actualizar el documento de notificación con la información del envío
      await snapshot.ref.update({
        sent: true,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        deliveryCount: response.successCount,
        failureCount: response.failureCount
      });

      return {
        success: true,
        sent: response.successCount,
        failed: response.failureCount
      };
    } catch (error) {
      console.error('Error al enviar notificación push:', error);
      
      // Actualizar el documento con información del error
      await snapshot.ref.update({
        sent: false,
        error: error.message || 'Error desconocido',
        errorAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }); 