// src/modules/services/services/serviceService.js
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';
import { logDebug, logError } from '../../../core/utils/logger';

export const fetchServices = async (shopId) => {
  const q = query(
    collection(db, "services"),
    where("shopId", "==", shopId),
    where("active", "==", true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createService = async (serviceData) => {
  return await addDoc(collection(db, "services"), serviceData);
};

export const updateService = async (serviceId, serviceData) => {
  await updateDoc(doc(db, "services", serviceId), serviceData);
};

export const deleteService = async (serviceId) => {
  await deleteDoc(doc(db, "services", serviceId));
};

export const fetchPendingHaircuts = async (shopId, barberId = null) => {
  // Crear la consulta base
  let queryConstraints = [
    where("shopId", "==", shopId),
    where("status", "==", "pending")
  ];
  
  // Si se proporciona un barberId, añadir la restricción
  if (barberId) {
    logDebug("Filtrando cortes pendientes por barberId:", barberId);
    queryConstraints.push(where("barberId", "==", barberId));
  }
  
  const q = query(
    collection(db, "haircuts"),
    ...queryConstraints
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateHaircutStatus = async (haircutId, status) => {
  await updateDoc(doc(db, "haircuts", haircutId), { status });
};

export const fetchAllHaircuts = async (shopId, barberId = null) => {
  try {
    logDebug("Obteniendo cortes para shopId:", shopId, barberId ? `y barberId: ${barberId}` : "");
    
    // Crear la consulta base
    let queryConstraints = [
      where("shopId", "==", shopId),
      where("status", "==", "confirmed")
    ];
    
    // Si se proporciona un barberId, añadir la restricción
    if (barberId) {
      logDebug("Filtrando cortes confirmados por barberId:", barberId);
      queryConstraints.push(where("barberId", "==", barberId));
    }
    
    const q = query(
      collection(db, "haircuts"),
      ...queryConstraints
    );
    
    const snapshot = await getDocs(q);
    logDebug("Cortes encontrados:", snapshot.size);
    
    if (snapshot.empty) {
      return [];
    }
    
    // Convertimos los documentos a objetos y aseguramos que createdAt sea una cadena ISO
    const haircuts = snapshot.docs.map(doc => {
      const data = doc.data();
      // Aseguramos que createdAt sea una cadena ISO
      let createdAt = data.createdAt;
      if (createdAt instanceof Timestamp) {
        createdAt = createdAt.toDate().toISOString();
      } else if (createdAt && typeof createdAt === 'object' && createdAt.seconds) {
        // Manejar el caso de objetos Firestore no convertidos
        createdAt = new Date(createdAt.seconds * 1000).toISOString();
      }
      
      return { 
        id: doc.id, 
        ...data,
        createdAt
      };
    });
    
    // Ordenamos por fecha de creación (más reciente primero)
    return haircuts.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    logError("Error al obtener cortes");
    return [];
  }
};

export const fetchBarbers = async (shopId) => {
  try {
    logDebug("Obteniendo barberos para shopId:", shopId);
    const q = query(
      collection(db, "users"),
      where("shopId", "==", shopId)
    );
    const snapshot = await getDocs(q);
    logDebug("Barberos encontrados:", snapshot.size);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logError("Error al obtener barberos");
    return [];
  }
};