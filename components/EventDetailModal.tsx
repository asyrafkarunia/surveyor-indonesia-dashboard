
import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any | null;
  onDelete?: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ isOpen, onClose, event, onDelete }) => {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const isOwner = user && event && event.user_id === user.id;

  if (!isOpen || !event) return null;

  const handleDelete = async () => {
    if (!event || !isOwner) return;
    
    if (!confirm('Apakah Anda yakin ingin menghapus aktivitas ini?')) {
      return;
    }

    setDeleting(true);
    try {
      await api.deleteCalendarEvent(event.id.toString());
      if (onDelete) {
        onDelete();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      alert(error.message || 'Gagal menghapus aktivitas');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Handle ISO format with timezone
      let date: Date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString + 'T00:00:00');
      }
      
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      // Handle both "HH:mm" and "HH:mm:ss" formats, and ISO datetime strings
      let timeStr = timeString;
      
      // If it's an ISO datetime string, extract time part
      if (timeString.includes('T')) {
        const date = new Date(timeString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      
      // Handle regular time format
      const timeParts = timeStr.split(':');
      if (timeParts.length >= 2) {
        return `${timeParts[0]}:${timeParts[1]}`;
      }
      return timeString;
    } catch (e) {
      return timeString;
    }
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    if (!dateString) return '';
    try {
      let date: Date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else if (timeString) {
        date = new Date(`${dateString}T${timeString}`);
      } else {
        date = new Date(dateString + 'T00:00:00');
      }
      
      const dateStr = date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      if (timeString) {
        const timeStr = formatTime(timeString);
        return `${dateStr}, ${timeStr} WIB`;
      }
      
      return dateStr;
    } catch (e) {
      return dateString;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting': return 'Meeting';
      case 'deadline': return 'Deadline';
      case 'activity': return 'Aktivitas';
      case 'other': return 'Lainnya';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'deadline': return 'bg-red-100 text-red-700 border-red-200';
      case 'activity': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  const startDate = new Date(event.date);
  const endDate = event.end_date ? new Date(event.end_date) : startDate;
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const hasTimeRange = event.start_time && event.end_time;
  const isMultiDay = duration > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl transition-all border border-slate-100 dark:border-slate-700">
        {/* Modal Header */}
        <div className={`flex items-center justify-between border-b-4 px-6 py-5 ${getTypeColor(event.type)}`}>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800/50 border-2 border-current">
              <span className="material-symbols-outlined text-[24px]">
                {event.type === 'meeting' ? 'groups' : event.type === 'deadline' ? 'event' : 'event_note'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black text-current uppercase tracking-tight">
                {getTypeLabel(event.type)}
              </h3>
              <p className="text-xs font-bold text-current/70 uppercase tracking-wider">
                Detail Aktivitas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-current/70 hover:bg-white dark:bg-slate-800/50 hover:text-current transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 custom-scrollbar space-y-6">
          {/* Activity Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Nama Aktivitas</label>
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{event.title}</h2>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Deskripsi Aktivitas</label>
            {event.description ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 border-dashed">
                <p className="text-sm text-slate-400 italic">Tidak ada deskripsi yang ditambahkan</p>
              </div>
            )}
          </div>

          {/* PIC Information */}
          {event.user && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">PIC (Person In Charge)</label>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="size-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-primary">
                    {event.user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">{event.user.name}</p>
                  {event.user.email && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{event.user.email}</p>
                  )}
                  {event.user.division && (
                    <p className="text-xs text-slate-400 mt-0.5">{event.user.division}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Team Members Information */}
          {event.team_member_users && event.team_member_users.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Anggota Tim Terlibat</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.team_member_users.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                        {member.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date & Time Information */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Waktu Pelaksanaan</label>
            
            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">event</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Mulai</span>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{formatDate(event.date)}</p>
                {!hasTimeRange && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(event.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>

              {isMultiDay && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">event_available</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Selesai</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{formatDate(event.end_date)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(event.end_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Duration or Time Range */}
            {hasTimeRange ? (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">schedule</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Rentang Waktu</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-blue-900">
                    {formatDateTime(event.date, event.start_time)} - {formatTime(event.end_time)} WIB
                  </p>
                  <p className="text-xs text-blue-700">
                    Durasi: {(() => {
                      try {
                        const start = new Date(`${event.date}T${event.start_time}`);
                        const end = new Date(`${event.date}T${event.end_time}`);
                        const diffMs = end.getTime() - start.getTime();
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        if (diffHours > 0) {
                          return `${diffHours} jam ${diffMinutes > 0 ? `${diffMinutes} menit` : ''}`;
                        }
                        return `${diffMinutes} menit`;
                      } catch {
                        return '';
                      }
                    })()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">calendar_view_week</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Durasi</span>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {duration} {duration === 1 ? 'Hari' : 'Hari'}
                </p>
                {isMultiDay && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Aktivitas berlangsung dari {formatDate(event.date)} hingga {formatDate(event.end_date)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Project Information */}
          {event.project && (event.project.code || event.project.title) ? (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Proyek Terkait</label>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                {event.project.code && <p className="text-sm font-black text-slate-900 dark:text-white">{event.project.code}</p>}
                {event.project.title && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{event.project.title}</p>}
              </div>
            </div>
          ) : null}

          {/* Recurring Information */}
          {event.is_recurring && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Aktivitas Berulang</label>
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-purple-600 text-[18px]">update</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">Pengaturan Pengulangan</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-purple-900">
                    {event.recurring_frequency === 'daily' && 'Harian'}
                    {event.recurring_frequency === 'weekly' && 'Mingguan'}
                    {event.recurring_frequency === 'monthly' && 'Bulanan'}
                    {event.recurring_frequency === 'yearly' && 'Tahunan'}
                    {' '}setiap {event.recurring_interval}{' '}
                    {event.recurring_frequency === 'daily' && 'hari'}
                    {event.recurring_frequency === 'weekly' && 'minggu'}
                    {event.recurring_frequency === 'monthly' && 'bulan'}
                    {event.recurring_frequency === 'yearly' && 'tahun'}
                  </p>
                  {event.recurring_end_type === 'date' && event.recurring_end_date && (
                    <p className="text-xs text-purple-700">
                      Berakhir pada: {formatDate(event.recurring_end_date)}
                    </p>
                  )}
                  {event.recurring_end_type === 'count' && event.recurring_count && (
                    <p className="text-xs text-purple-700">
                      Berakhir setelah {event.recurring_count} kali
                    </p>
                  )}
                  {event.recurring_end_type === 'never' && (
                    <p className="text-xs text-purple-700">
                      Berlangsung selamanya
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-700 px-8 py-6 bg-slate-50 dark:bg-slate-900/50">
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              {deleting ? 'Menghapus...' : 'Hapus Aktivitas'}
            </button>
          )}
          <button
            onClick={onClose}
            className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors ${!isOwner ? 'mx-auto' : 'ml-auto'}`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
