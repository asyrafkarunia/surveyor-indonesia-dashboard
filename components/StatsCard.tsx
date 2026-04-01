
import React from 'react';
import { StatCardData } from '../types';

const StatsCard: React.FC<StatCardData> = ({ 
  title, 
  value, 
  trend = 0, 
  trendLabel, 
  icon, 
  iconColor = 'text-primary', 
  isNegative: isNegativeProp,
  subValue,
  subValueColor = 'text-slate-500'
}) => {
  // Automatically determine if negative if not explicitly provided
  // If trend is negative (e.g., -5.2), it's negative.
  // If explicitly set, use that (useful if higher number = bad, like "Klien Non-Aktif")
  const isNegative = isNegativeProp !== undefined ? isNegativeProp : trend < 0;
  const isNeutral = trend === 0;
  
  // Dynamic styling based on trend
  const trendBg = isNeutral ? 'bg-slate-100 dark:bg-slate-700/50' : isNegative ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';
  const trendText = isNeutral ? 'text-slate-500 dark:text-slate-400' : isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
  const trendIcon = isNeutral ? 'remove' : isNegative ? 'trending_down' : 'trending_up';

  // Helper to get background color for the icon container
  const getIconBg = (color: string) => {
    if (color.includes('primary')) return 'bg-primary/10';
    if (color.includes('emerald')) return 'bg-emerald-50';
    if (color.includes('blue')) return 'bg-blue-50';
    if (color.includes('amber')) return 'bg-amber-50';
    if (color.includes('purple')) return 'bg-purple-50';
    return 'bg-slate-50';
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20">
      {/* Decorative background icon */}
      <div className={`absolute -right-2 -top-2 p-4 opacity-[0.03] transition-all duration-500 group-hover:opacity-[0.08] group-hover:scale-110 group-hover:-rotate-12`}>
        <span className={`material-symbols-outlined text-8xl ${iconColor}`}>{icon}</span>
      </div>
      
      <div className="flex items-start justify-between mb-2 relative z-10">
        <div className="space-y-1 overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 truncate">{title}</p>
          <div className="flex flex-col">
            <h4 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-300 truncate">
              {value}
            </h4>
            {subValue && (
              <span className={`text-[10px] font-bold mt-0.5 ${subValueColor} opacity-90 transition-all duration-300 group-hover:opacity-100`}>
                {subValue}
              </span>
            )}
          </div>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getIconBg(iconColor)} dark:bg-slate-700/50 transition-transform duration-300 group-hover:scale-110 shadow-sm border border-transparent group-hover:border-white/20`}>
          <span className={`material-symbols-outlined text-xl ${iconColor}`}>{icon}</span>
        </div>
      </div>
      
      <div className="mt-auto flex items-center gap-2 relative z-10 pt-2">
        <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black tracking-tight transition-colors duration-300 ${trendBg} ${trendText}`}>
          <span className="material-symbols-outlined text-[14px]">
            {trendIcon}
          </span> 
          {Math.abs(trend)}%
        </div>
        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 opacity-80 line-clamp-1">{trendLabel}</span>
      </div>
      
      {/* Bottom accent bar that appears on hover */}
      <div className={`absolute bottom-0 left-0 h-1 w-0 bg-linear-to-r from-primary to-cyan-400 transition-all duration-500 group-hover:w-full`}></div>
    </div>
  );
};

export default StatsCard;
