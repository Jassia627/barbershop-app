import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './modules/auth';
import { Toaster } from 'react-hot-toast';

// Registrar service worker para notificaciones push
const registerServiceWorker = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('Service Worker registrado con éxito:', registration.scope);
      return registration;
    }
    console.log('Service Worker no compatible en este navegador');
    return null;
  } catch (error) {
    console.error('Error al registrar Service Worker:', error);
    return null;
  }
};

// Registrar el service worker al inicio
registerServiceWorker();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
); 