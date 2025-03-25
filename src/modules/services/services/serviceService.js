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
  let queryConstraints = [
    where("shopId", "==", shopId),
    where("status", "==", "pending")
  ];
  
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

export const fetchAllHaircuts = async (shopId, barberId = null) => {
  try {
    logDebug("Obteniendo cortes para shopId:", shopId, barberId ? `y barberId: ${barberId}` : "");
    
    let queryConstraints = [
      where("shopId", "==", shopId),
      where("status", "==", "confirmed")
    ];
    
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
    
    const haircuts = snapshot.docs.map(doc => {
      const data = doc.data();
      let createdAt = data.createdAt;
      if (createdAt instanceof Timestamp) {
        createdAt = createdAt.toDate().toISOString();
      } else if (createdAt && typeof createdAt === 'object' && createdAt.seconds) {
        createdAt = new Date(createdAt.seconds * 1000).toISOString();
      }
      
      return { 
        id: doc.id, 
        ...data,
        createdAt
      };
    });
    
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

export const fetchHaircuts = async (filters = {}) => {
  try {
    const { 
      shopId, 
      barberId, 
      status, 
      startDate, 
      endDate, 
      searchTerm,
      limit = 100
    } = filters;

    let constraints = [];

    if (shopId) constraints.push(where("shopId", "==", shopId));
    if (barberId) constraints.push(where("barberId", "==", barberId));
    if (status) constraints.push(where("status", "==", status));

    if (startDate) {
      constraints.push(where("createdAt", ">=", startDate));
    }
    if (endDate) {
      constraints.push(where("createdAt", "<=", endDate));
    }

    constraints.push(orderBy("createdAt", "desc"));

    const q = query(collection(db, "haircuts"), ...constraints);
    const snapshot = await getDocs(q);
    
    let haircuts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt instanceof Timestamp 
        ? doc.data().createdAt.toDate() 
        : new Date(doc.data().createdAt)
    }));

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      haircuts = haircuts.filter(haircut => 
        haircut.clientName?.toLowerCase().includes(term) ||
        haircut.serviceName?.toLowerCase().includes(term) ||
        haircut.barberName?.toLowerCase().includes(term)
      );
    }

    logDebug("Cortes obtenidos:", haircuts.length);
    return haircuts;
  } catch (error) {
    logError("Error al obtener cortes:", error);
    throw error;
  }
};

export const saveHaircut = async (haircutData) => {
  try {
    const docRef = await addDoc(collection(db, "haircuts"), {
      ...haircutData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    logDebug("Corte guardado con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    logError("Error al guardar corte:", error);
    throw error;
  }
};

export const updateHaircutStatus = async (haircutId, status, additionalData = {}) => {
  try {
    await updateDoc(doc(db, "haircuts", haircutId), {
      status,
      updatedAt: new Date().toISOString(),
      ...additionalData
    });
    logDebug("Estado del corte actualizado:", haircutId, status);
    return true;
  } catch (error) {
    logError("Error al actualizar estado del corte:", error);
    throw error;
  }
};

export const getHaircutStats = async (shopId, filters = {}) => {
  try {
    const haircuts = await fetchHaircuts({ shopId, ...filters });
    
    const stats = {
      total: haircuts.length,
      pending: haircuts.filter(h => h.status === 'pending').length,
      completed: haircuts.filter(h => h.status === 'completed').length,
      pendingReview: haircuts.filter(h => h.status === 'pending_review').length,
      finished: haircuts.filter(h => h.status === 'finished').length,
      totalEarnings: haircuts.reduce((sum, h) => sum + (h.price || 0), 0),
      topBarbers: [],
      topServices: []
    };

    const barberStats = {};
    haircuts.forEach(h => {
      if (!barberStats[h.barberId]) {
        barberStats[h.barberId] = {
          barberId: h.barberId,
          barberName: h.barberName,
          count: 0,
          earnings: 0
        };
      }
      barberStats[h.barberId].count++;
      barberStats[h.barberId].earnings += h.price || 0;
    });
    stats.topBarbers = Object.values(barberStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const serviceStats = {};
    haircuts.forEach(h => {
      if (!serviceStats[h.serviceId]) {
        serviceStats[h.serviceId] = {
          serviceId: h.serviceId,
          serviceName: h.serviceName,
          count: 0,
          earnings: 0
        };
      }
      serviceStats[h.serviceId].count++;
      serviceStats[h.serviceId].earnings += h.price || 0;
    });
    stats.topServices = Object.values(serviceStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    logDebug("Estadísticas calculadas:", stats);
    return stats;
  } catch (error) {
    logError("Error al obtener estadísticas:", error);
    throw error;
  }
};