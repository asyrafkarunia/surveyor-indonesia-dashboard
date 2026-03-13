
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ActivityModal from './ActivityModal';
import EventDetailModal from './EventDetailModal';
import * as XLSX from 'xlsx';

type ViewMode = 'month' | 'week' | 'day';

const CalendarActivityScreen: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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
                                  <div className="size-4 rounded-full bg-slate-200 flex items-center justify-center text-[7px] font-black">
                                    {event.user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                  </div>
                                  <span className="text-[8px] font-bold opacity-70">{event.user.name}</span>
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
                              <div className="size-4 rounded-full bg-slate-200 flex items-center justify-center text-[7px] font-black">
                                {event.user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-[8px] font-bold opacity-70">{event.user.name}</span>
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    const weekStartStr = weekDays[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const weekEndStr = weekDays[6].toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
      <div className="flex flex-col h-full">
        {/* Week Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden shadow-sm">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-1.5 hover:text-primary transition-colors"
                title="Minggu sebelumnya"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={goToToday}
                className="border-l border-r border-slate-200 dark:border-slate-700 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-1.5 hover:text-primary transition-colors"
                title="Minggu berikutnya"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {weekStartStr} - {weekEndStr}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
          {weekDays.map((date, idx) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={idx} className="border-r border-slate-100 dark:border-slate-700 p-4 text-center">
                <div className={`text-xs font-black uppercase ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                  {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][date.getDay()]}
                </div>
                <div className={`text-lg font-black mt-1 ${isToday ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((date, idx) => {
            const dayEvents = getEventsForDate(date);
            return (
              <div key={idx} className="border-r border-b border-slate-100 dark:border-slate-700 p-2 min-h-[400px]">
                <div className="space-y-2">
                  {dayEvents.map(event => {
                    const getColorClass = (type: string) => {
                      switch (type) {
                        case 'meeting': return 'border-purple-500 bg-purple-50 text-purple-900';
                        case 'deadline': return 'border-red-500 bg-red-50 text-red-900';
                        case 'activity': return 'border-blue-500 bg-blue-50 text-blue-900';
                        default: return 'border-slate-400 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300';
                      }
                    };
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setIsDetailModalOpen(true);
                        }}
                        className={`cursor-pointer rounded-lg border-l-[3px] p-2 text-[10px] font-black hover:shadow-md hover:scale-[1.02] transition-all ${getColorClass(event.type)}`}
                        title={`${event.title} - Klik untuk detail`}
                      >
                        <p className="truncate">{event.title}</p>
                        {event.user && (
                          <div className="mt-1 flex items-center gap-1">
                            <div className="size-3 rounded-full bg-slate-200 flex items-center justify-center text-[6px] font-black">
                              {event.user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[8px] font-bold opacity-70 truncate">{event.user.name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 1);
      } else {
        newDate.setDate(prev.getDate() + 1);
      }
      return newDate;
    });
  };

  const handleDayDateSelect = (year: number, month: number, day: number) => {
    setCurrentDate(new Date(year, month - 1, day));
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    return (
      <div className="flex flex-col h-full">
        {/* Day Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden shadow-sm">
              <button
                onClick={() => navigateDay('prev')}
                className="p-1.5 hover:text-primary transition-colors"
                title="Hari sebelumnya"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={goToToday}
                className="border-l border-r border-slate-200 dark:border-slate-700 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateDay('next')}
                className="p-1.5 hover:text-primary transition-colors"
                title="Hari berikutnya"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <DayDatePicker
              currentDate={currentDate}
              onDateSelect={handleDayDateSelect}
            />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {currentDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {dayEvents.length === 0 ? (
              <div className="text-center text-slate-400 py-12">
                <p className="text-sm">Tidak ada aktivitas untuk hari ini</p>
              </div>
            ) : (
              dayEvents.map(event => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(event);
                    setIsDetailModalOpen(true);
                  }}
                  className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all"
                >
                <h4 className="font-black text-slate-900 dark:text-white">{event.title}</h4>
                {event.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">{event.description}</p>
                )}
                {event.start_time && event.end_time && (
                  <p className="text-xs text-slate-400 mt-2">
                    {(() => {
                      try {
                        const formatTime = (time: string) => {
                          if (time.includes('T')) {
                            const date = new Date(time);
                            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                          }
                          return time.substring(0, 5);
                        };
                        return `${formatTime(event.start_time)} - ${formatTime(event.end_time)} WIB`;
                      } catch {
                        return `${event.start_time} - ${event.end_time}`;
                      }
                    })()}
                  </p>
                )}
                {!event.start_time && event.duration_days > 1 && (
                  <p className="text-xs text-slate-400 mt-2">
                    {event.duration_days} hari
                  </p>
                )}
                  {event.user && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black">
                        {event.user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{event.user.name}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
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
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Tambah Aktivitas
            </button>
          </div>
        </div>

        {/* Calendar Header */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700 p-4 gap-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden shadow-sm">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={goToToday}
                className="border-l border-r border-slate-200 dark:border-slate-700 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1.5 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <DatePicker
              currentDate={currentDate}
              onDateSelect={handleDateSelect}
            />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{formatMonthYear(currentDate)}</h3>
          </div>
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700'
                  : 'text-slate-400 hover:text-primary'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700'
                  : 'text-slate-400 hover:text-primary'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`rounded-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700'
                  : 'text-slate-400 hover:text-primary'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="flex flex-col flex-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900/20 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-slate-400">Loading...</div>
              </div>
            ) : (
              <>
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
              </>
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

// Day Date Picker Component (for Day View)
const DayDatePicker: React.FC<{
  currentDate: Date;
  onDateSelect: (year: number, month: number, day: number) => void;
}> = ({ currentDate, onDateSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate());

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 5 + i);
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedDay(currentDate.getDate());
  }, [currentDate]);

  const handleApply = () => {
    onDateSelect(selectedYear, selectedMonth, selectedDay);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm transition-colors hover:bg-slate-50 dark:bg-slate-900"
      >
        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
        <span>{selectedDay} {months[selectedMonth - 1]} {selectedYear}</span>
        <span className="material-symbols-outlined text-[18px]">expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-80 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">Tanggal</label>
              <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                      selectedDay === day
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90"
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

// Date Picker Component (for Month View)
const DatePicker: React.FC<{
  currentDate: Date;
  onDateSelect: (year: number, month: number) => void;
}> = ({ currentDate, onDateSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm transition-colors hover:bg-slate-50 dark:bg-slate-900"
      >
        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
        <span>{months[selectedMonth - 1]} {selectedYear}</span>
        <span className="material-symbols-outlined text-[18px]">expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-80 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-lg">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">Bulan</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">Tahun</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleApply}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90"
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
