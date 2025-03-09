// src/modules/expenses/services/expenseService.js
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';

export const fetchExpenses = async (shopId) => {
  const q = query(collection(db, "expenses"), where("shopId", "==", shopId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createExpense = async (expenseData) => {
  return await addDoc(collection(db, "expenses"), expenseData);
};