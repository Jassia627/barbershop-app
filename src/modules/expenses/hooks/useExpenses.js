// src/modules/expenses/hooks/useExpenses.js
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth';
import { fetchExpenses, createExpense } from '../services/expenseService';
import { toast } from 'react-hot-toast';

export const useExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExpenses = async () => {
      if (!user || !user.shopId) {
        console.error("Usuario o shopId no disponible");
        setLoading(false);
        return;
      }
      
      try {
        const expenseData = await fetchExpenses(user.shopId);
        setExpenses(expenseData);
      } catch (error) {
        console.error("Error al cargar gastos:", error);
        toast.error("Error al cargar gastos");
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadExpenses();
  }, [user]);

  const saveExpense = async (expenseData) => {
    if (!user || !user.shopId) {
      toast.error("No se puede guardar el gasto: usuario no autenticado");
      return false;
    }
    
    try {
      const data = {
        ...expenseData,
        shopId: user.shopId,
        createdAt: new Date().toISOString()
      };
      const docRef = await createExpense(data);
      setExpenses(prev => [...prev, { id: docRef.id, ...data }]);
      toast.success("Gasto registrado con éxito");
      return true;
    } catch (error) {
      console.error("Error al registrar gasto:", error);
      toast.error("Error al registrar gasto");
      return false;
    }
  };

  return { expenses, loading, saveExpense };
};