
import React from 'react';

interface DayEventsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: any[];
  onSelectEvent: (event: any) => void;
}

const DayEventsListModal: React.FC<DayEventsListModalProps> = ({ 
  isOpen, 
  onClose, 
  date, 
  events,
  onSelectEvent
}) => {
  if (!isOpen || !date) return null;

  const formatDateLong = (d: Date) => {
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting': return 'Meeting';
      case 'deadline': return 'Deadline';
      case 'visit': return 'Visitasi';
      case 'inspection': return 'Inspeksi';
      case 'audit': return 'Audit';
      case 'activity': return 'Aktivitas';
      default: return type;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30';
      case 'audit': return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/30';
      case 'visit': return 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800/30';
      case 'inspection': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30';
      default: return 'bg-red-50 text-primary border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col transform overflow-hidden rounded-[2rem] bg-white dark:bg-slate-800 shadow-2xl transition-all border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-8 py-6 bg-slate-50/50 dark:bg-slate-900/20">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Agenda Hari Ini
            </h3>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">
              {formatDateLong(date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all shadow-sm active:scale-90"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/10">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
              <p className="text-xs font-bold uppercase tracking-widest">Tidak ada aktivitas</p>
            </div>
          ) : (
            events.map((event) => (
              <div 
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="group relative bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98] overflow-hidden"
              >
                {/* Type Icon/Badge */}
                <div className={`size-12 rounded-xl border flex flex-col items-center justify-center shrink-0 shadow-sm ${getTypeStyles(event.type)}`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {event.type === 'meeting' ? 'groups' : event.type === 'visit' ? 'map' : 'event_note'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${getTypeStyles(event.type)}`}>
                      {getTypeLabel(event.type)}
                    </span>
                    {event.project && (
                      <span className="text-[8px] font-bold text-slate-400 uppercase truncate max-w-[150px]">
                        • {event.project.code || event.project.title}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors text-sm mb-1">{event.title}</h4>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                        {event.user?.name?.split(' ')[0]}
                      </span>
                    </div>
                    {(event.start_time || event.time) && (
                      <div className="flex items-center gap-1 text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-[14px] opacity-70">schedule</span>
                        {event.start_time || event.time}
                        {event.end_time && ` - ${event.end_time}`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-slate-300 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>

                {/* Decorative Hover Bar */}
                <div className="absolute top-0 right-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex justify-center text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">PT Surveyor Indonesia - Agenda System</p>
        </div>
      </div>
    </div>
  );
};

export default DayEventsListModal;
