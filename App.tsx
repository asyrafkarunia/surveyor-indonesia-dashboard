
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginScreen from './components/LoginScreen';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsCard from './components/StatsCard';
import RevenueChart from './components/RevenueChart';
import ProjectTable from './components/ProjectTable';
import FeedScreen from './components/FeedScreen';
import NotificationsScreen from './components/NotificationsScreen';
import ClientsScreen from './components/ClientsScreen';
import ClientDetailScreen from './components/ClientDetailScreen';
import SphManagementScreen from './components/SphManagementScreen';
import CreateProjectScreen from './components/CreateProjectScreen';
import CreateSphWizard from './components/CreateSphWizard';
import SettingsScreen from './components/SettingsScreen';
import PermissionsScreen from './components/PermissionsScreen';
import ActivityLogScreen from './components/ActivityLogScreen';
import CreateClientWizard from './components/CreateClientWizard';
import EditClientScreen from './components/EditClientScreen';
import MarketingKanbanScreen from './components/MarketingKanbanScreen';
import CreateMarketingTaskScreen from './components/CreateMarketingTaskScreen';
import AudiensiScreen from './components/AudiensiScreen';
import AudiensiTemplateManagementScreen from './components/AudiensiTemplateManagementScreen';
import AudiensiListScreen from './components/AudiensiListScreen';
import AddAudiensiTemplateScreen from './components/AddAudiensiTemplateScreen';
import ProjectMonitoringScreen from './components/ProjectMonitoringScreen';
import ProjectApprovalScreen from './components/ProjectApprovalScreen';
import CalendarActivityScreen from './components/CalendarActivityScreen';
import DateRangeSelector from './components/DateRangeSelector';
import { api } from './services/api';
import { ClientData } from './types';
import ProjectDetailScreen from './components/ProjectDetailScreen';
import BerkasDokumenScreen from './components/BerkasDokumenScreen';

