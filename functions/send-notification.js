const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar la aplicación de Firebase si no está ya inicializada
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Función Cloud para enviar notificaciones FCM
 * Esta función debe ser ejecutada con credenciales de servidor
 */
exports.sendNotification = functions.https.onCall(async (data, context) => {
  // Verificar si el usuario está autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'La función requiere autenticación'
    );
  }

  try {
    const { token, title, body, data: notificationData } = data;

    if (!token) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Se requiere token FCM'
      );
    }

    // Construir el mensaje
    const message = {
      token,
      notification: {
        title: title || 'Barbershop App',
        body: body || 'Tienes una nueva notificación',
      },
      data: notificationData || {},
      android: {
        notification: {
          sound: 'default',
          channelId: 'barbershop_channel',
          priority: 'high',
          vibrateTimingsMillis: [200, 100, 200],
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/Rojo negro.png',
          badge: '/badge.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
        },
        fcmOptions: {
          link: notificationData?.url || '/',
        },
      },
    };

    // Enviar la notificación usando las credenciales de administrador
    const response = await admin.messaging().send(message);
    
    console.log('Notificación enviada exitosamente:', response);
    
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error al enviar la notificación',
      error.message
    );
  }
});

/**
 * Función para enviar notificaciones a todos los administradores de una tienda
 * cuando se crea una nueva cita
 */
exports.notifyNewAppointment = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snapshot, context) => {
    try {
      const appointment = snapshot.data();
      const appointmentId = context.params.appointmentId;

      // Solo procesar citas pendientes
      if (appointment.status !== 'pending') {
        console.log('Ignorando cita con estado:', appointment.status);
        return null;
      }

      const shopId = appointment.shopId;
      if (!shopId) {
        console.log('Cita sin shopId, no se pueden enviar notificaciones');
        return null;
      }

      // Obtener tokens de administradores de la tienda
      const tokensSnapshot = await admin
        .firestore()
        .collection('userTokens')
        .where('shopId', '==', shopId)
        .where('role', '==', 'admin')
        .get();

      if (tokensSnapshot.empty) {
        console.log('No se encontraron tokens de administradores');
        return null;
      }

      // Preparar la notificación
      const title = '¡Nueva Cita!';
      const body = `${appointment.clientName || 'Un cliente'} ha solicitado una cita`;
      const notificationData = {
        appointmentId,
        url: '/admin/appointments',
        timestamp: admin.firestore.Timestamp.now().toMillis().toString(),
      };

      // Enviar a cada token
      const sendPromises = [];
      tokensSnapshot.forEach((doc) => {
        const tokenData = doc.data();
        if (tokenData.fcmToken) {
          console.log('Enviando notificación a:', doc.id);
          
          const message = {
            token: tokenData.fcmToken,
            notification: {
              title,
              body,
            },
            data: notificationData,
            android: {
              notification: {
                sound: 'default',
                channelId: 'barbershop_channel',
                priority: 'high',
              },
            },
            apns: {
              headers: {
                'apns-priority': '10',
              },
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  contentAvailable: true,
                },
              },
            },
            webpush: {
              notification: {
                icon: '/Rojo negro.png',
                badge: '/badge.png',
                vibrate: [200, 100, 200],
                requireInteraction: true,
              },
              fcmOptions: {
                link: notificationData.url,
              },
            },
          };
          
          sendPromises.push(admin.messaging().send(message));
        }
      });

      if (sendPromises.length === 0) {
        console.log('No hay tokens válidos para enviar notificaciones');
        return null;
      }

      // Esperar a que se completen todos los envíos
      const results = await Promise.all(sendPromises);
      console.log(`Notificaciones enviadas: ${results.length}`);
      
      // Actualizar el documento de la cita para indicar que se enviaron las notificaciones
      await snapshot.ref.update({
        notificationSent: true,
        notificationTime: admin.firestore.FieldValue.serverTimestamp(),
      });

      return results;
    } catch (error) {
      console.error('Error al enviar notificaciones:', error);
      return null;
    }
  });

// Actualizar tokens FCM cuando se detecte un cambio en los permisos
exports.deleteInvalidTokens = functions.firestore
  .document('userTokens/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    
    // Si el documento fue eliminado, no hacemos nada
    if (!change.after.exists) {
      return null;
    }
    
    const tokenData = change.after.data();
    const token = tokenData.fcmToken;
    
    if (!token) {
      return null;
    }
    
    try {
      // Verificar que el token sea válido
      await admin.messaging().send({
        token,
        notification: { title: 'Token Validation' },
        data: { test: 'true' },
      });
      
      console.log('Token válido para usuario:', userId);
      return null;
    } catch (error) {
      // Si hay un error de token no registrado, eliminamos el token
      if (error.code === 'messaging/registration-token-not-registered') {
        console.log('Eliminando token inválido para usuario:', userId);
        return change.after.ref.update({
          fcmToken: admin.firestore.FieldValue.delete(),
          tokenInvalid: true,
          tokenInvalidReason: error.message,
          tokenInvalidTime: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      
      console.error('Error al validar token:', error);
      return null;
    }
  }); 