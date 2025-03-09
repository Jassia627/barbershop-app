import { useState } from 'react';
import { useAuth } from '../../auth';
import { updateBarber } from '../services/barberService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';
import { toast } from 'react-hot-toast';

export const useProfile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const updateProfile = async (profileData) => {
    if (!user) {
      toast.error("No hay usuario autenticado");
      return false;
    }

    setLoading(true);
    try {
      // Actualizar en Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: profileData.name,
        phone: profileData.phone,
        updatedAt: new Date().toISOString()
      });

      // Actualizar el estado local del usuario
      setUser({
        ...user,
        name: profileData.name,
        phone: profileData.phone
      });

      toast.success("Perfil actualizado con éxito");
      return true;
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast.error("Error al actualizar perfil");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateProfile, loading };
}; 