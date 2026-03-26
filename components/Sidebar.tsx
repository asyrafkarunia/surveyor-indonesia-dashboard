
import React from 'react';
import { NavItem } from '../types';
import { SIDEBAR_NAV } from '../constants';
import { MarsIconLogo } from './LoginScreen';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeId: string;
  onNavigate: (id: string) => void;
  isAdmin?: boolean;
  isApprover?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, activeId, onNavigate, isAdmin = false, isApprover = false }) => {

  // Filter navigation items based on role
  const mainNavItems = SIDEBAR_NAV.filter(item => {
    // Hide settings/permissions/admin_log — now in Header dropdown
    if (['settings', 'permissions', 'admin_log'].includes(item.id)) return false;
    // Hide marketing-only items from non-marketing users
    if ((item.id === 'sph' || item.id === 'audiensi' || item.id === 'marketing_kanban' || item.id === 'essential_docs') && !isAdmin) return false;
    // Hide clients from common users
    if (item.id === 'clients' && !isAdmin && !isApprover) return false;
    // Hide approval from non-approvers
    if (item.id === 'approval' && !isApprover) return false;
    return true;
  });

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-transform lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col gap-8 p-6 flex-1 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #003868, #00B4AE)' }}>
            <MarsIconLogo className="w-7 h-7" color="white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold leading-tight text-slate-900 dark:text-white">MARS</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Marketing Analysis Report System</p>
          </div>
          <button onClick={onToggle} className="ml-auto lg:hidden text-slate-400">
             <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 rounded-r-xl px-4 py-3 transition-all duration-300 group text-left ${
                activeId === item.id 
                  ? 'bg-linear-to-r from-primary/10 to-transparent text-primary border-l-4 border-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 border-l-4 border-transparent'
              }`}
            >
              <span className={`material-symbols-outlined text-[24px] transition-transform duration-300 ${activeId === item.id ? 'fill scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className={`text-sm ${activeId === item.id ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Version Badge */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <span className="material-symbols-outlined text-[14px]">info</span>
          MARS v1.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
