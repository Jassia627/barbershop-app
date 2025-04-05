import React, { useState, useEffect } from 'react';
import { subscribeToPushNotifications } from '../../core/services/webPushService';
import toast from 'react-hot-toast';

const PushNotificationsComponent = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState('no-solicitado');

  useEffect(() => {
    // Verificar el estado del permiso de notificaciones al cargar
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const handleActivateNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    if (!user || !user.uid) {
      setError('Debes iniciar sesión para activar notificaciones');
      setIsLoading(false);
      return;
    }
    
    try {
      // Solicitar permiso y registrar para notificaciones push
      const success = await subscribeToPushNotifications(user);
      
      if (success) {
        setPermissionState('granted');
        toast.success('¡Notificaciones activadas correctamente!');
      } else {
        setError('No se pudieron activar las notificaciones');
        toast.error('No se pudieron activar las notificaciones');
      }
    } catch (err) {
      console.error('Error al activar notificaciones:', err);
      setError(err.message || 'Error al activar notificaciones');
      toast.error(`Error: ${err.message}`);
      
      // Actualizar el estado del permiso
      if ('Notification' in window) {
        setPermissionState(Notification.permission);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (permissionState !== 'granted') {
      toast.error('Debes activar las notificaciones primero');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      toast.success('Enviando notificación de prueba...');
      
      // Obtener el service worker registrado para mostrar notificaciones
      // Este método funciona tanto en escritorio como en Android
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          await registration.showNotification('Notificación de Prueba', {
            body: 'Esta es una notificación de prueba enviada desde tu dispositivo',
            icon: '/badge.png',
            tag: 'test-notification',
            data: {
              url: window.location.href,
              timestamp: new Date().toISOString()
            },
            actions: [
              {
                action: 'open',
                title: 'Abrir app'
              }
            ]
          });
          
          toast.success('Notificación local enviada correctamente');
        } catch (swError) {
          console.error('Error al mostrar notificación con Service Worker:', swError);
          setError(`Error al mostrar notificación: ${swError.message}`);
          toast.error(`Error: ${swError.message}`);
        }
      } else {
        setError('Este navegador no soporta Service Workers');
        toast.error('Este navegador no soporta Service Workers');
      }
      
      // Intentar enviar una notificación desde el servidor (de manera discreta)
      try {
        await fetch('/api/test-notification', {
          method: 'POST',
          headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        // No esperamos respuesta ni mostramos errores del servidor
      } catch (serverError) {
        console.error('Error al enviar notificación del servidor:', serverError);
        // No mostramos este error al usuario, ya que la notificación local se mostró
      }
    } catch (err) {
      console.error('Error al enviar notificación de prueba:', err);
      toast.error(`Error: ${err.message || 'Error al enviar notificación de prueba'}`);
      setError(`Error al enviar notificación: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Notificaciones Push</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Recibe notificaciones instantáneas en tu dispositivo móvil sobre nuevas citas y actualizaciones.
        </p>
        
        <div className="flex items-center space-x-2 text-sm">
          <span>Estado:</span>
          {permissionState === 'granted' ? (
            <span className="text-green-600 font-medium">Activado</span>
          ) : permissionState === 'denied' ? (
            <span className="text-red-600 font-medium">Bloqueado por el navegador</span>
          ) : (
            <span className="text-yellow-600 font-medium">No activado</span>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          onClick={handleActivateNotifications}
          disabled={isLoading || permissionState === 'denied'}
          className={`px-4 py-2 rounded-md text-white ${
            isLoading
              ? 'bg-gray-400'
              : permissionState === 'denied'
              ? 'bg-gray-400 cursor-not-allowed'
              : permissionState === 'granted'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors`}
        >
          {isLoading
            ? 'Activando...'
            : permissionState === 'granted'
            ? 'Reactivar notificaciones'
            : 'Activar notificaciones'}
        </button>
        
        {permissionState === 'granted' && (
          <button
            onClick={handleTestNotification}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white ${
              isLoading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'
            } transition-colors`}
          >
            Probar notificación
          </button>
        )}
      </div>
      
      {permissionState === 'denied' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            Las notificaciones están bloqueadas en tu navegador. Para activarlas:
          </p>
          <ol className="mt-1 text-xs text-red-700 list-decimal list-inside">
            <li>Haz clic en el icono de candado o información en la barra de direcciones</li>
            <li>Busca la sección de notificaciones</li>
            <li>Cambia la configuración a "Permitir"</li>
            <li>Recarga esta página</li>
          </ol>
        </div>
      )}
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-400">
        <p>Compatibilidad del navegador:</p>
        <ul className="list-disc list-inside">
          <li>Service Worker: {('serviceWorker' in navigator) ? '✅' : '❌'}</li>
          <li>Notificaciones: {('Notification' in window) ? '✅' : '❌'}</li>
          <li>Push API: {('PushManager' in window) ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  );
};

export default PushNotificationsComponent; 