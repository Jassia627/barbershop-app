// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./modules/auth";
import { ThemeProvider } from "./core/context/ThemeContext";
import AppRoutes from "./core/routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { useEffect, useRef } from 'react';
import { setupAppointmentNotifications } from './core/services/notificationService';
import { logDebug, logError } from './core/utils/logger';

// Componente interno que usa useAuth
function AppContent() {
  const { user, isLoading } = useAuth();
  const unsubscribeRef = useRef(null);

  // Efecto para manejar notificaciones cuando el usuario cambia
  useEffect(() => {
    // No hacer nada si todavía está cargando el usuario
    if (isLoading) {
      return;
    }

    // Limpiar cualquier suscripción anterior
    if (unsubscribeRef.current) {
      logDebug('Limpiando suscripción anterior');
      try {
        unsubscribeRef.current();
      } catch (e) {
        logError('Error al limpiar suscripción:', e);
      }
      unsubscribeRef.current = null;
    }

    // Verificar si el usuario es admin
    if (user?.role === 'admin' && user?.shopId) {
      logDebug('Configurando sistema de notificaciones para admin');
      
      try {
        // Iniciar sistema de notificaciones
        const cleanup = setupAppointmentNotifications(user);
        if (typeof cleanup === 'function') {
          unsubscribeRef.current = cleanup;
        }
      } catch (error) {
        logError('Error al configurar notificaciones:', error);
      }
    }
    
    // Limpieza
    return () => {
      if (unsubscribeRef.current) {
        logDebug('Limpiando sistema de notificaciones');
        try {
          unsubscribeRef.current();
        } catch (e) {
          logError('Error al limpiar suscripción:', e);
        }
        unsubscribeRef.current = null;
      }
    };
  }, [user, isLoading]);

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