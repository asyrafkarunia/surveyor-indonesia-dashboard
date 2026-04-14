import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { TutorialProvider, useTutorial } from './contexts/TutorialContext';
import TutorialManager from './components/TutorialManager';
import { 
  DASHBOARD_STEPS, 
  MONITORING_STEPS,
  CALENDAR_STEPS,
  ACTIVITY_STEPS,
  CLIENTS_STEPS,
  SPH_STEPS,
  AUDIENSI_STEPS,
  KANBAN_STEPS,
  SETTINGS_STEPS,
  DOKUMEN_STEPS,
  APPROVAL_STEPS,
  ADMIN_LOG_STEPS,
} from './src/constants/tutorialSteps';
import LoginScreen from './components/LoginScreen';
import { MarsIconLogo } from './components/LoginScreen';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsCard from './components/StatsCard';
import RevenueChart from './components/RevenueChart';
import ProjectTable from './components/ProjectTable';
const FeedScreen = lazy(() => import('./components/FeedScreen'));
const NotificationsScreen = lazy(() => import('./components/NotificationsScreen'));
const ClientsScreen = lazy(() => import('./components/ClientsScreen'));
const ClientDetailScreen = lazy(() => import('./components/ClientDetailScreen'));
const SphManagementScreen = lazy(() => import('./components/SphManagementScreen'));
const CreateProjectScreen = lazy(() => import('./components/CreateProjectScreen'));
const CreateSphWizard = lazy(() => import('./components/CreateSphWizard'));
const SettingsScreen = lazy(() => import('./components/SettingsScreen'));
const ActivityLogScreen = lazy(() => import('./components/ActivityLogScreen'));
const CreateClientWizard = lazy(() => import('./components/CreateClientWizard'));
const EditClientScreen = lazy(() => import('./components/EditClientScreen'));
const MarketingKanbanScreen = lazy(() => import('./components/MarketingKanbanScreen'));
const CreateMarketingTaskScreen = lazy(() => import('./components/CreateMarketingTaskScreen'));
const AudiensiScreen = lazy(() => import('./components/AudiensiScreen'));
const AudiensiTemplateManagementScreen = lazy(() => import('./components/AudiensiTemplateManagementScreen'));
const AudiensiListScreen = lazy(() => import('./components/AudiensiListScreen'));
const AddAudiensiTemplateScreen = lazy(() => import('./components/AddAudiensiTemplateScreen'));
const ProjectMonitoringScreen = lazy(() => import('./components/ProjectMonitoringScreen'));
const ProjectApprovalScreen = lazy(() => import('./components/ProjectApprovalScreen'));
const CalendarActivityScreen = lazy(() => import('./components/CalendarActivityScreen'));
import DateRangeSelector from './components/DateRangeSelector';
import { api } from './services/api';
import { ClientData } from './types';
const ProjectDetailScreen = lazy(() => import('./components/ProjectDetailScreen'));
const BerkasDokumenScreen = lazy(() => import('./components/BerkasDokumenScreen'));
import PageTransition from './components/PageTransition';

const LoadingScreen = () => (
  <div className="flex w-full h-full min-h-[50vh] flex-col items-center justify-center gap-4">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Memuat Halaman...</p>
  </div>
);

