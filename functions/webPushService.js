const functions = require('firebase-functions');
const admin = require('firebase-admin');
const webpush = require('web-push');

// Configuración de claves VAPID (IMPORTANTE: debes establecer tus propias claves)
const vapidKeys = {
  publicKey: 'BP0yRYzqYRXa82PqOn18G3XjoK0AzdIBe9gil4qSfNcMwjWQZ5gMVEE6g7yT9vM8j8CaIlIbQ6Jjw5kwtQtBSg8',
  privateKey: 'M5n2uKfKREtDvTUavH7FDLR9ffsLeYSs75hFFXOWzb4'
};

// Configurar web-push con las claves
webpush.setVapidDetails(
  'mailto:servicio@barbershop.com', // Cambia esto a tu correo electrónico
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Función para enviar notificación web push
const sendWebPushNotification = async (subscription, payload) => {
  try {
    return await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error('Error al enviar notificación web-push:', error);
    return { error: error.message };
  }
};

/**
 * Función para guardar una suscripción de usuario
 */
exports.saveSubscription = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Debe iniciar sesión para guardar suscripción'
    );
  }

  const { subscription, shopId, role } = data;
  
  if (!subscription || !subscription.endpoint) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Datos de suscripción incorrectos o incompletos'
    );
  }

  try {
    // Guardar suscripción en Firestore
    await admin.firestore().collection('webPushSubscriptions').doc(context.auth.uid).set({
      userId: context.auth.uid,
      subscription,
      shopId: shopId || null,
      role: role || 'client',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      platform: 'web',
      browser: data.userAgent || 'unknown'
    });

    return { success: true, message: 'Suscripción guardada correctamente' };
  } catch (error) {
    console.error('Error al guardar suscripción:', error);
    throw new functions.https.HttpsError('internal', 'Error al guardar suscripción: ' + error.message);
  }
});

/**
 * Función para enviar notificaciones cuando se crea una nueva cita
 */
exports.sendAppointmentNotification = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snapshot, context) => {
    try {
      const appointmentData = snapshot.data();
      
      // Verificar datos necesarios
      if (!appointmentData.shopId) {
        console.error('Datos de cita incompletos:', appointmentData);
        return null;
      }

      console.log('Nueva cita para notificar:', appointmentData);

      // Obtener suscripciones de administradores de esta tienda
      const subscriptionsSnapshot = await admin.firestore()
        .collection('webPushSubscriptions')
        .where('shopId', '==', appointmentData.shopId)
        .where('role', '==', 'admin')
        .get();

      if (subscriptionsSnapshot.empty) {
        console.log('No se encontraron suscripciones para administradores de la tienda:', appointmentData.shopId);
        return null;
      }

      // Formatear fecha si está disponible
      let formattedDate = 'fecha no especificada';
      if (appointmentData.date) {
        try {
          const dateObj = appointmentData.date.toDate();
          formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()} ${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
        } catch (e) {
          console.error('Error al formatear fecha:', e);
        }
      }

      // Crear payload de notificación
      const payload = {
        notification: {
          title: '🔔 ¡Nueva Cita!',
          body: `${appointmentData.clientName || 'Un cliente'} ha solicitado una cita para ${formattedDate}`,
          icon: '/appointment_icon.png',
          badge: '/badge.png',
          vibrate: [200, 100, 200, 100, 200],
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'Ver cita'
            }
          ]
        },
        data: {
          url: '/admin/appointments',
          appointmentId: context.params.appointmentId,
          shopId: appointmentData.shopId,
          type: 'new_appointment',
          timestamp: Date.now().toString()
        }
      };

      // Enviar notificaciones a todos los administradores suscritos
      const sendPromises = [];
      let successCount = 0;
      let failureCount = 0;

      subscriptionsSnapshot.forEach(doc => {
        const { subscription } = doc.data();
        if (subscription && subscription.endpoint) {
          sendPromises.push(
            sendWebPushNotification(subscription, payload)
              .then(result => {
                if (!result.error) {
                  successCount++;
                  return true;
                } else {
                  failureCount++;
                  return false;
                }
              })
              .catch(() => {
                failureCount++;
                return false;
              })
          );
        }
      });

      // Esperar todas las notificaciones
      await Promise.all(sendPromises);

      console.log(`Resultado del envío: ${successCount} exitosos, ${failureCount} fallidos`);
      
      // Registrar resultado en Firestore
      await admin.firestore().collection('notifications').add({
        title: payload.notification.title,
        body: payload.notification.body,
        shopId: appointmentData.shopId,
        appointmentId: context.params.appointmentId,
        data: payload.data,
        sent: true,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        deliveryCount: successCount,
        failureCount: failureCount,
        method: 'web-push'
      });

      // Actualizar la cita para marcar que se envió la notificación
      await snapshot.ref.update({
        notificationSent: true,
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        success: true,
        sent: successCount,
        failed: failureCount
      };
    } catch (error) {
      console.error('Error al enviar notificación web-push:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

// Exportar la clave pública VAPID para que la aplicación cliente pueda usarla
exports.getVapidPublicKey = functions.https.onCall(async (data, context) => {
  return { publicKey: vapidKeys.publicKey };
}); 