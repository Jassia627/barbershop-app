// src/modules/appointments/components/AppointmentCard.jsx
import React from 'react';
import { MessageSquare, Check, X, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AppointmentCard = ({ appointment, onApprove, onCancel, onComplete, onFinish, isBarber = false }) => {
  const sendWhatsApp = () => {
    const phoneNumber = appointment.clientPhone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/+57${phoneNumber}?text=${encodeURIComponent(appointment.whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'pending_review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      case 'finished':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'completed':
        return 'Completada';
      case 'pending_review':
        return 'Pendiente de revisión';
      case 'finished':
        return 'Finalizada';
      case 'pending':
      default:
        return 'Pendiente';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {appointment.clientName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {format(appointment.date, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(appointment.status)}`}>
          {getStatusText(appointment.status)}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {isBarber ? 'Cliente' : 'Barbero'}
          </p>
          <p className="text-gray-900 dark:text-white">
            {isBarber ? appointment.clientName : appointment.barberName}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</p>
          <p className="text-gray-900 dark:text-white">{appointment.clientPhone}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {/* Botones para el administrador */}
          {!isBarber && appointment.status === 'pending' && onApprove && onCancel && (
            <>
              <button
                onClick={() => onApprove(appointment.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Check className="h-4 w-4" />
                Confirmar
              </button>
              <button
                onClick={() => onCancel(appointment.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </>
          )}

          {/* Botón para el barbero */}
          {isBarber && appointment.status === 'confirmed' && onComplete && (
            <button
              onClick={() => onComplete(appointment.id)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Clock className="h-4 w-4" />
              Marcar como completado
            </button>
          )}

          {/* Botón para el administrador - finalizar cita */}
          {!isBarber && appointment.status === 'pending_review' && onFinish && (
            <button
              onClick={() => onFinish(appointment)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Finalizar y guardar
            </button>
          )}
        </div>

        {/* Botón de WhatsApp siempre visible */}
        <button
          onClick={sendWhatsApp}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          WhatsApp
        </button>
      </div>
    </div>
  );
};

export default AppointmentCard;