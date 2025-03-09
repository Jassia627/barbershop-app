// src/modules/expenses/pages/Expenses.jsx
import React, { useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseForm from '../components/ExpenseForm';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Search,
  Filter,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Expenses = () => {
  const { expenses, loading, saveExpense } = useExpenses();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ description: '', amount: 0 });
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const success = await saveExpense(formData);
    if (success) {
      setFormData({ description: '', amount: 0 });
      setIsModalOpen(false);
    }
    setSaving(false);
  };

  const filteredExpenses = expenses?.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesDate = true;

    if (dateFilter !== 'all') {
      const expenseDate = new Date(expense.createdAt);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = expenseDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.setDate(today.getDate() - 7));
          matchesDate = expenseDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
          matchesDate = expenseDate >= monthAgo;
          break;
        default:
          break;
      }
    }

    return matchesSearch && matchesDate;
  });

  const totalExpenses = filteredExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-blue-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-900 dark:text-white" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              Gestión de Gastos
            </h1>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Registrar Gasto</span>
          </button>
        </div>

        {/* Tarjeta de resumen */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Gastos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-auto md:flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar gastos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === 'all' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === 'today' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setDateFilter('week')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === 'week' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setDateFilter('month')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === 'month' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Mes
                </button>
              </div>
              
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('all');
                }}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title="Limpiar filtros"
              >
                <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Lista de gastos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span>Gastos Registrados</span>
            <span className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {filteredExpenses?.length || 0}
            </span>
          </h2>

          <div className="space-y-4">
            {filteredExpenses && filteredExpenses.length > 0 ? (
              filteredExpenses.map(expense => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/20 rounded-xl">
                <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No hay gastos registrados</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Comienza registrando un nuevo gasto usando el botón "Registrar Gasto"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para registrar gasto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-500" />
                Registrar Nuevo Gasto
              </h2>
              <ExpenseForm 
                formData={formData} 
                setFormData={setFormData} 
                onSubmit={handleSubmit} 
                saving={saving}
                onCancel={() => {
                  setIsModalOpen(false);
                  setFormData({ description: '', amount: 0 });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;