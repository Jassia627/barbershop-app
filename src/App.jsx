// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./modules/auth";
import { ThemeProvider } from "./core/context/ThemeContext";
import AppRoutes from "./core/routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { useEffect } from 'react';
import { setupAppointmentNotifications } from './core/services/notificationService';
import { logDebug } from './core/utils/logger';

// Componente interno que usa useAuth
function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribe = null;

    if (user?.role === 'admin') {
      logDebug('Configurando notificaciones para:', user);
      unsubscribe = setupAppointmentNotifications(user);
    }

    return () => {
      if (unsubscribe) {
        logDebug('Limpiando listener de notificaciones');
        unsubscribe();
      }
    };
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