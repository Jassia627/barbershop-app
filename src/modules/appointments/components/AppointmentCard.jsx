// src/modules/appointments/components/AppointmentCard.jsx
import React from 'react';
import { MessageSquare, Check, X, Clock, CheckCircle2, CheckCircle, XCircle, CheckSquare, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AppointmentCard = ({ appointment, onApprove, onCancel, onComplete, onFinish, isBarber = false }) => {
  const sendWhatsApp = () => {
    const phoneNumber = appointment.clientPhone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/+57${phoneNumber}?text=${encodeURIComponent(appointment.whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400',
      confirmed: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400',
      cancelled: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400',
      completed: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
      pending_review: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400',
      finished: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400'
    };
    return colors[status] || colors.pending;
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
      pending_review: 'Esperando Revisión',
      finished: 'Finalizada'
    };
    return texts[status] || 'Pendiente';
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

      <div className="mt-4 flex flex-wrap gap-2">
        {appointment.status === 'pending' && !isBarber && (
          <>
            <button
              onClick={() => onApprove(appointment.id)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Confirmar
            </button>
            <button
              onClick={() => onCancel(appointment.id)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancelar
            </button>
          </>
        )}

        {appointment.status === 'confirmed' && isBarber && (
          <button
            onClick={() => onComplete(appointment.id)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg"
          >
            <CheckSquare className="w-4 h-4 mr-1" />
            Marcar como Completado
          </button>
        )}

        {appointment.status === 'pending_review' && !isBarber && (
          <>
            <button
              onClick={() => onFinish(appointment.id)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg"
            >
              <CheckSquare className="w-4 h-4 mr-1" />
              Finalizar
            </button>
            <button
              onClick={() => onCancel(appointment.id)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Rechazar
            </button>
          </>
        )}

        {appointment.status === 'confirmed' && (
          <a
            href={`https://wa.me/${appointment.clientPhone}?text=${encodeURIComponent(
              `¡Hola ${appointment.clientName}! Recordatorio de tu cita para ${format(
                appointment.date,
                "EEEE d 'de' MMMM",
                { locale: es }
              )} a las ${appointment.time} con ${appointment.barberName}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center px-3 py-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;