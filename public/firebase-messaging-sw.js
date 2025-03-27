// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
firebase.initializeApp({
  apiKey: "AIzaSyB2xtx9PNSs_yAFice9jbkxzdahzzf3yoY",
  authDomain: "barbershop-9810d.firebaseapp.com",
  projectId: "barbershop-9810d",
  storageBucket: "barbershop-9810d.appspot.com",
  messagingSenderId: "678061957866",
  appId: "1:678061957866:web:9cd1c7e7742451f4186d93",
  measurementId: "G-5Q1DXP7L23"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    tag: 'new-appointment',
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click in background
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  
  // Close the notification
  event.notification.close();
  
  // Navigate to the appointments page when clicked
  // This will focus on an existing tab or open a new one if needed
  const urlToOpen = new URL('/admin/appointments', self.location.origin).href;
  
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
  .then((windowClients) => {
    // Check if there is already a window open with the target URL
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      // If so, focus it
      if (client.url === urlToOpen && 'focus' in client) {
        return client.focus();
      }
    }
    // If not, open a new window
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });
  
  event.waitUntil(promiseChain);
}); 