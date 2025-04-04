// src/modules/auth/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User, Sun, Moon, Scissors, ChevronRight, Phone, Building } from 'lucide-react';
import { useTheme } from '../../../hooks/useTheme';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import ShopList from '../../../components/common/ShopList';

const Register = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'admin',
    phone: '',
    shopId: '',
    shopName: ''
  });
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Efecto para animación de entrada
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'role' && {
        shopId: '',
        shopName: ''
      })
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('El correo electrónico es requerido');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('El teléfono es requerido');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.role === 'barber' && !formData.shopId) {
      toast.error('Debe seleccionar una barbería');
      return false;
    }
    if (formData.role === 'admin' && !formData.shopName) {
      toast.error('Debe ingresar el nombre de la barbería');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const userCredential = await signup(formData.email, formData.password);
      const uid = userCredential.user.uid;
      
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        createdAt: new Date().toISOString(),
        status: formData.role === 'admin' ? 'active' : 'inactive',
        shopId: formData.role === 'admin' ? uid : formData.shopId,
        shopName: formData.role === 'admin' ? formData.shopName : formData.shopName,
        uid: uid
      };

      if (formData.role === 'admin') {
        userData.isShopOwner = true;
        userData.status = 'active';
      } else {
        const shopDoc = await getDoc(doc(db, "users", formData.shopId));
        if (!shopDoc.exists()) {
          throw new Error('La barbería seleccionada no existe');
        }
        userData.status = 'pending';
        userData.isApproved = false;
      }

      await setDoc(doc(db, "users", uid), userData);
      
      let message = 'Registro exitoso';
      if (formData.role === 'barber') {
        message += '. Tu cuenta está pendiente de aprobación por el administrador';
      }
      toast.success(message);
      navigate('/login');
    } catch (error) {
      console.error('Error en el registro:', error);
      let errorMessage = 'Error al registrar usuario';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este correo ya está registrado';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Correo electrónico inválido';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'El registro está deshabilitado temporalmente';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es muy débil';
          break;
        default:
          errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Panel de registro */}
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
                Crear nueva cuenta
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Regístrate para comenzar a gestionar tu barbería
              </p>
            </div>

        <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#024850] dark:group-focus-within:text-red-500 transition-colors" />
              <input
                      id="name"
                      name="name"
                type="text"
                      required
                      className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#024850] dark:focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ingresa tu nombre completo"
                value={formData.name}
                      onChange={handleChange}
                      disabled={loading}
              />
            </div>
          </div>
                
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#024850] dark:group-focus-within:text-red-500 transition-colors" />
              <input
                      id="email"
                      name="email"
                type="email"
                      required
                      className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#024850] dark:focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="correo@ejemplo.com"
                value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#024850] dark:group-focus-within:text-red-500 transition-colors" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#024850] dark:focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ingresa tu teléfono"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Tipo de usuario
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#024850] dark:group-focus-within:text-red-500 transition-colors" />
                    <select
                      id="role"
                      name="role"
                      required
                      className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#024850] dark:focus:ring-red-500 focus:border-transparent transition-all duration-200 appearance-none"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="barber">Barbero</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {formData.role === 'admin' ? (
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Nombre de la Barbería
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#024850] dark:group-focus-within:text-red-500 transition-colors" />
                      <input
                        id="shopName"
                        name="shopName"
                        type="text"
                required
                        className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#024850] dark:focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Nombre de tu barbería"
                        value={formData.shopName}
                        onChange={handleChange}
                        disabled={loading}
              />
            </div>
          </div>
                ) : (
                  <div className={`border rounded-lg p-4 transition-colors duration-200
                    ${theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                    <label className={`block text-sm font-medium mb-2
                      ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                      Seleccionar Barbería
                    </label>
                    <ShopList
                      onSelect={(shop) => {
                        setFormData(prev => ({
                          ...prev,
                          shopId: shop.shopId,
                          shopName: shop.shopName
                        }));
                      }}
                      selectedShopId={formData.shopId}
                    />
                  </div>
                )}
                
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#024850] dark:group-focus-within:text-red-500 transition-colors" />
              <input
                      id="password"
                      name="password"
                type="password"
                      required
                      className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#024850] dark:focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="••••••••"
                value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#024850] dark:group-focus-within:text-red-500 transition-colors" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                required
                      className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#024850] dark:focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
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
                    Registrando...
                  </div>
                ) : (
                  <>
                    <span>Registrarse</span>
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
          </button>
        </form>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="font-medium text-[#024850] dark:text-red-500 hover:text-[#023840] dark:hover:text-red-400">
                  Inicia sesión
                </Link>
              </p>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
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

export default Register;