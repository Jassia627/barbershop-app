// Este archivo simula un endpoint API para enviar notificaciones en desarrollo
// En producción, deberías usar Firebase Cloud Functions

import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Endpoint API para enviar notificaciones
 * Esta es una solución temporal para desarrollo
 * En producción, usa Firebase Cloud Functions
 */
export const sendNotification = async (req) => {
  try {
    // En un entorno real, aquí se enviaría la notificación usando FCM Admin SDK
    console.log('Notificación recibida para envío:', req);
    
    // Almacenar la solicitud en Firestore para que cloud functions pueda procesarla
    const notificationRef = await addDoc(collection(db, 'notificationRequests'), {
      ...req,
      createdAt: serverTimestamp(),
      status: 'pending',
      processingEnvironment: 'client'
    });
    
    console.log('Solicitud de notificación guardada:', notificationRef.id);
    
    // Simular una respuesta exitosa
    return {
      success: true,
      messageId: `simulated-message-id-${Date.now()}`,
      note: 'Esta es una simulación. En producción, usa Firebase Cloud Functions.'
    };
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default sendNotification; 