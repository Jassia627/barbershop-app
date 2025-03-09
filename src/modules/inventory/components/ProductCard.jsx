// src/modules/inventory/components/ProductCard.jsx
import React from 'react';
import { Package } from 'lucide-react';

const ProductCard = ({ product, onSelect }) => (
  <div
    onClick={() => onSelect(product)}
    className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 cursor-pointer transition-all"
  >
    <div className="flex items-center">
      <Package className="h-6 w-6 text-gray-400 mr-3" />
      <div className="text-left">
        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Stock: {product.stock}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">${product.price.toLocaleString()}</p>
      </div>
    </div>
  </div>
);

export default ProductCard;