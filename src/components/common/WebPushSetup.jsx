import React, { useState } from 'react';
import { useAuth } from '../../modules/auth';
import { subscribeToPushNotifications } from '../../core/services/webPushService';
import toast from 'react-hot-toast';

const WebPushSetup = () => {
  const { user } = useAuth();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  const handleSubscribe = async () => {
    setErrorDetails(null);
    
    if (!user) {
      toast.error('Debes iniciar sesión para activar notificaciones');
      return;
    }

    if (user.role !== 'admin') {
      toast.error('Solo los administradores pueden recibir notificaciones');
      return;
    }

    setIsSubscribing(true);
    try {
      console.log('Iniciando proceso de suscripción...');
      // Intentar registrar el service worker primero
      if (!('serviceWorker' in navigator)) {
        throw new Error('Este navegador no soporta Service Workers');
      }
      
      // Verificar si el navegador soporta notificaciones
      if (!('Notification' in window)) {
        throw new Error('Este navegador no soporta notificaciones');
      }
      
      const success = await subscribeToPushNotifications(user);
      console.log('Resultado de suscripción:', success);
      
      if (success) {
        toast.success('¡Notificaciones activadas correctamente!');
      } else {
        toast.error('No se pudo activar las notificaciones');
      }
    } catch (error) {
      console.error('Error al suscribirse:', error);
      setErrorDetails(error.message || 'Error desconocido');
      toast.error('Error al configurar notificaciones');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Notificaciones Push</h2>
      <p className="text-sm text-gray-700 mb-4">
        Activa las notificaciones push para recibir alertas cuando lleguen nuevas citas.
      </p>
      <button
        onClick={handleSubscribe}
        disabled={isSubscribing}
        className={`px-4 py-2 rounded text-white ${
          isSubscribing ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
        } transition-colors`}
      >
        {isSubscribing ? 'Activando...' : 'Activar Notificaciones'}
      </button>
      
      {errorDetails && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 text-sm rounded-md">
          <strong>Error:</strong> {errorDetails}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Estado de navegador:</p>
        <ul className="mt-1 list-disc list-inside">
          <li>Service Worker: {('serviceWorker' in navigator) ? '✅ Soportado' : '❌ No soportado'}</li>
          <li>Notificaciones: {('Notification' in window) ? '✅ Soportado' : '❌ No soportado'}</li>
          <li>Permiso: {('Notification' in window) ? Notification.permission : 'N/A'}</li>
        </ul>
      </div>
    </div>
  );
};

export default WebPushSetup; 