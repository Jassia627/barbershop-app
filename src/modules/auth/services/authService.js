import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/core/firebase/config'; // Usando alias

export const login = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const signup = async (email, password) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
  await signOut(auth);
};