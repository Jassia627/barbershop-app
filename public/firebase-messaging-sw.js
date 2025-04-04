// firebase-messaging-sw.js
// Este archivo debe estar en la raíz del proyecto (public)

importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// Configuración de Firebase
firebase.initializeApp({
  apiKey: "AIzaSyB2xtx9PNSs_yAFice9jbkxzdahzzf3yoY",
  authDomain: "barbershop-9810d.firebaseapp.com",
  projectId: "barbershop-9810d",
  storageBucket: "barbershop-9810d.appspot.com",
  messagingSenderId: "678061957866",
  appId: "1:678061957866:web:9cd1c7e7742451f4186d93",
  measurementId: "G-5Q1DXP7L23"
});

// Obtener instancia de Firebase Messaging
const messaging = firebase.messaging();

// Configurar manejo de mensajes en segundo plano (cuando app está cerrada o en background)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Recibida notificación en background:', payload);
  
  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva notificación',
    icon: '/Rojo negro.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'barbershop-notification',
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Ver detalles'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clic en la notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Clic en notificación', event);
  
  event.notification.close();
  
  // Navegar a URL específica
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true})
      .then((windowClients) => {
        // Verificar si ya hay una ventana abierta con la URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          // Si existe, enfocar esa ventana
          if ('focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen
            });
            return;
          }
        }
        
        // Si no hay una ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
}); 