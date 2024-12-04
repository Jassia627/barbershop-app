import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiPackage, 
  FiDollarSign, 
  FiAlertCircle,
  FiTrendingUp 
} from 'react-icons/fi';

const categories = [
  { id: 'drinks', name: 'Bebidas', icon: '🥤' },
  { id: 'snacks', name: 'Snacks', icon: '🍿' },
  { id: 'products', name: 'Productos de Barbería', icon: '✂' },
  { id: 'accessories', name: 'Accesorios', icon: '🎽' },
  { id: 'cleaning', name: 'Limpieza', icon: '🧹' },
  { id: 'others', name: 'Otros', icon: '📦' }
];

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'drinks',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    provider: '',
    description: ''
  });

  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    monthSales: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    monthEarnings: 0,
    allTimeTotal: 0,
    todayTotal: 0,
    monthTotal: 0,
    topProducts: []
  });

  useEffect(() => {
    if (user?.shopId) {
      fetchProducts();
      fetchStats();
    }
  }, [user?.shopId]);

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, "inventory"), where("shopId", "==", user.shopId));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user?.shopId) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const salesRef = collection(db, "sales");
      const q = query(salesRef, where("shopId", "==", user.shopId));
      const querySnapshot = await getDocs(q);
      
      const sales = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: new Date(doc.data().createdAt)
      }));

      const todaySales = sales.filter(sale => sale.createdAt >= today);
      const monthSales = sales.filter(sale => sale.createdAt >= firstDayOfMonth);

      // Calcular ventas (ingresos totales)
      const todayTotal = todaySales.reduce((sum, sale) => sum + sale.price, 0);
      const monthTotal = monthSales.reduce((sum, sale) => sum + sale.price, 0);
      const allTimeTotal = sales.reduce((sum, sale) => sum + sale.price, 0);

      // Calcular ganancias netas
      const todayEarnings = todaySales.reduce((sum, sale) => sum + sale.profit, 0);
      const monthEarnings = monthSales.reduce((sum, sale) => sum + sale.profit, 0);
      const totalEarnings = sales.reduce((sum, sale) => sum + sale.profit, 0);

      // Calcular productos más vendidos
      const productSales = {};
      sales.forEach(sale => {
        if (!productSales[sale.productId]) {
          productSales[sale.productId] = {
            name: sale.productName,
            quantity: 0,
            earnings: 0,
            total: 0
          };
        }
        productSales[sale.productId].quantity += sale.quantity;
        productSales[sale.productId].earnings += sale.profit;
        productSales[sale.productId].total += sale.price;
      });

      const topProducts = Object.entries(productSales)
        .map(([id, data]) => ({
          id,
          ...data
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setStats({
        todaySales: todaySales.length,
        monthSales: monthSales.length,
        totalSales: sales.length,
        todayEarnings,
        monthEarnings,
        totalEarnings,
        todayTotal,
        monthTotal,
        allTimeTotal,
        topProducts
      });

    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return false;
    }
    if (!formData.cost || formData.cost <= 0) {
      toast.error("El costo debe ser mayor a 0");
      return false;
    }
    if (Number(formData.price) <= Number(formData.cost)) {
      toast.error("El precio de venta debe ser mayor al costo");
      return false;
    }
    if (!formData.stock || formData.stock < 0) {
      toast.error("El stock no puede ser negativo");
      return false;
    }
    if (!formData.minStock || formData.minStock < 0) {
      toast.error("El stock mínimo no puede ser negativo");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
        cost: Number(formData.cost),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        provider: formData.provider.trim(),
        description: formData.description.trim(),
        shopId: user.shopId,
        shopName: user.shopName,
        profitMargin: ((formData.price - formData.cost) / formData.price * 100).toFixed(2),
        updatedAt: new Date().toISOString()
      };

      if (selectedProduct) {
        await updateDoc(doc(db, "inventory", selectedProduct.id), productData);
        toast.success("Producto actualizado exitosamente");
      } else {
        productData.createdAt = new Date().toISOString();
        await addDoc(collection(db, "inventory"), productData);
        toast.success("Producto agregado exitosamente");
      }

      setFormData({
        name: '',
        category: 'drinks',
        price: '',
        cost: '',
        stock: '',
        minStock: '',
        provider: '',
        description: ''
      });
      setSelectedProduct(null);
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Error al guardar el producto");
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      cost: product.cost?.toString() || '',
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      provider: product.provider || '',
      description: product.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await deleteDoc(doc(db, "inventory", productId));
      toast.success("Producto eliminado exitosamente");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar el producto");
    }
  };

  const handleSell = async (product, quantity) => {
    if (quantity > product.stock) {
      toast.error('No hay suficiente stock disponible');
      return;
    }

    try {
      const productRef = doc(db, "inventory", product.id);
      await updateDoc(productRef, {
        stock: product.stock - quantity,
        updatedAt: new Date().toISOString()
      });

      const saleData = {
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        cost: product.cost * quantity,
        price: product.price * quantity,
        profit: (product.price - product.cost) * quantity,
        shopId: user.shopId,
        shopName: user.shopName,
        soldBy: user.uid,
        soldByName: user.name,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "sales"), saleData);

      toast.success('Venta realizada con éxito');
      setIsSellModalOpen(false);
      setSellQuantity(1);
      fetchProducts();
      fetchStats();
    } catch (error) {
      console.error("Error al procesar la venta:", error);
      toast.error('Error al procesar la venta');
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'all' || product.category === selectedCategory)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">{user?.shopName}</p>
        </div>
        {/* Botón de nuevo producto con estilo vintage */}
