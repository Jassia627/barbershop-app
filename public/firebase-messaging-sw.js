// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-messaging-compat.js');

const DEBUG = true;

// Función para log
function logDebug(...args) {
  if (DEBUG) {
    console.log('[Firebase-SW]', ...args);
  }
}

// Inicializar Firebase
firebase.initializeApp({
  apiKey: "AIzaSyB2xtx9PNSs_yAFice9jbkxzdahzzf3yoY",
  authDomain: "barbershop-9810d.firebaseapp.com",
  projectId: "barbershop-9810d",
  storageBucket: "barbershop-9810d.appspot.com",
  messagingSenderId: "678061957866",
  appId: "1:678061957866:web:9cd1c7e7742451f4186d93",
  measurementId: "G-5Q1DXP7L23"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

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

// Handle incoming messages
messaging.onBackgroundMessage((payload) => {
  logDebug('Mensaje recibido en background:', payload);
  
  const notificationData = payload.notification || payload.data || {};
  
  // Mostrar la notificación
  self.registration.showNotification(
    notificationData.title || 'Barbershop App', 
    {
      body: notificationData.body || 'Tienes una nueva notificación',
      icon: notificationData.icon || '/badge.png',
      badge: '/badge.png',
      tag: notificationData.tag || 'firebase-notification',
      data: {
        url: notificationData.click_action || '/',
        firebasePayload: payload
      },
      actions: [
        {
          action: 'open',
          title: 'Ver detalles'
        }
      ]
    }
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

  // Ruta por defecto
  let url = '/';
  
  // Si hay datos de URL en la notificación, usarla
  if (data.url) {
    url = data.url;
  }

  logDebug('Abriendo URL:', url);

  // Abrir o enfocar una ventana existente
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Verificar si ya hay una ventana abierta 
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          // Intentar navegar a la URL
          if (client.navigate) {
            return client.navigate(url);
          }
          return client;
        }
      }

      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

logDebug('Firebase Messaging Service Worker registrado y listo'); 