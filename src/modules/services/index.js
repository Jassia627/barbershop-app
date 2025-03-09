// src/modules/services/index.js
export { default as ServicesManagement } from './pages/ServicesManagement';
export { default as NewHaircut } from './pages/NewHaircut';
export { default as AdminNewHaircut } from './pages/AdminNewHaircut';
export { default as PendingHaircuts } from './pages/PendingHaircuts';
export { default as BarberHaircutHistory } from './pages/BarberHaircutHistory';
export { default as ServiceCard } from './components/ServiceCard';
export { default as ServiceForm } from './components/ServiceForm';
export { default as ServiceSelect } from './components/ServiceSelect';
export { default as HaircutCard } from './components/HaircutCard';
export * from './services/serviceService';
export * from './hooks/useServices';