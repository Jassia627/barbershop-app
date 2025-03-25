import React, { useState, useEffect } from 'react';
import { X, HelpCircle, ArrowRight, Sparkles, Scissors } from 'lucide-react';
import { useTour } from '../../hooks/useTour';
import { useAuth } from '../../modules/auth';

/**
 * Componente que muestra un mensaje de bienvenida al recorrido guiado
 * @returns {JSX.Element} - Componente de bienvenida al recorrido
 */
const WelcomeTour = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { startTour, hasSeenTour } = useTour(user?.role || 'admin', false);

  useEffect(() => {
    // Verificar si el usuario ya ha visto el mensaje de bienvenida
    const welcomeSeen = localStorage.getItem(`welcome-tour-seen`);
    
    if (!welcomeSeen && !hasSeenTour) {
      // Pequeño retraso para mostrar el mensaje después de que la página se cargue
      const timer = setTimeout(() => {
        setShow(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
    
    setMounted(true);
  }, [hasSeenTour]);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem('welcome-tour-seen', 'true');
  };

  const handleStartTour = () => {
    handleClose();
    startTour();
  };

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>
      
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-500 scale-100 animate-fade-in-up">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 dark:bg-indigo-600 rounded-full"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500 dark:bg-purple-700 rounded-full"></div>
        </div>
        
        {/* Botón de cerrar */}
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors bg-white/10 hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Contenido */}
        <div className="flex flex-col items-center text-center p-6 pt-8 relative z-10">
          <div className="relative">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-indigo-600 dark:to-purple-700 p-4 rounded-full mb-5 shadow-lg">
              <Scissors className="h-8 w-8 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Bienvenido a StarBarber!
          </h2>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-sm font-medium px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              {user?.role === 'admin' ? 'Panel de Administrador' : 'Panel de Barbero'}
            </span>
            <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            ¿Te gustaría hacer un recorrido guiado para conocer todas las funciones de la aplicación y sacar el máximo provecho?
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Ahora no
            </button>
            
            <button
              onClick={handleStartTour}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-indigo-600 dark:to-purple-700 rounded-lg text-white hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <span>Iniciar recorrido</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeTour; 