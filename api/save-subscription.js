import { initializeFirebaseAdmin } from './_firebase';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export default async function handler(req, res) {
  console.log('[API] Solicitud recibida para guardar suscripción');
  
  // Solo permitir POST
  if (req.method !== 'POST') {
    console.error('[API] Método no permitido:', req.method);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Inicializar Firebase Admin
    console.log('[API] Inicializando Firebase Admin...');
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.error('[API] Error: Firebase Admin no pudo inicializarse');
      return res.status(500).json({ 
        error: 'Error de configuración del servidor: Firebase Admin no inicializado',
        firebaseInitialized: false
      });
    }
    
    // Obtener instancias de Firestore y Auth
    console.log('[API] Obteniendo Firestore y Auth...');
    let db, auth;
    try {
      db = getFirestore();
      auth = getAuth();
      console.log('[API] Firestore y Auth obtenidos correctamente');
    } catch (dbError) {
      console.error('[API] Error al obtener Firestore o Auth:', dbError);
      return res.status(500).json({ 
        error: 'Error al inicializar Firestore o Auth',
        details: dbError.message
      });
    }
    
    console.log('[API] Parseando cuerpo de la solicitud...');
    const { idToken, subscription, shopId, role } = req.body;
    console.log('[API] Datos recibidos:', { 
      hasIdToken: !!idToken, 
      hasSubscription: !!subscription,
      hasEndpoint: subscription?.endpoint ? true : false,
      shopId,
      role
    });

    // Validar datos de entrada
    if (!idToken) {
      console.error('[API] Error: Token de autenticación no proporcionado');
      return res.status(400).json({ error: 'Token de autenticación no proporcionado' });
    }
    
    if (!subscription || !subscription.endpoint) {
      console.error('[API] Error: Datos de suscripción incompletos');
      return res.status(400).json({ error: 'Datos de suscripción incompletos o inválidos' });
    }

    // Verificar token de autenticación
    console.log('[API] Verificando token de autenticación...');
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (authError) {
      console.error('[API] Error al verificar token:', authError);
      return res.status(401).json({ 
        error: 'Token de autenticación inválido',
        details: authError.message
      });
    }
    
    const uid = decodedToken.uid;
    console.log('[API] Usuario autenticado:', uid);

    // Guardar suscripción en Firestore
    console.log('[API] Guardando suscripción en Firestore...');
    const docData = {
      userId: uid,
      subscription,
      shopId: shopId || null,
      role: role || 'client',
      lastUpdated: new Date().toISOString(),
      platform: 'web',
      browser: req.headers['user-agent'] || 'unknown',
      active: true
    };
    
    try {
      const subscriptionCollection = db.collection('webPushSubscriptions');
      
      // Usar un ID basado en el endpoint para evitar duplicados
      const subscriptionId = Buffer.from(subscription.endpoint).toString('base64');
      
      await subscriptionCollection.doc(subscriptionId).set(docData, { merge: true });
      console.log('[API] Suscripción guardada correctamente para usuario:', uid);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Suscripción guardada correctamente',
        userId: uid,
        subscriptionId,
        timestamp: new Date().toISOString()
      });
    } catch (firestoreError) {
      console.error('[API] Error específico de Firestore:', firestoreError);
      return res.status(500).json({
        error: 'Error al guardar en Firestore',
        details: firestoreError.message,
        code: firestoreError.code
      });
    }
  } catch (error) {
    console.error('[API] Error general al guardar suscripción:', error);
    return res.status(500).json({ 
      error: 'Error al guardar suscripción: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 