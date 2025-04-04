// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./modules/auth";
import { ThemeProvider } from "./core/context/ThemeContext";
import AppRoutes from "./core/routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { useEffect, useRef } from 'react';
import { setupAppointmentNotifications } from './core/services/notificationService';
import { initializePushNotifications } from './core/services/pushNotificationService';
import { logDebug, logError } from './core/utils/logger';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import OfflineNotice from './components/common/OfflineNotice';
import { isPWA } from './registerSW';

// Componente interno que usa useAuth
function AppContent() {
  const { user } = useAuth();
  const unsubscribeRef = useRef(null);
  const isPwaMode = isPWA();

  useEffect(() => {
    let cleanup = null;

    const setupNotifications = async () => {
      try {
        // Verificar si el usuario está autenticado
        if (user?.uid) {
          logDebug('Usuario autenticado, iniciando configuración de notificaciones');

          // Inicializar notificaciones push si estamos en modo PWA o si el usuario es admin
          if (isPwaMode || user.role === 'admin') {
            // Inicializar notificaciones push
            await initializePushNotifications(user);
            logDebug('Notificaciones push inicializadas');
          }

          // Configurar notificaciones específicas para administradores
          if (user.role === 'admin') {
            logDebug('Iniciando configuración de notificaciones para admin');

            // Limpiar listener anterior si existe
            if (unsubscribeRef.current) {
              unsubscribeRef.current();
              unsubscribeRef.current = null;
            }

            // Configurar nuevo listener
            cleanup = setupAppointmentNotifications(user);
            if (typeof cleanup === 'function') {
              unsubscribeRef.current = cleanup;
            }
          }
        } else {
          logDebug('Usuario no autenticado o no es admin');
          // Limpiar listener si existe
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
          }
        }
      } catch (error) {
        logError('Error al configurar notificaciones:', error);
      }
    };

    setupNotifications();

    // Función de limpieza
    return () => {
      if (typeof cleanup === 'function') {
        logDebug('Limpiando configuración de notificaciones');
        cleanup();
      }
      if (unsubscribeRef.current) {
        logDebug('Limpiando listener de notificaciones');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, isPwaMode]); // Se ejecuta cuando cambia el usuario o el modo PWA

  return (
    <ThemeProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
          },
        }}
      />
      <AppRoutes />
      <PWAInstallPrompt />
      <OfflineNotice />
    </ThemeProvider>
  );
}

// Componente principal que provee el contexto
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;