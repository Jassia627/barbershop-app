// src/modules/shared/components/ShareBookingLink.jsx
import React, { useState } from 'react';
import { useAuth } from '../../auth';
import { Copy, Share2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ShareBookingLink = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const bookingUrl = `${window.location.origin}/book/${user?.shopId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      toast.error("Error al copiar el enlace");
    }
  };

  const shareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Reserva tu cita',
          text: 'Agenda tu cita en nuestra barbería',
          url: bookingUrl,
        });
        toast.success("Enlace compartido");
      } else {
        toast.error("La función de compartir no está soportada en este dispositivo");
      }
    } catch (err) {
      console.error('Error al compartir:', err);
      toast.error("Error al compartir el enlace");
    }
  };

  if (!user || !user.shopId) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Link de Reservas para Clientes</h3>
        <Share2 className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={bookingUrl}
          readOnly
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm"
        />
        <button
          onClick={copyToClipboard}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          title="Copiar enlace"
        >
          {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
        </button>
        {navigator.share && (
          <button
            onClick={shareLink}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Compartir enlace"
          >
            <Share2 className="h-5 w-5" />
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Comparte este enlace con tus clientes para que reserven citas directamente.
      </p>
    </div>
  );
};

export default ShareBookingLink;