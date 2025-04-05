import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Inicializar Firebase Admin
export const initializeFirebaseAdmin = () => {
  try {
    console.log('[Firebase] Inicializando Firebase Admin...');
    
    // Verificar si ya hay una instancia inicializada
    if (getApps().length > 0) {
      console.log('[Firebase] Firebase Admin ya está inicializado');
      return getApps()[0];
    }
    
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error('[Firebase] ERROR: Faltan variables de entorno para Firebase Admin');
      console.error('[Firebase] Variables requeridas: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      throw new Error('Configuración de Firebase incompleta. Contacte al administrador.');
    }
    
    console.log('[Firebase] Variables configuradas correctamente');
    
    // Inicializar la app
    try {
      // Manejar el formato de la clave privada según su formato
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      console.log('[Firebase] Tipo de clave privada:', typeof privateKey);
      
      // Intentar arreglar problemas comunes con el formato de la clave
      
      // 1. Si la clave está como JSON string (con comillas escapadas), parsearla
      if (typeof privateKey === 'string') {
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          try {
            privateKey = JSON.parse(privateKey);
            console.log('[Firebase] Clave privada parseada de formato JSON string');
          } catch (parseError) {
            console.log('[Firebase] No se pudo parsear la clave como JSON string:', parseError.message);
          }
        }
        
        // 2. Reemplazar escapes de saltos de línea con saltos reales
        privateKey = privateKey.replace(/\\n/g, '\n');
        console.log('[Firebase] Saltos de línea reemplazados en la clave privada');
      }
      
      // 3. Verificar formato PEM básico
      if (typeof privateKey === 'string') {
        // Si no tiene los delimitadores PEM, intentar reconstruir el formato
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || 
            !privateKey.includes('-----END PRIVATE KEY-----')) {
            
          console.warn('[Firebase] La clave privada no tiene formato PEM completo, intentando reconstruir...');
          
          // Eliminar todo lo que no sea base64 válido y espacios en blanco
          const cleanKey = privateKey.replace(/[^A-Za-z0-9+/=\s]/g, '');
          
          // Reconstruir con formato PEM
          privateKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
          console.log('[Firebase] Clave reconstruida con formato PEM');
        }
      } else {
        console.error('[Firebase] ERROR: La clave privada no es una string válida:', typeof privateKey);
        throw new Error('Formato de clave privada inválido: no es una string');
      }
      
      // Verificar formato final
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || 
          !privateKey.includes('-----END PRIVATE KEY-----')) {
        console.error('[Firebase] ERROR: Formato de clave privada inválido después de correcciones');
        console.error('[Firebase] La clave debe tener formato PEM válido con BEGIN/END PRIVATE KEY');
        throw new Error('Formato de clave privada inválido. Verifique el valor de FIREBASE_PRIVATE_KEY.');
      }
      
      console.log('[Firebase] Intentando inicializar con clave privada de longitud:', privateKey.length);
      console.log('[Firebase] La clave privada comienza con:', privateKey.substring(0, 30) + '...');
      
      // Inicializar la app con las credenciales
      const app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        })
      });
      console.log('[Firebase] Firebase Admin inicializado correctamente');
      return app;
    } catch (certError) {
      console.error('[Firebase] Error al crear certificado:', certError);
      throw certError;
    }
  } catch (error) {
    console.error('[Firebase] Error inicializando Firebase Admin:', error);
    return null;
  }
}; 