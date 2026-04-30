import React, { useState, useRef, useEffect } from 'react';

interface DateRangeSelectorProps {
  startYear?: number;
  endYear?: number;
  selectedStartMonth?: number;
  selectedStartYear?: number;
  selectedEndMonth?: number;
  selectedEndYear?: number;
  onChange: (startMonth: number, startYear: number, endMonth: number, endYear: number) => void;
}

const currentYearVal = new Date().getFullYear();

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startYear = 2015,
  endYear = currentYearVal,
  selectedStartYear = currentYearVal,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate years from endYear descending to startYear
  const maxYear = Math.max(endYear, currentYearVal + 5);
  const years = Array.from({ length: maxYear - startYear + 1 }, (_, i) => maxYear - i);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleYearChange = (year: number) => {
    // Send full year range (Jan 1 - Dec 31) for that year to maintain compatibility
    onChange(1, year, 12, year);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 rounded-xl border px-5 py-2.5 text-sm font-bold shadow-sm transition-all duration-300 ${
          isOpen 
            ? 'bg-primary/10 border-primary/50 text-primary ring-4 ring-primary/10 dark:bg-primary/20 dark:border-primary/50 dark:text-primary-light' 
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-primary/30 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        <div className={`flex h-6 w-6 items-center justify-center rounded-md ${isOpen ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Filter Tahun</span>
          <span>{selectedStartYear}</span>
        </div>
        <span className={`material-symbols-outlined text-[18px] ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-slate-400'}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-1">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => handleYearChange(year)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  year === selectedStartYear
                    ? 'bg-primary text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {year}
                {year === selectedStartYear && (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;