const DashboardHome: React.FC<{
  onNavigate?: (tab: string) => void;
  onOpenProject?: (projectId: string | number) => void;
}> = ({ onNavigate, onOpenProject }) => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [startMonth, setStartMonth] = useState(1);
  const [startYear, setStartYear] = useState(currentYear);
  const [endMonth, setEndMonth] = useState(12);
  const [endYear, setEndYear] = useState(currentYear);
  const [stats, setStats] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProjects, setTopProjects] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, revenueDataResult, topProjectsData, activitiesData] = await Promise.all([
        api.getDashboardStats(startMonth, startYear, endMonth, endYear),
        api.getRevenueData(startMonth, startYear, endMonth, endYear),
        api.getTopProjects(),
        api.getRecentActivities(),
      ]);
      
      setStats(statsData);
      setRevenueData(revenueDataResult);
      setTopProjects(topProjectsData);
      setRecentActivities(activitiesData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startMonth, startYear, endMonth, endYear]);

  const handleDateRangeChange = (newStartMonth: number, newStartYear: number, newEndMonth: number, newEndYear: number) => {
    setStartMonth(newStartMonth);
    setStartYear(newStartYear);
    setEndMonth(newEndMonth);
    setEndYear(newEndYear);
  };

  const statsCards = stats ? [
    { 
      title: 'Nilai Kontrak', 
      value: stats.totalBudgetFormatted || 'Rp 0', 
      trend: stats.budgetTrend || 0, 
      trendLabel: 'vs periode sebelumnya', 
      icon: 'payments', 
      iconColor: 'text-primary' 
    },
    { 
      title: 'Aktualisasi (Terserap)', 
      value: stats.totalActualFormatted || 'Rp 0', 
      trend: stats.actualTrend || 0, 
      trendLabel: 'vs periode sebelumnya', 
      icon: 'account_balance_wallet', 
      iconColor: 'text-emerald-600' 
    },
    { 
      title: 'SPH Issued', 
      value: stats.sphIssued?.toString() || '0', 
      trend: stats.sphTrend || 0, 
      trendLabel: 'vs periode sebelumnya', 
      icon: 'description', 
      iconColor: 'text-blue-600' 
    },
    { 
      title: 'Win Rate', 
      value: `${stats.winRate || 0}%`, 
      trend: 0, 
      trendLabel: 'dari total audiensi', 
      icon: 'emoji_events', 
      iconColor: 'text-amber-500',
      isNegative: false
    },
    { 
      title: 'Project Berjalan', 
      value: stats.runningProjects?.toString() || '0', 
      trend: 0, 
      trendLabel: 'proyek aktif', 
      icon: 'engineering', 
      iconColor: 'text-purple-500' 
    },
  ] : [];
  
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Selamat Datang, {user?.name || 'User'}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here is the latest update for your projects.</p>
          </div>
          <DateRangeSelector
            selectedStartMonth={startMonth}
            selectedStartYear={startYear}
            selectedEndMonth={endMonth}
            selectedEndYear={endYear}
            onChange={handleDateRangeChange}
          />
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200"></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap lg:flex-nowrap">
            {statsCards.map((stat, index) => {
              // Custom sizing logic based on index/title
              // 0: Anggaran (Large)
              // 1: Aktualisasi (Large)
              // 2: SPH Issued (Small)
              // 3: Win Rate (Small)
              // 4: Project Berjalan (Medium)
              
              let wrapperClass = "flex-1 min-w-[200px]"; // Default (Large/Medium)
              
              if (stat.title === 'SPH Issued' || stat.title === 'Win Rate') {
                wrapperClass = "w-full sm:w-[48%] lg:w-40 xl:w-48 shrink-0";
              }
              
              return (
                <div key={stat.title} className={wrapperClass}>
                  <StatsCard {...stat} />
                </div>
              );
            })}
          </div>
        )}

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Chart */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm lg:col-span-2">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Nilai Kontrak vs Aktualisasi</h3>
          <p className="text-xs text-slate-400">Nilai Kontrak = nilai proyek, Aktualisasi = nilai terserap</p>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-200"></span>
                <span className="text-slate-500 dark:text-slate-400">Nilai Kontrak</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-primary"></span>
                <span className="text-slate-500 dark:text-slate-400">Aktualisasi</span>
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-sm text-slate-500 dark:text-slate-400">Loading chart data...</div>
              </div>
            ) : (
              <RevenueChart data={revenueData} />
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm lg:col-span-1">
          <h3 className="mb-8 text-base font-bold text-slate-900 dark:text-white">Aktivitas Terbaru</h3>
          {loading ? (
            <div className="flex-1 text-sm text-slate-400">Loading activities...</div>
          ) : recentActivities.length > 0 ? (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="text-sm">
                  <p className="font-medium text-slate-900 dark:text-white">{activity.user}</p>
                  <p className="text-slate-600 dark:text-slate-300">{activity.action}</p>
                  <p className="text-xs text-slate-400">{activity.time}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 text-sm text-slate-400">Tidak ada aktivitas terbaru</div>
          )}
          <button 
            onClick={() => onNavigate?.('activity')}
            className="mt-6 w-full rounded-lg py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
          >
            View All Activity
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Monitoring Project (Top 5)</h3>
          <button
            onClick={() => onNavigate?.('monitoring')}
            className="text-sm font-bold text-primary hover:underline"
          >
            See All Projects
          </button>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading projects...</div>
        ) : (
          <ProjectTable projects={topProjects} onSelectProjectId={(id) => onOpenProject?.(id)} />
        )}
      </div>
    </div>
  </main>
  );
};

