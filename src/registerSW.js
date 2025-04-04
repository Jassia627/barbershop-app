// Función para detectar dispositivo móvil
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Función para registrar el service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        console.log('Intentando registrar service worker...');
        
        const isMobile = isMobileDevice();
        console.log(`Tipo de dispositivo: ${isMobile ? 'Móvil' : 'Desktop'}`);
        
        // Eliminar service workers anteriores en móviles para evitar conflictos
        if (isMobile) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (let registration of registrations) {
            console.log(`Eliminando Service Worker anterior: ${registration.scope}`);
            await registration.unregister();
          }
        }
        
        // Registrar el service worker con opciones específicas
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none' // No usar caché para actualizaciones
        });
        
        console.log('Service Worker registrado con éxito:', registration.scope);
        
        // Si estamos en un dispositivo móvil, forzar la actualización
        if (isMobile) {
          console.log('Forzando actualización del Service Worker en móvil');
          await registration.update();
        }
        
        // Añadir listener para mensajes del service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Mensaje recibido del Service Worker:', event.data);
          if (event.data && event.data.type === 'SW_ACTIVATED') {
            console.log('Service Worker actualizado correctamente');
          }
        });
        
      } catch (error) {
        console.error('Error al registrar el Service Worker:', error);
      }
    });
  } else {
    console.log('Este navegador no soporta Service Workers');
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

// Limpiar caché del Service Worker (útil para actualizaciones)
export async function clearServiceWorkerCache() {
  if ('caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log(`Eliminando caché: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
      console.log('Caches eliminados correctamente');
      return true;
    } catch (error) {
      console.error('Error al limpiar caché:', error);
      return false;
    }
  } else {
    console.log('API de Cache no disponible');
    return false;
  }
} 