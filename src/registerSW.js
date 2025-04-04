// Función para registrar el service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado con éxito:', registration.scope);
        
        // Registrar también para notificaciones push si es posible
        setupPushNotifications(registration);
      } catch (error) {
        console.error('Error al registrar el Service Worker:', error);
      }
    });
  }
}

// Función para configurar notificaciones push
async function setupPushNotifications(registration) {
  try {
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return;
    }

    // Verificar si ya tenemos permiso
    if (Notification.permission === 'granted') {
      console.log('Ya tenemos permiso para enviar notificaciones');
    } else if (Notification.permission !== 'denied') {
      // Pedir permiso
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Permiso de notificaciones concedido');
      } else {
        console.log('Permiso de notificaciones denegado');
        return;
      }
    }

    // Si llegamos aquí es que tenemos permiso
    console.log('Service worker y notificaciones configurados correctamente');
  } catch (error) {
    console.error('Error al configurar notificaciones push:', error);
  }
}

// Función para verificar si la app se está ejecutando como PWA
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone || 
         document.referrer.includes('android-app://');
}

// Función para comprobar si el dispositivo está online
export function isOnline() {
  return navigator.onLine;
}

// Añadir event listeners para detectar cambios en la conexión
export function setupOnlineOfflineListeners(onOnline, onOffline) {
  window.addEventListener('online', () => {
    console.log('Conexión recuperada');
    if (typeof onOnline === 'function') onOnline();
  });
  
  window.addEventListener('offline', () => {
    console.log('Conexión perdida');
    if (typeof onOffline === 'function') onOffline();
  });
} 