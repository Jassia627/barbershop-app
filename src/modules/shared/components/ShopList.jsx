// src/modules/shared/components/ShopList.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';
import { toast } from 'react-hot-toast';

const ShopList = ({ onSelect, selectedShopId }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const shopsData = querySnapshot.docs
          .filter(doc => doc.data().role === 'admin' && doc.data().shopName && doc.data().isShopOwner)
          .map(doc => ({ id: doc.id, shopId: doc.id, shopName: doc.data().shopName }));
        setShops(shopsData);
      } catch (error) {
        toast.error("Error al cargar las barberías disponibles");
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const filteredShops = shops.filter(shop => shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex justify-center items-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar barbería..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            ×
          </button>
        )}
      </div>
      <div className="max-h-60 overflow-y-auto space-y-2">
        {filteredShops.length === 0 ? (
          <div className="text-center py-4 text-gray-500">{searchTerm ? 'No se encontraron barberías' : 'No hay barberías registradas'}</div>
        ) : (
          filteredShops.map(shop => (
            <div
              key={shop.shopId}
              onClick={() => onSelect(shop)}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedShopId === shop.shopId ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-gray-50 border-gray-200'}`}
            >
              <h3 className="font-medium text-gray-900">{shop.shopName}</h3>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ShopList;