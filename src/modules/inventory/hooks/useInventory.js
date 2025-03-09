// src/modules/inventory/hooks/useInventory.js
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth';
import { fetchProducts, createProduct, updateProduct } from '../services/inventoryService';
import { toast } from 'react-hot-toast';
import { logDebug, logError } from '../../../core/utils/logger';

export const useInventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      if (!user) {
        logError("Usuario no disponible para cargar inventario");
        setError("No se pudo cargar el inventario: usuario no autenticado");
        setLoading(false);
        return;
      }
      
      try {
        // Información detallada para depuración
        logDebug("Información de usuario para cargar inventario:", {
          uid: user.uid,
          email: user.email,
          role: user.role,
          shopId: user.shopId
        });
        
        // Verificar si el usuario es admin
        const isAdmin = user.role === 'admin';
        logDebug("¿El usuario es admin?", isAdmin);
        
        if (!isAdmin && !user.shopId) {
          logError("Usuario no admin sin shopId asignado");
          setError("No se pudo cargar el inventario: usuario sin tienda asignada");
          setLoading(false);
          return;
        }
        
        logDebug("Intentando cargar productos para shopId:", user.shopId);
        const productData = await fetchProducts(user.shopId);
        logDebug("Productos cargados:", productData.length);
        setProducts(productData);
        setError(null);
      } catch (error) {
        logError("Error al cargar inventario");
        
        let errorMessage = "Error al cargar inventario";
        
        // Manejar específicamente el error de permisos
        if (error.code === 'permission-denied') {
          errorMessage = `Error de permisos: El usuario ${user.email} (${user.role}) no tiene acceso a la colección de productos`;
          logError(errorMessage);
          
          // Sugerencias para solucionar el problema
          logDebug("Posibles soluciones:");
          logDebug("1. Verifica que el usuario tenga el rol correcto (admin o empleado con permisos)");
          logDebug("2. Revisa las reglas de seguridad de Firestore para la colección 'products'");
          logDebug("3. Asegúrate de que el shopId sea correcto y el usuario pertenezca a esa tienda");
          logDebug("4. Información de usuario:", {
            uid: user.uid,
            email: user.email,
            role: user.role,
            shopId: user.shopId
          });
        }
        
        toast.error(errorMessage, { duration: 5000 });
        setProducts([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [user]);

  const saveProduct = async (productData, productId) => {
    if (!user) {
      toast.error("No se puede guardar el producto: usuario no autenticado");
      return false;
    }
    
    // Verificar si el usuario es admin
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
      toast.error("No tienes permisos para modificar productos. Se requiere rol de administrador.");
      return false;
    }
    
    try {
      const data = {
        ...productData,
        shopId: user.shopId,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email
      };
      
      logDebug("Guardando producto con datos:", data);
      
      if (productId) {
        await updateProduct(productId, data);
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...data } : p));
      } else {
        data.createdAt = new Date().toISOString();
        data.createdBy = user.email;
        const docRef = await createProduct(data);
        setProducts(prev => [...prev, { id: docRef.id, ...data }]);
      }
      toast.success("Producto guardado con éxito");
      return true;
    } catch (error) {
      logError("Error al guardar producto");
      
      let errorMessage = "Error al guardar producto";
      
      // Manejar específicamente el error de permisos
      if (error.code === 'permission-denied') {
        errorMessage = `Error de permisos: El usuario ${user.email} (${user.role}) no tiene permisos para modificar productos`;
        logError(errorMessage);
        logDebug("Información de usuario:", {
          uid: user.uid,
          email: user.email,
          role: user.role,
          shopId: user.shopId
        });
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  return { products, loading, error, saveProduct };
};