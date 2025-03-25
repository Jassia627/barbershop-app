import { useState, useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

/**
 * Hook personalizado para manejar recorridos guiados con Driver.js
 * @param {string} tourType - Tipo de recorrido ('admin', 'barber', etc.)
 * @param {boolean} autoStart - Si el recorrido debe iniciar automáticamente
 * @returns {Object} - Métodos y estado del recorrido
 */
export const useTour = (tourType = 'admin', autoStart = false) => {
  const [driverObj, setDriverObj] = useState(null);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Definición de los diferentes recorridos
  const tours = {
    admin: [
      {
        element: '#admin-dashboard',
        popover: {
          title: '📊 Panel de Administración',
          description: 'Aquí puedes ver un resumen de la actividad de tu barbería, incluyendo estadísticas de ventas, citas y rendimiento de tus barberos.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#admin-barbers',
        popover: {
          title: '💈 Gestión de Barberos',
          description: 'Administra los barberos de tu negocio, aprueba nuevos barberos, gestiona sus perfiles y controla sus horarios de trabajo.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#admin-appointments',
        popover: {
          title: '📅 Gestión de Citas',
          description: 'Visualiza y administra todas las citas programadas en tu barbería. Puedes confirmar, cancelar o reprogramar citas desde aquí.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#admin-services',
        popover: {
          title: '✂️ Servicios',
          description: 'Configura los servicios que ofrece tu barbería, establece precios, duración y asigna qué barberos pueden realizar cada servicio.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#admin-new-haircut',
        popover: {
          title: '✨ Nuevo Corte',
          description: 'Registra un nuevo corte de cabello realizado en tu barbería, incluyendo detalles como el barbero, cliente, servicio y precio.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#admin-pending-haircuts',
        popover: {
          title: '✓ Cortes Pendientes',
          description: 'Revisa y aprueba los cortes completados por tus barberos. Esto te permite mantener un control de calidad sobre el trabajo realizado.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#admin-inventory',
        popover: {
          title: '📦 Inventario',
          description: 'Gestiona el inventario de productos de tu barbería, controla el stock y recibe alertas cuando necesites reabastecerte.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#admin-expenses',
        popover: {
          title: '💰 Gastos',
          description: 'Registra y monitorea los gastos de tu barbería para mantener un control financiero efectivo de tu negocio.',
          side: 'bottom',
          align: 'start'
        }
      }
    ],
    barber: [
      {
        element: '#barber-dashboard',
        popover: {
          title: '📊 Tu Panel',
          description: 'Aquí puedes ver un resumen de tu actividad como barbero, incluyendo tus citas del día, ingresos y estadísticas de rendimiento.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#barber-appointments',
        popover: {
          title: '📅 Mis Citas',
          description: 'Visualiza y gestiona tus citas programadas. Puedes ver los detalles de cada cliente y los servicios solicitados.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#barber-schedule',
        popover: {
          title: '🕒 Mi Horario',
          description: 'Configura tu disponibilidad y horarios de trabajo para que los clientes puedan reservar citas contigo en los momentos que estés disponible.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#barber-new-haircut',
        popover: {
          title: '✂️ Registrar Corte',
          description: 'Registra los cortes que has completado para su aprobación por el administrador y mantén un registro de tu trabajo.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#barber-haircuts',
        popover: {
          title: '📚 Historial',
          description: 'Revisa tu historial de cortes realizados, incluyendo detalles como clientes, servicios, fechas y valoraciones.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#barber-profile',
        popover: {
          title: '👤 Mi Perfil',
          description: 'Gestiona tu información personal, foto de perfil y especialidades para que los clientes te conozcan mejor.',
          side: 'bottom',
          align: 'start'
        }
      }
    ]
  };

  // Inicializar Driver.js
  useEffect(() => {
    // Verificar si el usuario ya ha visto el recorrido
    const tourSeen = localStorage.getItem(`${tourType}-tour-seen`);
    setHasSeenTour(tourSeen === 'true');

    // Crear instancia de Driver.js con configuración mejorada
    const driverInstance = driver({
      showProgress: true,
      animate: true,
      showButtons: ['next', 'previous', 'close'],
      steps: tours[tourType] || [],
      allowClose: true,
      stagePadding: 10,
      smoothScroll: true,
      disableActiveInteraction: false,
      overlayOpacity: 0.7,
      onHighlightStarted: () => setIsActive(true),
      onDeselected: () => setIsActive(false),
      onDestroyed: () => {
        setIsActive(false);
        localStorage.setItem(`${tourType}-tour-seen`, 'true');
        setHasSeenTour(true);
      },
      className: 'custom-driver-theme',
      prevBtnText: 'Anterior',
      nextBtnText: 'Siguiente',
      doneBtnText: 'Finalizar',
      closeBtnText: 'Cerrar',
      stageRadius: 5,
      popoverOffset: 12,
      onPopoverRender: (popover) => {
        // Añadir animación a los elementos del popover
        const title = popover.querySelector('.driver-popover-title');
        const description = popover.querySelector('.driver-popover-description');
        const footer = popover.querySelector('.driver-popover-footer');
        
        if (title) title.style.animation = 'fade-in-down 0.4s ease-out forwards';
        if (description) description.style.animation = 'fade-in-down 0.4s ease-out 0.1s forwards';
        if (footer) footer.style.animation = 'fade-in-up 0.4s ease-out 0.2s forwards';
      }
    });

    setDriverObj(driverInstance);

    // Iniciar automáticamente si autoStart es true y el usuario no ha visto el recorrido
    if (autoStart && !tourSeen) {
      // Pequeño retraso para asegurar que los elementos estén cargados
      const timer = setTimeout(() => {
        driverInstance.drive();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [tourType, autoStart]);

  // Función para iniciar el recorrido manualmente
  const startTour = () => {
    if (driverObj) {
      driverObj.drive();
    }
  };

  // Función para reiniciar el estado del recorrido (para pruebas)
  const resetTourState = () => {
    localStorage.removeItem(`${tourType}-tour-seen`);
    setHasSeenTour(false);
  };

  return {
    startTour,
    resetTourState,
    hasSeenTour,
    isActive,
    driverObj
  };
};

export default useTour; 