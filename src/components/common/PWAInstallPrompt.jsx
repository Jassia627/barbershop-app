import { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir que Chrome muestre automáticamente la solicitud de instalación
      e.preventDefault();
      // Almacenar el evento para usarlo más tarde
      setDeferredPrompt(e);
      // Mostrar nuestro botón personalizado de instalación
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verificar si la app ya está instalada
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isAppInstalled) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Mostrar el prompt de instalación
    deferredPrompt.prompt();

    // Esperar a que el usuario responda al prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // El evento ya no se puede usar de nuevo, así que lo limpiamos
    setDeferredPrompt(null);

    if (outcome === 'accepted') {
      toast.success('¡Gracias por instalar nuestra app!');
      setShowInstallButton(false);
    } else {
      toast.error('La instalación fue cancelada');
    }
  };

  // No mostrar nada si el botón de instalación no debe aparecer
  if (!showInstallButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-rose-600 p-2 rounded-full">
            <FiDownload className="text-white h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-white">Instalar Barbershop App</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Añade la app a tu pantalla de inicio para un acceso más rápido</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowInstallButton(false)}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400"
          >
            Ahora no
          </button>
          <button 
            onClick={handleInstallClick}
            className="px-3 py-1.5 text-sm bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt; 