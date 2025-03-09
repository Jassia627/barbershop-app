// src/modules/barbers/services/barberService.js
import { collection, query, where, getDocs, addDoc, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser, getAuth } from 'firebase/auth';
import { auth, db } from '../../../core/firebase/config';

export const fetchBarbers = async (shopId) => {
  const q = query(
    collection(db, "users"),
    where("shopId", "==", shopId),
    where("role", "==", "barber")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addBarber = async (barberData, shopId) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, barberData.email, barberData.password);
    const user = userCredential.user;

    const barberDoc = {
      uid: user.uid,
      shopId,
      role: 'barber',
      name: barberData.name,
      email: barberData.email,
      phone: barberData.phone || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, "users", user.uid), barberDoc);

    return { id: user.uid, ...barberDoc };
  } catch (error) {
    console.error("Error al crear barbero:", error);
    throw error;
  }
};

export const updateBarber = async (barberId, barberData) => {
  try {
    await updateDoc(doc(db, "users", barberId), barberData);
    return { id: barberId, ...barberData };
  } catch (error) {
    console.error("Error al actualizar barbero:", error);
    throw error;
  }
};

export const updateBarberStatus = async (barberId, status) => {
  await updateDoc(doc(db, "users", barberId), { status });
};

export const deleteBarber = async (barberId) => {
  try {
    // Eliminar el documento del usuario
    await deleteDoc(doc(db, "users", barberId));
    return true;
  } catch (error) {
    console.error("Error al eliminar barbero:", error);
    throw error;
  }
};