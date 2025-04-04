import { useState, useEffect } from 'react';
import { isOnline } from '../../registerSW';
import { FiWifiOff } from 'react-icons/fi';

const OfflineNotice = () => {
  const [offline, setOffline] = useState(!isOnline());

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div className="fixed bottom-16 left-4 right-4 mx-auto max-w-md z-50 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg p-3">
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-3">
          <FiWifiOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
            Estás navegando sin conexión. Algunas funciones pueden no estar disponibles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineNotice; 