// src/modules/auth/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../../core/context/ThemeContext';
import { 
  Moon, 
  Sun, 
  UserPlus, 
  Loader, 
  Mail, 
  Lock, 
  Phone, 
  Store, 
  User,
  Scissors
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'barber',
    phone: '',
    shopId: '',
    shopName: ''
  });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Redirigir si el usuario ya está autenticado
  if (user) {
    return <Navigate to="/" replace />;
  }

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
        status: formData.role === 'admin' ? 'active' : 'pending',
        shopId: formData.role === 'admin' ? uid : formData.shopId,
        shopName: formData.role === 'admin' ? formData.shopName : '',
        uid: uid
      };

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

  const inputClasses = `w-full px-4 py-3 rounded-lg border transition-colors duration-200
    ${theme === 'dark' 
      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400' 
      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
    } focus:ring-2 focus:ring-yellow-500 focus:border-transparent`;

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8
      ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full space-y-8 p-8 rounded-xl shadow-2xl
        ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        
        {/* Botón de cambio de tema */}
        <button
          onClick={toggleTheme}
          className={`absolute top-4 right-4 p-2 rounded-full
            ${theme === 'dark' 
              ? 'text-yellow-500 hover:bg-gray-700' 
              : 'text-gray-500 hover:bg-gray-100'}`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div>
          {theme === 'dark' ? (
            <img src="/bb.png" alt="Logo" className="mx-auto h-24" />
          ) : (
            <img src="/bbDark.png" alt="Logo" className="mx-auto h-24" />
          )}
          <h2 className={`mt-6 text-center text-3xl font-bold
            ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Crear nueva cuenta
          </h2>
          <p className={`mt-2 text-center text-sm
            ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-medium text-yellow-500 hover:text-yellow-400">
              Inicia sesión
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Nombre */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="name"
                required
                className={`pl-10 ${inputClasses}`}
                placeholder="Nombre completo"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                required
                className={`pl-10 ${inputClasses}`}
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Teléfono */}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                required
                className={`pl-10 ${inputClasses}`}
                placeholder="Teléfono"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Rol */}
            <div className="relative">
              <Scissors className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                name="role"
                required
                className={`pl-10 ${inputClasses}`}
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="barber">Barbero</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {/* Nombre de la barbería (solo para admin) */}
            {formData.role === 'admin' && (
              <div className="relative">
                <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="shopName"
                  required
                  className={`pl-10 ${inputClasses}`}
                  placeholder="Nombre de la Barbería"
                  value={formData.shopName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            )}

            {/* Contraseña */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                name="password"
                required
                className={`pl-10 ${inputClasses}`}
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Confirmar Contraseña */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                name="confirmPassword"
                required
                className={`pl-10 ${inputClasses}`}
                placeholder="Confirmar contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent
              text-sm font-medium rounded-lg text-black bg-yellow-500 hover:bg-yellow-400
              transition-colors duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Registrando...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                Registrarse
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;