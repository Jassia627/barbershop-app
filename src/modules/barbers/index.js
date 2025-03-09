// src/modules/barbers/index.js
export { default as BarbersManagement } from './pages/BarbersManagement';
export { default as Profile } from './pages/Profile';
export { default as ScheduleManagement } from './pages/ScheduleManagement';
export { default as BarberCard } from './components/BarberCard';
export { default as BarberStatus } from './components/BarberStatus';
export { default as BarberForm } from './components/BarberForm';
export { default as ScheduleForm } from './components/ScheduleForm';
export * from './services/barberService';
export * from './hooks/useBarbers';