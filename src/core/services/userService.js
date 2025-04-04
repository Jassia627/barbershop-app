import { db, auth } from '../../firebase/config';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { logDebug, logError } from '../utils/logger';

/**
 * Guarda el token FCM del usuario
 * @param {string} token - Token de FCM para notificaciones push
 * @returns {Promise<boolean>} - True si se guardó correctamente
 */
export const saveUserToken = async (token) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      logError('No hay usuario autenticado para guardar token');
      return false;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      logError('El documento del usuario no existe');
      return false;
    }

    const userData = userSnap.data();
    // Crear array de tokens si no existe
    const tokens = userData.fcmTokens || [];
    // Verificar si el token ya existe
    if (!tokens.includes(token)) {
      tokens.push(token);
      
      // Actualizar documento
      await setDoc(userRef, {
        ...userData,
        fcmTokens: tokens,
        lastTokenUpdate: new Date()
      }, { merge: true });
      
      logDebug(`Token FCM guardado correctamente para usuario ${user.uid}`);
      return true;
    } else {
      logDebug('El token ya existía para este usuario');
      return true; // Ya estaba registrado, consideramos éxito
    }
  } catch (error) {
    logError('Error al guardar token FCM:', error);
    return false;
  }
};

/**
 * Obtiene todos los tokens de usuarios con un rol específico en una tienda
 * @param {string} shopId - ID de la tienda
 * @param {string} role - Rol del usuario (admin, barber)
 * @returns {Promise<string[]>} - Array de tokens
 */
export const getUserTokens = async (shopId, role = 'admin') => {
  try {
    if (!shopId) {
      logError('No se proporcionó ID de tienda para obtener tokens');
      return [];
    }

    // Consultar usuarios de esta tienda con el rol especificado
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("shopId", "==", shopId),
      where("role", "==", role)
    );

    const querySnapshot = await getDocs(q);
    let allTokens = [];

    // Recopilar todos los tokens
    querySnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
        allTokens = [...allTokens, ...userData.fcmTokens];
      }
    });

    // Eliminar duplicados
    const uniqueTokens = [...new Set(allTokens)];
    logDebug(`Se encontraron ${uniqueTokens.length} tokens para usuarios ${role} de la tienda ${shopId}`);
    
    return uniqueTokens;
  } catch (error) {
    logError('Error al obtener tokens de usuarios:', error);
    return [];
  }
};

/**
 * Elimina un token FCM del usuario
 * @param {string} token - Token a eliminar
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
export const removeUserToken = async (token) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      logError('No hay usuario autenticado para eliminar token');
      return false;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return false;
    }

    const userData = userSnap.data();
    const tokens = userData.fcmTokens || [];
    
    // Filtrar el token a eliminar
    const updatedTokens = tokens.filter(t => t !== token);
    
    // Si no hay cambios, no actualizamos
    if (tokens.length === updatedTokens.length) {
      return true;
    }
    
    // Actualizar documento
    await setDoc(userRef, {
      ...userData,
      fcmTokens: updatedTokens,
      lastTokenUpdate: new Date()
    }, { merge: true });
    
    logDebug(`Token FCM eliminado correctamente para usuario ${user.uid}`);
    return true;
  } catch (error) {
    logError('Error al eliminar token FCM:', error);
    return false;
  }
}; 