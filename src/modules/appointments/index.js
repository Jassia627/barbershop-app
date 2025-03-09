// src/modules/appointments/index.js
export { default as AppointmentBooking } from './pages/AppointmentBooking';
export { default as AppointmentsManagement } from './pages/AppointmentsManagement';
export { default as BarberAppointments } from './pages/BarberAppointments';
export { default as AppointmentForm } from './components/AppointmentForm';
export { default as BarberSelector } from './components/BarberSelector';
export { default as DatePicker } from './components/DatePicker';
export { default as TimeSlotSelector } from './components/TimeSlotSelector';
export { default as AppointmentCard } from './components/AppointmentCard';
export * from './services/appointmentService';
export * from './hooks/useAppointments';