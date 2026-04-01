import React, { useState, useRef, useEffect } from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | FilterOption)[];
  icon: string;
  placeholder?: string;
  className?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  icon,
  placeholder,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = options.find(opt => {
    if (typeof opt === 'string') return opt === value;
    return opt.value === value;
  });

  const displayLabel = typeof currentOption === 'string' 
    ? currentOption 
    : (currentOption?.label || value);

  return (
    <div className={`relative flex-1 min-w-[140px] max-w-[200px] ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl border transition-all duration-300
          ${isOpen 
            ? 'bg-teal-50/50 dark:bg-teal-900/10 border-teal-500/50 shadow-lg ring-4 ring-teal-500/10' 
            : value 
              ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/40' 
              : 'bg-white dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-teal-200/60'
          }
        `}
        title={label}
      >
        <span className={`material-symbols-outlined text-[18px] transition-colors duration-300 
          ${isOpen ? 'text-teal-600' : value ? 'text-emerald-600' : 'text-slate-400'}`}>
          {icon}
        </span>
        <div className="flex flex-col items-start truncate overflow-hidden">
          <span className={`text-[9px] font-black uppercase tracking-widest leading-none mb-0.5
            ${isOpen ? 'text-teal-500' : value ? 'text-emerald-500' : 'text-slate-400'}`}>
            {label}
          </span>
          <span className={`text-[13px] font-bold truncate w-full text-left 
            ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
            {displayLabel || `Semua`}
          </span>
        </div>
        <span className={`material-symbols-outlined text-[18px] ml-auto transition-transform duration-300 
          ${isOpen ? 'rotate-180 text-teal-500' : 'text-slate-300'}`}>
          expand_more
        </span>
      </button>

      {/* Dropdown Menu */}
      <div className={`
        absolute left-0 mt-3 min-w-full w-max max-w-[260px] bg-white/95 dark:bg-slate-800/95 
        backdrop-blur-xl border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-50 
        overflow-hidden origin-top transition-all duration-300
        ${isOpen 
          ? 'opacity-100 scale-100 translate-y-0 visible' 
          : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
        }
      `}>
        <div className="py-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          {/* Default/All Option */}
          <button
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className={`
              w-full text-left px-4 py-2.5 text-[13px] font-bold transition-colors
              ${!value ? 'bg-teal-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-900/20'}
            `}
          >
            Semua {label}
          </button>
          
          <div className="h-px bg-slate-50 dark:bg-slate-700/50 my-1"></div>

          {options.map((opt, idx) => {
            const optVal = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            
            if (!optVal) return null;

            return (
              <button
                key={idx}
                onClick={() => {
                  onChange(optVal);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-4 py-3 text-[13px] font-bold transition-colors
                  ${value === optVal 
                    ? 'bg-teal-500 text-white' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                  }
                `}
              >
                {optLabel}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FilterSelect;
