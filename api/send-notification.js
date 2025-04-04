// api/send-notification.js
// Este es un endpoint de Vercel para enviar notificaciones

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Configurar CORS para permitir solicitudes desde tu dominio
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Manejar solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Solo se acepta POST.'
    });
  }

  try {
    // Obtener datos de la solicitud
    const payload = req.body;
    
    if (!payload || !payload.token) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos obligatorios (token)'
      });
    }

    console.log('Intentando enviar notificación:', JSON.stringify(payload, null, 2));

    // Construir el mensaje FCM
    const fcmMessage = {
      to: payload.token,
      notification: payload.notification || {
        title: 'Barbershop App',
        body: 'Tienes una nueva notificación'
      },
      data: payload.data || {},
      android: payload.android || {
        priority: 'high',
        notification: {
          sound: 'default',
          channel_id: 'barbershop_channel'
        }
      },
      apns: payload.apns || {
        headers: {
          'apns-priority': '10'
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            content_available: true
          }
        }
      }
    };

    // Enviar a través de Cloud Function o directamente a FCM
    // Esta es una versión simulada para desarrollo
    console.log('Simulando envío de notificación:', fcmMessage);

    // En un entorno real, aquí enviaríamos a FCM o llamaríamos a una Cloud Function

    // Simulamos una respuesta exitosa
    return res.status(200).json({
      success: true,
      messageId: `simulated-message-id-${Date.now()}`
    });
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
}; 