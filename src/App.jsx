// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./modules/auth";
import { ThemeProvider } from "./core/context/ThemeContext";
import AppRoutes from "./core/routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { useEffect, useRef, useState } from 'react';
import { setupAppointmentNotifications } from './core/services/notificationService';
import { logDebug } from './core/utils/logger';

// Componente interno que usa useAuth
function AppContent() {
  const { user } = useAuth();
  const [notificationsActive, setNotificationsActive] = useState(false);
  const unsubscribeRef = useRef(null);

  // Efecto principal para manejar notificaciones
  useEffect(() => {
    let cleanupFunctions = [];
    
    // Solo configurar notificaciones si el usuario es admin
    if (user?.role === 'admin') {
      logDebug('Usuario admin detectado, iniciando notificaciones:', user.email);
      
      // Función para iniciar las notificaciones
      const startNotifications = () => {
        try {
          // Limpiar suscripción existente si hay alguna
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
          }
          
          // Configurar nuevas notificaciones
          unsubscribeRef.current = setupAppointmentNotifications(user);
          setNotificationsActive(true);
          logDebug('✅ Notificaciones configuradas correctamente');
        } catch (error) {
          logDebug('❌ Error al configurar notificaciones:', error);
        }
      };
      
      // Iniciar las notificaciones inmediatamente
      startNotifications();
      
      // Función para comprobar y reiniciar notificaciones si es necesario
      const checkAndRestartNotifications = () => {
        if (user?.role === 'admin') {
          if (!notificationsActive) {
            logDebug('🔄 Reactivando notificaciones inactivas');
            startNotifications();
          } else {
            logDebug('👍 Las notificaciones están activas');
          }
        }
      };
      
      // Verificar periodicamente el estado de las notificaciones
      const intervalId = setInterval(() => {
        logDebug('⏱️ Verificación periódica de notificaciones');
        checkAndRestartNotifications();
      }, 30000); // Cada 30 segundos
      cleanupFunctions.push(() => clearInterval(intervalId));
      
      // Manejar cambios de visibilidad de la página
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          logDebug('👁️ Página ahora visible, verificando notificaciones');
          checkAndRestartNotifications();
        }
      };
      
      // Agregar listener para detectar cuando la página vuelve a ser visible
      document.addEventListener('visibilitychange', handleVisibilityChange);
      cleanupFunctions.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));
      
      // Manejar eventos de conexión
      const handleOnline = () => {
        logDebug('🌐 Conexión restablecida, verificando notificaciones');
        checkAndRestartNotifications();
      };
      
      window.addEventListener('online', handleOnline);
      cleanupFunctions.push(() => window.removeEventListener('online', handleOnline));
    } else {
      // Si no es admin, limpiar las notificaciones
      if (unsubscribeRef.current) {
        logDebug('Usuario no es admin, limpiando notificaciones');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        setNotificationsActive(false);
      }
    }
    
    // Función de limpieza
    return () => {
      logDebug('Limpiando recursos de notificaciones');
      
      // Ejecutar todas las funciones de limpieza
      cleanupFunctions.forEach(fn => fn());
      
      // Limpiar suscripción de notificaciones
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        setNotificationsActive(false);
      }
    };
  }, [user]); // Solo re-ejecutar cuando cambia el usuario

  return (
    <ThemeProvider>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 5000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
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