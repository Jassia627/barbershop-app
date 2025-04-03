const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Función para enviar notificaciones push a los administradores
 * Se activa cuando se crea un nuevo documento en la colección 'notifications'
 */
exports.sendAdminNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    try {
      const notificationData = snapshot.data();
      
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

      // Datos de la notificación para Firebase Cloud Messaging
      const message = {
        notification: {
          title: notificationData.title,
          body: notificationData.body,
        },
        data: {
          url: notificationData.data?.url || '/admin/appointments',
          type: notificationData.data?.type || 'notification',
          appointmentId: notificationData.data?.appointmentId || '',
          shopId: notificationData.shopId,
          click_action: 'FLUTTER_NOTIFICATION_CLICK', // Para aplicaciones Flutter
        },
        webpush: {
          notification: {
            icon: '/logo.png',
            badge: '/badge.png',
            actions: [
              {
                action: 'view',
                title: 'Ver detalles'
              }
            ],
            vibrate: [200, 100, 200],
            requireInteraction: true,
          },
          fcmOptions: {
            link: notificationData.data?.url || '/admin/appointments',
          }
        },
        // Indicamos prioridad alta para que se muestre de inmediato
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
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