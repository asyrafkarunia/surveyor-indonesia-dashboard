
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
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col transition-transform lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ background: 'linear-gradient(180deg, #0d2137 0%, #0f2a43 60%, #0a1e32 100%)' }}
    >
      <div className="flex flex-col gap-8 p-6 flex-1 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #003868, #00B4AE)' }}>
            <MarsIconLogo className="w-7 h-7" color="white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold leading-tight text-white">MARS</h1>
            <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>Marketing Analysis Report System</p>
          </div>
          <button onClick={onToggle} className="ml-auto lg:hidden" style={{ color: 'rgba(255,255,255,0.5)' }} aria-label="Tutup menu navigasi">
             <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1" aria-label="Navigasi Utama">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 group text-left ${
                activeId === item.id 
                  ? 'shadow-md' 
                  : 'border-transparent hover:bg-white/8'
              }`}
              style={activeId === item.id
                ? { background: 'linear-gradient(135deg, rgba(0,180,174,0.22), rgba(0,56,104,0.18))', color: '#00B4AE', borderLeft: '3px solid #00B4AE' }
                : { color: 'rgba(255,255,255,0.55)' }
              }
            >
              <span className={`material-symbols-outlined text-[22px] transition-transform duration-200 ${activeId === item.id ? 'fill scale-110' : 'group-hover:scale-105'}`}>
                {item.icon}
              </span>
              <span className={`text-sm ${activeId === item.id ? 'font-bold' : 'font-medium'}`} style={{ color: activeId === item.id ? '#00B4AE' : 'inherit' }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Version Badge */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <span className="material-symbols-outlined text-[14px]">info</span>
          MARS v1.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
