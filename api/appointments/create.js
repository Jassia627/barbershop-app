import { initializeFirebaseAdmin } from '../_firebase';
import { getFirestore } from 'firebase-admin/firestore';
import { sendNotification } from '../_notificationHelper';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('Iniciando creación de cita...');
    
    // Inicializar Firebase Admin si no está inicializado
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.error('Error: Firebase Admin no pudo inicializarse');
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    const db = getFirestore();
    
    // Extraer datos de la solicitud
    const { 
      clientName, 
      clientPhone, 
      date, 
      time, 
      service, 
      barberId, 
      barberName,
      shopId,
      status = 'pendiente',
      notes = ''
    } = req.body;
    
    // Validar datos requeridos
    if (!clientName || !clientPhone || !date || !time || !service || !barberId || !shopId) {
      console.error('Error: Faltan datos requeridos para la cita');
      return res.status(400).json({ error: 'Faltan datos requeridos para la cita' });
    }
    
    // Crear datos de la cita
    const appointmentData = {
      clientName,
      clientPhone,
      date,
      time,
      service,
      barberId,
      barberName,
      shopId,
      status,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Guardando cita en Firestore');
    
    // Guardar la cita en Firestore
    const appointmentRef = await db.collection('appointments').add(appointmentData);
    const appointmentId = appointmentRef.id;
    
    console.log(`Cita creada con ID: ${appointmentId}`);
    
    // Enviar notificación a administradores de la tienda
    try {
      console.log('Enviando notificación a administradores...');
      
      const notificationResult = await sendNotification({
        title: 'Nueva Cita Registrada',
        body: `${clientName} ha reservado para ${service} el ${date} a las ${time}`,
        shopId,
        role: 'admin',
        url: `/admin/appointments?id=${appointmentId}`,
        data: {
          appointmentId,
          type: 'new_appointment'
        }
      });
      
      console.log('Resultado de notificación:', notificationResult);
    } catch (notificationError) {
      console.error('Error al enviar notificación:', notificationError);
      // No interrumpimos el flujo si la notificación falla
    }
    
    return res.status(201).json({ 
      success: true, 
      message: 'Cita creada correctamente',
      appointmentId,
      appointment: {
        id: appointmentId,
        ...appointmentData
      }
    });
  } catch (error) {
    console.error('Error al crear la cita:', error);
    return res.status(500).json({ error: 'Error al crear la cita', message: error.message });
  }
} 