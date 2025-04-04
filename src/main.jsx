// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerServiceWorker, setupOnlineOfflineListeners } from './registerSW';
import toast from 'react-hot-toast';

console.log("main.jsx: Iniciando renderizado de la app");

// Registrar el service worker
registerServiceWorker();

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