const AppContent: React.FC = () => {
  const { user, loading, isMarketing, isApprover, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard');
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isCreatingSph, setIsCreatingSph] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [isCreatingMarketingTask, setIsCreatingMarketingTask] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [preSelectedClientId, setPreSelectedClientId] = useState<number | null>(null);
  const [audiensiView, setAudiensiView] = useState<'list' | 'create' | 'manage' | 'add-template'>('list');
  const [globalProjectSearch, setGlobalProjectSearch] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use fetch with keepalive for reliable request on unload to mark user offline
      const token = localStorage.getItem('auth_token');
      if (token) {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        fetch((import.meta as any).env.VITE_API_URL + '/activities/offline', {
            method: 'POST',
            headers: headers,
            keepalive: true
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="mb-2 text-lg font-medium text-slate-600 dark:text-slate-300">Loading System...</div>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-slate-200 via-emerald-400 to-slate-200" style={{ backgroundSize: '200% 100%' }}></div>
          </div>
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem('auth_token');
            window.location.reload();
          }}
          className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors mt-8"
        >
          Stuck? Click here to clear cache and reload
        </button>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const isAdmin = isMarketing();

  const renderContent = () => {
    if (activeTab === 'sph' && isCreatingSph) {
      return <CreateSphWizard onCancel={() => setIsCreatingSph(false)} onFinish={() => setIsCreatingSph(false)} />;
    }
    
    if (activeTab === 'clients' && isCreatingClient) {
      return <CreateClientWizard onCancel={() => setIsCreatingClient(false)} onFinish={() => setIsCreatingClient(false)} />;
    }

    if (activeTab === 'marketing_kanban' && isCreatingMarketingTask) {
      return (
        <CreateMarketingTaskScreen 
          onCancel={() => setIsCreatingMarketingTask(false)} 
          onSave={() => setIsCreatingMarketingTask(false)} 
        />
      );
    }

    if (activeTab === 'create_project') {
      return (
        <CreateProjectScreen 
          onCancel={() => {
            setActiveTab('monitoring');
            setPreSelectedClientId(null);
          }} 
          onSave={() => {
            setActiveTab('monitoring');
            setPreSelectedClientId(null);
          }} 
          initialClientId={preSelectedClientId}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardHome
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenProject={(projectId) => {
              setSelectedProjectId(String(projectId));
              setActiveTab('monitoring');
            }}
          />
        );
      case 'monitoring':
        return (
          <ProjectMonitoringScreen
            onAddProject={() => setActiveTab('create_project')}
            initialProjectId={selectedProjectId}
            onInitialProjectHandled={() => setSelectedProjectId(null)}
            externalSearchQuery={globalProjectSearch}
            onExternalSearchHandled={() => setGlobalProjectSearch('')}
            onViewProjectDetail={(id) => {
              setSelectedProjectId(id);
              setActiveTab('project_detail');
            }}
          />
        );
      case 'project_detail':
        if (!selectedProjectId) {
          return (
            <ProjectMonitoringScreen
              onAddProject={() => setActiveTab('create_project')}
              initialProjectId={null}
              onInitialProjectHandled={() => {}}
              externalSearchQuery={globalProjectSearch}
              onExternalSearchHandled={() => setGlobalProjectSearch('')}
              onViewProjectDetail={(id) => {
                setSelectedProjectId(id);
                setActiveTab('project_detail');
              }}
            />
          );
        }
        return (
          <ProjectDetailScreen
            projectId={selectedProjectId}
            onBack={() => setActiveTab('monitoring')}
          />
        );
      case 'approval': return <ProjectApprovalScreen />;
      case 'calendar': return <CalendarActivityScreen />;
      case 'marketing_kanban': return <MarketingKanbanScreen onAddTask={() => setIsCreatingMarketingTask(true)} />;
      case 'essential_docs': return isAdmin ? <BerkasDokumenScreen /> : <DashboardHome />;
      case 'activity': return <FeedScreen />;
      case 'notifications': return <NotificationsScreen onNavigate={(tab) => setActiveTab(tab)} />;
      case 'clients': 
        if (selectedClient) {
          if (isEditingClient) {
            return (
              <EditClientScreen 
                client={selectedClient} 
                onBack={() => setIsEditingClient(false)} 
                onSave={(updatedClient) => {
                  setSelectedClient(updatedClient);
                  setIsEditingClient(false);
                }}
              />
            );
          }

          return (
            <ClientDetailScreen 
              client={selectedClient} 
              onBack={() => setSelectedClient(null)} 
              onNewProject={(client) => {
                setPreSelectedClientId(client.id);
                setActiveTab('create_project');
              }}
              onEdit={(client) => {
                setIsEditingClient(true);
              }}
            />
          );
        }
        return <ClientsScreen onSelectClient={(client) => setSelectedClient(client)} onAddClient={() => setIsCreatingClient(true)} />;
      case 'sph': return <SphManagementScreen onCreateClick={() => setIsCreatingSph(true)} />;
      case 'audiensi': 
        if (audiensiView === 'create') {
          return <AudiensiScreen onManageTemplates={() => setAudiensiView('manage')} onBack={() => setAudiensiView('list')} />;
        }
        if (audiensiView === 'manage') {
          return (
            <AudiensiTemplateManagementScreen 
              onBack={() => setAudiensiView('list')} 
              onAddTemplate={() => setAudiensiView('add-template')} 
            />
          );
        }
        if (audiensiView === 'add-template') {
          return (
            <AddAudiensiTemplateScreen 
              onBack={() => setAudiensiView('manage')} 
              onSave={() => setAudiensiView('manage')}
            />
          );
        }
        return <AudiensiListScreen onCreateNew={() => setAudiensiView('create')} />;
      case 'settings': return <SettingsScreen onManagePermissions={(userId) => {
        if (userId) {
          setActiveTab('permissions');
          // Store selected userId for permissions screen
          sessionStorage.setItem('selectedUserId', userId);
        } else {
          setActiveTab('permissions');
          sessionStorage.removeItem('selectedUserId');
        }
      }} />;
      case 'permissions': return isAdmin ? <PermissionsScreen /> : <DashboardHome />;
      case 'admin_log': return isAdmin ? <ActivityLogScreen /> : <DashboardHome />;
      default: return <DashboardHome />;
    }
  };

  const getBreadcrumbItems = () => {
    const items = [{ label: 'Home', id: 'dashboard' }];
    
    switch(activeTab) {
      case 'monitoring':
        items.push({ label: 'Monitoring Proyek', id: 'monitoring' });
        break;
      case 'project_detail':
        items.push({ label: 'Monitoring Proyek', id: 'monitoring' });
        items.push({ label: 'Detail Proyek', id: 'project_detail' });
        break;
      case 'approval':
        items.push({ label: 'Persetujuan Proyek', id: 'approval' });
        break;
      case 'create_project':
        items.push({ label: 'Proyek', id: 'monitoring' });
        items.push({ label: 'Tambah Proyek Baru', id: 'create_project' });
        break;
      case 'calendar':
        items.push({ label: 'Kalendar Aktivitas', id: 'calendar' });
        break;
      case 'marketing_kanban':
        items.push({ label: 'Marketing', id: 'marketing' });
        items.push({ label: 'Kanban Board', id: 'marketing_kanban' });
        if (isCreatingMarketingTask) {
          items.push({ label: 'Tambah Kegiatan', id: 'create_marketing_task' });
        }
        break;
      case 'activity': 
        items.push({ label: 'Activity Feed', id: 'activity' });
        break;
      case 'notifications': 
        items.push({ label: 'Notifikasi', id: 'notifications' });
        break;
      case 'clients': 
        items.push({ label: 'Clients', id: 'clients' });
        if (isCreatingClient) {
          items.push({ label: 'Tambah Klien Baru', id: 'create-client' });
        } else if (selectedClient) {
          items.push({ label: 'Detail Klien', id: 'client-detail' });
        }
        break;
      case 'sph':
        items.push({ label: 'Dashboard', id: 'dashboard' });
        items.push({ label: 'Surat Penawaran (SPH)', id: 'sph' });
        if (isCreatingSph) {
          items.push({ label: 'Buat SPH Baru', id: 'create-sph' });
        }
        break;
      case 'audiensi':
        items.push({ label: 'Dashboard', id: 'dashboard' });
        items.push({ label: 'Surat Audiensi', id: 'audiensi' });
        if (audiensiView === 'manage') {
          items.push({ label: 'Kelola Template', id: 'manage-audiensi' });
        } else if (audiensiView === 'create') {
          items.push({ label: 'Buat Baru', id: 'create-audiensi' });
        } else if (audiensiView === 'add-template') {
          items.push({ label: 'Kelola Template', id: 'manage-audiensi' });
          items.push({ label: 'Tambah Baru', id: 'add-template' });
        } else {
          items.push({ label: 'Daftar Surat', id: 'list-audiensi' });
        }
        break;
      case 'essential_docs':
        items.push({ label: 'Administrator', id: 'admin' });
        items.push({ label: 'Berkas Dokumen', id: 'essential_docs' });
        break;
      case 'settings':
        items.push({ label: 'Pengaturan Akun', id: 'settings' });
        break;
      case 'permissions':
        items.push({ label: 'Administrator', id: 'admin' });
        items.push({ label: 'Kelola Izin', id: 'permissions' });
        break;
      case 'admin_log':
        items.push({ label: 'Administrator', id: 'admin' });
        items.push({ label: 'Log Aktivitas', id: 'admin_log' });
        break;
      default: break;
    }
    return items;
  };

  const breadcrumbs = getBreadcrumbItems();

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-slate-900 font-display">
      {/* Navigation Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        activeId={activeTab === 'clients' && (selectedClient || isCreatingClient) ? 'clients' : activeTab}
        user={user}
        isAdmin={isAdmin}
        isApprover={isApprover()}
        onLogout={logout}
        onNavigate={(id) => {
          // Hide admin features from sidebar if not admin
          if ((id === 'permissions' || id === 'admin_log') && !isAdmin) return;
          // Hide marketing-only features
          if ((id === 'sph' || id === 'audiensi' || id === 'marketing_kanban' || id === 'essential_docs') && !isMarketing()) return;
          // Hide clients from common users
          if (id === 'clients' && !isMarketing() && !isApprover()) return;
          setActiveTab(id);
          setSelectedClient(null);
          setIsCreatingSph(false);
          setIsCreatingClient(false);
          setIsCreatingMarketingTask(false);
          setAudiensiView('list'); // Reset to list when navigating to audiensi
          setIsSidebarOpen(false);
        }}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          onNotificationClick={() => setActiveTab('notifications')}
          activeId={activeTab}
          user={user}
          onProfileClick={() => setActiveTab('settings')}
          onProjectSearch={(query) => {
            setGlobalProjectSearch(query);
            setActiveTab('monitoring');
          }}
        />
        
        {/* Custom Breadcrumb for Sub-Screens */}
        {activeTab !== 'dashboard' && (
           <header className="flex h-12 w-full items-center border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-2 lg:px-10 shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={`${crumb.id}-${idx}`}>
                  {idx > 0 && <span className="text-slate-200 scale-150">/</span>}
                  <button 
                    onClick={() => {
                      if (crumb.id === 'dashboard') {
                        setActiveTab('dashboard');
                      } else if (crumb.id === 'monitoring') {
                        setActiveTab('monitoring');
                      } else if (crumb.id === 'calendar') {
                        setActiveTab('calendar');
                      } else if (crumb.id === 'marketing') {
                        setActiveTab('marketing_kanban');
                        setIsCreatingMarketingTask(false);
                      } else if (crumb.id === 'clients') {
                        setSelectedClient(null);
                        setIsCreatingClient(false);
                      } else if (crumb.id === 'sph') {
                        setIsCreatingSph(false);
                      } else if (crumb.id === 'audiensi') {
                        setActiveTab('audiensi');
                        setAudiensiView('list');
                      } else if (crumb.id === 'manage-audiensi') {
                        setAudiensiView('manage');
                      } else if (crumb.id === 'create-audiensi') {
                        setAudiensiView('create');
                      } else if (crumb.id === 'add-template') {
                        setAudiensiView('add-template');
                      } else if (crumb.id === 'settings') {
                        setActiveTab('settings');
                      } else if (crumb.id === 'admin') {
                        setActiveTab('settings'); // Fallback for admin group crumbs
                      }
                    }} 
                    className={`${idx === breadcrumbs.length - 1 ? 'text-slate-900 dark:text-white' : 'hover:text-primary transition-colors'}`}
                  >
                    {crumb.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </header>
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
