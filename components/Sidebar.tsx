
import React, { useState, useEffect } from 'react';
import { NavItem } from '../types';
import { SIDEBAR_NAV } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeId: string;
  onNavigate: (id: string) => void;
  onLogout: () => Promise<void>;
  user?: any;
  isAdmin?: boolean;
  isApprover?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, activeId, onNavigate, onLogout, user, isAdmin = false, isApprover = false }) => {

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto-expand settings dropdown if one of its children is active
  useEffect(() => {
    if (['settings', 'permissions', 'admin_log'].includes(activeId)) {
      setIsSettingsOpen(true);
    }
  }, [activeId]);

  // Filter navigation items based on role
  const mainNavItems = SIDEBAR_NAV.filter(item => {
    if (['settings', 'permissions', 'admin_log'].includes(item.id)) return false;
    // Hide marketing-only items from non-marketing users
    if ((item.id === 'sph' || item.id === 'audiensi' || item.id === 'marketing_kanban' || item.id === 'essential_docs') && !isAdmin) return false;
    // Hide clients from common users
    if (item.id === 'clients' && !isAdmin && !isApprover) return false;
    // Hide approval from non-approvers
    if (item.id === 'approval' && !isApprover) return false;
    return true;
  });
  
  const settingsItems = SIDEBAR_NAV.filter(item => ['permissions', 'admin_log'].includes(item.id));
  const settingsParent = SIDEBAR_NAV.find(item => item.id === 'settings');

  const getUserRoleLabel = (usr: any) => {
    if (usr?.roleName) return usr.roleName;
    
    switch (usr?.role) {
      case 'head_section':
        return 'Head Section Marketing';
      case 'marketing':
        return 'Marketing Staff';
      case 'senior_manager':
        return 'Senior Manager';
      case 'general_manager':
        return 'General Manager';
      case 'approver':
        return 'Senior Manager / General Manager';
      default:
        return 'Umum';
    }
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-transform lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col gap-8 p-6 flex-1 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-slate-100 border border-slate-200">
            <div 
              className="absolute inset-0 bg-center bg-cover" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCSERvJ1idddmJjE2gASHfL72NSzlW3Yh_rF78kx3XZlx4gkTviXNQh-_Bh2_c3K4CgrHPygE6D9xseLWU9wUQS6-HN2G-6JTikV2i74m3YwcDtu_ncu9DUuQ-srBWQi3SBQbD0BAWXBe_fFNxm37rY5f0MJW76PiK20Vfjeli80e746F3YnJtHp6D4mFvTOkXhFMNfzS2Irip6Z0oweY7TfTob1c-zLI2WzFti7CzoD4uDDWC_pxnmR9yhPpLrqQFXZ4hRhr19WWI")' }}
            ></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold leading-tight text-slate-900">PT Surveyor Indonesia</h1>
            <p className="text-xs text-slate-500">Admin Console</p>
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group text-left ${
                activeId === item.id 
                  ? 'bg-red-50 dark:bg-red-900/20 text-primary' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${activeId === item.id ? 'fill' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-sm ${activeId === item.id ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </button>
          ))}

          {/* Settings Group with Dropdown */}
          {settingsParent && (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  if (isAdmin) {
                    setIsSettingsOpen(!isSettingsOpen);
                  } else {
                    onNavigate('settings');
                  }
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group text-left w-full ${
                  activeId === 'settings' 
                    ? 'bg-red-50 dark:bg-red-900/20 text-primary' 
                    : ['permissions', 'admin_log'].includes(activeId) 
                      ? 'text-primary' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span className={`material-symbols-outlined text-[24px] ${activeId === 'settings' || isSettingsOpen ? 'fill' : ''}`}>
                  {settingsParent.icon}
                </span>
                <span className={`text-sm flex-1 ${activeId === 'settings' ? 'font-bold' : 'font-medium'}`}>{settingsParent.label}</span>
                {isAdmin && (
                  <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                )}
              </button>

              {/* Dropdown Items */}
              {isAdmin && isSettingsOpen && (
                <div className="flex flex-col gap-1 ml-9 mt-1 animate-in slide-in-from-top-2 duration-200">
                   <button
                    onClick={() => onNavigate('settings')}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-left ${
                      activeId === 'settings' ? 'text-primary font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-xs">Profil Saya</span>
                  </button>
                  {settingsItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-left ${
                        activeId === item.id 
                          ? 'text-primary font-bold' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-700 p-3 bg-slate-50/50 dark:bg-slate-800/50">
          <div 
            className="flex flex-1 items-center gap-3 overflow-hidden cursor-pointer group" 
            onClick={() => onNavigate('settings')}
          >
            <div className="size-9 rounded-full bg-cover bg-center border border-slate-200" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCgDCf55ND08WPg8DubqFZ9EGK8cCH16t9LrzzV-7wZDo_29Xq073BDudx1oTlS6RIpF8LFCTng3lIqAiP3HnOMBNDpC76-4TdqHKzGXr_G2ltU1Dw_WKRyFgZz8vf2q65awbNyd5kRdZSYtH2psc_YFPhkCresYvPI49UuOGc7BfQdrBrkodQ837ZgLBj2clgyTfXEJ7g0OL5qIp1QuLpFlGBH7FMjEMUbetTf51jrGywSuggrjJb8CdmF4cCPwey1abOoRkcIkg8")' }}></div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{user?.name || 'User'}</p>
              <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{getUserRoleLabel(user)}</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              try {
                await onLogout();
              } catch (error) {
                console.error('Logout error:', error);
              }
            }}
            className="text-slate-400 dark:text-slate-500 hover:text-primary transition-colors"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
