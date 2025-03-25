// src/modules/inventory/pages/Inventory.jsx
import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import StockAlert from '../components/StockAlert';
import { ArrowLeft, AlertTriangle, ShieldAlert, ShoppingBag, Package, Search, Plus, Filter } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth';
import { logDebug, logError } from '../../../core/utils/logger';

const Inventory = () => {
  const { products, loading, error, saveProduct } = useInventory();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: 0, stock: 0, minStock: 0 });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const success = await saveProduct(formData, selectedProduct?.id);
    if (success) {
      setFormData({ name: '', price: 0, stock: 0, minStock: 0 });
      setSelectedProduct(null);
    }
    setSaving(false);
  };

  const handleEdit = (product) => {
    setFormData(product);
    setSelectedProduct(product);
  };

  // Filtrar productos
  const filteredProducts = products
    ? products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLowStock = filterLowStock ? product.stock <= product.minStock : true;
        return matchesSearch && matchesLowStock;
      })
    : [];

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;

  // Renderizar mensaje de error si hay un problema de permisos
  if (error && error.code === 'permission-denied') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Inventario</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Error de permisos</h2>
              <p className="text-red-600 dark:text-red-400 mb-4">
                No tienes permisos suficientes para acceder al inventario.
              </p>
              <div className="bg-white dark:bg-gray-800 p-4 rounded border border-red-100 dark:border-red-900 mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Información de usuario:</p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li><strong>Email:</strong> {user?.email || 'No disponible'}</li>
                  <li><strong>Rol:</strong> {user?.role || 'No disponible'}</li>
                  <li><strong>ID de tienda:</strong> {user?.shopId || 'No disponible'}</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Contacta con el administrador del sistema para solicitar los permisos necesarios.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar mensaje de error genérico si hay otro tipo de error
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Inventario</h1>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-10 w-10 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Error al cargar el inventario</h2>
              <p className="text-yellow-600 dark:text-yellow-400 mb-2">
                Se ha producido un error al intentar cargar los datos del inventario.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Por favor, intenta recargar la página o contacta con soporte si el problema persiste.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado con navegación */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Gestión de Inventario
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {user?.shopName}
            </p>
          </div>
        </div>
        <Link 
          to="/admin/sales" 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 shadow-md"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="font-medium">Vender Productos</span>
        </Link>
      </div>
      
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl">
              <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{products?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-xl">
              <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Stock Bajo</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {products?.filter(p => p.stock <= p.minStock).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl">
              <ShoppingBag className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Valor Inventario</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${products?.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulario de producto */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              {selectedProduct ? 'Editar Producto' : 'Agregar Producto'}
            </h2>
            <ProductForm formData={formData} setFormData={setFormData} onSubmit={handleSubmit} saving={saving} />
          </div>
        </div>
        
        {/* Lista de productos */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Productos
            </h2>
            
            {/* Búsqueda y filtros */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700/50 transition-all duration-200"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              
              <div className="flex items-center">
                <button
                  onClick={() => setFilterLowStock(!filterLowStock)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    filterLowStock 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  {filterLowStock ? 'Mostrar todos' : 'Solo stock bajo'}
                </button>
              </div>
            </div>
            
            {/* Lista de productos */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div key={product.id} className="transition-all duration-200 hover:translate-x-1">
                    <ProductCard product={product} onSelect={handleEdit} />
                    <StockAlert product={product} />
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || filterLowStock 
                      ? 'No se encontraron productos con los filtros actuales' 
                      : 'No hay productos en el inventario'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;