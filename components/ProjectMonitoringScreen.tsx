
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import ActivityModal from './ActivityModal';
import ProjectDetailModal from './ProjectDetailModal';
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

  // Ensure selected year is visible when it changes (but don't interfere with manual scrolling)
  useEffect(() => {
    const selectedIndex = allYears.indexOf(selectedYear);
    if (selectedIndex !== -1) {
      const currentEndIndex = visibleStartIndex + VISIBLE_YEARS_COUNT - 1;
      // Only auto-scroll if the selected year is completely outside the visible range
      if (selectedIndex < visibleStartIndex) {
        // Selected year is before visible range, scroll to show it at the start
        setVisibleStartIndex(selectedIndex);
      } else if (selectedIndex > currentEndIndex) {
        // Selected year is after visible range, scroll to show it
        // Position it so it's visible (at the end of visible range)
        const newStartIndex = Math.max(0, selectedIndex - VISIBLE_YEARS_COUNT + 1);
        setVisibleStartIndex(newStartIndex);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const scrollYears = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setVisibleStartIndex(Math.max(0, visibleStartIndex - 1));
    } else {
      // Allow scrolling right until the last year (2026) is visible
      // Calculate the maximum start index where we can still show 4 years
      const maxStartIndex = Math.max(0, allYears.length - VISIBLE_YEARS_COUNT);
      if (visibleStartIndex < maxStartIndex) {
        setVisibleStartIndex(visibleStartIndex + 1);
      }
    }
  };

  const canScrollLeft = visibleStartIndex > 0;
  // Can scroll right if we haven't reached the position where the last year is visible
  const maxStartIndex = Math.max(0, allYears.length - VISIBLE_YEARS_COUNT);
  const canScrollRight = visibleStartIndex < maxStartIndex;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-blue-100 text-blue-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'DONE':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700 dark:text-slate-200';
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
    if (picOptions.length === 0 && projects.length > 0) {
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
    }
  }, [projects, picOptions.length]);

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Update current page list optimistically
    setProjects((prev) => prev.map((p: any) => (String(p.id) === String(updated.id) ? { ...p, ...updated } : p)));
    // Refresh stats (progress/status changes can affect it)
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

  // Calculate donut chart percentages
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

  const uniquePics = Array.from(new Set(projects.map((p: any) => p.pic?.name).filter(Boolean)))
    .sort((a, b) => String(a).localeCompare(String(b), 'id-ID'));
  const uniqueMarketingPics = Array.from(new Set(projects.map((p: any) => p.marketing_pic?.name).filter(Boolean)))
    .sort((a, b) => String(a).localeCompare(String(b), 'id-ID'));

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

  const isFiltered = !!(picFilter || picMarketingFilter || statusFilter || progressFilter || contractFilter);

  const allVisibleSelected =
    filteredProjects.length > 0 &&
    filteredProjects.every((project: any) => selectedExportIds.includes(getProjectExportId(project)));

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

  const handleExportExcel = () => {
    const headers = [
      'ID',
      'Code',
      'Title',
      'Client',
      'PIC',
      'Status',
      'Progress',
      'Start Date',
      'End Date',
      'Nilai Kontrak',
      'Actual (Aktualisasi)',
      'Project Type (Portofolio)',
      'Approval Status',
    ];

    const projectsToExport = getProjectsForExport();
    const rows = buildExportRows(projectsToExport);

    const data = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Style header row (row 1)
    if ((worksheet as any)['!ref']) {
      const range = XLSX.utils.decode_range((worksheet as any)['!ref']);
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c });
        const cell = (worksheet as any)[cellAddress];
        if (cell) {
          cell.s = {
            font: { bold: true, color: { rgb: 'FFFFFFFF' } },
            fill: { patternType: 'solid', fgColor: { rgb: 'FFEF4444' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
              left: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
              right: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
              bottom: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
            },
          };
        }
      }

      // Format data rows: Progress as percent, Budget & Actual as numeric with thousand separators
      for (let r = range.s.r + 1; r <= range.e.r; r++) {
        const progressAddr = XLSX.utils.encode_cell({ r, c: 6 });
        const budgetAddr = XLSX.utils.encode_cell({ r, c: 9 });
        const actualAddr = XLSX.utils.encode_cell({ r, c: 10 });

        const progressCell = (worksheet as any)[progressAddr];
        if (progressCell && progressCell.v !== undefined && progressCell.v !== null && !isNaN(Number(progressCell.v))) {
          const numeric = Number(progressCell.v) / 100;
          progressCell.v = numeric;
          progressCell.t = 'n';
          progressCell.z = '0%';
        }

        const budgetCell = (worksheet as any)[budgetAddr];
        if (budgetCell && budgetCell.v !== undefined && budgetCell.v !== null && !isNaN(Number(budgetCell.v))) {
          budgetCell.v = Number(budgetCell.v);
          budgetCell.t = 'n';
          budgetCell.z = '#,##0';
        }

        const actualCell = (worksheet as any)[actualAddr];
        if (actualCell && actualCell.v !== undefined && actualCell.v !== null && !isNaN(Number(actualCell.v))) {
          actualCell.v = Number(actualCell.v);
          actualCell.t = 'n';
          actualCell.z = '#,##0';
        }
      }
    }

    // Set column widths for better readability
    const colWidths = [
      { wch: 6 },   // ID
      { wch: 14 },  // Code
      { wch: 40 },  // Title
      { wch: 28 },  // Client
      { wch: 20 },  // PIC
      { wch: 12 },  // Status
      { wch: 10 },  // Progress
      { wch: 14 },  // Start Date
      { wch: 14 },  // End Date
      { wch: 16 },  // Budget
      { wch: 18 },  // Actual
      { wch: 22 },  // Project Type
      { wch: 18 },  // Approval Status
    ];
    (worksheet as any)['!cols'] = colWidths;

    // Add auto filter on header row so Excel shows filter dropdowns
    if ((worksheet as any)['!ref']) {
      (worksheet as any)['!autofilter'] = { ref: (worksheet as any)['!ref'] };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proyek');

    const filename = `Monitoring_Proyek_${selectedYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Code',
      'Title',
      'Client',
      'PIC',
      'Status',
      'Progress',
      'Start Date',
      'End Date',
      'Budget',
      'Actual (Aktualisasi)',
      'Project Type (Portofolio)',
      'Approval Status',
    ];

    const projectsToExport = getProjectsForExport();
    const rows = buildExportRows(projectsToExport);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monitoring_Proyek_${selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-auto bg-background-light">
      {/* Header */}
      <header className="p-8 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#1a0f0f] dark:text-white text-3xl font-black tracking-tight">Dashboard Monitoring Status Proyek</h2>
            <p className="text-[#915555] dark:text-slate-300 text-sm font-normal uppercase tracking-wider">Integrated view of all assurance project stages across Indonesia</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onAddProject}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-dark transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Tambah Proyek Baru
            </button>
          </div>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-[#e5d2d2] dark:border-slate-700 shadow-sm w-fit">
          <button 
            onClick={() => scrollYears('left')}
            disabled={!canScrollLeft}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              canScrollLeft ? 'text-[#915555] dark:text-slate-300 cursor-pointer' : 'text-gray-300 cursor-not-allowed opacity-50'
            }`}
            title="Tahun sebelumnya"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex items-center gap-2">
            {visibleYears.map(year => (
              <button 
                key={year}
                onClick={() => handleYearChange(year)}
                className={`px-5 py-2 text-sm font-bold rounded-lg transition-all min-w-[70px] ${
                  year === selectedYear 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/20' 
                  : 'text-[#6b7280] dark:text-slate-400 hover:bg-gray-100 hover:scale-105 border border-transparent hover:border-gray-200'
                }`}
                title={`Lihat data tahun ${year}`}
              >
                {year}
              </button>
            ))}
          </div>
          <button 
            onClick={() => scrollYears('right')}
            disabled={!canScrollRight}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              canScrollRight ? 'text-[#915555] dark:text-slate-300 cursor-pointer' : 'text-gray-300 cursor-not-allowed opacity-50'
            }`}
            title="Tahun berikutnya"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <section className="px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[#e5d2d2] dark:border-slate-700 shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#915555] dark:text-slate-300 text-xs font-bold uppercase tracking-wider">Total Proyek ({selectedYear})</p>
              <span className="material-symbols-outlined text-primary text-xl">folder_shared</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-[#1a0f0f] dark:text-white text-3xl font-black">{stats?.totalProjects || 0}</p>
              {stats?.totalTrend !== undefined && (
                <p className={`text-xs font-bold ${stats.totalTrend >= 0 ? 'text-[#078807]' : 'text-red-600'}`}>
                  {stats.totalTrend >= 0 ? '+' : ''}{stats.totalTrend}%
                </p>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[#e5d2d2] dark:border-slate-700 shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#915555] dark:text-slate-300 text-xs font-bold uppercase tracking-wider">Menunggu Persetujuan</p>
              <span className="material-symbols-outlined text-yellow-500 text-xl">pending_actions</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-[#1a0f0f] dark:text-white text-3xl font-black">{stats?.pendingProjects || 0}</p>
              <p className="text-[#915555] dark:text-slate-300 text-xs font-medium">{stats?.pendingPercent || 0}% total</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[#e5d2d2] dark:border-slate-700 border-l-4 border-l-blue-500 shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#915555] dark:text-slate-300 text-xs font-bold uppercase tracking-wider">Sedang Berjalan</p>
              <span className="material-symbols-outlined text-blue-500 text-xl">rocket_launch</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-[#1a0f0f] dark:text-white text-3xl font-black">{stats?.runningProjects || 0}</p>
              {stats?.runningTrend !== undefined && (
                <p className={`text-xs font-bold ${stats.runningTrend >= 0 ? 'text-[#078807]' : 'text-red-600'}`}>
                  {stats.runningTrend >= 0 ? '+' : ''}{stats.runningTrend}%
                </p>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[#e5d2d2] dark:border-slate-700 shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#915555] dark:text-slate-300 text-xs font-bold uppercase tracking-wider">Selesai</p>
              <span className="material-symbols-outlined text-green-500 text-xl">verified</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-[#1a0f0f] dark:text-white text-3xl font-black">{stats?.doneProjects || 0}</p>
              {stats?.doneTrend !== undefined && (
                <p className={`text-xs font-bold ${stats.doneTrend >= 0 ? 'text-[#078807]' : 'text-red-600'}`}>
                  {stats.doneTrend >= 0 ? '+' : ''}{stats.doneTrend}%
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Visual Analytics */}
      <section className="px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Donut */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[#e5d2d2] dark:border-slate-700 shadow-sm">
            <h3 className="text-[#1a0f0f] dark:text-white text-sm font-bold mb-6 flex items-center gap-2 uppercase tracking-widest">
              <span className="material-symbols-outlined text-primary text-lg">pie_chart</span>
              Distribusi Status Proyek {selectedYear}
            </h3>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-sm text-[#915555] dark:text-slate-300">Loading...</div>
              </div>
            ) : stats ? (
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-48 h-48 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {donutData.running > 0 && (
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="15.91549430918954" 
                        fill="transparent" 
                        stroke="#3b82f6" 
                        strokeWidth="4" 
                        strokeDasharray={`${donutData.running} ${100 - donutData.running}`} 
                        strokeDashoffset="0"
                      />
                    )}
                    {donutData.pending > 0 && (
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="15.91549430918954" 
                        fill="transparent" 
                        stroke="#f59e0b" 
                        strokeWidth="4" 
                        strokeDasharray={`${donutData.pending} ${100 - donutData.pending}`} 
                        strokeDashoffset={-donutData.running}
                      />
                    )}
                    {donutData.done > 0 && (
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="15.91549430918954" 
                        fill="transparent" 
                        stroke="#10b981" 
                        strokeWidth="4" 
                        strokeDasharray={`${donutData.done} ${100 - donutData.done}`} 
                        strokeDashoffset={-(donutData.running + donutData.pending)}
                      />
                    )}
                    {donutData.rejected > 0 && (
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="15.91549430918954" 
                        fill="transparent" 
                        stroke="#d32f2f" 
                        strokeWidth="4" 
                        strokeDasharray={`${donutData.rejected} ${100 - donutData.rejected}`} 
                        strokeDashoffset={-(donutData.running + donutData.pending + donutData.done)}
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-black text-[#1a0f0f] dark:text-white">{stats.totalProjects || 0}</span>
                    <span className="text-[10px] text-[#915555] dark:text-slate-300 font-bold uppercase tracking-widest">Total</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      <span className="text-xs font-bold text-[#6b7280] dark:text-slate-400 uppercase tracking-tighter">Running</span>
                    </div>
                    <span className="text-xs font-black text-[#1a0f0f] dark:text-white">
                      {stats.runningProjects || 0} ({stats.runningPercent || 0}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      <span className="text-xs font-bold text-[#6b7280] dark:text-slate-400 uppercase tracking-tighter">Pending</span>
                    </div>
                    <span className="text-xs font-black text-[#1a0f0f] dark:text-white">
                      {stats.pendingProjects || 0} ({stats.pendingPercent || 0}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span className="text-xs font-bold text-[#6b7280] dark:text-slate-400 uppercase tracking-tighter">Done</span>
                    </div>
                    <span className="text-xs font-black text-[#1a0f0f] dark:text-white">
                      {stats.doneProjects || 0} ({stats.donePercent || 0}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-primary"></span>
                      <span className="text-xs font-bold text-[#6b7280] dark:text-slate-400 uppercase tracking-tighter">Rejected</span>
                    </div>
                    <span className="text-xs font-black text-[#1a0f0f] dark:text-white">
                      {stats.rejectedProjects || 0} ({stats.rejectedPercent || 0}%)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-sm text-[#915555] dark:text-slate-300">Tidak ada data</div>
              </div>
            )}
          </div>

          {/* Portofolio Proyek Bar Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-[#e5d2d2] dark:border-slate-700 shadow-sm">
            <h3 className="text-[#1a0f0f] dark:text-white text-sm font-bold mb-6 flex items-center gap-2 uppercase tracking-widest">
              <span className="material-symbols-outlined text-[#1a237e] text-lg">bar_chart</span>
              Portofolio Proyek {selectedYear}
            </h3>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-sm text-[#915555] dark:text-slate-300">Loading...</div>
              </div>
            ) : stats?.portfolioData && stats.portfolioData.length > 0 ? (
              <div className="space-y-6">
                {stats.portfolioData.map((item: any, index: number) => {
                  const colors = ['#1a237e', '#4a5568', '#d33131'];
                  const color = colors[index % colors.length];
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-[#915555] dark:text-slate-300">
                        <span>{item.category}</span>
                        <span>{item.count} Projects</span>
                      </div>
                      <div className="w-full bg-[#f2e9e9] dark:bg-slate-700 h-6 rounded-lg overflow-hidden flex">
                        <div 
                          className="h-full transition-all duration-1000" 
                          style={{ width: `${item.percentage}%`, backgroundColor: color }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-sm text-[#915555] dark:text-slate-300">Tidak ada data</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="px-8 py-2">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#e5d2d2] dark:border-slate-700 flex flex-col gap-3 shadow-sm">
          <div className="w-full">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#915555] dark:text-slate-300 text-xl group-focus-within:text-primary transition-colors">search</span>
              <input 
                className="w-full bg-[#f2e9e9] dark:bg-slate-700 border-none rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-primary placeholder:text-[#915555] dark:text-slate-300 text-[#1a0f0f] dark:text-white font-medium" 
                placeholder="Cari nama proyek atau ID..." 
                type="text"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-black text-[#b5655f] uppercase tracking-widest">Filter By:</span>
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#fdf7f7] dark:bg-slate-800 rounded-lg border border-[#f3dcdc] dark:border-slate-700 hover:border-[#e1b9b9] dark:border-slate-600 cursor-pointer min-w-[140px]">
                <span className="material-symbols-outlined text-[16px] text-[#b5655f]">badge</span>
                <select
                  className="px-3 md:px-4 py-2 text-xs md:text-sm font-bold bg-white dark:bg-slate-800 border-l-0 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 appearance-none pr-10 cursor-pointer shadow-sm transition-all flex-1 min-w-[120px] max-w-[160px]"
                  value={picFilter}
                  onChange={(e) => setPicFilter(e.target.value)}
                >
                  <option className="dark:bg-slate-800" value="">PIC Proyek</option>
                  {uniquePics.map(p => (
                    <option className="dark:bg-slate-800" key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#fdf7f7] dark:bg-slate-800 rounded-lg border border-[#f3dcdc] dark:border-slate-700 hover:border-[#e1b9b9] dark:border-slate-600 cursor-pointer min-w-[140px]">
                <span className="material-symbols-outlined text-[16px] text-[#b5655f]">campaign</span>
                <select
                  className="px-3 md:px-4 py-2 text-xs md:text-sm font-bold bg-white dark:bg-slate-800 border-l-0 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 appearance-none pr-10 cursor-pointer rounded-r-xl md:rounded-r-2xl shadow-sm transition-all flex-1 min-w-[120px] max-w-[160px]"
                  value={picMarketingFilter}
                  onChange={(e) => setPicMarketingFilter(e.target.value)}
                >
                  <option className="dark:bg-slate-800" value="">PIC Marketing</option>
                  {uniqueMarketingPics.map(p => (
                    <option className="dark:bg-slate-800" key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-[#f2e9e9] dark:border-slate-700 hover:border-[#d6bebe] dark:border-slate-600 cursor-pointer min-w-[140px]">
                <span className="material-symbols-outlined text-[16px] text-[#b5655f]">flag</span>
                <select
                  className="px-3 md:px-4 py-2 text-xs md:text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 appearance-none pr-10 cursor-pointer rounded-l-xl md:rounded-l-2xl shadow-sm transition-all flex-1 min-w-[120px] max-w-[160px]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option className="dark:bg-slate-800" value="">Status</option>
                  {statusOptions.map(st => (
                    <option className="dark:bg-slate-800" key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-[#f2e9e9] dark:border-slate-700 hover:border-[#d6bebe] dark:border-slate-600 cursor-pointer min-w-[140px]">
                <span className="material-symbols-outlined text-[16px] text-[#b5655f]">timeline</span>
                <select
                  className="px-3 md:px-4 py-2 text-xs md:text-sm font-bold bg-white dark:bg-slate-800 border-l-0 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 appearance-none pr-10 cursor-pointer shadow-sm transition-all flex-1 min-w-[120px] max-w-[160px]"
                  value={progressFilter}
                  onChange={(e) => setProgressFilter(e.target.value)}
                >
                  <option className="dark:bg-slate-800" value="">Progress</option>
                  <option className="dark:bg-slate-800" value="0">0%</option>
                  <option className="dark:bg-slate-800" value="lte25">1% - 25%</option>
                  <option className="dark:bg-slate-800" value="lte50">26% - 50%</option>
                  <option className="dark:bg-slate-800" value="lte75">51% - 75%</option>
                  <option className="dark:bg-slate-800" value="lte100">76% - 100%</option>
                </select>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-[#f2e9e9] dark:border-slate-700 hover:border-[#d6bebe] dark:border-slate-600 cursor-pointer min-w-[140px]">
                <span className="material-symbols-outlined text-[16px] text-[#b5655f]">description</span>
                <select
                  className="px-3 md:px-4 py-2 text-xs md:text-sm font-bold bg-white dark:bg-slate-800 border-l-0 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 appearance-none pr-10 cursor-pointer shadow-sm transition-all flex-1 min-w-[120px] max-w-[160px]"
                  value={contractFilter}
                  onChange={(e) => setContractFilter(e.target.value)}
                >
                  <option className="dark:bg-slate-800" value="">Durasi</option>
                  <option className="dark:bg-slate-800" value="lte6m">&le; 6 Bulan</option>
                  <option className="dark:bg-slate-800" value="lte1y">&le; 1 Tahun</option>
                  <option className="dark:bg-slate-800" value="lte2y">&le; 2 Tahun</option>
                  <option className="dark:bg-slate-800" value="gt2y">&gt; 2 Tahun</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPicFilter('');
                  setPicMarketingFilter('');
                  setStatusFilter('');
                  setProgressFilter('');
                  setContractFilter('');
                }}
                className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-800 rounded-lg text-[11px] font-semibold text-[#915555] dark:text-slate-300 border border-[#f2e9e9] dark:border-slate-700 hover:border-[#d6bebe] dark:border-slate-600 w-[120px] h-[36px] tracking-[0.12em] uppercase"
              >
                Reset
              </button>
              <div className="relative inline-block w-[140px] h-[36px]">
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen((prev) => !prev)}
                  className="flex items-center justify-center gap-2 w-full h-full bg-primary text-white rounded-lg text-[11px] font-semibold shadow-sm hover:bg-primary-dark transition-all tracking-[0.12em] uppercase"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Ekspor
                  <span className="material-symbols-outlined text-xs">expand_more</span>
                </button>
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-[#e5d2d2] dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        handleExportExcel();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-[#1a0f0f] dark:text-white hover:bg-gray-100 border-b border-gray-50 dark:border-slate-700/50 text-left"
                    >
                      <span className="material-symbols-outlined text-green-600 text-lg">table_view</span>
                      Ekspor ke Excel
                    </button>
                    <button
                      onClick={() => {
                        handleExportCSV();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-[#1a0f0f] dark:text-white hover:bg-gray-100 text-left"
                    >
                      <span className="material-symbols-outlined text-primary text-lg">description</span>
                      Ekspor CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Table */}
      <section className="px-8 py-6" ref={projectListRef}>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e5d2d2] dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-[#e5d2d2] dark:border-slate-700">
                  <th className="px-4 py-5 w-10 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary border-[#e5d2d2] dark:border-slate-600 rounded focus:ring-primary dark:bg-slate-800"
                      checked={allVisibleSelected}
                      onChange={handleToggleSelectAllVisible}
                    />
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#915555] dark:text-slate-300 uppercase tracking-[0.15em]">Project Name & ID</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#915555] dark:text-slate-300 uppercase tracking-[0.15em]">PIC Proyek</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#915555] dark:text-slate-300 uppercase tracking-[0.15em]">PIC Marketing</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#915555] dark:text-slate-300 uppercase tracking-[0.15em]">Current Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#915555] dark:text-slate-300 uppercase tracking-[0.15em]">Timeline Progress</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[#915555] dark:text-slate-300 uppercase tracking-[0.15em]">Kontrak Proyek</th>
                  <th className="px-6 py-5 text-right">
                    <button
                      onClick={handleExportCSV}
                      className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                      title="Export Table Data (CSV)"
                    >
                      <span className="material-symbols-outlined text-primary text-xl">ios_share</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5d2d2]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-[#915555] dark:text-slate-300">
                      Loading projects...
                    </td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-[#915555] dark:text-slate-300">
                      Tidak ada proyek ditemukan untuk tahun {selectedYear}
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-[#915555] dark:text-slate-300">
                      Tidak ada proyek yang cocok dengan filter yang dipilih
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => {
                    const projectId = getProjectExportId(project);
                    const isSelectedForExport = selectedExportIds.includes(projectId);
                    return (
                    <tr
                      key={projectId}
                      className="hover:bg-red-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedProjectId(projectId)}
                    >
                      <td className="px-4 py-5 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary border-[#e5d2d2] dark:border-slate-600 rounded focus:ring-primary dark:bg-slate-800"
                          checked={isSelectedForExport}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedExportIds((prev) =>
                              prev.includes(projectId)
                                ? prev.filter((id) => id !== projectId)
                                : [...prev, projectId]
                            );
                          }}
                        />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const id = project.id?.toString?.() ?? String(project.id);
                              onViewProjectDetail?.(id);
                            }}
                            className="text-left text-sm font-black text-[#1a0f0f] dark:text-white group-hover:text-primary transition-colors hover:underline"
                          >
                            {highlightText(project.title || '', searchQuery)}
                          </button>
                          <span className="text-xs font-bold text-[#915555] dark:text-slate-300 uppercase tracking-widest mt-0.5">
                            {highlightText(project.code || '', searchQuery)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-black text-primary uppercase">
                              {getInitials(project.pic?.name || 'N/A')}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{project.pic?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                              {getInitials(project.marketing_pic?.name || 'N/A')}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{project.marketing_pic?.name || 'N/A'}</span>
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
                            <span>
                              {project.progress || 0}% 
                              {project.start_date && (
                                <span className={`ml-1 ${project.progress >= 100 || project.status === 'DONE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary dark:text-slate-400'}`}>
                                  • {getTimelineText(project)}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="w-full bg-[#f2e9e9] dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`${getProgressColor(project.status)} h-full rounded-full transition-all duration-1000 shadow-sm`} 
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs text-[#915555] dark:text-slate-300 font-bold italic tracking-tight uppercase leading-relaxed">
                          {formatDate(project.start_date)} - {formatDate(project.end_date)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const id = projectId;
                            setActionMenuProjectId((current) => (current === id ? null : id));
                          }}
                          className="text-[#915555] dark:text-slate-300 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-slate-700"
                          title="Opsi proyek"
                        >
                          <span className="material-symbols-outlined text-2xl">more_vert</span>
                        </button>
                        {actionMenuProjectId === projectId && (                          <div className="absolute right-4 mt-2 w-48 bg-white dark:bg-slate-800 border border-[#e5d2d2] dark:border-slate-700 rounded-lg shadow-lg z-50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const id = projectId;
                                onViewProjectDetail?.(id);
                                setActionMenuProjectId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-bold text-left text-[#1a0f0f] dark:text-white hover:bg-red-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                              Lihat Detail Proyek
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProjectId(projectId);
                                setActionMenuProjectId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-bold text-left text-[#1a0f0f] dark:text-white hover:bg-red-50 dark:hover:bg-slate-700 flex items-center gap-2 border-t border-[#f3dcdc] dark:border-slate-700"
                            >
                              <span className="material-symbols-outlined text-sm text-primary">edit</span>
                              Edit Proyek
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const id = projectId;
                                handleDeleteProject(id);
                              }}
                              className="w-full px-4 py-2 text-xs font-bold text-left text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 flex items-center gap-2 border-t border-[#f3dcdc] dark:border-slate-700"
                            >
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
          
          {/* Footer Table Info */}
          <div className="px-6 py-4 border-t border-[#e5d2d2] dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <p className="text-xs font-black text-[#915555] dark:text-slate-300 uppercase tracking-widest">
              {pagination && !isFiltered ? (
                <>Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} results for Year {selectedYear}</>
              ) : (
                <>Showing {filteredProjects.length} results for Year {selectedYear}</>
              )}
            </p>
            {pagination && pagination.last_page > 1 && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={pagination.current_page === 1}
                  className="px-4 py-1.5 border border-[#e5d2d2] dark:border-slate-700 rounded-lg text-xs font-black uppercase tracking-widest text-[#915555] dark:text-slate-300 hover:bg-white dark:bg-slate-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                  let pageNum;
                  if (pagination.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.current_page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.current_page >= pagination.last_page - 2) {
                    pageNum = pagination.last_page - 4 + i;
                  } else {
                    pageNum = pagination.current_page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${
                        pagination.current_page === pageNum
                          ? 'bg-primary text-white shadow-lg shadow-primary/30'
                          : 'border border-[#e5d2d2] dark:border-slate-700 text-[#915555] dark:text-slate-300 hover:bg-white dark:bg-slate-800 transition-all shadow-sm'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                  disabled={pagination.current_page === pagination.last_page}
                  className="px-4 py-1.5 border border-[#e5d2d2] dark:border-slate-700 rounded-lg text-xs font-black uppercase tracking-widest text-[#915555] dark:text-slate-300 hover:bg-white dark:bg-slate-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">© 2025 PT Surveyor Indonesia Assurance. All rights reserved.</p>
        </footer>
      </section>

      {/* Activity Modal */}
      <ActivityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Project Detail Modal */}
      {selectedProjectId && (
        <ProjectDetailModal
          projectId={selectedProjectId}
          isOpen={!!selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
          onUpdated={handleProjectUpdated}
        />
      )}
    </main>
  );
};

export default ProjectMonitoringScreen;
