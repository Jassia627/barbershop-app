// src/modules/barbers/pages/Profile.jsx
import React, { useState } from 'react';
import { useAuth } from '../../auth';
import { useProfile } from '../hooks/useProfile';
import ProfileForm from '../components/ProfileForm';
import BarberStatus from '../components/BarberStatus';
import { User, Mail, Phone, Edit, X, Check } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const { updateProfile, loading } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = async (profileData) => {
    const success = await updateProfile(profileData);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Editar Perfil
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {isEditing ? (
          <ProfileForm user={user} onSubmit={handleSubmit} loading={loading} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-400" />
              <p className="font-medium text-gray-900 dark:text-white">{user.phone || 'No especificado'}</p>
            </div>
            <BarberStatus status={user.status} />
          </div>
        )}
      </div>
      
      {/* Sección de información adicional */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Información Adicional</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Rol</p>
              <p className="text-gray-600 dark:text-gray-400">{user.role === 'admin' ? 'Administrador' : 'Barbero'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Fecha de Registro</p>
              <p className="text-gray-600 dark:text-gray-400">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'No disponible'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;