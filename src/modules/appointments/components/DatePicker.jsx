// src/modules/appointments/components/DatePicker.jsx
import React from 'react';
import { Calendar } from 'lucide-react';

const DatePicker = ({ selectedDate, onDateChange }) => {
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (onDateChange && !isNaN(newDate)) {
      onDateChange(newDate);
    }
  };

  return (
    <div className="relative">
      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="date"
        value={selectedDate.toISOString().split('T')[0]}
        onChange={handleDateChange}
        className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
      />
    </div>
  );
};

export default DatePicker;