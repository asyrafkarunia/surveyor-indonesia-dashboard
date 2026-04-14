
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ActivityModal from './ActivityModal';
import EventDetailModal from './EventDetailModal';
import * as XLSX from 'xlsx';



interface CalendarActivityScreenProps {
  initialEventId?: number | null;
  onInitialEventHandled?: () => void;
}

const CalendarActivityScreen: React.FC<CalendarActivityScreenProps> = ({ 
  initialEventId, 
  onInitialEventHandled 
}) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (initialEventId && !loading && events.length > 0) {
      const event = events.find(e => e.id === initialEventId);
      if (event) {
        setSelectedEvent(event);
        setIsDetailModalOpen(true);
        if (onInitialEventHandled) {
          onInitialEventHandled();
        }
      }
    }
  }, [initialEventId, loading, events]);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  useEffect(() => {
    fetchEvents();
  }, [currentYear, currentMonth]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);
      const data = await api.getCalendarEvents({
        start: formatDateLocal(startDate),
        end: formatDateLocal(endDate),
      });
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateSelect = (year: number, month: number) => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const formatMonthYear = (date: Date) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Helper function to format date to YYYY-MM-DD in local timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleExport = async () => {
    try {
      // Fetch all events for current month
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);
      const allEvents = await api.getCalendarEvents({
        start: formatDateLocal(startDate),
        end: formatDateLocal(endDate),
      }) as any[];

      // Prepare data for Excel
      const exportData = (allEvents || []).map((event: any) => {
        const startDate = event.date ? new Date(event.date + 'T00:00:00') : null;
        const endDate = event.end_date ? new Date(event.end_date + 'T00:00:00') : null;
        
        const getTypeLabel = (type: string) => {
          switch (type) {
            case 'meeting': return 'Meeting';
            case 'deadline': return 'Deadline';
            case 'activity': return 'Aktivitas';
            case 'other': return 'Lainnya';
            default: return type;
          }
        };

        return {
          'Nama Aktivitas': event.title || '-',
          'Deskripsi': event.description || '-',
          'Tipe': getTypeLabel(event.type || 'activity'),
          'Tanggal Mulai': startDate ? startDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }) : '-',
          'Tanggal Selesai': endDate ? endDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }) : '-',
          'Waktu Mulai': event.start_time || '-',
          'Waktu Selesai': event.end_time || '-',
          'PIC': event.user?.name || '-',
          'Email PIC': event.user?.email || '-',
          'Proyek': event.project ? `${event.project.code} - ${event.project.title}` : '-',
          'Berulang': event.is_recurring ? 'Ya' : 'Tidak',
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Aktivitas Kalender');

      // Set column widths
      const colWidths = [
        { wch: 30 }, // Nama Aktivitas
        { wch: 40 }, // Deskripsi
        { wch: 15 }, // Tipe
        { wch: 25 }, // Tanggal Mulai
        { wch: 25 }, // Tanggal Selesai
        { wch: 15 }, // Waktu Mulai
        { wch: 15 }, // Waktu Selesai
        { wch: 25 }, // PIC
        { wch: 30 }, // Email PIC
        { wch: 30 }, // Proyek
        { wch: 12 }, // Berulang
      ];
      ws['!cols'] = colWidths;

      // Generate filename
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const filename = `Kalender_Aktivitas_${monthNames[currentMonth - 1]}_${currentYear}.xlsx`;

      // Export to file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Gagal mengekspor data. Silakan coba lagi.');
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDateLocal(date);
    return events.filter(event => {
      // Parse event date in local timezone
      const eventDateStr = event.date.includes('T') ? event.date.split('T')[0] : event.date;
      const eventStart = new Date(eventDateStr + 'T00:00:00');
      const eventEnd = event.end_date ? new Date((event.end_date.includes('T') ? event.end_date.split('T')[0] : event.end_date) + 'T00:00:00') : eventStart;
      const checkDate = new Date(dateStr + 'T00:00:00');
      
      // Compare dates only (ignore time)
      const checkDateOnly = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      const eventStartOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
      const eventEndOnly = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
      
      return checkDateOnly >= eventStartOnly && checkDateOnly <= eventEndOnly;
    });
  };

  const isDateInRange = (date: Date, startDate: Date, endDate: Date) => {
    return date >= startDate && date <= endDate;
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return (
      <div className="grid grid-cols-7 bg-white dark:bg-slate-800 min-w-[1000px]">
        {/* Days Header */}
        {dayNames.map(day => (
          <div key={day} className="border-b border-r border-slate-100 dark:border-slate-700 py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 dark:bg-slate-900/50">
            {day.substring(0, 3)}
          </div>
        ))}

        {/* Calendar Cells */}
        {days.map((day, idx) => {
          const cellDate = day ? new Date(currentYear, currentMonth - 1, day) : null;
          const isToday = cellDate && 
            cellDate.getDate() === new Date().getDate() &&
            cellDate.getMonth() === new Date().getMonth() &&
            cellDate.getFullYear() === new Date().getFullYear();
          const dayEvents = cellDate ? getEventsForDate(cellDate) : [];

          return (
            <div
              key={idx}
              className={`group relative min-h-[140px] border-b border-r border-slate-100 dark:border-slate-700 p-2 transition-colors hover:bg-slate-50 dark:bg-slate-900/50 ${
                !day ? 'bg-slate-50 dark:bg-slate-900/30 text-slate-300' : 'text-slate-900 dark:text-white'
              }`}
            >
              {day && (
                <>
                  <span className={`block text-right text-xs font-black mb-1 ${isToday ? 'text-primary' : ''}`}>
                    {day}
                  </span>

                  {/* Add button */}
                  <button
                    onClick={() => {
                      setSelectedDate(cellDate);
                      setIsModalOpen(true);
                    }}
                    className="absolute left-2 top-2 hidden size-6 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary-dark group-hover:flex transition-all active:scale-90"
                    title="Tambah aktivitas"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>

                  {/* Events */}
                  <div className="mt-2 space-y-1.5">
                    {dayEvents.map(event => {
                      // Parse event dates in local timezone
                      const eventDateStr = event.date.includes('T') ? event.date.split('T')[0] : event.date;
                      const eventEndDateStr = event.end_date ? (event.end_date.includes('T') ? event.end_date.split('T')[0] : event.end_date) : eventDateStr;
                      
                      const eventStart = new Date(eventDateStr + 'T00:00:00');
                      const eventEnd = new Date(eventEndDateStr + 'T00:00:00');
                      const checkDate = new Date(cellDate!.getFullYear(), cellDate!.getMonth(), cellDate!.getDate());
                      
                      // Compare dates only (ignore time)
                      const checkDateOnly = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
                      const eventStartOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
                      const eventEndOnly = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
                      
                      const isStart = checkDateOnly.getTime() === eventStartOnly.getTime();
                      const isEnd = checkDateOnly.getTime() === eventEndOnly.getTime();
                      const isInRange = checkDateOnly > eventStartOnly && checkDateOnly < eventEndOnly;
                      const duration = Math.ceil((eventEndOnly.getTime() - eventStartOnly.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                      const getColorClass = (type: string) => {
                        switch (type) {
                          case 'meeting': return 'border-purple-500 bg-purple-50 text-purple-900';
                          case 'deadline': return 'border-red-500 bg-red-50 text-red-900';
                          case 'activity': return 'border-blue-500 bg-blue-50 text-blue-900';
                          default: return 'border-slate-400 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300';
                        }
                      };

                      // For multi-day events, show different UI
                      if (duration > 1) {
                        if (isStart) {
                          // Show full event card at start
                          return (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                setIsDetailModalOpen(true);
                              }}
                              className={`cursor-pointer rounded-lg border-l-[3px] p-2 hover:shadow-md hover:scale-[1.02] transition-all text-[10px] font-black uppercase tracking-tight ${getColorClass(event.type)}`}
                              title={`${event.title} - Klik untuk detail`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="truncate">{event.title}</p>
                                <span className="text-[8px] font-bold opacity-70">{duration} hari</span>
                              </div>
                              {event.user && (
                                <div className="mt-1 flex items-center gap-1">
                                  <div className="size-4 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-[7px] font-black shrink-0 border border-white/20">
                                    {event.user.avatar ? (
                                      <img src={event.user.avatar} alt={event.user.name} className="size-full object-cover" />
                                    ) : (
                                      event.user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <span className="text-[8px] font-bold opacity-70 truncate">{event.user.name}</span>
                                </div>
                              )}
                            </div>
                          );
                        } else if (isInRange || isEnd) {
                          // Show continuation bar for middle/end days
                          return (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                setIsDetailModalOpen(true);
                              }}
                              className={`cursor-pointer rounded-lg border-l-[3px] p-1 hover:shadow-md hover:scale-[1.02] transition-all ${getColorClass(event.type)}`}
                              title={`${event.title} - Klik untuk detail`}
                            >
                              <div className="h-2 bg-current opacity-30 rounded"></div>
                            </div>
                          );
                        }
                      }

                      // Single day event
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setIsDetailModalOpen(true);
                          }}
                          className={`cursor-pointer rounded-lg border-l-[3px] p-2 hover:shadow-md hover:scale-[1.02] transition-all text-[10px] font-black uppercase tracking-tight ${getColorClass(event.type)}`}
                          title={`${event.title} - Klik untuk detail`}
                        >
                          <p className="truncate">{event.title}</p>
                          {event.user && (
                            <div className="mt-1 flex items-center gap-1">
                              <div className="size-4 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-[7px] font-black shrink-0 border border-white/20">
                                {event.user.avatar ? (
                                  <img src={event.user.avatar} alt={event.user.name} className="size-full object-cover" />
                                ) : (
                                  event.user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <span className="text-[8px] font-bold opacity-70 truncate">{event.user.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

return (
    <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 custom-scrollbar">
      <div className="flex flex-1 flex-col gap-6 p-6 lg:p-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">Kalender Aktivitas</h2>
            <p className="mt-2 text-base text-slate-500 dark:text-slate-400 font-medium">Pantau jadwal, deadline tender, dan kolaborasi pemasaran.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="group flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors hover:border-primary hover:text-primary shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">file_download</span>
              <span className="hidden sm:inline uppercase tracking-widest text-[10px]">Export</span>
            </button>
            <button
              onClick={() => {
                setSelectedDate(null);
                setIsModalOpen(true);
              }}
              id="add-event-btn"
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Tambah Aktivitas
            </button>
          </div>
        </div>

        {/* Calendar Header */}
        <div id="calendar-header" className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4 gap-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <DatePicker
              currentDate={currentDate}
              onDateSelect={handleDateSelect}
              onPrev={() => navigateMonth('prev')}
              onNext={() => navigateMonth('next')}
              onToday={goToToday}
            />
          </div>

        </div>

        {/* Calendar Content */}
        <div id="calendar-container" className="flex flex-col flex-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900/20 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-slate-400">Loading...</div>
              </div>
            ) : (
              renderMonthView()
            )}
          </div>
        </div>
      </div>

      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDate(null);
        }}
        selectedDate={selectedDate}
        onSave={() => {
          fetchEvents();
          setIsModalOpen(false);
          setSelectedDate(null);
        }}
      />

      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onDelete={() => {
          fetchEvents();
        }}
      />
    </main>
  );
};


// Date Picker Component (for Month View)
const DatePicker: React.FC<{
  currentDate: Date;
  onDateSelect: (year: number, month: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}> = ({ currentDate, onDateSelect, onPrev, onNext, onToday }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedYear(currentDate.getFullYear());
  }, [currentDate]);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 5 + i);

  const handleApply = () => {
    onDateSelect(selectedYear, selectedMonth);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        {/* Prev Button */}
        <button
          onClick={onPrev}
          className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-colors border-r border-slate-100 dark:border-slate-700/50"
          title="Bulan Sebelumnya"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        {/* Today Button */}
        <button
          onClick={onToday}
          className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-primary transition-colors border-r border-slate-100 dark:border-slate-700/50"
          title="Hari Ini"
        >
          <span className="material-symbols-outlined text-[20px]">calendar_today</span>
        </button>

        {/* Month Year Display / Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <span className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {/* Next Button */}
        <button
          onClick={onNext}
          className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-colors border-l border-slate-100 dark:border-slate-700/50"
          title="Bulan Berikutnya"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-3 w-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Bulan</label>
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMonth(index + 1)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      selectedMonth === index + 1
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {month.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Tahun</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full rounded-xl border-none bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleApply}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-transform active:scale-95"
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

export default CalendarActivityScreen;
