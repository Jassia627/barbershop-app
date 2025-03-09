// src/modules/appointments/services/appointmentService.js
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';

export const fetchBarbers = async (shopId) => {
  const q = query(
    collection(db, "users"),
    where("shopId", "==", shopId),
    where("role", "==", "barber"),
    where("status", "==", "active")
  );
  const snapshot = await getDocs(q);
  const barbers = snapshot.docs.map(doc => {
    const data = doc.data();
    console.log("fetchBarbers: Datos del barbero:", { id: doc.id, ...data }); // Log para depurar
    return { id: doc.id, ...data };
  });
  return barbers;
};

export const fetchSchedules = async (barberId) => {
  const q = query(
    collection(db, "schedules"),
    where("barberId", "==", barberId),
    where("active", "==", true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fetchTakenSlots = async (barberId, date) => {
  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);
  const q = query(
    collection(db, "appointments"),
    where("barberId", "==", barberId),
    where("date", ">=", Timestamp.fromDate(new Date(startOfDay))),
    where("date", "<=", Timestamp.fromDate(new Date(endOfDay))),
    where("status", "in", ["pending", "confirmed"])
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().time);
};

export const fetchAppointments = async (shopId, barberId = null) => {
  const constraints = [
    where("shopId", "==", shopId),
    where("status", "in", ["pending", "confirmed"])
  ];
  if (barberId) constraints.push(where("barberId", "==", barberId));
  
  const q = query(collection(db, "appointments"), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createAppointment = async (appointmentData) => {
  const { date, ...rest } = appointmentData;
  return await addDoc(collection(db, "appointments"), {
    ...rest,
    date: Timestamp.fromDate(date),
    createdAt: Timestamp.now(),
    status: 'pending'
  });
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  await updateDoc(doc(db, "appointments", appointmentId), { status });
};

export const saveSchedule = async (scheduleData) => {
  const { id, ...data } = scheduleData;
  if (id) {
    await updateDoc(doc(db, "schedules", id), { ...data, updatedAt: Timestamp.now(), daysOff: data.daysOff || [] });
    return { id, ...data };
  } else {
    const docRef = await addDoc(collection(db, "schedules"), {
      ...data,
      createdAt: Timestamp.now(),
      active: true,
      daysOff: data.daysOff || []
    });
    return { id: docRef.id, ...data };
  }
};