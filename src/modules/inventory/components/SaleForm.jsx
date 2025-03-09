import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign, Search } from 'lucide-react';

const SaleForm = ({ products, onSubmit, saving }) => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Filtrar productos basados en el término de búsqueda
  useEffect(() => {
    if (!products) return;
    
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
      product.stock > 0
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  // Calcular el total de la venta
  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  // Añadir producto al carrito
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Si ya está en el carrito, incrementar cantidad
      if (existingItem.quantity >= product.stock) {
        // No permitir añadir más que el stock disponible
        return;
      }
      
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Si no está en el carrito, añadirlo
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        currentStock: product.stock
      }]);
    }
  };

  // Incrementar cantidad de un producto en el carrito
  const incrementQuantity = (productId) => {
    const product = products.find(p => p.id === productId);
    const cartItem = cart.find(item => item.productId === productId);
    
    if (cartItem && product && cartItem.quantity < product.stock) {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    }
  };

  // Decrementar cantidad de un producto en el carrito
  const decrementQuantity = (productId) => {
    const cartItem = cart.find(item => item.productId === productId);
    
    if (cartItem && cartItem.quantity > 1) {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      ));
    } else {
      // Si la cantidad es 1, remover del carrito
      removeFromCart(productId);
    }
  };

  // Remover producto del carrito
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      alert('Debe agregar al menos un producto al carrito');
      return;
    }
    
    const saleData = {
      products: cart,
      total,
      paymentMethod,
      customerName: 'Cliente general',
      date: new Date()
    };
    
    onSubmit(saleData);
  };

  // Limpiar el carrito
  const clearCart = () => {
    setCart([]);
    setTotal(0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-blue-500" />
        Registrar Venta
      </h3>
      
      {/* Búsqueda de productos */}
      <div className="mb-4 relative">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      {/* Lista de productos filtrados */}
      {searchTerm && (
        <div className="mb-4 max-h-60 overflow-y-auto border rounded-lg">
          {filteredProducts.length > 0 ? (
            <ul className="divide-y">
              {filteredProducts.map(product => (
                <li 
                  key={product.id} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Stock: {product.stock} | Precio: ${product.price.toLocaleString()}
                    </p>
                  </div>
                  <button 
                    className="p-1 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600 dark:text-blue-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-3 text-center text-gray-500 dark:text-gray-400">
              No se encontraron productos o no hay stock disponible
            </p>
          )}
        </div>
      )}
      
      {/* Carrito de compras */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Carrito</h4>
          {cart.length > 0 && (
            <button 
              onClick={clearCart}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Limpiar carrito
            </button>
          )}
        </div>
        
        {cart.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subtotal</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {cart.map(item => (
                  <tr key={item.productId}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{item.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center">${item.price.toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div className="flex items-center justify-center space-x-1">
                        <button 
                          onClick={() => decrementQuantity(item.productId)}
                          className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => incrementQuantity(item.productId)}
                          className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center">${(item.price * item.quantity).toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <td colSpan="3" className="px-3 py-2 text-right font-medium">Total:</td>
                  <td className="px-3 py-2 text-center font-bold">${total.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500 dark:text-gray-400 border rounded-lg">
            No hay productos en el carrito
          </p>
        )}
      </div>
      
      {/* Método de pago */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Método de Pago
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-2 border rounded-lg ${
                paymentMethod === 'cash' 
                  ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-200' 
                  : 'bg-white dark:bg-gray-700'
              }`}
            >
              Efectivo
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-2 border rounded-lg ${
                paymentMethod === 'card' 
                  ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-200' 
                  : 'bg-white dark:bg-gray-700'
              }`}
            >
              Tarjeta
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className={`p-2 border rounded-lg ${
                paymentMethod === 'transfer' 
                  ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-200' 
                  : 'bg-white dark:bg-gray-700'
              }`}
            >
              Transferencia
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={cart.length === 0 || saving}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <DollarSign className="h-5 w-5" />
          {saving ? 'Procesando...' : 'Completar Venta'}
        </button>
      </form>
    </div>
  );
};

export default SaleForm; 