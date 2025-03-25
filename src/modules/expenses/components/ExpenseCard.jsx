// src/modules/expenses/components/ExpenseCard.jsx
import React from 'react';
import { DollarSign, Calendar, Clock, Tag } from 'lucide-react';
import formatMoney from '../../../utils/format';

const ExpenseCard = ({ expense }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Encabezado con descripción y categoría */}
        <div className="flex items-start gap-3 mb-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-full flex-shrink-0">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
              {expense.description}
            </h3>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {expense.category || 'Sin categoría'}
              </span>
            </div>
          </div>
        </div>

        {/* Información de fecha y hora */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(expense.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{formatTime(expense.createdAt)}</span>
          </div>
        </div>

        {/* Monto del gasto */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-end items-center">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {formatMoney(expense.amount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;