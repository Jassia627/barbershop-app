import React, { useState, useEffect } from 'react';
import { HelpCircle, Info, Sparkles } from 'lucide-react';
import { useTour } from '../../hooks/useTour';
import { useAuth } from '../../modules/auth';

/**
 * Botón de ayuda que inicia el recorrido guiado
 * @param {Object} props - Propiedades del componente
 * @param {string} props.tourType - Tipo de recorrido ('admin', 'barber', etc.)
 * @param {string} props.position - Posición del botón ('top-right', 'bottom-right', etc.)
 * @returns {JSX.Element} - Componente de botón de ayuda
 */
const TourButton = ({ tourType = '', position = 'bottom-right' }) => {
  const { user } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Si no se especifica un tipo de recorrido, usar el rol del usuario
  const actualTourType = tourType || (user?.role || 'admin');
  
  const { startTour, hasSeenTour } = useTour(actualTourType, false);

  // Efecto para la animación de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Determinar la clase de posición
  const positionClass = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  }[position] || 'fixed bottom-6 right-6';

  return (
    <div className={`${positionClass} z-50 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="relative group">
        <button
          onClick={startTour}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-indigo-600 dark:to-purple-700 
            p-3.5 rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 
            hover:scale-110 hover:rotate-12 flex items-center justify-center group"
          aria-label="Iniciar recorrido guiado"
        >
          {!hasSeenTour ? (
            <Sparkles className="h-6 w-6 text-white animate-pulse" strokeWidth={2} />
          ) : (
            <HelpCircle className="h-6 w-6 text-white group-hover:animate-pulse" strokeWidth={2} />
          )}
        </button>
        
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full mb-3 right-0 bg-white dark:bg-gray-800 
            rounded-xl shadow-xl p-4 text-sm w-56 transform transition-all duration-300 
            scale-100 opacity-100 pointer-events-none border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {!hasSeenTour ? '¡Descubre la aplicación!' : '¿Necesitas ayuda?'}
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-xs mt-1.5 leading-relaxed">
                  {!hasSeenTour 
                    ? 'Haz clic para iniciar un recorrido guiado y conocer todas las funciones' 
                    : 'Haz clic para iniciar un recorrido guiado por la aplicación'}
                </p>
              </div>
            </div>
            <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white dark:bg-gray-800 
              border-r border-b border-gray-100 dark:border-gray-700 transform rotate-45"></div>
          </div>
        )}
        
        {/* Indicador de nuevo para usuarios que no han visto el recorrido */}
        {!hasSeenTour && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>
    </div>
  );
};

export default TourButton; 