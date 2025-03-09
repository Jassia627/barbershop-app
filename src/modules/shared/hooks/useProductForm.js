// src/modules/shared/hooks/useProductForm.js
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';

export const useProductForm = (initialProduct = null) => {
  const [formData, setFormData] = useState({
    name: '', category: '', cost: '', price: '', stock: '', minStock: '', barcode: '', provider: '', description: '',
    createdAt: new Date(), updatedAt: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);

  useEffect(() => {
    if (initialProduct) setFormData(initialProduct);
  }, [initialProduct]);

  const searchProductByBarcode = async (barcode) => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('barcode', '==', barcode));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty ? null : querySnapshot.docs[0].data();
    } catch (error) {
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = async (barcode) => {
    try {
      setLoading(true);
      const existingProduct = await searchProductByBarcode(barcode);
      if (existingProduct) {
        setFormData(existingProduct);
        alert('Producto encontrado! Los datos han sido cargados.');
      } else {
        setFormData(prev => ({ ...prev, barcode }));
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setBarcodeModalOpen(false);
    }
  };

  const saveProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const productData = { ...formData, updatedAt: new Date() };

      if (initialProduct) {
        await updateDoc(doc(db, 'products', initialProduct.id), productData);
      } else {
        const newProductRef = doc(collection(db, 'products'));
        await setDoc(newProductRef, { ...productData, id: newProductRef.id, createdAt: new Date() });
      }
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { formData, setFormData, loading, error, barcodeModalOpen, setBarcodeModalOpen, handleBarcodeScanned, saveProduct };
};