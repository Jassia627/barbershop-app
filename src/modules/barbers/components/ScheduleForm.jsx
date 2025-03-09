// src/modules/barbers/components/ScheduleForm.jsx
import React from 'react';
import { Clock, CalendarOff } from 'lucide-react';

const daysOfWeek = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const ScheduleForm = ({ formData, setFormData, onSubmit, saving }) => {
  const toggleDayOff = (day) => {
    const daysOff = formData.daysOff.includes(day)
      ? formData.daysOff.filter(d => d !== day)
      : [...formData.daysOff, day];
    setFormData({ ...formData, daysOff });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora de Inicio</label>
        <div className="relative mt-1">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora de Fin</label>
        <div className="relative mt-1">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Días No Laborables</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {daysOfWeek.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDayOff(day)}
              className={`px-3 py-1 rounded-md ${formData.daysOff.includes(day) ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white'}`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar Horario'}
      </button>
    </form>
  );
};

export default ScheduleForm;