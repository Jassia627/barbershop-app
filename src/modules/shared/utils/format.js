// src/modules/shared/utils/format.js
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
  };
  
  export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };