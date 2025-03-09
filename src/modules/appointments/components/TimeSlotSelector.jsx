// src/modules/appointments/components/TimeSlotSelector.jsx
import React from 'react';
import { Clock } from 'lucide-react';

const TimeSlotSelector = ({ timeSlots = [], selectedTime, onTimeSelect }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {timeSlots.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No hay horarios disponibles.</p>
      ) : (
        timeSlots.map(slot => (
          <button
            key={slot}
            onClick={() => onTimeSelect(slot)}
            className={`px-3 py-1 rounded-md flex items-center gap-1 ${selectedTime === slot ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white'}`}
          >
            <Clock className="h-4 w-4" />
            {slot}
          </button>
        ))
      )}
    </div>
  );
};

export default TimeSlotSelector;