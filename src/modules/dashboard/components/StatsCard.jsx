// src/modules/dashboard/components/StatsCard.jsx
import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color = 'bg-blue-500' }) => (
  <div className={`p-6 rounded-xl shadow-xl ${color} text-white overflow-hidden relative group transition-all duration-300 hover:shadow-2xl hover:translate-y-[-5px]`}>
    {/* Fondo decorativo */}
    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150"></div>
    <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/5 transition-transform duration-500 group-hover:scale-150 group-hover:rotate-45"></div>
    
    <div className="flex items-center gap-4 relative z-10">
      {Icon && (
        <div className="bg-white/20 p-3 rounded-lg shadow-inner group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8" strokeWidth={2} />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
    
    {/* Línea decorativa */}
    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 mt-4">
      <div className="h-full bg-white/40 w-0 group-hover:w-full transition-all duration-1000"></div>
    </div>
  </div>
);

export default StatsCard;