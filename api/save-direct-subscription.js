import { initializeFirebaseAdmin } from '../_firebase';
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('Iniciando guardado de suscripción directa...');
    
    // Inicializar Firebase Admin si no está inicializado
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.error('Error: Firebase Admin no pudo inicializarse');
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    const db = getFirestore();
    
    // Extraer datos de la solicitud
    const { subscription, shopId, role, email, userAgent } = req.body;
    
    // Validar datos requeridos
    if (!subscription || !shopId || !role || !email) {
      console.error('Error: Faltan datos requeridos en la solicitud', { 
        hasSubscription: !!subscription, 
        hasShopId: !!shopId, 
        hasRole: !!role, 
        hasEmail: !!email 
      });
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    
    // Validar el objeto de suscripción
    if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      console.error('Error: Objeto de suscripción inválido');
      return res.status(400).json({ error: 'Objeto de suscripción inválido' });
    }
    
    // Crear un ID único para la suscripción basado en el endpoint
    const subscriptionId = Buffer.from(subscription.endpoint).toString('base64');
    
    // Preparar datos para almacenar
    const subscriptionData = {
      subscription,
      shopId,
      role,
      email,
      userAgent: userAgent || 'No disponible',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      active: true
    };
    
    console.log(`Guardando suscripción para ${email} en tienda ${shopId} con rol ${role}`);
    
    // Guardar la suscripción en Firestore
    await db.collection('push_subscriptions').doc(subscriptionId).set(subscriptionData, { merge: true });
    
    console.log('Suscripción guardada correctamente');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Suscripción guardada correctamente',
      subscriptionId
    });
  } catch (error) {
    console.error('Error al guardar suscripción:', error);
    return res.status(500).json({ error: 'Error al guardar suscripción', message: error.message });
  }
} 