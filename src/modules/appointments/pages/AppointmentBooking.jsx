// src/modules/appointments/pages/AppointmentBooking.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppointments } from '../hooks/useAppointments';
import BarberSelector from '../components/BarberSelector';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"; // Importar los estilos CSS
import TimeSlotSelector from '../components/TimeSlotSelector';
import AppointmentForm from '../components/AppointmentForm';
import { toast } from 'react-hot-toast';
import { MessageSquare, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { format, parseISO, startOfDay, addMonths, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { logDebug, logError, logWarn } from '../../../core/utils/logger';

// Función para normalizar texto (eliminar acentos y caracteres especiales)
const normalizeText = (text) => {
  return text
    .normalize("NFD")                 // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "")  // Eliminar los acentos
    .toUpperCase()                    // Convertir a mayúsculas
    .trim();                          // Eliminar espacios
};

const AppointmentBooking = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { barbers, services, availableTimeSlots, schedules, selectedBarber, setSelectedBarber, selectedDate, setSelectedDate, loading, saveAppointment } = useAppointments(shopId);
  const [formData, setFormData] = useState({ clientName: '', clientPhone: '', serviceId: '', serviceName: '', price: 0, time: '' });
  const [saving, setSaving] = useState(false);
  const [appointmentSaved, setAppointmentSaved] = useState(false);
  const [lastSelectedBarber, setLastSelectedBarber] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [nonWorkingDays, setNonWorkingDays] = useState([]);

  // Detectar si es dispositivo de escritorio o móvil
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inicializar selectedDate con la fecha actual normalizada
  useEffect(() => {
    const normalizedDate = startOfDay(new Date());
    logDebug("AppointmentBooking: Inicializando selectedDate:", normalizedDate, "formateado:", format(normalizedDate, 'dd/MM/yyyy', { locale: es }));
    setSelectedDate(normalizedDate);
  }, []);

  // Actualizar los días no laborables cuando cambie el barbero seleccionado
  useEffect(() => {
    if (selectedBarber && schedules && schedules.length > 0) {
      const schedule = schedules[0];
      
      // Mapa de días con versiones normalizadas
      const daysOffMap = {
        // Abreviaturas
        'DOM': 0,  // Domingo
        'LUN': 1,  // Lunes
        'MAR': 2,  // Martes
        'MIE': 3,  // Miércoles (sin acento)
        'MIÉ': 3,  // Miércoles (con acento)
        'JUE': 4,  // Jueves
        'VIE': 5,  // Viernes
        'SAB': 6,  // Sábado (sin acento)
        'SÁB': 6,  // Sábado (con acento)
        
        // Nombres completos
        'DOMINGO': 0,
        'LUNES': 1,
        'MARTES': 2,
        'MIERCOLES': 3,
        'MIÉRCOLES': 3,
        'JUEVES': 4,
        'VIERNES': 5,
        'SABADO': 6,
        'SÁBADO': 6,
        
        // Números como strings
        '0': 0,
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 6
      };
      
      // Convertir los días no laborables a números de día de la semana
      let daysOffNumbers = [];
      
      if (Array.isArray(schedule.daysOff)) {
        daysOffNumbers = schedule.daysOff
          .map(day => {
            if (!day && day !== 0) return undefined;
            
            // Si es un número, convertirlo directamente
            if (typeof day === 'number') {
              // Asegurarse de que esté en el rango 0-6
              const normalizedNumber = ((day % 7) + 7) % 7;
              return normalizedNumber;
            }
            
            // Si es un string, normalizarlo
            if (typeof day === 'string') {
              // Normalizar el día (quitar acentos y convertir a mayúsculas)
              const normalizedDay = normalizeText(day);
              const originalTrimmed = day.toUpperCase().trim();
              
              // Intentar primero con el día original
              let dayNumber = daysOffMap[originalTrimmed];
              
              // Si no se encuentra, intentar con la versión normalizada
              if (dayNumber === undefined) {
                dayNumber = daysOffMap[normalizedDay];
              }
              
              if (dayNumber === undefined) {
                logWarn(`Día no reconocido: "${day}" (normalizado: "${normalizedDay}"). Valores aceptados: ${Object.keys(daysOffMap).join(', ')}`);
                
                // Intentar buscar coincidencias parciales para ayudar en la depuración
                const possibleMatches = Object.keys(daysOffMap).filter(key => 
                  key.includes(normalizedDay) || normalizedDay.includes(key)
                );
                
                if (possibleMatches.length > 0) {
                  logDebug(`Posibles coincidencias para "${day}": ${possibleMatches.join(', ')}`);
                }
              }
              
              return dayNumber;
            }
            
            return undefined;
          })
          .filter(day => day !== undefined && day >= 0 && day <= 6);
      }
      
      logDebug("Días no laborables del barbero:", schedule.daysOff);
      logDebug("Convertidos a números:", daysOffNumbers);
      logDebug("¿Incluye sábado (6)?", daysOffNumbers.includes(6));
      
      setNonWorkingDays(daysOffNumbers);
    } else {
      setNonWorkingDays([]);
    }
  }, [selectedBarber, schedules]);

  // Función para obtener el nombre del día a partir del número
  const getDayName = (dayNumber) => {
    const dayNames = {
      0: 'Domingo',
      1: 'Lunes',
      2: 'Martes',
      3: 'Miércoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sábado'
    };
    return dayNames[dayNumber] || `Día ${dayNumber}`;
  };

  // Función para verificar si una fecha es un día no laborable
  const isNonWorkingDay = useCallback((date) => {
    if (!selectedBarber || !nonWorkingDays || nonWorkingDays.length === 0) return false;
    
    const dayOfWeek = date.getDay(); // 0 = domingo, 6 = sábado
    logDebug(`Verificando día ${dayOfWeek} (${date.toDateString()}) contra días no laborables:`, nonWorkingDays);
    return nonWorkingDays.includes(dayOfWeek);
  }, [selectedBarber, nonWorkingDays]);

  // Depuración de selectedDate al cambiar
  useEffect(() => {
    logDebug("AppointmentBooking: selectedDate actualizado:", selectedDate, "formateado:", format(selectedDate, 'dd/MM/yyyy', { locale: es }));
  }, [selectedDate]);

  // Depuración de nonWorkingDays cuando cambia
  useEffect(() => {
    logDebug("Estado actualizado de nonWorkingDays:", nonWorkingDays);
    
    // Verificar si el sábado está incluido
    if (nonWorkingDays.includes(6)) {
      logDebug("SÁBADO está configurado como día no laborable");
    } else {
      logDebug("SÁBADO NO está configurado como día no laborable");
    }
    
    // Probar la función isNonWorkingDay con una fecha sábado
    const nextSaturday = new Date();
    while (nextSaturday.getDay() !== 6) {
      nextSaturday.setDate(nextSaturday.getDate() + 1);
    }
    
    logDebug(`Prueba con próximo sábado (${nextSaturday.toDateString()}):`, 
      isNonWorkingDay(nextSaturday) ? "Es día no laborable" : "NO es día no laborable");
    
  }, [nonWorkingDays, isNonWorkingDay]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBarber || !formData.time || !formData.serviceId || !formData.clientName || !formData.clientPhone) {
      toast.error("Por favor, completa todos los campos: barbero, servicio, horario, nombre y teléfono", { duration: 4000 });
      return;
    }
    setSaving(true);
    const appointmentData = {
      shopId,
      barberId: selectedBarber.id,
      barberName: selectedBarber.name,
      date: new Date(selectedDate.setHours(...formData.time.split(':').map(Number), 0, 0)),
      time: formData.time,
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      serviceId: formData.serviceId,
      serviceName: formData.serviceName,
      price: formData.price
    };
    const success = await saveAppointment(appointmentData);
    if (success) {
      setLastSelectedBarber(selectedBarber);
      setAppointmentSaved(true);
      setFormData({ clientName: '', clientPhone: '', serviceId: '', serviceName: '', price: 0, time: '' });
      setSelectedBarber(null);
      setSelectedDate(startOfDay(new Date())); // Reinicia con fecha actual normalizada
      toast.success("Cita reservada con éxito. Pendiente de aprobación.", { duration: 4000 });
    }
    setSaving(false);
  };

  const sendWhatsAppToBarber = () => {
    const barberToContact = lastSelectedBarber || selectedBarber;
    if (!barberToContact?.phone) {
      toast.error("El barbero no tiene un número de teléfono registrado.", { duration: 4000 });
      return;
    }
    const message = `Hola ${barberToContact.name}, soy ${formData.clientName}. He reservado una cita para el ${format(selectedDate, 'dd/MM/yyyy', { locale: es })} a las ${formData.time} para ${formData.serviceName}. ¡Gracias!`;
    const whatsappUrl = `https://wa.me/+57${barberToContact.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success("Mensaje enviado por WhatsApp.", { duration: 4000 });
  };

  const getNonWorkingDayMessage = () => {
    if (availableTimeSlots.length === 0 && selectedBarber) {
      const dayOfWeek = selectedDate.getDay(); // 0 = domingo, 6 = sábado
      
      // Verificar si es un día no laborable
      if (nonWorkingDays.includes(dayOfWeek)) {
        return `El barbero no trabaja los ${getDayName(dayOfWeek).toLowerCase()}. Por favor, selecciona otro día.`;
      }
      
      return "No hay horarios disponibles para esta fecha. Por favor, selecciona otro día.";
    }
    return '';
  };

  // Función para personalizar el calendario
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <div className="relative">
      <input
        value={value}
        onClick={onClick}
        ref={ref}
        readOnly
        className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3 pl-10 focus:ring-2 focus:ring-blue-500 transition duration-200 cursor-pointer"
      />
      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  ));
  
  CustomInput.displayName = 'CustomDatePickerInput';

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg shadow-lg">
          Reservar Cita
        </h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl transition-all duration-300 hover:shadow-2xl">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <User className="w-5 h-5" /> Seleccionar Barbero
              </h2>
              {barbers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay barberos disponibles.</p>
              ) : (
                <BarberSelector
                  barbers={barbers}
                  selectedBarber={selectedBarber}
                  onSelect={setSelectedBarber}
                  className="w-full"
                />
              )}
            </div>
            {selectedBarber && !appointmentSaved && (
              <>
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5" /> Seleccionar Fecha
                  </h2>
                  <div className={`${isDesktop ? 'flex items-start gap-6' : ''}`}>
                    {isDesktop ? (
                      // Versión de escritorio: Calendario al lado
                      <>
                        <div className="w-full max-w-[200px]">
                          <CustomInput 
                            value={format(selectedDate, 'dd/MM/yyyy', { locale: es })}
                            onClick={() => {}} // No hace nada, solo para mantener el estilo
                          />
                          {nonWorkingDays.length > 0 && (
                            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-md">
                              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                <span>Días no laborables:</span>
                              </div>
                              <ul className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                                {nonWorkingDays.map(day => (
                                  <li key={day} className="font-semibold">
                                    {getDayName(day)}
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                                Estos días aparecerán deshabilitados en el calendario
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="calendar-container flex-grow">
                          <DatePicker
                            selected={selectedDate}
                            onChange={(date) => {
                              const newDate = date ? startOfDay(date) : startOfDay(new Date());
                              setSelectedDate(newDate);
                            }}
                            dateFormat="dd/MM/yyyy"
                            locale={es}
                            minDate={new Date()}
                            maxDate={addMonths(new Date(), 3)}
                            inline
                            calendarClassName="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2"
                            dayClassName={date => {
                              // Verificar si es un día no laborable
                              if (isNonWorkingDay(date)) {
                                return "bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 line-through";
                              }
                              // Estilo para fines de semana (si no son días no laborables)
                              return date.getDay() === 0 || date.getDay() === 6 
                                ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300" 
                                : undefined;
                            }}
                            filterDate={date => !isNonWorkingDay(date)}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            fixedHeight
                          />
                        </div>
                      </>
                    ) : (
                      // Versión móvil: Calendario emergente
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date) => {
                          const newDate = date ? startOfDay(date) : startOfDay(new Date());
                          setSelectedDate(newDate);
                        }}
                        dateFormat="dd/MM/yyyy"
                        locale={es}
                        minDate={new Date()}
                        maxDate={addMonths(new Date(), 3)}
                        customInput={<CustomInput />}
                        calendarClassName="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2"
                        dayClassName={date => {
                          // Verificar si es un día no laborable
                          if (isNonWorkingDay(date)) {
                            return "bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 line-through";
                          }
                          // Estilo para fines de semana (si no son días no laborables)
                          return date.getDay() === 0 || date.getDay() === 6 
                            ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300" 
                            : undefined;
                        }}
                        filterDate={date => !isNonWorkingDay(date)}
                        popperClassName="react-datepicker-right"
                        popperPlacement="bottom-start"
                        popperModifiers={[
                          {
                            name: "offset",
                            options: {
                              offset: [0, 10]
                            }
                          },
                          {
                            name: "preventOverflow",
                            options: {
                              rootBoundary: "viewport",
                              tether: false,
                              altAxis: true
                            }
                          }
                        ]}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        fixedHeight
                        withPortal
                      />
                    )}
                  </div>
                  {availableTimeSlots.length === 0 && selectedDate && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-md">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                        <AlertCircle className="h-5 w-5" />
                        <p>{getNonWorkingDayMessage() || "No hay horarios disponibles para esta fecha."}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5" /> Seleccionar Horario
                  </h2>
                  {availableTimeSlots.length > 0 ? (
                    <TimeSlotSelector
                      timeSlots={availableTimeSlots}
                      selectedTime={formData.time}
                      onTimeSelect={(time) => setFormData({ ...formData, time })}
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
                    />
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Selecciona un día laborable para ver los horarios disponibles.
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                    <User className="w-5 h-5" /> Detalles de la Cita
                  </h2>
                  <AppointmentForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleSubmit}
                    saving={saving}
                    services={services}
                    className="space-y-4"
                  />
                </div>
              </>
            )}
            {appointmentSaved && (
              <div className="text-center space-y-6">
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-4 animate-pulse">
                  ¡Cita reservada con éxito!
                </p>
                <button
                  onClick={sendWhatsAppToBarber}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-300 shadow-md hover:shadow-lg"
                >
                  <MessageSquare className="w-5 h-5" /> Contactar al Barbero por WhatsApp
                </button>
                <button
                  onClick={() => {
                    setAppointmentSaved(false);
                    navigate(`/book/${shopId}`);
                  }}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg"
                >
                  Reservar Otra Cita
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        
        /* Estilos adicionales para el DatePicker */
        .react-datepicker {
          font-family: inherit;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }
        
        .react-datepicker__header {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          padding-top: 0.5rem;
        }
        
        .react-datepicker__month {
          margin: 0.4rem;
        }
        
        .react-datepicker__day-name, .react-datepicker__day {
          width: 2rem;
          line-height: 2rem;
          margin: 0.2rem;
        }
        
        .react-datepicker__day--selected {
          background-color: #3b82f6 !important;
          color: white !important;
          border-radius: 50%;
        }
        
        .react-datepicker__day:hover {
          background-color: #dbeafe;
          border-radius: 50%;
        }
        
        .react-datepicker__day--disabled {
          color: #cbd5e1;
        }
        
        .react-datepicker__navigation {
          top: 0.5rem;
        }
        
        .react-datepicker__navigation--previous {
          left: 0.5rem;
        }
        
        .react-datepicker__navigation--next {
          right: 0.5rem;
        }
        
        .react-datepicker__month-dropdown-container,
        .react-datepicker__year-dropdown-container {
          margin: 0 0.5rem;
        }
        
        .react-datepicker__month-dropdown,
        .react-datepicker__year-dropdown {
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.25rem;
        }
        
        .react-datepicker__month-option,
        .react-datepicker__year-option {
          padding: 0.25rem 0.5rem;
        }
        
        .react-datepicker__month-option:hover,
        .react-datepicker__year-option:hover {
          background-color: #dbeafe;
        }
        
        /* Estilos para el contenedor cuando el calendario está inline */
        @media (min-width: 768px) {
          .calendar-container {
            margin-top: 0;
          }
          
          .react-datepicker--inline {
            display: inline-block !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
        }
        
        /* Estilos para el portal en móviles */
        .react-datepicker-portal {
          position: fixed;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.5);
          left: 0;
          top: 0;
          justify-content: center;
          align-items: center;
          display: flex;
          z-index: 9999;
        }
        
        .react-datepicker-portal .react-datepicker {
          transform: scale(1.2);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        /* Modo oscuro */
        .dark .react-datepicker {
          background-color: #1e293b;
          border-color: #475569;
        }
        
        .dark .react-datepicker__header {
          background-color: #334155;
          border-color: #475569;
        }
        
        .dark .react-datepicker__day-name, 
        .dark .react-datepicker__day {
          color: #f8fafc;
        }
        
        .dark .react-datepicker__day:hover {
          background-color: #475569;
        }
        
        .dark .react-datepicker__day--disabled {
          color: #64748b;
        }
        
        .dark .react-datepicker__month-dropdown,
        .dark .react-datepicker__year-dropdown {
          background-color: #1e293b;
          border-color: #475569;
          color: #f8fafc;
        }
        
        .dark .react-datepicker__month-option,
        .dark .react-datepicker__year-option {
          color: #f8fafc;
        }
        
        .dark .react-datepicker__month-option:hover,
        .dark .react-datepicker__year-option:hover {
          background-color: #475569;
        }
      `}</style>
    </div>
  );
};

export default AppointmentBooking;