import { collection, query, where, getDocs, addDoc, updateDoc, doc, getFirestore, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';

// Obtener todas las ventas de una tienda
export const fetchSales = async (shopId) => {
  try {
    console.log("fetchSales: Iniciando consulta para shopId:", shopId);
    
    if (!shopId) {
      console.error("fetchSales: shopId no proporcionado");
      throw new Error("Se requiere un ID de tienda para consultar ventas");
    }
    
    const salesRef = collection(db, "sales");
    
    // NOTA: Esta consulta requiere un índice compuesto en Firestore.
    // Si ves un error, haz clic en el enlace proporcionado para crear el índice.
    // Alternativamente, puedes eliminar el orderBy para evitar la necesidad del índice.
    
    // Opción 1: Sin orderBy (no requiere índice)
    const q = query(
      salesRef, 
      where("shopId", "==", shopId)
    );
    
    /* Opción 2: Con orderBy (requiere índice)
    const q = query(
      salesRef, 
      where("shopId", "==", shopId),
      orderBy("createdAt", "desc")
    );
    */
    
    console.log("fetchSales: Ejecutando consulta");
    const snapshot = await getDocs(q);
    
    console.log(`fetchSales: Consulta completada, ${snapshot.docs.length} ventas encontradas`);
    
    // Ordenar los resultados manualmente (ya que no usamos orderBy)
    const sales = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Manejar diferentes tipos de datos para createdAt
      let createdAt;
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          // Es un Timestamp de Firestore
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          // Ya es un objeto Date
          createdAt = data.createdAt;
        } else if (typeof data.createdAt === 'string') {
          // Es una cadena ISO
          createdAt = new Date(data.createdAt);
        } else if (typeof data.createdAt.seconds === 'number') {
          // Es un objeto con seconds y nanoseconds
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else {
          // Fallback
          console.warn(`Formato de fecha desconocido para venta ${doc.id}:`, data.createdAt);
          createdAt = new Date();
        }
      } else {
        // Si no hay fecha, usar la actual
        createdAt = new Date();
      }
      
      return { 
        id: doc.id, 
        ...data, 
        createdAt 
      };
    }).sort((a, b) => b.createdAt - a.createdAt); // Ordenar por fecha descendente
    
    return sales;
  } catch (error) {
    console.error("fetchSales: Error al consultar ventas:", error);
    throw error;
  }
};

// Registrar una nueva venta
export const createSale = async (saleData) => {
  try {
    console.log("createSale: Creando venta con datos:", saleData);
    
    if (!saleData.shopId || !saleData.products || saleData.products.length === 0) {
      console.error("createSale: Datos incompletos");
      throw new Error("Se requiere ID de tienda y al menos un producto para crear una venta");
    }
    
    // Añadir timestamp del servidor
    const dataWithTimestamp = {
      ...saleData,
      createdAt: serverTimestamp(),
      status: saleData.status || 'completed'
    };
    
    const docRef = await addDoc(collection(db, "sales"), dataWithTimestamp);
    console.log("createSale: Venta creada con ID:", docRef.id);
    
    // Actualizar el inventario reduciendo el stock de los productos vendidos
    for (const item of saleData.products) {
      if (item.productId && item.quantity) {
        try {
          const productRef = doc(db, "inventory", item.productId);
          await updateDoc(productRef, {
            stock: item.currentStock - item.quantity,
            updatedAt: serverTimestamp()
          });
          console.log(`Stock actualizado para producto ${item.productId}: nuevo stock = ${item.currentStock - item.quantity}`);
        } catch (error) {
          console.error(`Error al actualizar stock del producto ${item.productId}:`, error);
          // Continuamos con los demás productos aunque falle uno
        }
      }
    }
    
    return {
      id: docRef.id,
      ...dataWithTimestamp,
      createdAt: new Date() // Devolvemos una fecha JavaScript para uso inmediato
    };
  } catch (error) {
    console.error("createSale: Error al crear venta:", error);
    throw error;
  }
};

// Cancelar una venta y restaurar el inventario
export const cancelSale = async (saleId) => {
  try {
    console.log("cancelSale: Cancelando venta con ID:", saleId);
    
    // Primero obtenemos los datos de la venta
    const saleRef = doc(db, "sales", saleId);
    const saleSnap = await saleRef.get();
    
    if (!saleSnap.exists) {
      throw new Error(`No se encontró la venta con ID: ${saleId}`);
    }
    
    const saleData = saleSnap.data();
    
    // Actualizamos el estado de la venta
    await updateDoc(saleRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
    
    // Restauramos el inventario
    if (saleData.products && saleData.products.length > 0) {
      for (const item of saleData.products) {
        if (item.productId && item.quantity) {
          try {
            const productRef = doc(db, "inventory", item.productId);
            const productSnap = await productRef.get();
            
            if (productSnap.exists) {
              const productData = productSnap.data();
              await updateDoc(productRef, {
                stock: productData.stock + item.quantity,
                updatedAt: serverTimestamp()
              });
              console.log(`Stock restaurado para producto ${item.productId}: nuevo stock = ${productData.stock + item.quantity}`);
            }
          } catch (error) {
            console.error(`Error al restaurar stock del producto ${item.productId}:`, error);
          }
        }
      }
    }
    
    return { success: true, message: "Venta cancelada y stock restaurado" };
  } catch (error) {
    console.error("cancelSale: Error al cancelar venta:", error);
    throw error;
  }
}; 