
import React from 'react';
import { RECENT_ACTIVITIES } from '../constants';

const ActivityTimeline: React.FC = () => {
  const getIcon = (type: string) => {
    switch(type) {
      case 'update': return { icon: 'edit_document', bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'complete': return { icon: 'check_circle', bg: 'bg-green-100', text: 'text-green-600' };
      case 'alert': return { icon: 'warning', bg: 'bg-amber-100', text: 'text-amber-600' };
      case 'create': return { icon: 'add', bg: 'bg-slate-100', text: 'text-slate-600 dark:text-slate-300' };
      default: return { icon: 'info', bg: 'bg-slate-100', text: 'text-slate-600 dark:text-slate-300' };
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {RECENT_ACTIVITIES.map((activity, idx) => {
        const { icon, bg, text } = getIcon(activity.type);
        return (
          <div key={activity.id} className="relative flex gap-4 pl-6">
            {/* Timeline Line */}
            {idx !== RECENT_ACTIVITIES.length - 1 && (
              <div className="absolute left-[11px] top-8 h-full w-[2px] bg-slate-100"></div>
            )}
            
            {/* Timeline Dot/Icon */}
            <div className={`absolute left-0 flex size-[24px] items-center justify-center rounded-full ring-4 ring-white ${bg} ${text}`}>
              <span className="material-symbols-outlined text-[14px]">{icon}</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{activity.user}</h4>
                {activity.tag && (
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                    {activity.tag}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {activity.action} <span className="font-medium text-slate-700 dark:text-slate-200">{activity.target}</span>.
              </p>
              <time className="mt-2 block text-[11px] text-slate-400">{activity.time}</time>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