<button
 onClick={() => {
   setSelectedProduct(null);
   setFormData({
     name: '',
     category: 'drinks',
     price: '',
     cost: '',
     stock: '',
     minStock: '',
     provider: '',
     description: ''
   });
   setIsModalOpen(true);
 }}
 className="mt-4 sm:mt-0 bg-white border-2 border-[#d4c3b5] text-[#2c1810] px-6 py-3 rounded-lg 
   hover:bg-[#f8f5f0] transition-all duration-300 flex items-center space-x-2 shadow-md 
   hover:shadow-lg font-serif group"
>
 <span className="bg-[#3c7a3d] text-white p-1 rounded-full group-hover:rotate-90 transition-transform duration-300">
   <FiPlus className="text-lg" />
 </span>
 <span className="text-[#2c1810] group-hover:text-[#6b4423]">Agregar Producto</span>
</button>
      </div>

      {/* Dashboard Vintage */}
<div className="mb-6 bg-[#f8f5f0] p-4 rounded-lg">
 {/* Grid compacto de estadísticas */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
   {/* Ventas Hoy */}
   <div className="bg-white border border-[#d4c3b5] rounded-lg p-3 shadow hover:shadow-md transition-shadow">
     <div className="flex flex-col">
       <p className="text-[#2c1810] text-xs font-serif">Ventas Hoy</p>
       <p className="text-xl font-bold text-[#6b4423]">${stats.todayTotal?.toFixed(2)}</p>
       <p className="text-xs text-[#8b7355]">{stats.todaySales} ventas</p>
     </div>
   </div>

   {/* Ventas Mes */}
   <div className="bg-white border border-[#d4c3b5] rounded-lg p-3 shadow hover:shadow-md transition-shadow">
     <div className="flex flex-col">
       <p className="text-[#2c1810] text-xs font-serif">Ventas Mes</p>
       <p className="text-xl font-bold text-[#6b4423]">${stats.monthTotal?.toFixed(2)}</p>
       <p className="text-xs text-[#8b7355]">{stats.monthSales} ventas</p>
     </div>
   </div>

   {/* Ganancias Hoy */}
   <div className="bg-white border border-[#d4c3b5] rounded-lg p-3 shadow hover:shadow-md transition-shadow">
     <div className="flex flex-col">
       <p className="text-[#2c1810] text-xs font-serif">Ganancias Hoy</p>
       <p className="text-xl font-bold text-[#3c7a3d]">${stats.todayEarnings?.toFixed(2)}</p>
     </div>
   </div>

   {/* Ganancias Mes */}
   <div className="bg-white border border-[#d4c3b5] rounded-lg p-3 shadow hover:shadow-md transition-shadow">
     <div className="flex flex-col">
       <p className="text-[#2c1810] text-xs font-serif">Ganancias Mes</p>
       <p className="text-xl font-bold text-[#3c7a3d]">${stats.monthEarnings?.toFixed(2)}</p>
     </div>
   </div>
 </div>

 {/* Top Productos */}
 {stats.topProducts.length > 0 && (
   <div className="bg-white border border-[#d4c3b5] rounded-lg p-4 shadow mt-4">
     <h3 className="text-[#2c1810] text-sm font-serif mb-2">Top Productos</h3>
     <div className="space-y-2">
       {stats.topProducts.map((product, index) => (
         <div key={index} className="flex justify-between text-sm border-b border-[#d4c3b5] pb-2">
           <div>
             <p className="font-medium text-[#2c1810]">{product.name}</p>
             <p className="text-xs text-[#8b7355]">{product.quantity} vendidos</p>
           </div>
           <div className="text-right">
             <p className="text-[#6b4423]">${product.total?.toFixed(2)}</p>
             <p className="text-xs text-[#3c7a3d]">+${product.earnings?.toFixed(2)}</p>
           </div>
         </div>
       ))}
     </div>
   </div>
 )}
</div>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            placeholder="Buscar producto..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

{/* Lista de productos con estilo vintage */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {filteredProducts.length === 0 ? (
   <div className="col-span-full text-center text-[#8b7355] py-8 bg-white border border-[#d4c3b5] rounded-lg">
     No hay productos que coincidan con tu búsqueda.
   </div>
 ) : (
   filteredProducts.map((product) => (
     <div
       key={product.id}
       className="bg-white border border-[#d4c3b5] rounded-lg p-4 shadow hover:shadow-md transition-all"
     >
       <div className="flex justify-between items-start mb-2">
         <div>
           <h3 className="text-lg font-serif text-[#2c1810]">{product.name}</h3>
           <p className="text-[#8b7355] text-sm flex items-center">
             {categories.find(c => c.id === product.category)?.icon}{' '}
             {categories.find(c => c.id === product.category)?.name}
           </p>
         </div>
         <div className="text-right">
           <p className="text-lg font-bold text-[#6b4423]">
             ${product.price.toFixed(2)}
           </p>
           <p className="text-sm text-[#8b7355]">
             Costo: ${product.cost?.toFixed(2)}
           </p>
         </div>
       </div>

       <div className="space-y-1 mb-3 text-sm border-t border-[#d4c3b5] pt-2">
         <div className="flex justify-between text-[#2c1810]">
           <span>Stock:</span>
           <span className={`font-medium ${
             product.stock <= product.minStock ? 'text-red-500' : ''
           }`}>{product.stock}</span>
         </div>
         <div className="flex justify-between text-[#2c1810]">
           <span>Mínimo:</span>
           <span>{product.minStock}</span>
         </div>
         <div className="flex justify-between">
           <span className="text-[#2c1810]">Margen:</span>
           <span className="text-[#3c7a3d]">{product.profitMargin}%</span>
         </div>
       </div>

       {product.stock <= product.minStock && (
         <div className="text-red-500 text-sm flex items-center mb-3 bg-red-50 p-2 rounded border border-red-200">
           <FiAlertCircle className="mr-1" />
           Stock bajo
         </div>
       )}

       {product.provider && (
         <p className="text-sm text-[#8b7355] mb-3">
           Proveedor: {product.provider}
         </p>
       )}

       <div className="flex justify-between items-center border-t border-[#d4c3b5] pt-3">
         <div className="space-x-2">
           <button
             onClick={() => handleEdit(product)}
             className="p-1 text-[#6b4423] hover:text-[#2c1810]"
           >
             <FiEdit2 />
           </button>
           <button
             onClick={() => handleDelete(product.id)}
             className="p-1 text-red-600 hover:text-red-700"
           >
             <FiTrash2 />
           </button>
         </div>
         <button
           onClick={() => {
             setSelectedProduct(product);
             setSellQuantity(1);
             setIsSellModalOpen(true);
           }}
           className="text-sm px-3 py-1 bg-[#3c7a3d] text-white rounded hover:bg-[#2c5a2d] transition-colors flex items-center"
           disabled={product.stock < 1}
         >
           <FiDollarSign className="mr-1" /> Vender
         </button>
       </div>
     </div>
   ))
 )}
</div>

{/* Modal de Nuevo/Editar Producto con estilo vintage */}
{isModalOpen && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
   <div className="bg-[#f8f5f0] rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#d4c3b5]">
     <h2 className="text-xl font-serif text-[#2c1810] mb-4 text-center border-b border-[#d4c3b5] pb-2">
       {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
     </h2>

     <form onSubmit={handleSubmit} className="space-y-4">
       {/* Información básica */}
       <div className="bg-white p-4 rounded border border-[#d4c3b5] space-y-4">
         <div>
           <label className="block text-sm font-serif text-[#2c1810] mb-1">Nombre *</label>
           <input
             type="text"
             value={formData.name}
             onChange={(e) => setFormData({...formData, name: e.target.value})}
             className="w-full px-3 py-2 border border-[#d4c3b5] rounded focus:ring-1 focus:ring-[#6b4423] bg-[#f8f5f0]"
             required
           />
         </div>

         <div>
           <label className="block text-sm font-serif text-[#2c1810] mb-1">Categoría *</label>
           <select
             value={formData.category}
             onChange={(e) => setFormData({...formData, category: e.target.value})}
             className="w-full px-3 py-2 border border-[#d4c3b5] rounded focus:ring-1 focus:ring-[#6b4423] bg-[#f8f5f0]"
             required
           >
             {categories.map(category => (
               <option key={category.id} value={category.id}>
                 {category.icon} {category.name}
               </option>
             ))}
           </select>
         </div>
       </div>

       {/* Precios */}
       <div className="bg-white p-4 rounded border border-[#d4c3b5] space-y-4">
         <h3 className="font-serif text-[#2c1810] text-sm border-b border-[#d4c3b5] pb-2">Precios</h3>
         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-serif text-[#2c1810] mb-1">Costo *</label>
             <div className="relative">
               <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-[#8b7355]">$</span>
               <input
                 type="number"
                 value={formData.cost}
                 onChange={(e) => setFormData({...formData, cost: e.target.value})}
                 className="w-full pl-6 pr-3 py-2 border border-[#d4c3b5] rounded focus:ring-1 focus:ring-[#6b4423] bg-[#f8f5f0]"
                 required
                 min="0"
                 step="0.01"
               />
             </div>
           </div>

           <div>
             <label className="block text-sm font-serif text-[#2c1810] mb-1">Precio de Venta *</label>
             <div className="relative">
               <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-[#8b7355]">$</span>
               <input
                 type="number"
                 value={formData.price}
                 onChange={(e) => setFormData({...formData, price: e.target.value})}
                 className="w-full pl-6 pr-3 py-2 border border-[#d4c3b5] rounded focus:ring-1 focus:ring-[#6b4423] bg-[#f8f5f0]"
                 required
                 min="0"
                 step="0.01"
               />
             </div>
           </div>
         </div>
         {formData.cost && formData.price && (
           <p className="text-sm text-[#3c7a3d] text-right">
             Margen: {((formData.price - formData.cost) / formData.price * 100).toFixed(2)}%
           </p>
         )}
       </div>

       {/* Stock */}
       <div className="bg-white p-4 rounded border border-[#d4c3b5] space-y-4">
         <h3 className="font-serif text-[#2c1810] text-sm border-b border-[#d4c3b5] pb-2">Inventario</h3>
         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-serif text-[#2c1810] mb-1">Stock Inicial *</label>
             <input
               type="number"
               value={formData.stock}
               onChange={(e) => setFormData({...formData, stock: e.target.value})}
               className="w-full px-3 py-2 border border-[#d4c3b5] rounded focus:ring-1 focus:ring-[#6b4423] bg-[#f8f5f0]"
               required
               min="0"
             />
           </div>

           <div>
             <label className="block text-sm font-serif text-[#2c1810] mb-1">Stock Mínimo *</label>
             <input
               type="number"
               value={formData.minStock}
               onChange={(e) => setFormData({...formData, minStock: e.target.value})}
               className="w-full px-3 py-2 border border-[#d4c3b5] rounded focus:ring-1 focus:ring-[#6b4423] bg-[#f8f5f0]"
               required
               min="0"
             />
           </div>
         </div>
       </div>

       {/* Información adicional */}
       <div className="bg-white p-4 rounded border border-[#d4c3b5] space-y-4">
         <h3 className="font-serif text-[#2c1810] text-sm border-b border-[#d4c3b5] pb-2">Información Adicional</h3>
         <div>
           <label className="block text-sm font-serif text-[#2c1810] mb-1">Proveedor</label>
           <input
             type="text"
             value={formData.provider}
             onChange={(e) => setFormData({...formData, provider: e.target.value})}
             className="w-full px-3 py-2 border border-[#d4c3b5] rounded focus:ring-1 focus:ring-[#6b4423] bg-[#f8f5f0]"
             placeholder="Nombre del proveedor"
           />
         </div>

         <div>
           <label className="block text-sm font-serif text-[#2c1810] mb-1">Descripción</label>
           <textarea
             value={formData.description}
             onChange={(e) => setFormData({...formData, description: e.target.value})}
             className="w-full px-3 py-2 border border-[#d4c3b5] rounded focus:ring-1 focus:ring-[#6b4423] bg-[#f8f5f0]"
             rows="3"
             placeholder="Descripción del producto..."
           />
         </div>
       </div>

       {/* Botones */}
       <div className="flex justify-end space-x-3 pt-4 border-t border-[#d4c3b5]">
         <button
           type="button"
           onClick={() => setIsModalOpen(false)}
           className="px-4 py-2 border border-[#d4c3b5] rounded text-[#2c1810] hover:bg-white"
         >
           Cancelar
         </button>
         <button
           type="submit"
           className="px-4 py-2 bg-[#3c7a3d] text-white rounded hover:bg-[#2c5a2d] transition-colors"
         >
           {selectedProduct ? 'Actualizar' : 'Crear'}
         </button>
       </div>
     </form>
   </div>
 </div>
)}

{/* Modal de Venta */}
{isSellModalOpen && selectedProduct && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
   <div className="bg-[#f8f5f0] rounded-lg p-6 w-full max-w-md border border-[#d4c3b5] shadow-lg">
     <h2 className="text-xl font-serif text-[#2c1810] mb-4 text-center border-b border-[#d4c3b5] pb-2">Realizar Venta</h2>
     
     <div className="space-y-4">
       {/* Info del Producto */}
       <div className="bg-white p-3 rounded border border-[#d4c3b5]">
         <h3 className="font-serif text-[#2c1810]">{selectedProduct.name}</h3>
         <p className="text-[#8b7355]">Precio: ${selectedProduct.price.toFixed(2)}</p>
         <p className="text-[#8b7355]">Stock: {selectedProduct.stock}</p>
       </div>

       {/* Cantidad */}
       <div>
         <label className="block text-sm font-serif text-[#2c1810] mb-1">Cantidad</label>
         <input
           type="number"
           value={sellQuantity}
           onChange={(e) => setSellQuantity(Math.min(Number(e.target.value), selectedProduct.stock))}
           className="w-full px-3 py-2 border border-[#d4c3b5] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#6b4423]"
           required
           min="1"
           max={selectedProduct.stock}
         />
       </div>

       {/* Resumen */}
       <div className="bg-white p-3 rounded border border-[#d4c3b5] space-y-2">
         <div className="flex justify-between text-[#8b7355]">
           <span>Subtotal:</span>
           <span>${(selectedProduct.price * sellQuantity).toFixed(2)}</span>
         </div>
         <div className="flex justify-between text-[#3c7a3d] text-sm">
           <span>Ganancia:</span>
           <span>+${((selectedProduct.price - selectedProduct.cost) * sellQuantity).toFixed(2)}</span>
         </div>
         <div className="flex justify-between font-bold text-[#2c1810] pt-2 border-t border-[#d4c3b5]">
           <span>Total:</span>
           <span>${(selectedProduct.price * sellQuantity).toFixed(2)}</span>
         </div>
       </div>

       {/* Botones */}
       <div className="flex justify-end space-x-3 pt-4 border-t border-[#d4c3b5]">
         <button
           onClick={() => setIsSellModalOpen(false)}
           className="px-4 py-2 border border-[#d4c3b5] rounded-md text-[#2c1810] hover:bg-white transition-colors"
         >
           Cancelar
         </button>
         <button
           onClick={() => handleSell(selectedProduct, sellQuantity)}
           className="px-4 py-2 bg-[#3c7a3d] text-white rounded-md hover:bg-[#2c5a2d] transition-colors flex items-center"
           disabled={sellQuantity < 1 || sellQuantity > selectedProduct.stock}
         >
           <FiDollarSign className="mr-1" />
           Confirmar
         </button>
       </div>
     </div>
   </div>
 </div>
)}
    </div>
  );
};

export default Inventory;