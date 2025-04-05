import { initializeFirebaseAdmin } from '../_firebase';
import { getFirestore } from 'firebase-admin/firestore';
import { sendNotification } from '../_notificationHelper';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('Iniciando actualización de cita...');
    
    // Inicializar Firebase Admin si no está inicializado
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.error('Error: Firebase Admin no pudo inicializarse');
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    const db = getFirestore();
    
    // Extraer datos de la solicitud
    const { id, ...updateData } = req.body;
    
    // Validar ID
    if (!id) {
      console.error('Error: ID de cita no proporcionado');
      return res.status(400).json({ error: 'ID de cita no proporcionado' });
    }
    
    // Verificar si la cita existe
    const appointmentRef = db.collection('appointments').doc(id);
    const appointmentDoc = await appointmentRef.get();
    
    if (!appointmentDoc.exists) {
      console.error(`Error: No se encontró la cita con ID ${id}`);
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    const oldData = appointmentDoc.data();
    const oldStatus = oldData.status;
    
    // Añadir fecha de actualización
    updateData.updatedAt = new Date().toISOString();
    
    console.log(`Actualizando cita ${id} con datos:`, updateData);
    
    // Actualizar la cita
    await appointmentRef.update(updateData);
    
    console.log(`Cita ${id} actualizada correctamente`);
    
    // Verificar si cambió el estado y enviar notificación si es necesario
    if (updateData.status && updateData.status !== oldStatus) {
      try {
        console.log(`El estado de la cita cambió de ${oldStatus} a ${updateData.status}`);
        
        let notificationTitle = '';
        let notificationBody = '';
        
        // Configurar mensajes según el nuevo estado
        switch (updateData.status) {
          case 'confirmada':
            notificationTitle = 'Cita Confirmada';
            notificationBody = `Su cita para ${oldData.service} el ${oldData.date} a las ${oldData.time} ha sido confirmada.`;
            break;
          case 'completada':
            notificationTitle = 'Cita Completada';
            notificationBody = `Su cita para ${oldData.service} el ${oldData.date} a las ${oldData.time} ha sido marcada como completada.`;
            break;
          case 'cancelada':
            notificationTitle = 'Cita Cancelada';
            notificationBody = `Su cita para ${oldData.service} el ${oldData.date} a las ${oldData.time} ha sido cancelada.`;
            break;
          default:
            notificationTitle = 'Actualización de Cita';
            notificationBody = `Su cita para ${oldData.service} el ${oldData.date} a las ${oldData.time} ha sido actualizada.`;
        }
        
        // Enviar notificación a administradores
        console.log('Enviando notificación a administradores...');
        const adminNotificationResult = await sendNotification({
          title: notificationTitle,
          body: `${oldData.clientName}: ${notificationBody}`,
          shopId: oldData.shopId,
          role: 'admin',
          url: `/admin/appointments?id=${id}`,
          data: {
            appointmentId: id,
            type: 'status_change',
            oldStatus,
            newStatus: updateData.status
          }
        });
        
        console.log('Resultado de notificación a admins:', adminNotificationResult);
        
        // TODO: Cuando se implemente el inicio de sesión para clientes, 
        // se podría enviar notificación al cliente si tiene cuenta
        
      } catch (notificationError) {
        console.error('Error al enviar notificación:', notificationError);
        // No interrumpimos el flujo si la notificación falla
      }
    }
    
    // Obtener los datos actualizados
    const updatedDoc = await appointmentRef.get();
    const updatedData = updatedDoc.data();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Cita actualizada correctamente',
      appointment: {
        id,
        ...updatedData
      }
    });
  } catch (error) {
    console.error('Error al actualizar la cita:', error);
    return res.status(500).json({ error: 'Error al actualizar la cita', message: error.message });
  }
} 