const DashboardHome: React.FC<{
  onNavigate?: (tab: string, data?: any) => void;
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

  const translateDateIndo = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr
      .replace(/Sunday/gi, 'Minggu')
      .replace(/Monday/gi, 'Senin')
      .replace(/Tuesday/gi, 'Selasa')
      .replace(/Wednesday/gi, 'Rabu')
      .replace(/Thursday/gi, 'Kamis')
      .replace(/Friday/gi, 'Jumat')
      .replace(/Saturday/gi, 'Sabtu')
      .replace(/January/gi, 'Januari')
      .replace(/February/gi, 'Februari')
      .replace(/March/gi, 'Maret')
      .replace(/April/gi, 'April')
      .replace(/May/gi, 'Mei')
      .replace(/June/gi, 'Juni')
      .replace(/July/gi, 'Juli')
      .replace(/August/gi, 'Agustus')
      .replace(/September/gi, 'September')
      .replace(/October/gi, 'Oktober')
      .replace(/November/gi, 'November')
      .replace(/December/gi, 'Desember');
  };

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
      title: 'Realisasi (Terserap)', 
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
      iconColor: 'text-amber-500'
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
          <div id="stats-metrics" className="flex flex-col gap-4 sm:flex-row sm:flex-wrap lg:flex-nowrap">
            {statsCards.map((stat, index) => {
              // Custom sizing logic based on index/title
              // 0: Anggaran (Large)
              // 1: Realisasi (Large)
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
        <div id="revenue-chart" className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-md lg:col-span-2 relative z-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Nilai Kontrak vs Realisasi</h3>
          <p className="text-xs text-slate-400">Nilai Kontrak = nilai proyek, Realisasi = nilai terserap</p>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-200"></span>
                <span className="text-slate-500 dark:text-slate-400">Nilai Kontrak</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-primary"></span>
                <span className="text-slate-500 dark:text-slate-400">Realisasi</span>
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
        <div id="recent-activities" className="flex flex-col rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-md lg:col-span-1 relative z-10">
          <h3 className="mb-8 text-base font-bold text-slate-900 dark:text-white">Aktivitas Terbaru</h3>
          {loading ? (
            <div className="flex-1 text-sm text-slate-400">Loading activities...</div>
          ) : recentActivities.length > 0 ? (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="group flex gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary dark:bg-primary/20">
                    {activity.user.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{activity.user}</p>
                      <p className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{activity.time}</p>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">{translateDateIndo(activity.action)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 text-sm text-slate-400">Tidak ada aktivitas terbaru</div>
          )}
          <button 
            onClick={() => onNavigate?.('activity')}
            className="mt-6 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white dark:bg-slate-700/50 dark:hover:bg-primary"
          >
            <span>View All Activity</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div id="monitoring-table" className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md relative z-10">
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
  const [pendingCalendarEventId, setPendingCalendarEventId] = useState<number | null>(null);
  const { startTutorial, isCompleted, loading: tutorialLoading } = useTutorial();

  // Auto-start tutorials for new users (once per tutorial per user)
  useEffect(() => {
    // Only proceed if tutorial data is fully loaded and user is established
    if (tutorialLoading || !user) return;
    
    // Also skip if we just logged in and are still resetting navigation
    if (localStorage.getItem('just_logged_in')) return;

    const tutorialMap: Record<string, { id: string; steps: any[] }> = {
      dashboard:        { id: 'dashboard',     steps: DASHBOARD_STEPS },
      monitoring:       { id: 'monitoring',    steps: MONITORING_STEPS },
      calendar:         { id: 'calendar',      steps: CALENDAR_STEPS },
      activity:         { id: 'activity',      steps: ACTIVITY_STEPS },
      clients:          { id: 'clients',       steps: CLIENTS_STEPS },
      sph:              { id: 'sph',           steps: SPH_STEPS },
      audiensi:         { id: 'audiensi',      steps: AUDIENSI_STEPS },
      marketing_kanban: { id: 'kanban',        steps: KANBAN_STEPS },
      settings:         { id: 'settings',      steps: SETTINGS_STEPS },
      essential_docs:   { id: 'dokumen',       steps: DOKUMEN_STEPS },
      approval:         { id: 'approval',      steps: APPROVAL_STEPS },
      admin_log:        { id: 'admin_log',     steps: ADMIN_LOG_STEPS },
    };

    const tutorial = tutorialMap[activeTab];
    if (tutorial && !isCompleted(tutorial.id)) {
      // Small delay so the page content renders before the tooltip targets
      const timer = setTimeout(() => startTutorial(tutorial.id, tutorial.steps), 600);
      return () => clearTimeout(timer);
    }
  }, [activeTab, tutorialLoading, user]);

  // Handle navigation reset on application session initialization
  useEffect(() => {
    if (user && localStorage.getItem('just_logged_in')) {
      console.log('Application session initialized, setting default view...');
      setActiveTab('dashboard');
      setSelectedClient(null);
      setIsCreatingSph(false);
      setIsCreatingClient(false);
      setIsEditingClient(false);
      setIsCreatingMarketingTask(false);
      setSelectedProjectId(null);
      setPreSelectedClientId(null);
      setAudiensiView('list');
      setGlobalProjectSearch('');
      setPendingCalendarEventId(null);
      localStorage.removeItem('just_logged_in');
    }
  }, [user]);

  // Expose setPendingCalendarEventId to window for deep linking from NotificationsScreen
  useEffect(() => {
    (window as any).setPendingCalendarEventId = setPendingCalendarEventId;
    return () => {
      delete (window as any).setPendingCalendarEventId;
    };
  }, []);

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
      <div
        className="flex h-screen flex-col items-center justify-center bg-[#003868] relative overflow-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Dynamic Water Ripple Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Base gradient layer */}
          <div className="absolute inset-0 opacity-60" style={{
            background: 'radial-gradient(circle at 50% 50%, #005596 0%, #001d3d 100%)',
          }} />

          {/* Resonating Ripples (Expanding from center) */}
          <div className="absolute top-1/2 left-1/2 w-0 h-0">
             <div className="animate-ripple-expand absolute w-[400px] h-[400px] rounded-full border border-white/20" />
             <div className="animate-ripple-expand absolute w-[400px] h-[400px] rounded-full border border-cyan-400/20" style={{ animationDelay: '2s' }} />
             <div className="animate-ripple-expand absolute w-[400px] h-[400px] rounded-full border border-white/10" style={{ animationDelay: '4s' }} />
             <div className="animate-ripple-expand absolute w-[400px] h-[400px] rounded-full border border-cyan-400/10" style={{ animationDelay: '6s' }} />
          </div>

          <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[#00B4AE] blur-[150px] animate-pulse opacity-10"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#005596] blur-[120px] opacity-20"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* MARS Logo Icon - Seamless and glowing */}
          <div className="loading-logo-pulse loading-breathe mb-12 relative flex flex-col items-center justify-center">
             <div className="absolute inset-0 bg-[#00B4AE] blur-[30px] opacity-40 rounded-full scale-[1.5] animate-pulse"></div>
             <MarsIconLogo className="w-32 h-32 relative z-10 drop-shadow-[0_0_20px_rgba(0,180,174,0.6)]" color="white" />
          </div>

          {/* App name */}
          <h1 className="text-3xl font-black text-white tracking-[0.2em] mb-2 uppercase drop-shadow-lg">MARS</h1>
          <p className="text-[10px] tracking-[0.45em] text-cyan-400 font-bold uppercase mb-16 opacity-80">
            Marketing Analysis Report System
          </p>

          {/* Progress Section */}
          <div className="flex flex-col items-center w-64">
            {/* Premium Progress bar */}
            <div className="w-full h-1 rounded-full overflow-hidden mb-4 bg-white/5 backdrop-blur-sm">
              <div
                className="loading-progress-slide h-full rounded-full"
                style={{
                  width: '60%',
                  background: 'linear-gradient(90deg, #003868, #00B4AE, #a5f3f2)',
                  boxShadow: '0 0 15px rgba(0, 180, 174, 0.4)'
                }}
              />
            </div>

            {/* Status message */}
            <p className="text-[13px] text-slate-300 font-medium tracking-wide">
              Menyiapkan Dashboard<span className="loading-dot inline-block">.</span><span className="loading-dot-2 inline-block">.</span><span className="loading-dot-3 inline-block">.</span>
            </p>
          </div>
        </div>

        {/* Stuck button */}
        <button
          onClick={() => {
            localStorage.removeItem('auth_token');
            window.location.reload();
          }}
          className="absolute bottom-8 text-xs text-slate-400 hover:text-red-500 transition-colors duration-300"
        >
          Stuck? Klik di sini untuk reset
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
            onNavigate={(tab, data) => {
              setActiveTab(tab);
              if (tab === 'monitoring' && data?.projectCode) {
                setGlobalProjectSearch(data.projectCode);
              }
            }}
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
            onBack={() => {
              setSelectedProjectId(null);
              setActiveTab('monitoring');
            }}
          />
        );
      case 'approval': return <ProjectApprovalScreen />;
      case 'calendar': return (
        <CalendarActivityScreen 
          initialEventId={pendingCalendarEventId} 
          onInitialEventHandled={() => setPendingCalendarEventId(null)} 
        />
      );
      case 'marketing_kanban': return <MarketingKanbanScreen onAddTask={() => setIsCreatingMarketingTask(true)} />;
      case 'essential_docs': return isAdmin ? <BerkasDokumenScreen /> : <DashboardHome />;
      case 'activity': return (
        <FeedScreen 
          onNavigate={(tab, data) => {
            setActiveTab(tab);
            if (tab === 'calendar' && data?.eventId) {
              setPendingCalendarEventId(data.eventId);
            }
            if (tab === 'monitoring' && data?.projectCode) {
              setGlobalProjectSearch(data.projectCode);
            }
            if (tab === 'project_detail' && data?.projectId) {
              setSelectedProjectId(data.projectId);
            }
          }}
        />
      );
      case 'notifications': return (
        <NotificationsScreen 
          onNavigate={(tab, data) => {
            setActiveTab(tab);
            if (tab === 'calendar' && data?.eventId) {
              setPendingCalendarEventId(data.eventId);
            }
          }} 
        />
      );
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
        // No-op or redirect to user management if needed, but removing logic for now
        setActiveTab('settings');
      }} />;
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
        items.push({ label: 'Surat Penawaran (SPH)', id: 'sph' });
        if (isCreatingSph) {
          items.push({ label: 'Buat SPH Baru', id: 'create-sph' });
        }
        break;
      case 'audiensi':
        items.push({ label: 'Surat Audiensi', id: 'audiensi' });
        if (audiensiView === 'manage') {
          items.push({ label: 'Kelola Template', id: 'manage-audiensi' });
        } else if (audiensiView === 'create') {
          items.push({ label: 'Buat Baru', id: 'create-audiensi' });
        } else if (audiensiView === 'add-template') {
          items.push({ label: 'Kelola Template', id: 'manage-audiensi' });
          items.push({ label: 'Tambah Baru', id: 'add-template' });
        }
        break;
      case 'essential_docs':
        items.push({ label: 'Berkas Dokumen', id: 'essential_docs' });
        break;
      case 'settings':
        items.push({ label: 'Pengaturan Akun', id: 'settings' });
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
    <div className="flex h-screen w-full font-display" style={{ background: 'var(--bg-stone)' }}>
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
        isAdmin={isAdmin}
        isApprover={isApprover()}
        onNavigate={(id) => {
          // Hide admin features from sidebar if not admin
          if (id === 'admin_log' && !isAdmin) return;
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
          isAdmin={isAdmin}
          onNavigate={(id) => {
            setActiveTab(id);
            setSelectedClient(null);
            setIsCreatingSph(false);
            setIsCreatingClient(false);
            setIsCreatingMarketingTask(false);
            setAudiensiView('list');
            setIsSidebarOpen(false);
          }}
          onLogout={logout}
          onProjectSearch={(query) => {
            setGlobalProjectSearch(query);
            setActiveTab('monitoring');
          }}
        />
        
        {/* Custom Breadcrumb for Sub-Screens */}
        {activeTab !== 'dashboard' && (
           <header className="flex h-12 w-full items-center px-6 py-2 lg:px-10 shrink-0" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }}>
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
                      } else if (crumb.id === 'marketing_kanban') {
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

        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900">
          <PageTransition 
            transitionKey={`${activeTab}-${selectedClient?.id || ''}-${isCreatingSph}-${isCreatingClient}-${isEditingClient}-${isCreatingMarketingTask}-${selectedProjectId || ''}-${audiensiView}`}
          >
            <Suspense fallback={<LoadingScreen />}>
              {renderContent()}
            </Suspense>
          </PageTransition>
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
        <TutorialProvider>
          <NotificationProvider>
            <AppContent />
            <TutorialManager />
          </NotificationProvider>
        </TutorialProvider>
      </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
