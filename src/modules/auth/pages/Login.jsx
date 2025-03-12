// src/modules/auth/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, Sun, Moon, Scissors, ChevronRight, X } from 'lucide-react';
import { useTheme } from '../../../hooks/useTheme';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Efecto para animación de entrada
  useEffect(() => {
    setMounted(true);
  }, []);

  // Efecto para manejar la redirección cuando el usuario está autenticado
  useEffect(() => {
    if (user) {
      const role = user.role || 'barber';
      navigate(role === 'admin' ? '/admin' : '/barber', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await login(credentials.email, credentials.password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}
          max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto
          flex ring-1 ring-black ring-opacity-5 p-4 items-center gap-3`}>
          <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-full p-2">
            <Scissors className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <div className="flex-1 w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              ¡Bienvenido de nuevo, {userData.name}!
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Nos alegra verte otra vez
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 rounded-md text-gray-400 hover:text-gray-500 
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <span className="sr-only">Cerrar</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      ), {
        duration: 4000,
      });
      
      // No hacemos la redirección aquí, se manejará en el useEffect
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      toast.error("Error al iniciar sesión: " + (error.message || "Credenciales inválidas"));
      setLoading(false);
    }
  };

  // Si el usuario ya está autenticado, no mostramos el formulario de login
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#024850] dark:border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Panel lateral decorativo - solo visible en desktop */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#024850] to-[#023840] dark:from-red-600 dark:to-red-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        
        {/* Elementos decorativos */}
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/20 animate-float"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-white/10 animate-float-delay"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-white/15 animate-float-slow"></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <img 
            src={theme === 'dark' ? '/Rojo negro.png' : '/Verde negro.png'} 
            alt="Logo Grande" 
            className="w-64 h-auto mb-8 animate-pulse-subtle"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center">
            Barbershop App
          </h1>
          <p className="text-white/80 text-xl text-center max-w-md">
            Gestiona tu barbería de manera profesional y eficiente
          </p>
          
          <div className="mt-12 flex items-center gap-3 bg-white/20 px-6 py-4 rounded-xl">
            <Scissors className="h-6 w-6 text-white" />
            <p className="text-white font-medium">La mejor experiencia para tu negocio</p>
          </div>
        </div>
      </div>

      {/* Panel de login */}
      <div 
        className={`w-full md:w-1/2 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Botón de tema */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 z-20"
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-[#024850]" />
          )}
        </button>

        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
            {/* Logo - ahora dentro de la tarjeta para todos los dispositivos */}
            <div className="flex justify-center mb-6">
              <img
                src={theme === 'dark' ? '/Rojo negro.png' : '/Verde negro.png'}
                alt="Logo"
                className="h-28 md:h-24 w-auto object-contain transition-all duration-300"
              />
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Bienvenido
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Inicia sesión para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#024850] dark:group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="email"
                      value={credentials.email}
                      onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#024850] dark:focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#024850] dark:group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#024850] dark:focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3.5 text-white bg-gradient-to-r from-[#024850] to-[#023840] dark:from-red-600 dark:to-red-700 rounded-lg hover:from-[#023840] hover:to-[#022830] dark:hover:from-red-700 dark:hover:to-red-800 focus:ring-4 focus:ring-[#024850]/50 dark:focus:ring-red-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} Barbershop App. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos para animaciones */}
      <style jsx="true">{`
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes float-delay {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delay {
          animation: float-delay 8s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;