
import React from 'react';
import { StatCardData } from '../types';

const StatsCard: React.FC<StatCardData> = ({ 
  title, 
  value, 
  trend, 
  trendLabel, 
  icon, 
  iconColor, 
  isNegative 
}) => {
  return (
    <div className="group relative flex flex-col gap-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className={`absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20`}>
        <span className={`material-symbols-outlined text-6xl ${iconColor}`}>{icon}</span>
      </div>
      
      <p className="text-sm font-medium text-slate-500">{title}</p>
      
      <div className="mt-1 flex items-baseline gap-2">
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
      </div>
      
      <div className="mt-2 flex items-center gap-1">
        <span className={`flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${
          isNegative 
            ? 'bg-red-100 text-red-600' 
            : 'bg-emerald-100 text-emerald-600'
        }`}>
          <span className="material-symbols-outlined mr-0.5 text-[14px]">
            {isNegative ? 'trending_down' : 'trending_up'}
          </span> 
          {trend}%
        </span>
        <span className="ml-1 text-xs text-slate-400">{trendLabel}</span>
      </div>
    </div>
  );
};

export default StatsCard;
