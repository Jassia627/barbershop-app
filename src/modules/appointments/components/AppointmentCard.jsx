// src/modules/appointments/components/AppointmentCard.jsx
import React from 'react';
import { MessageSquare, Check, X, Clock, CheckCircle2, User, Phone, Calendar, Clock as ClockIcon, Scissors, Info } from 'lucide-react';
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
        return 'bg-green-500/20 text-green-500';
      case 'completed':
        return 'bg-blue-500/20 text-blue-500';
      case 'pending_review':
        return 'bg-purple-500/20 text-purple-500';
      case 'finished':
        return 'bg-gray-500/20 text-gray-500';
      case 'cancelled':
        return 'bg-red-500/20 text-red-500';
      case 'pending':
      default:
        return 'bg-yellow-500/20 text-yellow-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <Check className="h-3.5 w-3.5" />;
      case 'completed':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'pending_review':
        return <Scissors className="h-3.5 w-3.5" />;
      case 'finished':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'cancelled':
        return <X className="h-3.5 w-3.5" />;
      case 'pending':
      default:
        return <Clock className="h-3.5 w-3.5" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'completed':
        return 'Completada';
      case 'pending_review':
        return 'En Revisión';
      case 'finished':
        return 'Finalizada';
      case 'cancelled':
        return 'Cancelada';
      case 'pending':
      default:
        return 'Pendiente';
    }
  };

  // Determinar si la cita es para hoy
  const isToday = () => {
    const today = new Date();
    const appointmentDate = new Date(appointment.date);
    return (
      today.getDate() === appointmentDate.getDate() &&
      today.getMonth() === appointmentDate.getMonth() &&
      today.getFullYear() === appointmentDate.getFullYear()
    );
  };

  // Determinar cuánto tiempo falta para la cita
  const getTimeUntil = () => {
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const diffTime = appointmentDate - now;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffTime < 0) return null; // La cita ya pasó
    
    if (diffDays > 0) {
      return `En ${diffDays}d`;
    }
    
    if (diffHours > 0) {
      return `En ${diffHours}h`;
    }
    
    return 'Pronto';
  };

  const getTimeBadgeColor = () => {
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const diffTime = appointmentDate - now;
    const diffHours = diffTime / (1000 * 60 * 60);
    
    if (diffTime < 0) return ''; // La cita ya pasó
    
    if (diffHours < 1) {
      return 'bg-red-900/30 text-red-400 border-red-500/30';
    }
    
    if (diffHours < 3) {
      return 'bg-orange-900/30 text-orange-400 border-orange-500/30';
    }
    
    if (diffHours < 24) {
      return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
    }
    
    return 'bg-gray-800 text-gray-400 border-gray-600';
  };

  const getBorderColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'before:bg-green-500';
      case 'completed':
        return 'before:bg-blue-500';
      case 'pending_review':
        return 'before:bg-purple-500';
      case 'finished':
        return 'before:bg-gray-500';
      case 'cancelled':
        return 'before:bg-red-500';
      case 'pending':
      default:
        return 'before:bg-yellow-500';
    }
  };

  const timeUntil = getTimeUntil();
  
  // Formatear la hora de manera más compacta
  const formatTime = (date) => {
    return format(date, "HH:mm", { locale: es });
  };
  
  // Formatear la fecha de manera más compacta para móvil
  const formatDateMobile = (date) => {
    return format(date, "dd MMM", { locale: es });
  };
  
  // Formatear la fecha completa para desktop
  const formatDateDesktop = (date) => {
    return format(date, "EEEE d 'de' MMMM", { locale: es });
  };
  
  // Truncar texto largo si es necesario
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className={`bg-gradient-to-br from-gray-800 to-gray-800/90 rounded-lg shadow-md overflow-hidden border border-gray-700/50 relative before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${getBorderColor(appointment.status)}`}>      
      <div className="p-3 sm:p-5">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          {/* Información principal */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-full flex items-center justify-center shadow-inner">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-medium text-white flex items-center flex-wrap gap-1 sm:gap-2">
                <span className="truncate max-w-[120px] sm:max-w-full">{appointment.clientName}</span>
                {timeUntil && (
                  <span className={`inline-block px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full border ${getTimeBadgeColor()}`}>
                    {timeUntil}
                  </span>
                )}
                {isToday() && (
                  <span className="inline-block px-1.5 py-0.5 bg-blue-900/30 text-blue-400 text-[10px] sm:text-xs rounded-full border border-blue-500/30">
                    Hoy
                  </span>
                )}
              </h3>
              <div className="flex items-center mt-1 sm:mt-1.5 text-gray-400 text-[10px] sm:text-xs">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-gray-500" />
                <span className="hidden sm:inline">{formatDateDesktop(appointment.date)}</span>
                <span className="sm:hidden">{formatDateMobile(appointment.date)}</span>
                <span className="mx-1">•</span>
                <ClockIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-gray-500" />
                {formatTime(appointment.date)}
              </div>
            </div>
          </div>
          
          {/* Estado de la cita */}
          <span className={`flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(appointment.status)} shadow-sm`}>
            {getStatusIcon(appointment.status)}
            <span className="hidden sm:inline">{getStatusText(appointment.status)}</span>
            <span className="sm:hidden">{getStatusText(appointment.status).substring(0, 4)}</span>
          </span>
        </div>
        
        {/* Detalles adicionales */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center shadow-inner">
              <Scissors className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500">Barbero</p>
              <p className="text-xs sm:text-sm text-gray-300 truncate max-w-[80px] sm:max-w-full">{appointment.barberName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center shadow-inner">
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500">Teléfono</p>
              <p className="text-xs sm:text-sm text-gray-300">{appointment.clientPhone}</p>
            </div>
          </div>
          
          {appointment.serviceName && (
            <div className="flex items-center gap-1.5 sm:gap-2 col-span-2 mt-0.5 sm:mt-1">
              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center shadow-inner">
                <Scissors className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
              </div>
        <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Servicio</p>
                <p className="text-xs sm:text-sm text-gray-300 truncate max-w-[200px] sm:max-w-full">{appointment.serviceName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Comentarios (opcional) - visible solo en dispositivos más grandes */}
        {appointment.notes && (
          <div className="hidden sm:flex px-3 py-2 bg-gray-700/30 rounded-md mb-4 items-start gap-2">
            <Info className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400">{appointment.notes}</p>
          </div>
        )}
        
        {/* Comentarios (opcional) - versión móvil más compacta */}
        {appointment.notes && (
          <div className="sm:hidden px-2 py-1.5 bg-gray-700/30 rounded-md mb-3 flex items-start gap-1.5">
            <Info className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-gray-400 line-clamp-2">{truncateText(appointment.notes, 60)}</p>
      </div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap justify-end items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-700/70">
          {/* Botones para el administrador */}
          {!isBarber && appointment.status === 'pending' && onApprove && onCancel && (
            <>
              <button
                onClick={() => onCancel(appointment.id)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/10 text-red-400 rounded-md text-[10px] sm:text-xs font-medium hover:bg-red-500/20 hover:text-red-300 transition-colors"
              >
                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Cancelar</span>
                <span className="sm:hidden">No</span>
              </button>
              <button
                onClick={() => onApprove(appointment.id)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md text-[10px] sm:text-xs font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-sm"
              >
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Confirmar</span>
                <span className="sm:hidden">Sí</span>
              </button>
            </>
          )}

          {/* Botón para el barbero */}
          {isBarber && appointment.status === 'confirmed' && onComplete && (
            <button
              onClick={() => onComplete(appointment.id)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md text-[10px] sm:text-xs font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
            >
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Completar</span>
              <span className="sm:hidden">Listo</span>
            </button>
          )}

          {/* Botón para el administrador - finalizar cita */}
          {!isBarber && appointment.status === 'pending_review' && onFinish && (
            <button
              onClick={() => onFinish(appointment)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-md text-[10px] sm:text-xs font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm"
            >
              <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Finalizar</span>
              <span className="sm:hidden">Fin</span>
            </button>
          )}

          {/* Botón de WhatsApp */}
          <button
            onClick={sendWhatsApp}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md text-[10px] sm:text-xs font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-sm"
          >
            <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
            <span className="sm:hidden">WA</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;