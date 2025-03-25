// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./modules/auth";
import { ThemeProvider } from "./core/context/ThemeContext";
import AppRoutes from "./core/routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { useEffect } from 'react';
import { setupAppointmentNotifications } from './core/services/notificationService';

// Componente interno que usa useAuth
function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      const unsubscribe = setupAppointmentNotifications(user);
      return () => {
        if (unsubscribe) unsubscribe();
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
  console.log("App: Renderizando App.jsx");
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;