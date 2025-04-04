// Importar Firebase solo si no está definido ya
if (typeof firebase === 'undefined') {
  importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    apiKey: "AIzaSyB2xtx9PNSs_yAFice9jbkxzdahzzf3yoY",
    authDomain: "barbershop-9810d.firebaseapp.com",
    projectId: "barbershop-9810d",
    storageBucket: "barbershop-9810d.appspot.com",
    messagingSenderId: "678061957866",
    appId: "1:678061957866:web:9cd1c7e7742451f4186d93",
    measurementId: "G-5Q1DXP7L23"
  });

  // Inicializar Messaging
  const messaging = firebase.messaging();
  
  // Manejar mensajes en segundo plano
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Mensaje recibido en segundo plano:', payload);
    
    const { notification } = payload;
    
    if (notification) {
      const options = {
        body: notification.body || 'Tienes una notificación',
        icon: notification.icon || '/Rojo negro.png',
        badge: '/badge.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'barbershop-notification',
        requireInteraction: true,
        data: {
          url: notification.click_action || '/',
          ...payload.data
        }
      };

      self.registration.showNotification(notification.title || 'Barbershop App', options);
    }
  });
}

const CACHE_NAME = 'barbershop-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/main.jsx',
  '/Rojo negro.png',
  '/bb.png',
  '/bbDark.png',
  '/badge.png',
  '/notification.mp3',
  '/manifest.json'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
  // Hacer que el service worker tome el control inmediatamente
  self.skipWaiting();
});

// Activación del service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar el control de todas las pestañas abiertas
      console.log('[SW] Reclamando clientes');
      return self.clients.claim();
    })
  );
});

// Estrategia de caché: Network first, falling back to cache
self.addEventListener('fetch', (event) => {
  // Excluir las peticiones a Firebase y otras APIs
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase') ||
      event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la petición es exitosa, hacemos una copia de la respuesta
        // y la almacenamos en el caché
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Si la red falla, intentamos obtener del caché
        return caches.match(event.request)
          .then((response) => {
            // Si la respuesta está en caché, la devolvemos
            if (response) {
              return response;
            }
            
            // Si estamos navegando a una página y no está en caché, 
            // devolvemos la página offline.html
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // Para otros recursos que no están en caché, devolvemos una respuesta vacía
            return new Response('', {
              status: 408,
              statusText: 'Request timed out'
            });
          });
      })
  );
});

// Manejar eventos push
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event);

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    console.log('[SW] Error al parsear payload:', e);
    payload = {
      notification: {
        title: 'Nueva notificación',
        body: event.data ? event.data.text() : 'Sin contenido',
        icon: '/badge.png'
      }
    };
  }

  const { notification } = payload;

  const options = {
    body: notification.body || 'Tienes una notificación',
    icon: notification.icon || '/Rojo negro.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: notification.tag || 'barbershop-notification',
    requireInteraction: true,
    data: {
      url: notification.click_action || '/',
      ...payload.data
    }
  };

  event.waitUntil(
    self.registration.showNotification(notification.title || 'Barbershop App', options)
      .then(() => {
        console.log('[SW] Notificación mostrada correctamente');
      })
      .catch(error => {
        console.error('[SW] Error al mostrar notificación:', error);
      })
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click en notificación:', event);
  
  // Cerrar la notificación
  event.notification.close();
  
  // Navegar a la página especificada o a citas por defecto
  const url = event.notification.data?.url || '/admin/appointments';
  const urlToOpen = new URL(url, self.location.origin).href;
  
  console.log('[SW] Abriendo URL:', urlToOpen);
  
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
  .then((windowClients) => {
    // Buscar si ya hay una ventana abierta con esa URL
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      console.log('[SW] Cliente encontrado:', client.url);
      
      // Si ya hay una ventana abierta, la enfocamos
      if (client.url === urlToOpen && 'focus' in client) {
        console.log('[SW] Enfocando cliente existente');
        return client.focus();
      }
    }
    
    // Si hay algún cliente, lo navegamos a la URL
    if (windowClients.length > 0 && windowClients[0].navigate) {
      console.log('[SW] Navegando cliente existente a nueva URL');
      return windowClients[0].navigate(urlToOpen).then(client => client.focus());
    }
    
    // Si no hay cliente, abrimos uno nuevo
    console.log('[SW] Abriendo nueva ventana');
    return clients.openWindow(urlToOpen);
  });
  
  event.waitUntil(promiseChain);
}); 