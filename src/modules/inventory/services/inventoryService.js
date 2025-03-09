// src/modules/inventory/services/inventoryService.js
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getFirestore } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';

export const fetchProducts = async (shopId) => {
  try {
    console.log("fetchProducts: Iniciando consulta para shopId:", shopId);
    
    // Si no hay shopId, lanzar error
    if (!shopId) {
      console.error("fetchProducts: shopId no proporcionado");
      throw new Error("Se requiere un ID de tienda para consultar productos");
    }
    
    // Crear la consulta - Usar la colección 'inventory' en lugar de 'products'
    const productsRef = collection(db, "inventory");
    const q = query(productsRef, where("shopId", "==", shopId));
    
    console.log("fetchProducts: Ejecutando consulta en la colección 'inventory'");
    const snapshot = await getDocs(q);
    
    console.log(`fetchProducts: Consulta completada, ${snapshot.docs.length} productos encontrados`);
    
    // Mapear los documentos a objetos
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data };
    });
    
    return products;
  } catch (error) {
    console.error("fetchProducts: Error al consultar productos:", error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    console.log("createProduct: Creando producto con datos:", productData);
    
    // Validar datos mínimos
    if (!productData.name || !productData.shopId) {
      console.error("createProduct: Datos incompletos");
      throw new Error("Se requiere nombre y ID de tienda para crear un producto");
    }
    
    // Usar la colección 'inventory' en lugar de 'products'
    const docRef = await addDoc(collection(db, "inventory"), productData);
    console.log("createProduct: Producto creado con ID:", docRef.id);
    return docRef;
  } catch (error) {
    console.error("createProduct: Error al crear producto:", error);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    console.log("updateProduct: Actualizando producto con ID:", productId, "Datos:", productData);
    
    // Validar ID
    if (!productId) {
      console.error("updateProduct: ID de producto no proporcionado");
      throw new Error("Se requiere un ID de producto para actualizar");
    }
    
    // Usar la colección 'inventory' en lugar de 'products'
    const productRef = doc(db, "inventory", productId);
    await updateDoc(productRef, productData);
    console.log("updateProduct: Producto actualizado correctamente");
  } catch (error) {
    console.error("updateProduct: Error al actualizar producto:", error);
    throw error;
  }
};