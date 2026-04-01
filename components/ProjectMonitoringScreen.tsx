
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import ActivityModal from './ActivityModal';
import ProjectDetailModal from './ProjectDetailModal';
import StatsCard from './StatsCard';
import FilterSelect from './FilterSelect';
import * as XLSX from 'xlsx';

interface ProjectMonitoringScreenProps {
  onAddProject: () => void;
  initialProjectId?: string | null;
  onInitialProjectHandled?: () => void;
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
  initialProjectId,
  onInitialProjectHandled,
  externalSearchQuery,
  onExternalSearchHandled,
  onViewProjectDetail,
}) => {
  const currentYear = new Date().getFullYear();
  const startYear = 2015;
  const endYear = 2026;
  const allYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [actionMenuProjectId, setActionMenuProjectId] = useState<string | null>(null);
  const [picFilter, setPicFilter] = useState<string>('');
  const [picMarketingFilter, setPicMarketingFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [progressFilter, setProgressFilter] = useState<string>('');
  const [contractFilter, setContractFilter] = useState<string>('');
  const [picOptions, setPicOptions] = useState<string[]>([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [selectedExportIds, setSelectedExportIds] = useState<string[]>([]);
  const projectListRef = useRef<HTMLDivElement | null>(null);

  const VISIBLE_YEARS_COUNT = 4;
  const visibleYears = allYears.slice(visibleStartIndex, visibleStartIndex + VISIBLE_YEARS_COUNT);

  useEffect(() => {
    const selectedIndex = allYears.indexOf(selectedYear);
    if (selectedIndex !== -1) {
      const currentEndIndex = visibleStartIndex + VISIBLE_YEARS_COUNT - 1;
      if (selectedIndex < visibleStartIndex) {
        setVisibleStartIndex(selectedIndex);
      } else if (selectedIndex > currentEndIndex) {
        const newStartIndex = Math.max(0, selectedIndex - VISIBLE_YEARS_COUNT + 1);
        setVisibleStartIndex(newStartIndex);
      }
    }
  }, [selectedYear]);

  const scrollYears = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setVisibleStartIndex(Math.max(0, visibleStartIndex - 1));
    } else {
      const maxStartIndex = Math.max(0, allYears.length - VISIBLE_YEARS_COUNT);
      if (visibleStartIndex < maxStartIndex) {
        setVisibleStartIndex(visibleStartIndex + 1);
      }
    }
  };

  const canScrollLeft = visibleStartIndex > 0;
  const maxStartIndex = Math.max(0, allYears.length - VISIBLE_YEARS_COUNT);
  const canScrollRight = visibleStartIndex < maxStartIndex;

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
  }, [selectedYear, searchQuery, currentPage]);

  useEffect(() => {
    const fetchPicOptions = async () => {
      try {
        const res: any = await (api as any).getUsers();
        const data = res?.data || res;
        const list = Array.isArray(data) ? data : (data?.data || []);
        const allowedRoles = ['marketing', 'common', 'approver'];
        const names = Array.from(
          new Set(
            list
              .filter((u: any) => allowedRoles.includes(u.role))
              .map((u: any) => u.name)
              .filter((name: any) => typeof name === 'string' && name.trim().length > 0)
          ) as Set<string>
        ).sort((a, b) => a.localeCompare(b, 'id-ID'));

        if (names.length > 0) {
          setPicOptions(names);
          return;
        }
      } catch (error) {
        console.error('Failed to load PIC options from API:', error);
      }

      const fallbackNames = Array.from(
        new Set(
          projects
            .map((p: any) => p?.pic?.name)
            .filter((name: any) => typeof name === 'string' && name.trim().length > 0)
        ) as Set<string>
      ).sort((a, b) => a.localeCompare(b, 'id-ID'));

      if (fallbackNames.length > 0) {
        setPicOptions(fallbackNames);
      }
    };

    fetchPicOptions();
  }, []);

  useEffect(() => {
    if (externalSearchQuery === undefined || externalSearchQuery === null) return;
    const trimmed = externalSearchQuery.trim();
    if (!trimmed) return;
    if (trimmed !== searchQuery) {
      setSearchQuery(trimmed);
      setCurrentPage(1);
    }
    if (onExternalSearchHandled) {
      onExternalSearchHandled();
    }
    if (projectListRef.current) {
      projectListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [externalSearchQuery]);

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
      onInitialProjectHandled?.();
    } else {
      setSelectedProjectId(null);
    }
  }, [initialProjectId]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
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

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus proyek ini? Tindakan ini tidak dapat dibatalkan.');
    if (!confirmed) return;
    try {
      await api.deleteProject(projectId);
      setProjects((prev) => prev.filter((p: any) => String(p.id) !== String(projectId)));
      if (selectedProjectId && String(selectedProjectId) === String(projectId)) {
        setSelectedProjectId(null);
      }
      setActionMenuProjectId(null);
      fetchStats();
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      alert(error?.message || 'Gagal menghapus proyek. Silakan coba lagi.');
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

  const filteredProjects = projects.filter((project: any) => {
    if (picFilter && (project.pic?.name || '') !== picFilter) return false;
    if (picMarketingFilter && (project.marketing_pic?.name || '') !== picMarketingFilter) return false;
    if (statusFilter && (project.status || '') !== statusFilter) return false;
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
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monitoring_Proyek_${selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main id="project-list-container" className="flex-1 flex flex-col min-w-0 overflow-auto bg-background-light">
      <header className="p-8 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#0f172a] dark:text-white text-3xl font-black tracking-tight">Dashboard Monitoring Status Proyek</h2>
            <p className="text-[#64748b] dark:text-slate-300 text-sm font-normal uppercase tracking-wider">Integrated view of all assurance project stages across Indonesia</p>
          </div>
          <div className="flex items-center gap-3">
            <button id="add-project-btn" onClick={onAddProject} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-dark transition-all active:scale-95">
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Tambah Proyek Baru
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-[#e2e8f0] dark:border-slate-700 shadow-sm w-fit">
          <button onClick={() => scrollYears('left')} disabled={!canScrollLeft} className={`p-2 hover:bg-gray-100 rounded transition-colors ${canScrollLeft ? 'text-[#64748b] dark:text-slate-300 cursor-pointer' : 'text-gray-300 cursor-not-allowed opacity-50'}`}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex items-center gap-2">
            {visibleYears.map(year => (
              <button key={year} onClick={() => handleYearChange(year)} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all min-w-[70px] ${year === selectedYear ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/20' : 'text-[#6b7280] dark:text-slate-400 hover:bg-gray-100 hover:scale-105 border border-transparent hover:border-gray-200'}`}>
                {year}
              </button>
            ))}
          </div>
          <button onClick={() => scrollYears('right')} disabled={!canScrollRight} className={`p-2 hover:bg-gray-100 rounded transition-colors ${canScrollRight ? 'text-[#64748b] dark:text-slate-300 cursor-pointer' : 'text-gray-300 cursor-not-allowed opacity-50'}`}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
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
                <div className="text-sm text-[#64748b] dark:text-slate-300">Loading...</div>
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
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-xs font-bold text-[#6b7280] dark:text-slate-400 uppercase tracking-tighter">Running</span></div>
                    <span className="text-xs font-black text-[#0f172a] dark:text-white">{stats.runningProjects || 0} ({stats.runningPercent || 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span><span className="text-xs font-bold text-[#6b7280] dark:text-slate-400 uppercase tracking-tighter">Pending</span></div>
                    <span className="text-xs font-black text-[#0f172a] dark:text-white">{stats.pendingProjects || 0} ({stats.pendingPercent || 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span><span className="text-xs font-bold text-[#6b7280] dark:text-slate-400 uppercase tracking-tighter">Done</span></div>
                    <span className="text-xs font-black text-[#0f172a] dark:text-white">{stats.doneProjects || 0} ({stats.donePercent || 0}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-xs font-bold text-[#6b7280] dark:text-slate-400 uppercase tracking-tighter">Rejected</span></div>
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
                <div className="text-sm text-[#64748b] dark:text-slate-300">Loading...</div>
              </div>
            ) : stats?.portfolioData && stats.portfolioData.length > 0 ? (
              <div className="space-y-6">
                {stats.portfolioData.map((item: any, index: number) => {
                  const colors = ['#003868', '#4a5568', '#00B4AE'];
                  const color = colors[index % colors.length];
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-[#64748b] dark:text-slate-300">
                        <span>{item.category}</span>
                        <span>{item.count} Projects</span>
                      </div>
                      <div className="w-full bg-[#f1f5f9] dark:bg-slate-700 h-6 rounded-lg overflow-hidden flex">
                        <div className="h-full transition-all duration-1000" style={{ width: `${item.percentage}%`, backgroundColor: color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
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
            <input className="w-full bg-slate-100/50 dark:bg-slate-900/50 border-transparent rounded-xl pl-12 pr-4 py-3 text-[13px] font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-900 border-none placeholder:text-slate-400 dark:text-white transition-all duration-300 outline-none" placeholder="Cari nama proyek, kode, atau kata kunci lainnya..." type="text" value={searchQuery} onChange={handleSearch} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 pr-3 border-r border-slate-100 dark:border-slate-700 h-10 shrink-0"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Filter By:</span></div>
              <FilterSelect label="PIC Proyek" icon="badge" value={picFilter} onChange={setPicFilter} options={picOptions} />
              <FilterSelect label="Status" icon="flag" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
              <button type="button" onClick={() => { setPicFilter(''); setStatusFilter(''); setSearchQuery(''); }} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-[10px] font-black text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-300 tracking-[0.15em] uppercase border border-slate-100 dark:border-slate-800 hover:border-rose-200 active:scale-95 shrink-0">
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                Reset
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="project-table-main" className="px-8 py-4 mb-8">
        <div ref={projectListRef} className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 shadow-sm overflow-hidden relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr id="project-table-header" className="bg-gray-50 dark:bg-slate-900/50 border-b border-[#e2e8f0] dark:border-slate-700">
                  <th className="px-4 py-5 w-10 text-center"><input type="checkbox" className="h-4 w-4 text-primary border-[#e2e8f0] dark:border-slate-600 rounded focus:ring-primary dark:bg-slate-800" checked={allVisibleSelected} onChange={handleToggleSelectAllVisible} /></th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#64748b] dark:text-slate-300 uppercase tracking-[0.15em]">Project Name & ID</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#64748b] dark:text-slate-300 uppercase tracking-[0.15em]">PIC Proyek</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#64748b] dark:text-slate-300 uppercase tracking-[0.15em]">Current Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#64748b] dark:text-slate-300 uppercase tracking-[0.15em]">Timeline Progress</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#64748b] dark:text-slate-300 uppercase tracking-[0.15em]">Kontrak Proyek</th>
                  <th className="px-6 py-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-[#64748b] dark:text-slate-300">Loading projects...</td></tr>
                ) : projects.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-[#64748b] dark:text-slate-300">Tidak ada proyek ditemukan untuk tahun {selectedYear}</td></tr>
                ) : filteredProjects.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-[#64748b] dark:text-slate-300">Tidak ada proyek yang cocok dengan filter</td></tr>
                ) : (
                  filteredProjects.map((project) => {
                    const projectId = getProjectExportId(project);
                    return (
                      <tr key={projectId} className="hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer" onClick={() => onViewProjectDetail?.(projectId)}>
                        <td className="px-4 py-5 text-center">
                          <input type="checkbox" className="h-4 w-4 text-primary border-[#e2e8f0] dark:border-slate-600 rounded focus:ring-primary dark:bg-slate-800" checked={selectedExportIds.includes(projectId)} onChange={(e) => { e.stopPropagation(); setSelectedExportIds(prev => prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]); }} />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-[#0f172a] dark:text-white group-hover:text-primary transition-colors">{highlightText(project.title || '', searchQuery)}</span>
                            <span className="text-xs font-bold text-[#64748b] dark:text-slate-300 uppercase tracking-widest mt-0.5">{highlightText(project.code || '', searchQuery)}</span>
                          </div>
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
                          <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(project.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(project.status)} mr-2`}></span>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5 w-full max-w-[160px]">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 dark:text-slate-400">
                              <span>{project.progress || 0}% • {getTimelineText(project)}</span>
                            </div>
                            <div className="w-full bg-[#f1f5f9] dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div className={`${getProgressColor(project.status)} h-full rounded-full`} style={{ width: `${project.progress || 0}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs text-[#64748b] dark:text-slate-300 font-bold tracking-tight uppercase">
                            {formatDate(project.start_date)} - {formatDate(project.end_date)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right whitespace-nowrap relative">
                          <button onClick={(e) => { e.stopPropagation(); setActionMenuProjectId(actionMenuProjectId === projectId ? null : projectId); }} className="text-[#64748b] dark:text-slate-300 hover:text-primary transition-colors p-1.5 rounded-full">
                            <span className="material-symbols-outlined text-2xl">more_vert</span>
                          </button>
                          {actionMenuProjectId === projectId && (
                            <div className="absolute right-4 mt-2 w-48 bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-lg shadow-lg z-50">
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(projectId); }} className="w-full px-4 py-2 text-xs font-bold text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
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
             <p className="text-xs font-black text-[#64748b] dark:text-slate-300 uppercase tracking-widest">{pagination ? `Showing projects for year ${selectedYear}` : ''}</p>
          </div>
        </div>
      </section>

      {selectedProjectId && (
        <ProjectDetailModal projectId={selectedProjectId} isOpen={!!selectedProjectId} onClose={() => setSelectedProjectId(null)} onUpdated={handleProjectUpdated} />
      )}
    </main>
  );
};

export default ProjectMonitoringScreen;
