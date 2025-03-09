// src/modules/expenses/components/ExpenseCard.jsx
import React from 'react';
import { DollarSign, Calendar, Clock } from 'lucide-react';

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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
            <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {expense.description}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(expense.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatTime(expense.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            ${expense.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;