
import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

interface HeaderProps {
  onMenuClick: () => void;
  onNotificationClick: () => void;
  activeId: string;
  user?: any;
  onProfileClick?: () => void;
  onProjectSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onNotificationClick, activeId, user, onProfileClick, onProjectSearch }) => {
  const { unreadCount } = useNotification();
  const [projectSearch, setProjectSearch] = React.useState('');

  const handleProjectSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onProjectSearch) {
      const trimmed = projectSearch.trim();
      onProjectSearch(trimmed);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 dark:bg-slate-800/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeId === 'notifications' ? 'Notifikasi' : 'Overview'}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 sm:flex w-64">
          <span className="material-symbols-outlined text-[20px] text-slate-400 dark:text-slate-400">search</span>
          <input
            type="text"
            placeholder="Search projects..."
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            onKeyDown={handleProjectSearchKeyDown}
            className="w-full border-none bg-transparent p-0 text-sm placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white focus:ring-0"
          />
        </div>

        <div 
          onClick={onNotificationClick}
          className={`relative cursor-pointer rounded-lg p-2 transition-colors ${activeId === 'notifications' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
        >
          <span className={`material-symbols-outlined text-[22px] ${activeId === 'notifications' ? 'fill' : ''}`}>notifications</span>
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

        <div className="mx-1 h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={onProfileClick}
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.division || user?.role || 'User'}
            </p>
          </div>
          <div className="size-9 overflow-hidden rounded-full border-2 border-slate-100 dark:border-slate-700 bg-slate-200 dark:bg-slate-700 shadow-sm">
            <img 
              src="https://picsum.photos/seed/admin/100/100" 
              alt="Profile" 
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
