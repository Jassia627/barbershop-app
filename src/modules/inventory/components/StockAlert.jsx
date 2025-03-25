// src/modules/inventory/components/StockAlert.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const StockAlert = ({ product }) => {
  if (product.stock > product.minStock) return null;

  const stockPercentage = (product.stock / product.minStock) * 100;

  return (
    <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Stock bajo en {product.name}
          </p>
          <div className="mt-1.5 h-1.5 bg-yellow-200 dark:bg-yellow-900/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500 dark:bg-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            {product.stock} unidades restantes
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockAlert;