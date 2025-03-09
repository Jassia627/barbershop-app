// src/modules/auth/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../core/firebase/config';
import { logDebug, logError } from '../../../core/utils/logger';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
              shopId: userData.shopId // Asegurarnos de que shopId esté incluido
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
      logError("AuthContext: Error en onAuthStateChanged");
      setUser(null);
      setLoading(false);
      logDebug("AuthContext: Loading establecido a false tras error");
    });

    return () => {
      logDebug("AuthContext: Limpiando suscripción de onAuthStateChanged");
      unsubscribe();
    };
  }, []);

  const signup = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const value = { user, setUser, loading, signup, login, logout };

  logDebug("AuthContext: Renderizando, user:", user, "loading:", loading);
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};