// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { 
  registerServiceWorker, 
  setupOnlineOfflineListeners, 
  clearServiceWorkerCache,
  isMobileDevice 
} from './registerSW';
import toast from 'react-hot-toast';

console.log("main.jsx: Iniciando renderizado de la app");

// Si es móvil, limpiar la caché para asegurar PWA actualizada
const isMobile = isMobileDevice();
if (isMobile) {
  console.log("Dispositivo móvil detectado, limpiando caché...");
  clearServiceWorkerCache().then(() => {
    console.log("Caché limpiado, registrando service worker");
    // Registrar el service worker después de limpiar la caché
    registerServiceWorker();
  });
} else {
  // Para desktop, simplemente registrar el service worker
  registerServiceWorker();
}

// Configurar los listeners de conexión
setupOnlineOfflineListeners(
  () => toast.success('Conexión recuperada'),
  () => toast.error('Sin conexión a Internet')
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);