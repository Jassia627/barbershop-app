import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { subscribeToFirebaseMessages, createMessagingToken } from '../services/webPushService';
import { subscribeDirectToPush } from '../services/directWebPush';
import { logDebug, logError } from '../utils/logger';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  const [webPushLoading, setWebPushLoading] = useState(false);

  useEffect(() => {
    logDebug("AuthContext: Iniciando onAuthStateChanged...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      logDebug("AuthContext: onAuthStateChanged disparado, firebaseUser:", firebaseUser);
      if (firebaseUser) {
        try {
          // Buscar el documento del usuario usando su uid
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const finalUser = {
              ...firebaseUser,
              ...userData,
              id: firebaseUser.uid,
              role: userData.role || 'barber',
              shop: userData.shopId // Asegurarnos de que shopId esté incluido
            };
            setUser(finalUser);
            logDebug("AuthContext: Usuario autenticado:", finalUser);
          } else {
            logError("AuthContext: No se encontró el documento del usuario");
            setUser(null);
          }
        } catch (error) {
          logError("AuthContext: Error fetching user data:", error);
          setUser(null);
        }
      } else {
        logDebug("AuthContext: No hay usuario autenticado");
        setUser(null);
      }
      setLoading(false);
      logDebug("AuthContext: Loading establecido a false");
    }, (error) => {
      logError("AuthContext: Error en onAuthStateChanged:", error);
      setUser(null);
      setLoading(false);
      logDebug("AuthContext: Loading establecido a false tras error");
    });

    return () => {
      logDebug("AuthContext: Limpiando suscripción de onAuthStateChanged");
      unsubscribe();
    };
  }, []);

  // Función para activar notificaciones
  const activateNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setWebPushLoading(true);
      
      // Intentar primero con el método directo
      try {
        const userData = {
          shopId: user.shop,
          role: user.role,
          email: user.email
        };
        
        await subscribeDirectToPush(userData);
        setWebPushEnabled(true);
        toast.success('Notificaciones activadas correctamente');
        return;
      } catch (directError) {
        console.error('Error con método directo de notificaciones:', directError);
        
        // Si falla el método directo, intentar con Firebase Messaging
        try {
          await subscribeToFirebaseMessages();
          const token = await createMessagingToken();
          if (token) {
            setWebPushEnabled(true);
            toast.success('Notificaciones activadas correctamente');
          }
        } catch (firebaseError) {
          console.error('Error con método Firebase de notificaciones:', firebaseError);
          toast.error('No se pudieron activar las notificaciones');
          throw firebaseError;
        }
      }
    } catch (error) {
      console.error('Error al activar notificaciones:', error);
      toast.error('No se pudieron activar las notificaciones');
    } finally {
      setWebPushLoading(false);
    }
  }, [user]);

  const signup = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setWebPushEnabled(false);
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    webPushEnabled,
    webPushLoading,
    activateNotifications
  };

  logDebug("AuthContext: Renderizando, user:", user, "loading:", loading);
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 