import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShoppingBag, ChevronDown, ChevronUp, X, DollarSign, CreditCard, Banknote, RefreshCw } from 'lucide-react';

const SaleCard = ({ sale, onCancel }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Formatear fecha con manejo de errores
  let formattedDate = 'Fecha no disponible';
  try {
    if (sale.createdAt) {
      // Asegurarse de que createdAt sea un objeto Date
      const dateObj = sale.createdAt instanceof Date 
        ? sale.createdAt 
        : new Date(sale.createdAt);
      
      if (isNaN(dateObj.getTime())) {
        // Si la fecha no es válida, mostrar mensaje de error
        console.warn("Fecha inválida en venta:", sale.id, sale.createdAt);
        formattedDate = 'Fecha inválida';
      } else {
        // Formatear la fecha válida
        formattedDate = format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es });
      }
    }
  } catch (error) {
    console.error("Error al formatear fecha de venta:", error);
    formattedDate = 'Error en fecha';
  }
  
  // Determinar el icono del método de pago
  const getPaymentIcon = () => {
    switch (sale.paymentMethod) {
      case 'card':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'transfer':
        return <RefreshCw className="h-4 w-4 text-green-500" />;
      case 'cash':
      default:
        return <Banknote className="h-4 w-4 text-green-500" />;
    }
  };
  
  // Determinar el texto del método de pago
  const getPaymentMethodText = () => {
    switch (sale.paymentMethod) {
      case 'card':
        return 'Tarjeta';
      case 'transfer':
        return 'Transferencia';
      case 'cash':
      default:
        return 'Efectivo';
    }
  };
  
  // Determinar el color del estado
  const getStatusColor = () => {
    switch (sale.status) {
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };
  
  // Determinar el texto del estado
  const getStatusText = () => {
    switch (sale.status) {
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return 'Pendiente';
    }
  };
  
  // Manejar posibles valores undefined o null
  const safeTotal = sale.total || 0;
  const safeCustomerName = sale.customerName || 'Cliente general';
  const safeSellerName = sale.sellerName || 'No especificado';
  const safeProducts = Array.isArray(sale.products) ? sale.products : [];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-200">
      {/* Encabezado de la venta */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
              <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="font-medium">{safeCustomerName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="font-bold">${safeTotal.toLocaleString()}</span>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                {getPaymentIcon()}
                <span>{getPaymentMethodText()}</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </div>
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>
      
      {/* Detalles de la venta (expandible) */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {/* Productos vendidos */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Productos vendidos</h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {safeProducts.map((product, index) => {
                    const productName = product.name || 'Producto sin nombre';
                    const productPrice = product.price || 0;
                    const productQuantity = product.quantity || 0;
                    const subtotal = productPrice * productQuantity;
                    
                    return (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{productName}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-center">${productPrice.toLocaleString()}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-center">{productQuantity}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right">${subtotal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <td colSpan="3" className="px-3 py-2 text-right font-medium">Total:</td>
                    <td className="px-3 py-2 text-right font-bold">${safeTotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium mb-2">Información del cliente</h4>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <p><strong>Nombre:</strong> {safeCustomerName}</p>
                {sale.customerPhone && <p><strong>Teléfono:</strong> {sale.customerPhone}</p>}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Información de la venta</h4>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <p><strong>Fecha:</strong> {formattedDate}</p>
                <p><strong>Vendedor:</strong> {safeSellerName}</p>
                <p>
                  <strong>Método de pago:</strong> 
                  <span className="inline-flex items-center gap-1 ml-1">
                    {getPaymentIcon()}
                    {getPaymentMethodText()}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Acciones */}
          {sale.status !== 'cancelled' && (
            <div className="flex justify-end">
              <button
                onClick={() => onCancel(sale.id)}
                className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                Cancelar venta
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SaleCard; 