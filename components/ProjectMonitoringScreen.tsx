
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import ActivityModal from './ActivityModal';
import StatsCard from './StatsCard';
import FilterSelect from './FilterSelect';
import DateRangeSelector from './DateRangeSelector';
import * as XLSX from 'xlsx';
import { downloadCSV } from '../utils/downloadFile';

interface ProjectMonitoringScreenProps {
  onAddProject: () => void;
  externalSearchQuery?: string;
  onExternalSearchHandled?: () => void;
  onViewProjectDetail?: (projectId: string) => void;
}

const toPascalCase = (str: string) => {
  if (!str) return '';
  return str.replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
};

const getTimelineText = (project: any) => {
  if (!project.start_date) return '';
  const isDone = project.progress >= 100 || project.status === 'DONE';
  const start = new Date(project.start_date);
  const end = project.end_date ? new Date(project.end_date) : new Date();
  const compareDate = isDone ? end : new Date();
  
  let months = (compareDate.getFullYear() - start.getFullYear()) * 12 + compareDate.getMonth() - start.getMonth();
  months = Math.max(0, months);
  
  if (isDone) {
    return `Selesai dalam ${months} bulan`;
  }
  return `Berjalan ${months} bulan`;
};

const ProjectMonitoringScreen: React.FC<ProjectMonitoringScreenProps> = ({
  onAddProject,
  externalSearchQuery,
  onExternalSearchHandled,
  onViewProjectDetail,
}) => {
  const currentYear = new Date().getFullYear();
  const startYear = 2015;
  const endYear = 2026;
  const allYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [actionMenuProjectId, setActionMenuProjectId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [picFilter, setPicFilter] = useState<string>('');
  const [picMarketingFilter, setPicMarketingFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [progressFilter, setProgressFilter] = useState<string>('');
  const [contractFilter, setContractFilter] = useState<string>('');
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('');
  const [tenderFilter, setTenderFilter] = useState<string>('');
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [picOptions, setPicOptions] = useState<string[]>([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [selectedExportIds, setSelectedExportIds] = useState<string[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [clientIdFilter, setClientIdFilter] = useState<string>('');
  const projectListRef = useRef<HTMLDivElement | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-blue-100 text-blue-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'DONE': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700 dark:text-slate-200';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-blue-700';
      case 'PENDING': return 'bg-yellow-700';
      case 'DONE': return 'bg-green-700';
      case 'REJECTED': return 'bg-red-700';
      default: return 'bg-gray-700';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-blue-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'DONE': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response: any = await api.getProjects({
        year: selectedYear,
        search: searchQuery || undefined,
        page: currentPage,
        client_id: clientIdFilter || undefined,
      });
      
      if (response && response.data) {
        setProjects(response.data);
        setPagination({
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total,
        });
      } else {
        setProjects(response || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await api.getMonitoringStats(selectedYear);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedYear]);

  useEffect(() => {
    fetchProjects();
  }, [selectedYear, searchQuery, currentPage, clientIdFilter]);

  useEffect(() => {
    const fetchPicOptions = async () => {
      try {
        const res: any = await (api as any).getUsers();
        const data = res?.data || res;
        const list = Array.isArray(data) ? data : (data?.data || []);
        const names = Array.from(
          new Set(
            list
              .filter((u: any) => {
                const div = (u.division || '').toLowerCase();
                return div.includes('operasi');
              })
              .map((u: any) => u.name)
              .filter((name: any) => typeof name === 'string' && name.trim().length > 0)
          ) as Set<string>
        ).sort((a, b) => a.localeCompare(b, 'id-ID'));

        if (names.length > 0) {
          setPicOptions(names);
        }
      } catch (error) {
        console.error('Failed to load PIC options from API:', error);
      }
    };

    const fetchClients = async () => {
      try {
        const res: any = await api.getClients({ page: 1, limit: 100 } as any);
        const data = res?.data || res;
        const list = data.data || data;
        setClients(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('Failed to load clients:', error);
      }
    };

    fetchPicOptions();
    fetchClients();
  }, []);

  useEffect(() => {
    if (externalSearchQuery === undefined || externalSearchQuery === null) return;
    const trimmed = externalSearchQuery.trim();
    if (!trimmed) return;
    if (trimmed !== searchQuery) {
      setSearchQuery(trimmed);
      setSearchInput(trimmed);
      setCurrentPage(1);
    }
    if (onExternalSearchHandled) {
      onExternalSearchHandled();
    }
    if (projectListRef.current) {
      projectListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [externalSearchQuery]);



  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }
  };

  const handleResetSearch = () => {
    setPicFilter(''); setStatusFilter(''); setProjectTypeFilter(''); setProgressFilter(''); setContractFilter(''); setSearchQuery(''); setSearchInput(''); setClientIdFilter(''); setTenderFilter('');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getContractDurationDays = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    if (!isFinite(diffMs) || diffMs <= 0) return null;
    return diffMs / (1000 * 60 * 60 * 24);
  };

  const getInitials = (name: string) => {
    if (!name) return 'N/A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const highlightText = (text: string, query: string) => {
    if (!text || !query.trim()) return text;
    const source = text.toString();
    const lowerSource = source.toLowerCase();
    const lowerQuery = query.trim().toLowerCase();
    const result: any[] = [];
    let currentIndex = 0;
    let matchIndex = lowerSource.indexOf(lowerQuery);
    while (matchIndex !== -1) {
      if (matchIndex > currentIndex) {
        result.push(source.slice(currentIndex, matchIndex));
      }
      const match = source.slice(matchIndex, matchIndex + lowerQuery.length);
      result.push(
        <span key={result.length} className="bg-yellow-200 text-primary font-black">
          {match}
        </span>
      );
      currentIndex = matchIndex + lowerQuery.length;
      matchIndex = lowerSource.indexOf(lowerQuery, currentIndex);
    }
    if (currentIndex < source.length) {
      result.push(source.slice(currentIndex));
    }
    return result;
  };

  const getProjectExportId = (project: any) => project?.id?.toString?.() ?? String(project?.id ?? '');

  const buildExportRows = (sourceProjects: any[]) => {
    return sourceProjects.map((p: any) => [
      p?.id ?? '',
      p?.code ?? '',
      (p?.title ?? '').toString().replaceAll('\n', ' '),
      p?.client?.company_name ?? p?.client_name ?? '',
      p?.pic?.name ?? p?.custom_pic_name ?? '',
      p?.status ?? '',
      p?.progress ?? 0,
      p?.start_date ?? '',
      p?.end_date ?? '',
      p?.budget ?? '',
      p?.actual_revenue ?? '',
      p?.project_type ?? '',
      p?.approval_status ?? '',
    ]);
  };

  const handleProjectUpdated = (updated: any) => {
    setProjects((prev) => prev.map((p: any) => (String(p.id) === String(updated.id) ? { ...p, ...updated } : p)));
    fetchStats();
  };

  const confirmDeleteProject = (project: any) => {
    setProjectToDelete(project);
    setDeleteConfirmationText('');
    setActionMenuProjectId(null);
  };

  const executeDeleteProject = async () => {
    if (!projectToDelete || deleteConfirmationText !== 'HAPUS PROYEK') return;
    try {
      setIsDeleting(true);
      await api.deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p: any) => String(p.id) !== String(projectToDelete.id)));
      setProjectToDelete(null);
      fetchStats();
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      alert(error?.message || 'Gagal menghapus proyek. Silakan coba lagi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateDonutData = () => {
    if (!stats) return { running: 0, pending: 0, done: 0, rejected: 0 };
    const total = stats.totalProjects || 0;
    if (total === 0) return { running: 0, pending: 0, done: 0, rejected: 0 };
    return {
      running: (stats.runningProjects / total) * 100,
      pending: (stats.pendingProjects / total) * 100,
      done: (stats.doneProjects / total) * 100,
      rejected: (stats.rejectedProjects / total) * 100,
    };
  };

  const donutData = calculateDonutData();
  const statusOptions = ['RUNNING', 'PENDING', 'DONE', 'REJECTED'];
  const projectTypeOptions = [
    { value: 'Minyak, Gas, & Energi Terbarukan', label: 'Minyak, Gas, & Energi Terbarukan' },
    { value: 'Infrastruktur & Transportasi', label: 'Infrastruktur & Transportasi' },
    { value: 'Mineral & Batubara', label: 'Mineral & Batubara' },
    { value: 'Institusi & Pemerintahan', label: 'Institusi & Pemerintahan' },
    { value: 'Layanan Industri', label: 'Layanan Industri' },
    { value: 'Lingkungan & Keberlanjutan', label: 'Lingkungan & Keberlanjutan' },
  ];
  const tenderOptions = [
    { value: 'true', label: 'Tender' },
    { value: 'false', label: 'Non-Tender' },
  ];
  const progressOptions = [
    { value: '0', label: '0%' },
    { value: 'lte25', label: '1 - 25%' },
    { value: 'lte50', label: '26 - 50%' },
    { value: 'lte75', label: '51 - 75%' },
    { value: 'lte100', label: '76 - 100%' },
  ];
  const contractOptions = [
    { value: 'lte6m', label: '≤ 6 Bulan' },
    { value: 'lte1y', label: '6 - 12 Bulan' },
    { value: 'lte2y', label: '1 - 2 Tahun' },
    { value: 'gt2y', label: '> 2 Tahun' },
  ];

  const filteredProjects = projects.filter((project: any) => {
    // Client-side search filtering for strict matching
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const code = (project.code || '').toLowerCase();
      const title = (project.title || '').toLowerCase();
      if (!code.includes(query) && !title.includes(query)) return false;
    }

    if (picFilter && (project.pic?.name || '') !== picFilter) return false;
    if (picMarketingFilter && (project.marketing_pic?.name || '') !== picMarketingFilter) return false;
    if (statusFilter && (project.status || '') !== statusFilter) return false;
    if (projectTypeFilter) {
      const type = project.project_type || 'Minyak, Gas, & Energi Terbarukan';
      if (type.toLowerCase() !== projectTypeFilter.toLowerCase()) return false;
    }
    if (tenderFilter) {
      if (tenderFilter === 'true' && !project.is_tender) return false;
      if (tenderFilter === 'false' && project.is_tender) return false;
    }
    if (progressFilter) {
      const progress = Number(project.progress) || 0;
      if (progressFilter === '0' && progress !== 0) return false;
      if (progressFilter === 'lte25' && !(progress > 0 && progress <= 25)) return false;
      if (progressFilter === 'lte50' && !(progress > 25 && progress <= 50)) return false;
      if (progressFilter === 'lte75' && !(progress > 50 && progress <= 75)) return false;
      if (progressFilter === 'lte100' && !(progress > 75 && progress <= 100)) return false;
    }
    if (contractFilter) {
      const days = getContractDurationDays(project.start_date, project.end_date);
      if (days === null) return false;
      if (contractFilter === 'lte6m' && !(days <= 183)) return false;
      if (contractFilter === 'lte1y' && !(days > 183 && days <= 365)) return false;
      if (contractFilter === 'lte2y' && !(days > 365 && days <= 730)) return false;
      if (contractFilter === 'gt2y' && !(days > 730)) return false;
    }
    return true;
  });

  const allVisibleSelected = filteredProjects.length > 0 && filteredProjects.every((project: any) => selectedExportIds.includes(getProjectExportId(project)));

  const handleToggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredProjects.map((p: any) => getProjectExportId(p)));
      setSelectedExportIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      const visibleIds = filteredProjects.map((p: any) => getProjectExportId(p));
      const next = Array.from(new Set([...selectedExportIds, ...visibleIds]));
      setSelectedExportIds(next);
    }
  };

  const getProjectsForExport = () => {
    const selectedSet = new Set(selectedExportIds);
    const selected = filteredProjects.filter((p: any) => selectedSet.has(getProjectExportId(p)));
    return selected.length > 0 ? selected : filteredProjects;
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Code', 'Title', 'Client', 'PIC', 'Status', 'Progress', 'Start Date', 'End Date', 'Budget', 'Actual (Realisasi)', 'Project Type (Portofolio)', 'Approval Status'];
    const projectsToExport = getProjectsForExport();
    const rows = buildExportRows(projectsToExport);
    const blob_csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    downloadCSV(blob_csv, `Monitoring_Proyek_${selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <main id="project-list-container" className="flex-1 flex flex-col min-w-0 overflow-auto bg-background-light">
    <header className="px-8 pt-10 pb-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 relative z-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 max-w-3xl flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Dashboard Monitoring Status Proyek</h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Sistem pemantauan real-time untuk melacak progres fisik, status persetujuan, dan pencapaian target proyek di seluruh unit bisnis strategis PT Surveyor Indonesia.
          </p>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row items-center gap-4 shrink-0">
          <DateRangeSelector
            selectedStartYear={selectedYear}
            onChange={(sm, sy) => handleYearChange(sy)}
          />
          <button 
            id="add-project-btn" 
            onClick={onAddProject} 
            className="group flex items-center justify-center gap-3 px-6 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-xl shadow-primary/20 transition-all font-black text-xs uppercase tracking-widest active:scale-95 w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-300">add</span>
            <span>Tambah Proyek Baru</span>
          </button>
        </div>
      </div>
    </header>

      <section className="px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title={`Total Proyek (${selectedYear})`} value={stats?.totalProjects?.toString() || '0'} trend={stats?.totalTrend || 0} trendLabel="vs tahun sebelumnya" icon="folder_shared" iconColor="text-primary" subValue={`${stats?.newProjectsCount || 0} Baru, ${stats?.carryOverCount || 0} Lanjutan`} />
          <StatsCard title="Menunggu Persetujuan" value={stats?.pendingProjects?.toString() || '0'} trend={0} trendLabel={`${stats?.pendingPercent || 0}% dari total`} icon="pending_actions" iconColor="text-yellow-500" />
          <StatsCard title="Sedang Berjalan" value={stats?.runningProjects?.toString() || '0'} trend={stats?.runningTrend || 0} trendLabel="vs tahun sebelumnya" icon="rocket_launch" iconColor="text-blue-500" subValue={`${stats?.delayedCount || 0} Terlambat`} subValueColor={stats?.delayedCount > 0 ? 'text-rose-600' : 'text-slate-500'} />
          <StatsCard title="Selesai" value={stats?.doneProjects?.toString() || '0'} trend={stats?.doneTrend || 0} trendLabel="vs tahun sebelumnya" icon="verified" iconColor="text-green-500" />
        </div>
      </section>

      <section className="px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[#e2e8f0] dark:border-slate-700 shadow-sm">
            <h3 className="text-[#0f172a] dark:text-white text-sm font-bold mb-6 flex items-center gap-2 uppercase tracking-widest">
              <span className="material-symbols-outlined text-primary text-lg">pie_chart</span>
              Distribusi Status Proyek {selectedYear}
            </h3>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-emerald-500"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat data...</p>
                </div>
              </div>
            ) : stats ? (
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-48 h-48 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {donutData.running > 0 && <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray={`${donutData.running} ${100 - donutData.running}`} strokeDashoffset="0" />}
                    {donutData.pending > 0 && <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray={`${donutData.pending} ${100 - donutData.pending}`} strokeDashoffset={-donutData.running} />}
                    {donutData.done > 0 && <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDasharray={`${donutData.done} ${100 - donutData.done}`} strokeDashoffset={-(donutData.running + donutData.pending)} />}
                    {donutData.rejected > 0 && <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#d32f2f" strokeWidth="4" strokeDasharray={`${donutData.rejected} ${100 - donutData.rejected}`} strokeDashoffset={-(donutData.running + donutData.pending + donutData.done)} />}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-black text-[#0f172a] dark:text-white">{stats.totalProjects || 0}</span>
                    <span className="text-[10px] text-[#64748b] dark:text-slate-300 font-bold uppercase tracking-widest">Total</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-xs font-bold text-[#6b7280] dark:text-slate-400 uppercase tracking-tighter">Berjalan</span></div>
                    <span className="text-xs font-black text-[#0f172a] dark:text-white">{stats.runningProjects || 0} ({stats.runningPercent || 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span><span className="text-xs font-bold text-[#6b7280] dark:text-slate-400 uppercase tracking-tighter">Menunggu</span></div>
                    <span className="text-xs font-black text-[#0f172a] dark:text-white">{stats.pendingProjects || 0} ({stats.pendingPercent || 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span><span className="text-xs font-bold text-[#6b7280] dark:text-slate-400 uppercase tracking-tighter">Selesai</span></div>
                    <span className="text-xs font-black text-[#0f172a] dark:text-white">{stats.doneProjects || 0} ({stats.donePercent || 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-xs font-bold text-[#6b7280] dark:text-slate-400 uppercase tracking-tighter">Ditolak</span></div>
                    <span className="text-xs font-black text-[#0f172a] dark:text-white">{stats.rejectedProjects || 0} ({stats.rejectedPercent || 0}%)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-sm text-[#64748b] dark:text-slate-300">Tidak ada data</div>
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-md relative z-10">
            <h3 className="text-[#0f172a] dark:text-white text-sm font-bold mb-6 flex items-center gap-2 uppercase tracking-widest">
              <span className="material-symbols-outlined text-[#1a237e] text-lg">bar_chart</span>
              Portofolio Proyek {selectedYear}
            </h3>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-emerald-500"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat data...</p>
                </div>
              </div>
            ) : stats?.portfolioData && stats.portfolioData.length > 0 ? (() => {
              const portfolioColors: Record<string, string> = {
                'minyak, gas, & energi terbarukan': '#1e40af',
                'infrastruktur & transportasi': '#059669',
                'mineral & batubara': '#d97706',
                'institusi & pemerintahan': '#dc2626',
                'layanan industri': '#7c3aed',
                'lingkungan & keberlanjutan': '#0284c7',
              };

              // Aggregate from projects array to ensure consistency with table badges
              const aggregatedData: Record<string, number> = {};
              projects.forEach((project: any) => {
                const pType = (project.project_type || '').toLowerCase();
                const isValidDBS = ['minyak, gas, & energi terbarukan', 'infrastruktur & transportasi', 'mineral & batubara', 'institusi & pemerintahan', 'layanan industri', 'lingkungan & keberlanjutan'].includes(pType);
                const displayLabel = isValidDBS ? project.project_type : 'Minyak, Gas, & Energi Terbarukan';
                aggregatedData[displayLabel] = (aggregatedData[displayLabel] || 0) + 1;
              });

              const processedPortfolio = Object.entries(aggregatedData)
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count);

              const totalPortfolio = processedPortfolio.reduce((sum, item) => sum + item.count, 0);

              if (totalPortfolio === 0) {
                return (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-sm text-[#64748b] dark:text-slate-300">Tidak ada data portofolio</div>
                  </div>
                );
              }

              return (
                <div className="space-y-5">
                  {/* Stacked Bar */}
                  <div className="w-full h-10 rounded-xl overflow-hidden flex shadow-inner" style={{ backgroundColor: '#f1f5f9' }}>
                    {processedPortfolio.map((item, index) => {
                      const pct = (item.count / totalPortfolio) * 100;
                      const color = portfolioColors[item.category.toLowerCase()] || '#475569';
                      return (
                        <div
                          key={index}
                          className="h-full transition-all duration-1000 relative group/bar"
                          style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 0 ? '12px' : '0' }}
                          title={`${item.category}: ${item.count} Proyek (${Math.round(pct)}%)`}
                        >
                          {pct > 15 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white/90 tracking-wide">
                              {Math.round(pct)}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Legend Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                    {processedPortfolio.map((item, index) => {
                      const color = portfolioColors[item.category.toLowerCase()] || '#475569';
                      return (
                        <div key={index} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }}></span>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight truncate">{item.category}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-900 dark:text-white whitespace-nowrap">{item.count} Proyek</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })() : (
              <div className="flex items-center justify-center h-48">
                <div className="text-sm text-[#64748b] dark:text-slate-300">Tidak ada data</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="project-filters" className="px-8 py-2">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 flex flex-col gap-5 shadow-sm relative z-40 transition-all duration-300 hover:shadow-md">
          <div className="relative group w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-300">search</span>
            <input aria-label="Cari proyek" className="w-full bg-slate-100/50 dark:bg-slate-900/50 border-transparent rounded-xl pl-12 pr-4 py-3 text-[13px] font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-900 border-none placeholder:text-slate-400 dark:text-white transition-all duration-300 outline-none" placeholder="Cari nama proyek, kode, atau kata kunci lainnya... (Tekan Enter)" type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleSearchKeyPress} />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              {(() => {
                const activeFilters = [
                  { id: 'client', label: 'Klien', value: clientIdFilter, setter: setClientIdFilter, display: clients.find(c => c.id.toString() === clientIdFilter)?.company_name },
                  { id: 'dbs', label: 'DBS', value: projectTypeFilter, setter: setProjectTypeFilter, display: projectTypeFilter },
                  { id: 'tender', label: 'Klasifikasi', value: tenderFilter, setter: setTenderFilter, display: tenderFilter === 'true' ? 'Tender' : 'Non-Tender' },
                  { id: 'pic', label: 'PIC', value: picFilter, setter: setPicFilter, display: picFilter },
                  { id: 'status', label: 'Status', value: statusFilter, setter: setStatusFilter, display: statusFilter },
                  { id: 'progress', label: 'Progres', value: progressFilter, setter: setProgressFilter, display: progressOptions.find(o => o.value === progressFilter)?.label },
                  { id: 'contract', label: 'Kontrak', value: contractFilter, setter: setContractFilter, display: contractOptions.find(o => o.value === contractFilter)?.label },
                ].filter(f => f.value);
                
                return (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <button type="button" onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)} className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-bold transition-all ${isFilterPopupOpen || activeFilters.length > 0 ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary'}`}>
                          <span className="material-symbols-outlined text-[18px]">tune</span>
                          Filter Data
                          {activeFilters.length > 0 && <span className="ml-1 bg-white text-primary text-[10px] px-1.5 py-0.5 rounded-full leading-none font-black">{activeFilters.length}</span>}
                        </button>
                        
                        {isFilterPopupOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsFilterPopupOpen(false)}></div>
                            <div className="absolute top-full left-0 mt-3 p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl z-50 w-[800px] max-w-[85vw] animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-700 pb-3">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                  <span className="material-symbols-outlined text-primary text-[18px]">filter_alt</span>
                                  Pilih Filter
                                </h3>
                                <button onClick={() => setIsFilterPopupOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700 p-1 rounded-lg">
                                  <span className="material-symbols-outlined">close</span>
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FilterSelect label="Klien" icon="corporate_fare" value={clientIdFilter} onChange={setClientIdFilter} options={clients.map(c => ({ value: c.id.toString(), label: c.company_name }))} className="max-w-full!" />
                                <FilterSelect label="DBS" icon="category" value={projectTypeFilter} onChange={setProjectTypeFilter} options={projectTypeOptions} className="max-w-full!" />
                                <FilterSelect label="Klasifikasi" icon="gavel" value={tenderFilter} onChange={setTenderFilter} options={tenderOptions} className="max-w-full!" />
                                <FilterSelect label="PIC Proyek" icon="badge" value={picFilter} onChange={setPicFilter} options={picOptions} className="max-w-full!" />
                                <FilterSelect label="Status" icon="flag" value={statusFilter} onChange={setStatusFilter} options={statusOptions} className="max-w-full!" />
                                <FilterSelect label="Progres" icon="trending_up" value={progressFilter} onChange={setProgressFilter} options={progressOptions} className="max-w-full!" />
                                <FilterSelect label="Durasi Kontrak" icon="schedule" value={contractFilter} onChange={setContractFilter} options={contractOptions} className="max-w-full!" />
                              </div>
                              <div className="mt-6 flex justify-end">
                                <button onClick={() => setIsFilterPopupOpen(false)} className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 dark:hover:bg-white transition-all active:scale-95">
                                  Terapkan Filter
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {activeFilters.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mt-1 animate-in fade-in">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Aktif:</span>
                        {activeFilters.map(filter => (
                          <div key={filter.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 border border-primary/20 text-primary rounded-lg text-xs font-bold transition-all group">
                            <span className="opacity-70 font-medium">{filter.label}:</span>
                            <span className="truncate max-w-[150px]">{filter.display}</span>
                            <button onClick={() => filter.setter('')} className="hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 p-0.5 rounded-md ml-1 flex items-center justify-center transition-colors">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        ))}
                        <button onClick={handleResetSearch} className="text-[11px] font-bold text-slate-400 hover:text-rose-500 underline ml-2 transition-colors">Bersihkan Semua</button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <button type="button" onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 rounded-xl text-[10px] font-black text-primary transition-all duration-300 tracking-[0.15em] uppercase border border-primary/20 hover:border-primary/40 active:scale-95 shrink-0">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Unduh CSV
            </button>
          </div>
        </div>
      </section>

      <section id="project-table-main" className="px-8 py-4 mb-8">
        <div ref={projectListRef} className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 shadow-sm overflow-hidden relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr id="project-table-header" className="bg-gray-50 dark:bg-slate-900/50 border-b border-[#e2e8f0] dark:border-slate-700">
                  <th className="px-4 py-5 w-10 text-center"><input type="checkbox" className="h-4 w-4 text-primary border-[#e2e8f0] dark:border-slate-600 rounded focus:ring-primary dark:bg-slate-800" checked={allVisibleSelected} onChange={handleToggleSelectAllVisible} onClick={(e) => e.stopPropagation()} /></th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#64748b] dark:text-slate-300 uppercase tracking-[0.15em]">Klien & Proyek</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#64748b] dark:text-slate-300 uppercase tracking-[0.15em]">DBS</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#64748b] dark:text-slate-300 uppercase tracking-[0.15em]">PIC Proyek</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#64748b] dark:text-slate-300 uppercase tracking-[0.15em]">Status & Timeline</th>
                  <th className="px-6 py-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-[#64748b] dark:text-slate-300">Memuat proyek...</td></tr>
                ) : projects.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-[#64748b] dark:text-slate-300">Tidak ada proyek ditemukan untuk tahun {selectedYear}</td></tr>
                ) : filteredProjects.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-[#64748b] dark:text-slate-300">Tidak ada proyek yang cocok dengan filter</td></tr>
                ) : (
                  filteredProjects.map((project) => {
                    const projectId = getProjectExportId(project);
                    return (
                      <tr key={projectId} className="hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer" onClick={() => onViewProjectDetail?.(projectId)}>
                        <td className="px-4 py-5 text-center">
                          <input type="checkbox" className="h-4 w-4 text-primary border-[#e2e8f0] dark:border-slate-600 rounded focus:ring-primary dark:bg-slate-800" checked={selectedExportIds.includes(projectId)} onChange={(e) => { e.stopPropagation(); setSelectedExportIds(prev => prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]); }} onClick={(e) => e.stopPropagation()} />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm shrink-0 group-hover:border-primary/30 transition-colors">
                              {project.client?.logo ? (
                                <img 
                                  src={project.client.logo.startsWith('http') ? project.client.logo : `${((import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '')}/storage/${project.client.logo}`} 
                                  alt={project.client.company_name}
                                  className="size-full object-contain p-1.5"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">domain</span>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 max-w-[280px] md:max-w-[400px]">
                              <span className="text-sm font-black text-[#0f172a] dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-1">{highlightText(project.title || '', searchQuery)}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{highlightText(project.code || '', searchQuery)}</span>
                                <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">{project.client?.company_name || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          {(() => {
                            const portfolioColors: Record<string, string> = {
                              'minyak, gas, & energi terbarukan': '#1e40af',
                              'infrastruktur & transportasi': '#059669',
                              'mineral & batubara': '#d97706',
                              'institusi & pemerintahan': '#dc2626',
                              'layanan industri': '#7c3aed',
                              'lingkungan & keberlanjutan': '#0284c7',
                              // Fallbacks for older data
                              'certification': '#1e40af',
                              'inspection': '#059669',
                              'testing': '#d97706',
                              'assurance': '#dc2626',
                              'consultancy': '#7c3aed',
                            };
                            const pType = (project.project_type || '').toLowerCase();
                            const isValidDBS = ['minyak, gas, & energi terbarukan', 'infrastruktur & transportasi', 'mineral & batubara', 'institusi & pemerintahan', 'layanan industri', 'lingkungan & keberlanjutan'].includes(pType);
                            const displayLabel = isValidDBS ? project.project_type : 'Minyak, Gas, & Energi Terbarukan';
                            const color = portfolioColors[displayLabel.toLowerCase()] || '#1e40af';
                            
                            return (
                              <div className="inline-flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 max-w-[140px]">
                                <div className="w-2 h-2 rounded-full shrink-0 mt-[3px]" style={{ backgroundColor: color }}></div>
                                <span className="text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-200 whitespace-normal wrap-break-word leading-tight">
                                  {displayLabel}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                               <span className="text-[10px] font-black text-primary uppercase">{getInitials(project.pic?.name || 'N/A')}</span>
                             </div>
                             <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{project.pic?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2 w-full min-w-[180px] max-w-[220px]">
                            <div className="flex justify-between items-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(project.status)}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(project.status)} mr-1.5`}></span>
                                {project.status}
                              </span>
                              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">{project.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-[#f1f5f9] dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div className={`${getProgressColor(project.status)} h-full rounded-full transition-all duration-500`} style={{ width: `${project.progress || 0}%` }}></div>
                            </div>
                            <div className="flex flex-col gap-1 text-[9px] font-bold text-slate-400 mt-1.5">
                              <span>{getTimelineText(project)}</span>
                              <span className="text-slate-500 dark:text-slate-300">{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right whitespace-nowrap relative" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => { e.stopPropagation(); setActionMenuProjectId(actionMenuProjectId === projectId ? null : projectId); }} className="text-[#64748b] dark:text-slate-300 hover:text-primary transition-colors p-1.5 rounded-full">
                            <span className="material-symbols-outlined text-2xl">more_vert</span>
                          </button>
                          {actionMenuProjectId === projectId && (
                            <div className="absolute right-4 mt-2 w-48 bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-lg shadow-lg z-50">
                              <button onClick={(e) => { e.stopPropagation(); confirmDeleteProject(project); }} className="w-full px-4 py-2 text-xs font-bold text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">delete</span>
                                Hapus Proyek
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-[#e2e8f0] dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
             <p className="text-xs font-black text-[#64748b] dark:text-slate-300 uppercase tracking-widest">{pagination ? `Menampilkan proyek tahun ${selectedYear}` : ''}</p>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">warning</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Hapus Proyek?</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Proyek yang akan dihapus:</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{projectToDelete.title}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{projectToDelete.code}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Ketik <span className="font-black text-red-600 select-all">HAPUS PROYEK</span> untuk konfirmasi
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="HAPUS PROYEK"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteProject}
                disabled={deleteConfirmationText !== 'HAPUS PROYEK' || isDeleting}
                className="px-5 py-2.5 rounded-xl text-sm font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Hapus Permanen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProjectMonitoringScreen;
