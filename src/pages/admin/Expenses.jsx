// src\pages\admin\Expenses.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-hot-toast';
import { 
  Calculator,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  AlertCircle,
  CalendarClock,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { CurrencyInput } from '../../components/common/MoneyInput';
import formatMoney from '../../utils/format';

const Expenses = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({
    totalMonthly: 0,
    totalUnexpected: 0,
    monthlyCount: 0,
    unexpectedCount: 0
  });

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'monthly', // 'monthly' o 'unexpected'
    category: 'utilities',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    { id: 'utilities', name: 'Servicios', icon: '💡' },
    { id: 'rent', name: 'Alquiler', icon: '🏠' },
    { id: 'salary', name: 'Salarios', icon: '💰' },
    { id: 'supplies', name: 'Suministros', icon: '📦' },
    { id: 'marketing', name: 'Marketing', icon: '📢' },
    { id: 'maintenance', name: 'Mantenimiento', icon: '🔧' },
    { id: 'unexpected', name: 'Imprevisto', icon: '⚠️' },
    { id: 'other', name: 'Otros', icon: '📝' }
  ];

  useEffect(() => {
    if (user?.shopId) {
      fetchExpenses();
    }
  }, [user?.shopId]);

  const fetchExpenses = async () => {
    try {
      const q = query(
        collection(db, "expenses"),
        where("shopId", "==", user.shopId)
      );
      
      const querySnapshot = await getDocs(q);
      const expensesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calcular estadísticas
      const monthlyExpenses = expensesData.filter(exp => exp.type === 'monthly');
      const unexpectedExpenses = expensesData.filter(exp => exp.type === 'unexpected');

      setStats({
        totalMonthly: monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        totalUnexpected: unexpectedExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        monthlyCount: monthlyExpenses.length,
        unexpectedCount: unexpectedExpenses.length
      });

      setExpenses(expensesData.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Error al cargar los gastos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim() || !formData.amount) {
      toast.error("Por favor complete todos los campos requeridos");
      return;
    }

    try {
      const expenseData = {
        description: formData.description.trim(),
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category,
        date: formData.date,
        shopId: user.shopId,
        shopName: user.shopName,
        createdBy: user.uid,
        createdByName: user.name,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "expenses"), expenseData);
      toast.success("Gasto registrado exitosamente");
      
      setFormData({
        description: '',
        amount: '',
        type: 'monthly',
        category: 'utilities',
        date: new Date().toISOString().split('T')[0]
      });
      
      setIsModalOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Error al guardar el gasto");
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('¿Estás seguro de eliminar este gasto?')) return;

    try {
      await deleteDoc(doc(db, "expenses", expenseId));
      toast.success("Gasto eliminado exitosamente");
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Error al eliminar el gasto");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Gastos</h1>
          <p className="text-gray-600">{user?.shopName}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuevo Gasto
        </button>
      </div>

      {/* Dashboard de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 text-sm">Gastos Mensuales</h3>
            <CalendarClock className="text-blue-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(stats.totalMonthly)}</p>
          <p className="text-sm text-gray-500">{stats.monthlyCount} gastos</p>
        </div>
        


        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 text-sm">Gastos Inesperados</h3>
            <AlertCircle className="text-orange-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(stats.totalUnexpected)}</p>
          <p className="text-sm text-gray-500">{formatMoney(stats.totalUnexpected)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 text-sm">Total Gastos</h3>
            <ArrowUpCircle className="text-red-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatMoney(stats.totalMonthly + stats.totalUnexpected)}
          </p>
          <p className="text-sm text-gray-500">{stats.monthlyCount + stats.unexpectedCount} gastos</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 text-sm">Promedio Mensual</h3>
            <Calculator className="text-green-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatMoney(stats.totalMonthly / (stats.monthlyCount || 1))}
          </p>
          <p className="text-sm text-gray-500">por gasto mensual</p>
        </div>
      </div>

      {/* Lista de Gastos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tabla para pantallas medianas y grandes */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Descripción
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Categoría
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Monto
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-300">
                  {expense.description}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {expense.createdByName}
                </div>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="mr-2 text-gray-500 dark:text-gray-400">
                    {categories.find(c => c.id === expense.category)?.icon}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-300">
                    {categories.find(c => c.id === expense.category)?.name}
                  </span>
                </div>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  expense.type === 'monthly'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                }`}>
                  {expense.type === 'monthly' ? 'Mensual' : 'Inesperado'}
                </span>
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                {new Date(expense.date).toLocaleDateString()}
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                {formatMoney(expense.amount)}
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-150"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
          {expenses.length === 0 && (
            <tr>
              <td colSpan="6" className="px-4 sm:px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                No hay gastos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

      {/* Vista mejorada de tarjetas para móviles */}
      <div className="md:hidden space-y-4 p-4">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            {/* Encabezado con monto y tipo */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">
                  ${expense.amount.toFixed(2)}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  expense.type === 'monthly' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {expense.type === 'monthly' ? 'Mensual' : 'Inesperado'}
                </span>
              </div>
            </div>

            {/* Cuerpo de la tarjeta */}
            <div className="p-4 space-y-3">
              {/* Descripción */}
              <div className="text-base font-medium text-gray-900">
                {expense.description}
              </div>

              {/* Categoría */}
              <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-md p-2">
                <span className="mr-2">
                  {categories.find(c => c.id === expense.category)?.icon}
                </span>
                <span>
                  {categories.find(c => c.id === expense.category)?.name}
                </span>
              </div>

              {/* Información adicional */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center text-sm text-gray-500">
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar size={16} className="mr-1" />
                  <span>{new Date(expense.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Pie de tarjeta con acción de eliminar */}
            <div className="px-4 py-3 bg-gray-50 text-right border-t border-gray-100">
              <button
                onClick={() => handleDelete(expense.id)}
                className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
              >
                <Trash2 size={16} className="mr-1" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        ))}
        
        {expenses.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500">No hay gastos registrados.</p>
          </div>
        )}
      </div>
    </div>

      {/* Modal de Nuevo Gasto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Registrar Nuevo Gasto
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-[#2c1810] mb-4 text-center border-b border-[#d4c3b5] pb-2">
                  Descripción *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm  text-[#2c1810] mb-4 text-center border-b border-[#d4c3b5] pb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm  text-[#2c1810] mb-4 text-center border-b border-[#d4c3b5] pb-2">
                  Tipo de Gasto *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    
                    <input
                      type="radio"
                      name="type"
                      value="monthly"
                      checked={formData.type === 'monthly'}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm text-[#2c1810]">Mensual</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="unexpected"
                      checked={formData.type === 'unexpected'}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm text-[#2c1810]">Inesperado</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c1810] mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c1810] mb-1">
                  Monto ($) *
                </label>
                <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-[#8b7355]">$</span>
 
                  <CurrencyInput
                  value={formData.amount}
                  onValueChange={(value) => setFormData({...formData, amount: value})}
                  className="w-full px-3 py-2 border border-[#d4c3b5] rounded focus:ring-1 focus:ring-[#6b4423] bg-[#f8f5f0]0 pl-8"
                  required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Agregar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;