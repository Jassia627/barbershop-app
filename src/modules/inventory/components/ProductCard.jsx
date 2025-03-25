// src/modules/inventory/components/ProductCard.jsx
import React from 'react';
import { Package, Edit2, Trash2, DollarSign } from 'lucide-react';

const ProductCard = ({ product, onSelect, onDelete }) => (
  <div
    className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-md"
  >
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Categoría: {product.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product.id);
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Stock</p>
          <p className={`font-medium ${
            product.stock <= product.minStock 
              ? 'text-red-500 dark:text-red-400' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {product.stock} / {product.minStock}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Precio</p>
          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-green-500" />
            {product.price.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default ProductCard;