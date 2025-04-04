import { useState, useEffect } from 'react';
import { FiBell, FiBellOff } from 'react-icons/fi';
import { initializePushNotifications } from '../../core/services/pushNotificationService';
import { isPWA } from '../../registerSW';
import toast from 'react-hot-toast';

const NotificationPreferences = ({ user, isInitialized = false }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const isPwaMode = isPWA();

  // Inicializar el estado basado en el prop isInitialized
  useEffect(() => {
    setNotificationsEnabled(isInitialized);
  }, [isInitialized]);

  // Comprobar el estado de los permisos
  useEffect(() => {
    // Verificar si las notificaciones están habilitadas
    const checkNotificationStatus = async () => {
      if (!('Notification' in window)) {
        setNotificationsEnabled(false);
        return;
      }

      setNotificationsEnabled(Notification.permission === 'granted');
    };

    checkNotificationStatus();
  }, []);

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones');
      return;
    }

    setLoading(true);

    try {
      if (notificationsEnabled) {
        // No podemos revocar permisos desde JavaScript, pero podemos informar al usuario
        toast.error(
          'Para desactivar las notificaciones, debes hacerlo desde la configuración de tu navegador o dispositivo',
          { duration: 5000 }
        );
      } else {
        // Solicitar permisos e inicializar
        const result = await initializePushNotifications(user);
        if (result) {
          setNotificationsEnabled(true);
          toast.success('Notificaciones activadas correctamente');
        } else {
          toast.error('No se pudieron activar las notificaciones');
        }
      }
    } catch (error) {
      console.error('Error al gestionar notificaciones:', error);
      toast.error('Ocurrió un error al configurar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  // No mostrar nada si no estamos en PWA y el usuario no es admin
  if (!isPwaMode && user?.role !== 'admin') {
    return null;
  }

  // Determinar la clase de estilo
  const buttonClass = `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    notificationsEnabled
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }`;

  return (
    <button
      onClick={handleToggleNotifications}
      disabled={loading}
      className={buttonClass}
      aria-label={notificationsEnabled ? 'Notificaciones activadas' : 'Activar notificaciones'}
      title={notificationsEnabled ? 'Notificaciones activadas' : 'Activar notificaciones'}
    >
      {loading ? (
        <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin" />
      ) : notificationsEnabled ? (
        <FiBell className="h-4 w-4" />
      ) : (
        <FiBellOff className="h-4 w-4" />
      )}
      <span className="hidden md:inline">
        {notificationsEnabled
          ? 'Notificaciones activadas'
          : 'Activar notificaciones'}
      </span>
    </button>
  );
};

export default NotificationPreferences; 