// src/modules/inventory/index.js
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';

export { Inventory, Sales };

export { default as ProductCard } from './components/ProductCard';
export { default as ProductForm } from './components/ProductForm';
export { default as StockAlert } from './components/StockAlert';
export * from './services/inventoryService';
export * from './hooks/useInventory';