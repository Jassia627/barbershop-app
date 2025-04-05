export default function handler(req, res) {
  // Verificar las variables de entorno necesarias
  const envVars = {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY ? '✅ Configurado' : '❌ Falta',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ? '✅ Configurado' : '❌ Falta',
    vapidContactEmail: process.env.VAPID_CONTACT_EMAIL ? '✅ Configurado' : '❌ Falta',
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ? '✅ Configurado' : '❌ Falta',
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Configurado' : '❌ Falta',
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY ? '✅ Configurado' : '❌ Falta',
  };

  // Solo mostramos los primeros caracteres para seguridad
  const vapidPublicKeyPreview = process.env.VAPID_PUBLIC_KEY 
    ? `${process.env.VAPID_PUBLIC_KEY.substring(0, 10)}...` 
    : 'No disponible';

  return res.status(200).json({
    message: 'Estado de las variables de entorno',
    status: envVars,
    publicKeyPreview: vapidPublicKeyPreview,
    timestamp: new Date().toISOString()
  });
} 