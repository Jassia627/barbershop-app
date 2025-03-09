// src/modules/auth/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { toast } from 'react-hot-toast';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Efecto para manejar la redirección cuando el usuario está autenticado
  useEffect(() => {
    if (user) {
      const role = user.role || 'barber';
      navigate(role === 'admin' ? '/admin' : '/barber', { replace: true });
      toast.success("Inicio de sesión exitoso");
    }
  }, [user, navigate]);

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      await login(email, password);
      // La redirección se manejará en el useEffect cuando el usuario esté disponible
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      toast.error("Error al iniciar sesión: " + (error.message || "Credenciales inválidas"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Iniciar Sesión</h1>
        <LoginForm onSubmit={handleLogin} loading={loading} />
      </div>
    </div>
  );
};

export default Login;