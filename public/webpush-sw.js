// Web Push Service Worker

const DEBUG = true;

// Función para log
function logDebug(...args) {
  if (DEBUG) {
    console.log('[SW]', ...args);
  }
}

// Instalación del service worker
self.addEventListener('install', (event) => {
  logDebug('Service Worker instalado');
  // Forzar activación inmediata
  self.skipWaiting();
});

// Activación del service worker
self.addEventListener('activate', (event) => {
  logDebug('Service Worker activado');
  // Reclamar clientes abiertos
  event.waitUntil(clients.claim());
});

// Manejo de eventos push
self.addEventListener('push', (event) => {
  logDebug('Notificación push recibida', event);

  // Intentar extraer datos del payload
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      logDebug('Datos de la notificación:', data);
    } catch (e) {
      logDebug('Error al parsear datos de la notificación:', e);
      // Si no podemos parsear JSON, usar el texto plano
      data = {
        title: 'Nueva notificación',
        body: event.data.text(),
      };
    }
  } else {
    logDebug('Notificación sin datos');
    data = {
      title: 'Nueva notificación',
      body: 'Has recibido una nueva notificación',
    };
  }

  // Configuración de la notificación
  const title = data.title || 'Barbershop App';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: data.icon || '/badge.png',
    badge: '/badge.png',
    data: {
      url: data.url || '/',
      timestamp: new Date().getTime(),
      ...data
    },
    vibrate: [100, 50, 100],
    renotify: true,
    tag: data.tag || 'default-notification',
    actions: data.actions || []
  };

  logDebug('Mostrando notificación:', { title, options });

  // Mostrar la notificación
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manejo del clic en la notificación
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  logDebug('Clic en notificación', { 
    notification: notification, 
    action: action, 
    data: data 
  });

  // Cerrar la notificación
  notification.close();

  // Manejar acciones específicas
  let url = '/';
  
  if (action) {
    // Si hay una acción específica
    if (data.actions) {
      const actionData = data.actions.find(a => a.action === action);
      if (actionData && actionData.url) {
        url = actionData.url;
      }
    }
  } else {
    // Acción por defecto: abrir la URL de la notificación
    url = data.url || '/';
  }

  logDebug('Abriendo URL:', url);

  // Abrir o enfocar una ventana existente
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Verificar si ya hay una ventana abierta con la URL
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      // Si no hay ventana abierta con esa URL, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Manejo de cierre de notificación
self.addEventListener('notificationclose', (event) => {
  const notification = event.notification;
  const data = notification.data || {};
  
  logDebug('Notificación cerrada', { notification: notification, data: data });
});

// Manejo de mensajes al Service Worker
self.addEventListener('message', (event) => {
  logDebug('Mensaje recibido en SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    logDebug('Skip waiting ejecutado por mensaje');
  }
});

logDebug('Service Worker de Web Push registrado y listo'); 