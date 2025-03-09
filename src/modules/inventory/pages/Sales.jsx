import React, { useState } from 'react';
import { useSales } from '../hooks/useSales';
import { useInventory } from '../hooks/useInventory';
import SaleForm from '../components/SaleForm';
import SaleCard from '../components/SaleCard';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Sales = () => {
  const { sales, loading: loadingSales, stats, registerSale, cancelSale } = useSales();
  const { products, loading: loadingProducts } = useInventory();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('register'); // 'register' o 'history'
  
  const handleSubmit = async (saleData) => {
    setSaving(true);
    const success = await registerSale(saleData);
    if (success) {
      setActiveTab('history'); // Cambiar a la pestaña de historial después de una venta exitosa
    }
    setSaving(false);
  };
  
  const handleCancelSale = async (saleId) => {
    if (window.confirm('¿Estás seguro de que deseas cancelar esta venta? Esta acción restaurará el inventario.')) {
      await cancelSale(saleId);
    }
  };
  
  const loading = loadingSales || loadingProducts;
  
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Ventas</h1>
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
            <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Ventas</p>
            <p className="text-xl font-bold">{stats.totalSales}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos Totales</p>
            <p className="text-xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center gap-4">
          <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
            <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ventas Hoy</p>
            <p className="text-xl font-bold">{stats.todaySales}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center gap-4">
          <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
            <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos Hoy</p>
            <p className="text-xl font-bold">${stats.todayRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      {/* Pestañas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'register'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('register')}
          >
            Registrar Venta
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'history'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('history')}
          >
            Historial de Ventas
          </button>
        </div>
        
        <div className="p-4">
          {activeTab === 'register' ? (
            <SaleForm products={products} onSubmit={handleSubmit} saving={saving} />
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Historial de Ventas</h2>
              
              {sales.length > 0 ? (
                <div className="space-y-4">
                  {sales.map(sale => (
                    <SaleCard key={sale.id} sale={sale} onCancel={handleCancelSale} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No hay ventas registradas</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sales; 