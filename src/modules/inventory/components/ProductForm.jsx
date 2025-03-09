// src/modules/inventory/components/ProductForm.jsx
import React from 'react';
import { Package, DollarSign } from 'lucide-react';

const ProductForm = ({ formData = { name: '', price: 0, stock: 0, minStock: 0 }, setFormData, onSubmit, saving }) => {
  // Asegurarse de que formData tenga valores por defecto
  const safeFormData = formData || { name: '', price: 0, stock: 0, minStock: 0 };
  
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Producto</label>
        <div className="relative mt-1">
          <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={safeFormData.name || ''}
            onChange={(e) => setFormData({ ...safeFormData, name: e.target.value })}
            className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            placeholder="Ej. Shampoo"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio</label>
        <div className="relative mt-1">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="number"
            value={safeFormData.price || 0}
            onChange={(e) => setFormData({ ...safeFormData, price: parseInt(e.target.value) || 0 })}
            className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            placeholder="0"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
        <input
          type="number"
          value={safeFormData.stock || 0}
          onChange={(e) => setFormData({ ...safeFormData, stock: parseInt(e.target.value) || 0 })}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          placeholder="0"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Mínimo</label>
        <input
          type="number"
          value={safeFormData.minStock || 0}
          onChange={(e) => setFormData({ ...safeFormData, minStock: parseInt(e.target.value) || 0 })}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          placeholder="0"
          required
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar Producto'}
      </button>
    </form>
  );
};

export default ProductForm;