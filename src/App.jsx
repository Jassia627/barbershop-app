// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./modules/auth";
import { ThemeProvider } from "./core/context/ThemeContext";
import AppRoutes from "./core/routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { useEffect, useRef } from 'react';
import { setupAppointmentNotifications } from './core/services/notificationService';
import { logDebug } from './core/utils/logger';

// Componente interno que usa useAuth
function AppContent() {
  const { user } = useAuth();
  const notificationSetupRef = useRef(false);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // Limpiar el listener anterior si existe
    if (unsubscribeRef.current) {
      logDebug('Limpiando listener de notificaciones existente');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Solo configurar notificaciones para admin y solo una vez por sesión
    if (user?.role === 'admin' && !notificationSetupRef.current) {
      logDebug('Configurando notificaciones para admin:', user.email);
      
      // Configurar listener para notificaciones
      unsubscribeRef.current = setupAppointmentNotifications(user);
      notificationSetupRef.current = true;
      
      // Registrar actividad para mantener vivo el listener
      const interval = setInterval(() => {
        logDebug('Ping para mantener vivo el listener de notificaciones');
      }, 30000); // Cada 30 segundos
      
      return () => {
        clearInterval(interval);
        if (unsubscribeRef.current) {
          logDebug('Limpiando listener de notificaciones y ping');
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }
  }, [user]);

  return (
    <ThemeProvider>
      <Toaster position="top-right" />
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