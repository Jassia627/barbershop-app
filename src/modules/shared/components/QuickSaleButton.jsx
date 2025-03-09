// src/modules/shared/components/QuickSaleButton.jsx
import React, { useState } from 'react';
import { FiCamera } from 'react-icons/fi';
import QuickSaleScanner from './QuickSaleScanner';

const QuickSaleButton = ({ onScan }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#3c7a3d] text-white p-4 rounded-full shadow-lg hover:bg-[#2c5a2d] transition-colors flex items-center justify-center z-40"
      >
        <FiCamera className="w-6 h-6" />
        <span className="sr-only">Escanear para vender</span>
      </button>
      {isOpen && <QuickSaleScanner onScan={onScan} onClose={() => setIsOpen(false)} />}
    </>
  );
};

export default QuickSaleButton;