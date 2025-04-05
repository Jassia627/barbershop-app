// Las claves VAPID deben estar configuradas como variables de entorno en Vercel
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

export default async function handler(req, res) {
  try {
    // Verificar si está configurada la clave VAPID pública
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      console.error('Error: VAPID_PUBLIC_KEY no está configurada en las variables de entorno');
      return res.status(500).json({ error: 'Configuración del servidor incompleta' });
    }
    
    // Devolver la clave pública VAPID 
    return res.status(200).json({ 
      publicKey: vapidPublicKey,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al obtener la clave VAPID:', error);
    return res.status(500).json({ error: 'Error al obtener la clave VAPID', message: error.message });
  }
} 