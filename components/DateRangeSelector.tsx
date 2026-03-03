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
  selectedStartMonth = 1,
  selectedStartYear = currentYearVal,
  selectedEndMonth = 12,
  selectedEndYear = currentYearVal,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Local state for buffering changes
  const [tempStartMonth, setTempStartMonth] = useState(selectedStartMonth);
  const [tempStartYear, setTempStartYear] = useState(selectedStartYear);
  const [tempEndMonth, setTempEndMonth] = useState(selectedEndMonth);
  const [tempEndYear, setTempEndYear] = useState(selectedEndYear);

  useEffect(() => {
    if (isOpen) {
      setTempStartMonth(selectedStartMonth);
      setTempStartYear(selectedStartYear);
      setTempEndMonth(selectedEndMonth);
      setTempEndYear(selectedEndYear);
    }
  }, [isOpen, selectedStartMonth, selectedStartYear, selectedEndMonth, selectedEndYear]);


  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const years = Array.from({ length: Math.max(endYear, currentYearVal + 5) - startYear + 1 }, (_, i) => startYear + i);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartMonthChange = (month: number) => {
    let newEndMonth = tempEndMonth;
    let newEndYear = tempEndYear;
    
    // If start date is after end date, adjust end date
    if (tempStartYear > tempEndYear || 
        (tempStartYear === tempEndYear && month > tempEndMonth)) {
      newEndMonth = month;
      newEndYear = tempStartYear;
    }
    
    setTempStartMonth(month);
    setTempEndMonth(newEndMonth);
    setTempEndYear(newEndYear);
  };

  const handleStartYearChange = (year: number) => {
    let newEndMonth = tempEndMonth;
    let newEndYear = tempEndYear;
    
    // If start date is after end date, adjust end date
    if (year > tempEndYear || 
        (year === tempEndYear && tempStartMonth > tempEndMonth)) {
      newEndMonth = tempStartMonth;
      newEndYear = year;
    }
    
    setTempStartYear(year);
    setTempEndMonth(newEndMonth);
    setTempEndYear(newEndYear);
  };

  const handleEndMonthChange = (month: number) => {
    let newStartMonth = tempStartMonth;
    let newStartYear = tempStartYear;
    
    // If end date is before start date, adjust start date
    if (tempEndYear < tempStartYear || 
        (tempEndYear === tempStartYear && month < tempStartMonth)) {
      newStartMonth = month;
      newStartYear = tempEndYear;
    }
    
    setTempEndMonth(month);
    setTempStartMonth(newStartMonth);
    setTempStartYear(newStartYear);
  };

  const handleEndYearChange = (year: number) => {
    let newStartMonth = tempStartMonth;
    let newStartYear = tempStartYear;
    
    // If end date is before start date, adjust start date
    if (year < tempStartYear || 
        (year === tempStartYear && tempEndMonth < tempStartMonth)) {
      newStartMonth = tempEndMonth;
      newStartYear = year;
    }
    
    setTempEndYear(year);
    setTempStartMonth(newStartMonth);
    setTempStartYear(newStartYear);
  };

  const handleApply = () => {
    onChange(tempStartMonth, tempStartYear, tempEndMonth, tempEndYear);
    setIsOpen(false);
  };


  const formatDisplay = () => {
    return `${shortMonths[selectedStartMonth - 1]} ${selectedStartYear} - ${shortMonths[selectedEndMonth - 1]} ${selectedEndYear}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      >
        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
        <span>{formatDisplay()}</span>
        <span className={`material-symbols-outlined text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
          <div className="space-y-4">
            {/* Start Date */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">Dari</label>
              <div className="flex gap-2">
                <select
                  value={tempStartMonth}
                  onChange={(e) => handleStartMonthChange(Number(e.target.value))}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={tempStartYear}
                  onChange={(e) => handleStartYearChange(Number(e.target.value))}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">Sampai</label>
              <div className="flex gap-2">
                <select
                  value={tempEndMonth}
                  onChange={(e) => handleEndMonthChange(Number(e.target.value))}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={tempEndYear}
                  onChange={(e) => handleEndYearChange(Number(e.target.value))}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => {
                  const currentYear = new Date().getFullYear();
                  onChange(1, currentYear, 12, currentYear);
                  setIsOpen(false);
                }}
                className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                Tahun Ini
              </button>
              <button
                onClick={() => {
                  const lastYear = new Date().getFullYear() - 1;
                  onChange(1, lastYear, 12, lastYear);
                  setIsOpen(false);
                }}
                className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                Tahun Lalu
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;
