
import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useTutorial } from '../contexts/TutorialContext';
import { 
  DASHBOARD_STEPS, 
  MONITORING_STEPS, 
  PROJECT_DETAIL_STEPS,
  CALENDAR_STEPS,
  ACTIVITY_STEPS,
  CLIENTS_STEPS,
  SPH_STEPS,
  AUDIENSI_STEPS,
  KANBAN_STEPS,
  SETTINGS_STEPS,
  DOKUMEN_STEPS,
} from '../src/constants/tutorialSteps';

interface HeaderProps {
  onMenuClick: () => void;
  onNotificationClick: () => void;
  activeId: string;
  user?: any;
  onNavigate: (id: string) => void;
  onLogout: () => Promise<void>;
  isAdmin?: boolean;
  onProjectSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onNotificationClick, activeId, user, onNavigate, onLogout, isAdmin = false, onProjectSearch }) => {
  const { unreadCount } = useNotification();
  const { startTutorial, activeId: currentActiveTab } = useTutorial();
  const [projectSearch, setProjectSearch] = React.useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleProjectSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onProjectSearch) {
      const trimmed = projectSearch.trim();
      onProjectSearch(trimmed);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  const getUserRoleLabel = (usr: any) => {
    if (usr?.roleName) return usr.roleName;
    switch (usr?.role) {
      case 'head_section': return 'Head Section Marketing';
      case 'marketing': return 'Marketing Staff';
      case 'senior_manager': return 'Senior Manager';
      case 'general_manager': return 'General Manager';
      case 'approver': return 'Senior Manager / General Manager';
      default: return 'Umum';
    }
  };

  const handleNavigateFromDropdown = (id: string) => {
    onNavigate(id);
    setIsProfileOpen(false);
  };

  const handleManualTutorial = () => {
    const tutorialMap: Record<string, { id: string; steps: any[] }> = {
      dashboard:        { id: 'dashboard',     steps: DASHBOARD_STEPS },
      monitoring:       { id: 'monitoring',    steps: MONITORING_STEPS },
      project_detail:   { id: 'project_detail',steps: PROJECT_DETAIL_STEPS },
      calendar:         { id: 'calendar',      steps: CALENDAR_STEPS },
      activity:         { id: 'activity',      steps: ACTIVITY_STEPS },
      clients:          { id: 'clients',       steps: CLIENTS_STEPS },
      sph:              { id: 'sph',           steps: SPH_STEPS },
      audiensi:         { id: 'audiensi',      steps: AUDIENSI_STEPS },
      marketing_kanban: { id: 'kanban',        steps: KANBAN_STEPS },
      settings:         { id: 'settings',      steps: SETTINGS_STEPS },
      essential_docs:   { id: 'dokumen',       steps: DOKUMEN_STEPS },
    };
    const tutorial = tutorialMap[activeId];
    if (tutorial) {
      startTutorial(tutorial.id, tutorial.steps);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 backdrop-blur-md" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }}>
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <span className="material-symbols-outlined" aria-hidden="true">menu</span>
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeId === 'notifications' ? 'Notifikasi' : 'Overview'}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 transition-all duration-300 focus-within:bg-white dark:focus-within:bg-slate-700 focus-within:shadow-md focus-within:shadow-slate-200/50 dark:focus-within:shadow-slate-900/50 focus-within:ring-1 focus-within:ring-slate-200 dark:focus-within:ring-slate-600 w-64 focus-within:w-80">
          <span className="material-symbols-outlined text-[20px] text-slate-400 dark:text-slate-500 shrink-0">search</span>
          <input
            type="text"
            placeholder="Cari proyek..."
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            onKeyDown={handleProjectSearchKeyDown}
            className="w-full bg-transparent border-none outline-none p-0 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            style={{ boxShadow: 'none' }}
            aria-label="Cari proyek"
          />
          {projectSearch && (
            <button 
              onClick={() => setProjectSearch('')}
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div 
          onClick={onNotificationClick}
          className={`relative cursor-pointer rounded-lg p-2 transition-colors ${activeId === 'notifications' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          aria-label={`${unreadCount} notifikasi belum dibaca`}
          id="notification-bell"
        >
          <span className={`material-symbols-outlined text-[22px] ${activeId === 'notifications' ? 'fill' : ''}`} aria-hidden="true">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

        <button 
          onClick={handleManualTutorial}
          className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group relative"
          aria-label="Bantuan & Tutorial"
          id="help-button"
        >
          <span className="material-symbols-outlined text-[22px]">help</span>
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[10px] text-white shadow-lg">Bantuan & Tutorial</span>
        </button>

        <div className="mx-1 h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button 
            className="flex items-center gap-3 group rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
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
            <span className={`hidden sm:block material-symbols-outlined text-[18px] text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {/* Dropdown Menu */}
          <div 
            className={`absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl origin-top-right transition-all duration-200 ease-out ${
              isProfileOpen 
                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
            style={{ zIndex: 60 }}
          >
            {/* User Info Section */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="size-11 overflow-hidden rounded-full border-2 border-primary/20 bg-slate-200 dark:bg-slate-700 shadow-sm shrink-0">
                  <img 
                    src="https://picsum.photos/seed/admin/100/100" 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-primary font-semibold truncate">{getUserRoleLabel(user)}</p>
                  {user?.division && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.division}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button 
                onClick={() => handleNavigateFromDropdown('settings')}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  activeId === 'settings' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-primary' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
                Profil Saya
              </button>

              {isAdmin && (
                <>
                  <button 
                    onClick={() => handleNavigateFromDropdown('permissions')}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      activeId === 'permissions' 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-primary' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">shield_person</span>
                    Kelola Izin
                  </button>
                  <button 
                    onClick={() => handleNavigateFromDropdown('admin_log')}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      activeId === 'admin_log' 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-primary' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">history</span>
                    Log Aktivitas
                  </button>
                </>
              )}
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={async () => {
                  setIsProfileOpen(false);
                  try { await onLogout(); } catch (e) { console.error('Logout error:', e); }
                }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
