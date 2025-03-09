// src/modules/inventory/components/StockAlert.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

const StockAlert = ({ product }) => {
  if (product.stock > product.minStock) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-md">
      <AlertCircle className="w-5 h-5" />
      <span>{product.name} tiene stock bajo ({product.stock} unidades).</span>
    </div>
  );
};

export default StockAlert;