// src/modules/shared/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth';
import { useTheme } from '../../../core/context/ThemeContext';
import { toast } from 'react-hot-toast';
import { 
  Moon, 
  Sun, 
  Scissors, 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  User, 
  BarChart3, 
  Users, 
  CalendarDays, 
  Package, 
  DollarSign, 
  PlusCircle, 
  ShoppingBag, 
  Clock, 
  Home,
  Settings,
  History,
  UserCircle,
  CheckCircle2
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const userMenuButtonRef = useRef(null);

  const adminLinks = [
    { to: "/admin", text: "Estadísticas", icon: BarChart3 },
    { to: "/admin/barbers", text: "Barberos", icon: Users },
    { to: "/admin/appointments", text: "Citas", icon: CalendarDays },
    { to: "/admin/services", text: "Servicios", icon: Scissors },
    { to: "/admin/new-haircut", text: "Nuevo Corte", icon: PlusCircle },
    { to: "/admin/pending-haircuts", text: "Cortes Pendientes", icon: CheckCircle2 },
    { to: "/admin/inventory", text: "Inventario", icon: Package },
    { to: "/admin/expenses", text: "Gastos", icon: DollarSign },
  ];

  const barberLinks = [
    { to: "/barber", text: "Panel", icon: BarChart3 },
    { to: "/barber/appointments", text: "Mis Citas", icon: CalendarDays },
    { to: "/barber/schedule", text: "Mi Horario", icon: Clock },
    { to: "/barber/new-haircut", text: "Registrar Corte", icon: Scissors },
    { to: "/barber/haircuts", text: "Historial", icon: History },
    { to: "/barber/profile", text: "Mi Perfil", icon: UserCircle },
  ];

  // Efecto para la animación de entrada inicial
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar menús al hacer clic fuera de ellos
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Cerrar menú móvil si está abierto y se hace clic fuera
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target) && 
          menuButtonRef.current && !menuButtonRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      
      // Cerrar menú de usuario si está abierto y se hace clic fuera
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target) && 
          userMenuButtonRef.current && !userMenuButtonRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    // Cerrar menús al cambiar de ruta
    const handleRouteChange = () => {
      setIsMenuOpen(false);
      setIsUserMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isMenuOpen, isUserMenuOpen]);

  const handleLogout = async () => {
    try {
      const userName = user.name; // Guardamos el nombre antes de cerrar sesión
      await logout();
      
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}
          max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto
          flex ring-1 ring-black ring-opacity-5 p-4 items-center gap-3`}>
          <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-full p-2">
            <LogOut className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1 w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              ¡Hasta pronto, {userName}!
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Esperamos verte de nuevo pronto
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 rounded-md text-gray-400 hover:text-gray-500 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="sr-only">Cerrar</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      ), {
        duration: 3000,
      });
      
      navigate("/login");
      setIsMenuOpen(false);
      setIsUserMenuOpen(false);
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  const isCurrentPath = (path) => location.pathname === path;

  return (
    <nav className={`bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-lg sticky top-0 z-50 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-md transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 animate-pulse-slow">
              <Scissors className="h-6 w-6 text-blue-600 dark:text-blue-400 transform transition-transform duration-300 group-hover:rotate-45" />
            </div>
            <span className="text-white font-bold text-xl tracking-wide relative overflow-hidden group-hover:text-blue-100 transition-colors duration-300">
              StarBarber
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </span>
          </Link>
          
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {user.role === 'admin' && adminLinks.map((link, index) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center space-x-1 group
                    ${isCurrentPath(link.to) 
                      ? 'bg-white/20 text-white shadow-inner' 
                      : 'text-blue-100 hover:bg-white/10 hover:text-white hover:shadow hover:translate-y-[-2px]'} 
                    animate-slide-in-top`}
                  style={{ 
                    animationDelay: `${index * 70}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  <div className={`relative ${!isCurrentPath(link.to) ? 'group-hover:animate-bounce-subtle' : ''}`}>
                    <link.icon className="h-4 w-4" strokeWidth={2.5} />
                    {isCurrentPath(link.to) && (
                      <span className="absolute -bottom-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                    )}
                  </div>
                  <span>{link.text}</span>
                </Link>
              ))}
              
              {user.role === 'barber' && barberLinks.map((link, index) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center space-x-1 group
                    ${isCurrentPath(link.to) 
                      ? 'bg-white/20 text-white shadow-inner' 
                      : 'text-blue-100 hover:bg-white/10 hover:text-white hover:shadow hover:translate-y-[-2px]'}
                    animate-slide-in-top`}
                  style={{ 
                    animationDelay: `${index * 70}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  <div className={`relative ${!isCurrentPath(link.to) ? 'group-hover:animate-bounce-subtle' : ''}`}>
                    <link.icon className="h-4 w-4" strokeWidth={2.5} />
                    {isCurrentPath(link.to) && (
                      <span className="absolute -bottom-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                    )}
                  </div>
                  <span>{link.text}</span>
                </Link>
              ))}
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-white hover:bg-white/10 transition-all duration-300 hover:shadow-md hover:rotate-12 animate-slide-in-top"
                title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                style={{ 
                  animationDelay: `${(user.role === 'admin' ? adminLinks.length : barberLinks.length) * 70}ms`,
                  animationFillMode: 'backwards'
                }}
              >
                {theme === "dark" 
                  ? <Sun className="h-5 w-5 hover:animate-spin-slow" strokeWidth={2.5} /> 
                  : <Moon className="h-5 w-5 hover:animate-pulse" strokeWidth={2.5} />
                }
              </button>
              
              <div className="relative ml-4 animate-slide-in-top" style={{ 
                animationDelay: `${(user.role === 'admin' ? adminLinks.length : barberLinks.length) * 70 + 70}ms`,
                animationFillMode: 'backwards'
              }}>
                <button
                  ref={userMenuButtonRef}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-1 text-white hover:text-blue-200 bg-white/10 rounded-full px-3 py-1.5 transition-all duration-300 hover:bg-white/20 hover:shadow-md"
                >
                  <div className="bg-white/20 p-1 rounded-full animate-pulse-slow">
                    <User className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-medium">{user.name || user.email.split('@')[0]}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                </button>
                
                {isUserMenuOpen && (
                  <div 
                    ref={userMenuRef}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 z-10 border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 animate-fade-in-down"
                  >
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {user.role === 'admin' ? 'Administrador' : 'Barbero'}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white transition-colors duration-200 group"
                    >
                      <LogOut className="h-4 w-4 mr-2 group-hover:translate-x-[-2px] transition-transform duration-300" strokeWidth={2.5} />
                      <span className="group-hover:translate-x-[-2px] transition-transform duration-300">Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="md:hidden">
            <button
              ref={menuButtonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 transition-all duration-300 hover:rotate-3 hover:scale-110"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Abrir menú principal</span>
              {isMenuOpen ? (
                <X className="h-6 w-6 animate-rotate-in" strokeWidth={2.5} />
              ) : (
                <Menu className="h-6 w-6 animate-pulse-subtle" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
        
        {/* Overlay para cerrar el menú al tocar fuera */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
        
        {/* Menú móvil */}
        {user && (
          <div 
            ref={menuRef}
            className={`md:hidden fixed top-0 right-0 h-full w-72 bg-gradient-to-b from-blue-600 via-blue-500 to-indigo-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-50 transform transition-all duration-300 ease-in-out shadow-2xl ${
              isMenuOpen 
                ? 'translate-x-0 animate-slide-in-right' 
                : 'translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-4 border-b border-white/20">
                <div className="flex items-center space-x-2 animate-bounce-subtle">
                  <div className="bg-white/20 p-1.5 rounded-full">
                    <Scissors className="h-5 w-5 text-white animate-pulse-slow" strokeWidth={2.5} />
                  </div>
                  <span className="text-white font-bold text-lg">StarBarber</span>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="text-white hover:text-blue-200 bg-white/10 p-1.5 rounded-full transition-all duration-200 hover:rotate-90"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
              
              <div className="flex-1 px-2 py-4 overflow-y-auto">
                <div className="mb-4 px-3 animate-fade-in-down" style={{ animationDelay: '150ms' }}>
                  <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg hover:bg-white/20 transition-colors duration-300">
                    <div className="bg-white/20 p-2 rounded-full animate-pulse-slow">
                      <User className="h-5 w-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.name || user.email.split('@')[0]}</div>
                      <div className="text-blue-200 text-xs">{user.email}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Link
                    to="/"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-all duration-200 hover:translate-x-1 animate-fade-in-down"
                    style={{ animationDelay: '200ms' }}
                  >
                    <div className="bg-white/10 p-1.5 rounded-full">
                      <Home className="h-4 w-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span>Inicio</span>
                  </Link>
                  
                  {user.role === 'admin' && adminLinks.map((link, index) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:translate-x-1 animate-fade-in-down ${
                        isCurrentPath(link.to) 
                          ? 'bg-white/20 text-white' 
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`}
                      style={{ animationDelay: `${250 + index * 50}ms` }}
                    >
                      <div className={`bg-white/10 p-1.5 rounded-full ${isCurrentPath(link.to) ? 'bg-white/30' : ''}`}>
                        <link.icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                      </div>
                      <span>{link.text}</span>
                      {isCurrentPath(link.to) && (
                        <span className="ml-auto flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                      )}
                    </Link>
                  ))}
                  
                  {user.role === 'barber' && barberLinks.map((link, index) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:translate-x-1 animate-fade-in-down ${
                        isCurrentPath(link.to) 
                          ? 'bg-white/20 text-white' 
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`}
                      style={{ animationDelay: `${250 + index * 50}ms` }}
                    >
                      <div className={`bg-white/10 p-1.5 rounded-full ${isCurrentPath(link.to) ? 'bg-white/30' : ''}`}>
                        <link.icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                      </div>
                      <span>{link.text}</span>
                      {isCurrentPath(link.to) && (
                        <span className="ml-auto flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                      )}
                    </Link>
                  ))}
                  
                  <button
                    onClick={() => { toggleTheme(); setIsMenuOpen(false); }}
                    className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-all duration-200 hover:translate-x-1 animate-fade-in-down"
                    style={{ animationDelay: '600ms' }}
                  >
                    <div className="bg-white/10 p-1.5 rounded-full">
                      {theme === "dark" 
                        ? <Sun className="h-4 w-4 text-white" strokeWidth={2.5} /> 
                        : <Moon className="h-4 w-4 text-white" strokeWidth={2.5} />
                      }
                    </div>
                    <span>{theme === "dark" ? 'Modo Claro' : 'Modo Oscuro'}</span>
                  </button>
                </div>
              </div>
              
              <div className="border-t border-white/20 p-4 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 group"
                >
                  <LogOut className="h-5 w-5 group-hover:translate-x-[-2px] transition-transform duration-300" strokeWidth={2.5} />
                  <span className="group-hover:translate-x-[-2px] transition-transform duration-300">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Estilos para las animaciones */}
      <style jsx="true">{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
        
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
        
        @keyframes slide-in-top {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-top {
          animation: slide-in-top 0.5s ease-out forwards;
        }
        
        @keyframes rotate-in {
          from { transform: rotate(-90deg); }
          to { transform: rotate(0); }
        }
        .animate-rotate-in {
          animation: rotate-in 0.3s ease-out forwards;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;