// src/modules/appointments/components/AppointmentCard.jsx
import React from 'react';
import { User, Scissors, Clock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const AppointmentCard = ({ appointment, onApprove, onCancel }) => {
  const sendWhatsAppConfirmation = () => {
    if (!appointment.clientPhone) {
      alert("No hay número de teléfono registrado para este cliente.");
      return;
    }
    const message = `Hola ${appointment.clientName}, tu cita con ${appointment.barberName} para el ${format(appointment.date.toDate(), 'dd/MM/yyyy')} a las ${appointment.time} ha sido confirmada. ¡Te esperamos!`;
    const whatsappUrl = `https://wa.me/+57${appointment.clientPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onApprove(appointment.id); // Aprueba la cita tras enviar el mensaje
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <User className="h-6 w-6 text-gray-400" />
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{appointment.clientName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Scissors className="h-4 w-4" /> {appointment.serviceName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Clock className="h-4 w-4" /> {format(appointment.date.toDate(), 'dd/MM/yyyy')} - {appointment.time}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Barbero: {appointment.barberName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Estado: {appointment.status}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {appointment.status === 'pending' && (
          <>
            <button
              onClick={sendWhatsAppConfirmation}
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1"
            >
              <MessageSquare className="h-4 w-4" />
              Confirmar por WhatsApp
            </button>
            <button
              onClick={() => onCancel(appointment.id)}
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;