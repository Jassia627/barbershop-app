// src/modules/shared/components/BarcodeScanner.jsx
import React, { useState } from 'react';
import { useZxing } from 'react-zxing';

const BarcodeScanner = ({ onResult, onError }) => {
  const [isStarted, setIsStarted] = useState(false);

  const { ref } = useZxing({
    paused: !isStarted,
    constraints: { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } },
    timeBetweenDecodingAttempts: 300,
    onDecodeResult(result) {
      setIsStarted(false);
      onResult(result.getText());
    },
    onError,
  });

  return (
    <div className="relative">
      {isStarted ? (
        <>
          <video ref={ref} className="w-full h-64 object-cover rounded-lg" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-[20%] top-[30%] bottom-[30%] border-2 border-red-500">
              <div className="absolute inset-0 border-2 border-red-500 animate-pulse"></div>
            </div>
          </div>
          <button
            onClick={() => setIsStarted(false)}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      ) : (
        <button
          onClick={() => setIsStarted(true)}
          className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center space-y-2 hover:border-indigo-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-gray-500">Iniciar escáner de códigos</span>
        </button>
      )}
    </div>
  );
};

export default BarcodeScanner;