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
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
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

// Manejo de mensajes de Firebase (integrándolo con el service worker existente)
// Importar Firebase solo si no lo importamos ya en firebase-messaging-sw.js
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

  const messaging = firebase.messaging();
} 