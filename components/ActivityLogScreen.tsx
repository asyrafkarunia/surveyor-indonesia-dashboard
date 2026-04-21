
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { ActivityLogEntry } from '../types';
import { ADMIN_ACTIVITY_LOGS } from '../constants';

const ITEMS_PER_PAGE = 50;

const parseUserAgent = (ua: string) => {
  if (!ua) return 'Perangkat Tidak Diketahui';
  
  let os = 'OS Tidak Dikenal';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  
  const versionMatch = ua.match(/(?:Edg|Chrome|Firefox|Version)\/(\d+)/);
  const version = versionMatch ? ` ${versionMatch[1]}` : '';

  return `${os} • ${browser}${version}`;
};

// ─── Inline Date Range Picker ────────────────────────────────────────────────
interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onChange: (from: string, to: string) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ dateFrom, dateTo, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatDisplay = () => {
    if (!dateFrom && !dateTo) return 'Pilih rentang tanggal...';
    const fmtDate = (d: string) => {
      if (!d) return '?';
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    if (dateFrom && dateTo) return `${fmtDate(dateFrom)} — ${fmtDate(dateTo)}`;
    if (dateFrom) return `Dari: ${fmtDate(dateFrom)}`;
    return `Sampai: ${fmtDate(dateTo)}`;
  };

  const hasValue = dateFrom || dateTo;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full h-12 bg-slate-50 dark:bg-slate-900 border rounded-xl text-sm font-bold px-4 pl-11 pr-4 flex items-center justify-between transition-all text-left ${
          open
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-slate-100 dark:border-slate-700 hover:border-slate-300'
        } ${hasValue ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
      >
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">date_range</span>
        <span className="truncate">{formatDisplay()}</span>
        {hasValue && (
          <button
            onClick={(e) => { e.stopPropagation(); onChange('', ''); }}
            className="ml-2 shrink-0 text-slate-400 hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </button>

      {open && (
        <div className="absolute z-60 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-5 w-[340px]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tentukan Rentang Tanggal</p>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Dari Tanggal</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={e => onChange(e.target.value, dateTo)}
                className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Sampai Tanggal</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={e => onChange(dateFrom, e.target.value)}
                className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Pintasan Cepat</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Hari ini', fn: () => { const t = new Date().toISOString().split('T')[0]; onChange(t, t); setOpen(false); } },
                { label: '7 Hari', fn: () => { const t = new Date(); const f = new Date(t); f.setDate(f.getDate() - 6); onChange(f.toISOString().split('T')[0], t.toISOString().split('T')[0]); setOpen(false); } },
                { label: '30 Hari', fn: () => { const t = new Date(); const f = new Date(t); f.setDate(f.getDate() - 29); onChange(f.toISOString().split('T')[0], t.toISOString().split('T')[0]); setOpen(false); } },
                { label: 'Bulan Ini', fn: () => { const t = new Date(); const f = new Date(t.getFullYear(), t.getMonth(), 1); onChange(f.toISOString().split('T')[0], t.toISOString().split('T')[0]); setOpen(false); } },
                { label: '3 Bulan', fn: () => { const t = new Date(); const f = new Date(t); f.setMonth(f.getMonth() - 3); onChange(f.toISOString().split('T')[0], t.toISOString().split('T')[0]); setOpen(false); } },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={p.fn}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 hover:bg-primary/10 hover:text-primary border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-300 transition-all uppercase tracking-wide"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="mt-4 w-full h-9 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all"
          >
            Terapkan
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Export CSV Modal ─────────────────────────────────────────────────────────
interface ExportModalProps {
  onClose: () => void;
  currentFilters: { dateFrom: string; dateTo: string; search: string; userFilter: string; actionTypes: string[]; };
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose, currentFilters }) => {
  const [exportFrom, setExportFrom] = useState(currentFilters.dateFrom);
  const [exportTo, setExportTo] = useState(currentFilters.dateTo);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setProgress('Mengambil data dari server...');

    try {
      // Fetch ALL records matching the filters without pagination
      const params: any = {};
      if (exportFrom) params.date_from = exportFrom;
      if (exportTo) params.date_to = exportTo;
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.userFilter) params.user_id = currentFilters.userFilter;
      if (currentFilters.actionTypes.length > 0) params.action_types = currentFilters.actionTypes;
      params.per_page = 9999; // Fetch all

      const response: any = await api.getActivityLogs(params);
      const data = response?.data || response || [];
      
      setProgress(`Menyiapkan ${data.length} baris data...`);

      const headers = ['Timestamp', 'Pengguna', 'Deskripsi Aksi', 'Modul', 'Status'];
      const rows = data.map((log: any) => {
        const user = log.user || {};
        const createdAt = new Date(log.created_at);
        const ts = createdAt.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
        return [
          ts,
          user.name || 'Unknown',
          `${log.action || ''} ${log.action_target || ''}`.trim(),
          log.module || '',
          log.status || '',
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const label = exportFrom && exportTo ? `${exportFrom}_sd_${exportTo}` : new Date().toISOString().split('T')[0];
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `log_aktivitas_${label}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      setProgress('Gagal mengekspor data. Silakan coba lagi.');
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Ekspor Log ke CSV</h3>
            <p className="text-sm text-slate-500 mt-1">Data akan diunduh sesuai rentang yang ditentukan</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Dari Tanggal</label>
            <input
              type="date"
              value={exportFrom}
              max={exportTo || undefined}
              onChange={e => setExportFrom(e.target.value)}
              className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sampai Tanggal</label>
            <input
              type="date"
              value={exportTo}
              min={exportFrom || undefined}
              onChange={e => setExportTo(e.target.value)}
              className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        {!exportFrom && !exportTo && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              Tanpa rentang tanggal, semua log akan diekspor.
            </p>
          </div>
        )}

        {progress && (
          <div className="mt-3 p-3 bg-primary/5 rounded-xl">
            <p className="text-xs font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              {progress}
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
            Batal
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 h-11 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {exporting ? 'Mengunduh...' : 'Unduh CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};
// ─── Searchable User Select ───────────────────────────────────────────────────
interface UserSelectProps {
  options: { id: string; name: string }[];
  value: string;
  onChange: (val: string) => void;
}

const UserSelect: React.FC<UserSelectProps> = ({ options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedName = options.find(o => o.id === value)?.name || 'Semua pengguna';
  const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold px-4 pl-11 pr-4 flex items-center justify-between transition-all hover:border-slate-300 ${
          open ? 'ring-2 ring-primary/20 border-primary' : ''
        } ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
      >
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">person</span>
        <span className="truncate">{selectedName}</span>
        <span className="material-symbols-outlined text-slate-400 text-[20px] transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>expand_more</span>
      </button>

      {open && (
        <div className="absolute z-60 top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                autoFocus
                type="text"
                placeholder="Cari pengguna..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg pl-9 pr-3 text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
              className={`w-full px-4 py-3 text-left text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${!value ? 'text-primary bg-primary/5' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Semua pengguna
            </button>
            {filtered.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false); setSearch(''); }}
                className={`w-full px-4 py-3 text-left text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${value === opt.id ? 'text-primary bg-primary/5' : 'text-slate-600 dark:text-slate-400'}`}
              >
                {opt.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center">
                <span className="material-symbols-outlined text-slate-300 text-[32px] mb-2 block">search_off</span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tidak ada hasil</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Smart Pagination ─────────────────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    pages.push(1);
    if (currentPage > 4) pages.push('...');
    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-slate-50 enabled:dark:hover:bg-slate-700 transition-all"
      >
        ← Sebelumnya
      </button>
      {getPageNumbers().map((p, i) =>
        p === '...'
          ? <span key={`ellipsis-${i}`} className="size-9 flex items-center justify-center text-slate-400 text-sm font-bold">…</span>
          : <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`size-9 flex items-center justify-center rounded-xl text-[11px] font-black transition-all ${
                currentPage === p
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary'
              }`}
            >
              {p}
            </button>
      )}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-slate-50 enabled:dark:hover:bg-slate-700 transition-all"
      >
        Berikutnya →
      </button>
    </div>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ActivityLogScreen: React.FC = () => {
  const { isMarketing } = useAuth();
  const isAdmin = isMarketing();

  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLogEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedActionTypes, setSelectedActionTypes] = useState<string[]>([]);
  const [showActionTypeDropdown, setShowActionTypeDropdown] = useState(false);
  const [userFilter, setUserFilter] = useState('');
  const [userOptions, setUserOptions] = useState<{ id: string; name: string }[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [triggerFetch, setTriggerFetch] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [isAdmin, currentPage, triggerFetch]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const res: any = await api.getUsers();
      const payload = res.data || res;
      const users = (payload.data || payload || []) as any[];
      
      // Sort users alphabetically A-Z
      const sortedUsers = [...users].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      setUserOptions(sortedUsers.map((u: any) => ({ 
        id: u.id?.toString?.() || String(u.id), 
        name: u.name || 'Unknown' 
      })));
    } catch {}
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = { page: currentPage };
      if (selectedActionTypes.length > 0) params.action_types = selectedActionTypes;
      if (searchQuery) params.search = searchQuery;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (userFilter) params.user_id = userFilter;

      const response: any = await api.getActivityLogs(params);
      if (response && response.data) {
        const mappedLogs: ActivityLogEntry[] = response.data.map((log: any) => {
          const user = log.user || {};
          const createdAt = new Date(log.created_at);
          const dateStr = createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const timeStr = createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

          const getModuleInfo = (module: string) => {
            const m = module.toLowerCase();
            if (m.includes('sph')) return { icon: 'description', color: 'purple' };
            if (m.includes('client')) return { icon: 'apartment', color: 'blue' };
            if (m.includes('project')) return { icon: 'folder', color: 'orange' };
            if (m.includes('user') || m.includes('permission')) return { icon: 'manage_accounts', color: 'orange' };
            if (m.includes('marketing')) return { icon: 'campaign', color: 'blue' };
            if (m.includes('auth')) return { icon: 'lock', color: 'red' };
            return { icon: 'settings', color: 'slate' };
          };

          const moduleInfo = getModuleInfo(log.module);
          return {
            id: log.id.toString(),
            date: dateStr,
            time: timeStr,
            adminName: user.name || 'Unknown',
            adminId: user.id?.toString() || 'N/A',
            adminEmail: user.email || '',
            adminInitials: user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??',
            adminAvatar: user.avatar || undefined,
            action: log.action,
            actionTarget: log.action_target || '',
            module: log.module,
            moduleIcon: moduleInfo.icon,
            moduleColor: moduleInfo.color,
            status: log.status || 'Success',
            metadata: log.metadata || null,
          };
        });

        setLogs(mappedLogs);
        setTotalPages(response.last_page || 1);
        setTotalResults(response.total || 0);
      } else {
        setLogs(ADMIN_ACTIVITY_LOGS);
        setTotalPages(1);
        setTotalResults(ADMIN_ACTIVITY_LOGS.length);
      }
    } catch {
      setLogs(ADMIN_ACTIVITY_LOGS);
      setTotalPages(1);
      setTotalResults(ADMIN_ACTIVITY_LOGS.length);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => { 
    if (currentPage === 1) {
      setTriggerFetch(p => p + 1);
    } else {
      setCurrentPage(1); 
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setSelectedActionTypes([]);
    setUserFilter('');
    if (currentPage === 1) {
      setTriggerFetch(p => p + 1);
    } else {
      setCurrentPage(1);
    }
  };

  const toggleActionType = (t: string) =>
    setSelectedActionTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const selectAllInCategory = (actions: string[]) =>
    setSelectedActionTypes(prev => {
      const allSelected = actions.every(a => prev.includes(a));
      return allSelected ? prev.filter(a => !actions.includes(a)) : [...new Set([...prev, ...actions])];
    });

  const actionTypeCategories: Record<string, string[]> = {
    'Authentication': ['Authentication', 'Login', 'Logout'],
    'User Management': ['User Management', 'User Created', 'User Updated', 'User Deleted', 'Password Changed'],
    'Project Management': ['Project Management', 'Project Created', 'Project Updated', 'Project Approved', 'Project Rejected'],
    'Marketing': ['Marketing', 'Marketing Task Created', 'Marketing Task Updated', 'Marketing Task Deleted', 'Marketing Task Moved'],
    'Client Management': ['Client Management', 'Client Created', 'Client Updated', 'Client Deleted'],
    'SPH Management': ['SPH Management', 'SPH Created', 'SPH Approved'],
    'Permissions': ['Permissions', 'Permissions Updated'],
  };

  // Calculated pagination display
  const startItem = logs.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = (currentPage - 1) * ITEMS_PER_PAGE + logs.length;

  const moduleColorClass = (color: string) => ({
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800',
  }[color] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700');

  const statusColorClass = (status: string) => ({
    Success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800',
    Warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800',
    Failed: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800',
  }[status] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700');

  const statusDotClass = (status: string) => ({
    Success: 'bg-emerald-500',
    Warning: 'bg-amber-500',
    Failed: 'bg-red-500',
  }[status] || 'bg-slate-400');

  if (!isAdmin) {
    return (
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Akses Ditolak</h2>
            <p className="text-slate-500 dark:text-slate-400">Hanya administrator yang dapat mengakses halaman ini.</p>
          </div>
        </div>
      </main>
    );
  }

  const hasActiveFilters = searchQuery || dateFrom || dateTo || selectedActionTypes.length > 0 || userFilter;

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20">

          {/* Page Heading & Export */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black tracking-tight leading-none">Log Aktivitas Sistem</h1>
              <p className="text-slate-500 dark:text-slate-400 text-base font-medium max-w-2xl">Monitor semua aktivitas, perubahan sistem, dan kejadian keamanan di seluruh platform.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                id="activity-export-btn"
                onClick={() => setShowExportModal(true)}
                className="group flex items-center gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 text-primary px-6 py-3 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95 font-black text-[10px] uppercase tracking-widest overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">download</span>
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div id="activity-filters" className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="lg:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cari Log</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-400 text-[20px]">search</span>
                  <input
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold placeholder:text-slate-400 text-slate-900 dark:text-white pl-11 transition-all"
                    placeholder="Nama, aksi, atau kata kunci..."
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFilter()}
                  />
                </div>
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Filter Pengguna</label>
                <UserSelect
                  options={userOptions}
                  value={userFilter}
                  onChange={setUserFilter}
                />
              </div>

              {/* Date Range Picker */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rentang Tanggal</label>
                <DateRangePicker
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
                />
              </div>
            </div>

            {/* Second Row: Action Type + Buttons */}
            <div className="flex flex-col lg:flex-row items-end gap-4">
              {/* Action Type Multi-Select */}
              <div className="flex-1 min-w-[220px]">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kategori Aksi</label>
                <div className="relative z-50">
                  <button
                    type="button"
                    onClick={() => setShowActionTypeDropdown(!showActionTypeDropdown)}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold px-4 pr-10 cursor-pointer text-slate-900 dark:text-white flex items-center justify-between hover:border-slate-300 transition-all"
                  >
                    <span className="truncate text-left">
                      {selectedActionTypes.length === 0 ? <span className="text-slate-400">Pilih kategori aksi...</span> : `${selectedActionTypes.length} kategori dipilih`}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 shrink-0">
                      {showActionTypeDropdown ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {showActionTypeDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-[400px] overflow-y-auto custom-scrollbar">
                      <div className="p-4 space-y-4">
                        {selectedActionTypes.length > 0 && (
                          <div className="pb-3 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-1.5">
                            {selectedActionTypes.map(type => (
                              <span key={type} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg">
                                {type}
                                <button onClick={e => { e.stopPropagation(); toggleActionType(type); }} className="hover:text-red-600 transition-colors">
                                  <span className="material-symbols-outlined text-[12px]">close</span>
                                </button>
                              </span>
                            ))}
                            <button onClick={() => setSelectedActionTypes([])} className="text-[10px] font-black text-slate-400 hover:text-red-500 ml-auto transition-colors">Hapus semua</button>
                          </div>
                        )}
                        {Object.entries(actionTypeCategories).map(([name, actions]) => {
                          const sel = actions.filter(a => selectedActionTypes.includes(a));
                          const allSel = sel.length === actions.length;
                          const someSel = sel.length > 0 && sel.length < actions.length;
                          return (
                            <div key={name} className="space-y-1.5">
                              <label className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest cursor-pointer">
                                <input type="checkbox" checked={allSel} ref={i => { if (i) i.indeterminate = someSel; }} onChange={() => selectAllInCategory(actions)} className="w-4 h-4 text-primary rounded" />
                                {name}
                              </label>
                              <div className="pl-6 space-y-1">
                                {actions.map(action => (
                                  <label key={action} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer py-0.5">
                                    <input type="checkbox" checked={selectedActionTypes.includes(action)} onChange={() => toggleActionType(action)} className="w-3.5 h-3.5 text-primary rounded" />
                                    {action}
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleFilter}
                  className="h-12 px-6 bg-primary hover:bg-primary-dark text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  Filter
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    title="Reset Filter"
                    className="h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-slate-400 rounded-xl transition-all flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div id="activity-table" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">Timestamp</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-56">Pengguna</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi Aksi</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Modul</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Status</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {loading ? (
                    <tr><td colSpan={6} className="p-12 text-center text-slate-400 text-sm">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-[32px] animate-spin text-primary">progress_activity</span>
                        <span>Memuat data log...</span>
                      </div>
                    </td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-slate-400 text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-[40px] text-slate-300">search_off</span>
                        <span>Tidak ada data log yang cocok dengan filter saat ini</span>
                      </div>
                    </td></tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group">
                        <td className="p-6 whitespace-nowrap">
                          <span className="text-sm font-black text-slate-900 dark:text-white block">{log.date}</span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{log.time}</span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="relative size-9">
                              {log.adminAvatar ? (
                                <img 
                                  src={log.adminAvatar} 
                                  className="size-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm transition-opacity duration-300" 
                                  alt={log.adminName}
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.opacity = '0';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                  onLoad={(e) => {
                                    (e.target as HTMLImageElement).style.opacity = '1';
                                  }}
                                />
                              ) : null}
                              <div className={`absolute inset-0 size-9 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary text-[10px] font-black border border-blue-100 dark:border-blue-800 uppercase ${log.adminAvatar ? 'hidden' : ''}`}>
                                {log.adminInitials}
                              </div>
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-sm font-black text-slate-900 dark:text-white truncate block">{log.adminName}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.adminId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                            {log.action} {log.actionTarget && <span className="font-black text-slate-900 dark:text-white ml-1">{log.actionTarget}</span>}
                          </p>
                        </td>
                        <td className="p-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight border ${moduleColorClass(log.moduleColor)}`}>
                            <span className="material-symbols-outlined text-[15px]">{log.moduleIcon}</span>
                            {log.module}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${statusColorClass(log.status)}`}>
                            <span className={`size-1.5 rounded-full ${statusDotClass(log.status)}`} />
                            {log.status}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <button
                            onClick={() => { setSelectedLog(log); setShowDetailModal(true); }}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div id="activity-pagination" className="p-5 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/30">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {logs.length === 0 ? 'Tidak ada hasil' : <>Menampilkan <span className="text-slate-900 dark:text-white">{startItem}</span>–<span className="text-slate-900 dark:text-white">{endItem}</span> dari <span className="text-slate-900 dark:text-white">{totalResults}</span> hasil</>}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={p => setCurrentPage(p)} />
            </div>
          </div>

        </div>
      </div>

      {/* Click outside to close action type dropdown */}
      {showActionTypeDropdown && <div className="fixed inset-0 z-30" onClick={() => setShowActionTypeDropdown(false)} />}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          currentFilters={{ dateFrom, dateTo, search: searchQuery, userFilter, actionTypes: selectedActionTypes }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300" onClick={() => setShowDetailModal(false)}>
          <div 
            className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-300" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className={`size-14 rounded-2xl flex items-center justify-center shadow-lg shadow-${selectedLog.moduleColor}/10 border ${moduleColorClass(selectedLog.moduleColor)}`}>
                  <span className="material-symbols-outlined text-[32px]">{selectedLog.moduleIcon}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Audit Log Detail</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{selectedLog.module} • ID: {selectedLog.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-100 dark:hover:border-red-900 transition-all shadow-sm flex items-center justify-center group"
              >
                <span className="material-symbols-outlined text-[24px] group-active:scale-90 transition-transform">close</span>
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Visual Info */}
                <div className="lg:col-span-5 space-y-8">
                  {/* User Profile Card */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-[64px]">person</span>
                    </div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Pengguna Terkait</label>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="relative size-16">
                        {selectedLog.adminAvatar ? (
                          <img 
                            src={selectedLog.adminAvatar} 
                            className="size-16 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-md transition-opacity duration-300" 
                            alt={selectedLog.adminName} 
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.opacity = '0';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                            onLoad={(e) => {
                              (e.target as HTMLImageElement).style.opacity = '1';
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 size-16 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-black shadow-lg shadow-primary/20 border-2 border-white dark:border-slate-700 ${selectedLog.adminAvatar ? 'hidden' : ''}`}>
                          {selectedLog.adminInitials}
                        </div>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-lg font-black text-slate-900 dark:text-white truncate">{selectedLog.adminName}</p>
                        <p className="text-xs font-bold text-slate-500 truncate mb-1">{selectedLog.adminEmail}</p>
                        <span className="inline-flex px-2 py-0.5 bg-slate-200/50 dark:bg-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 rounded-md uppercase tracking-wider">ID: {selectedLog.adminId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Info */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deskripsi Aksi</label>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        {selectedLog.action} {selectedLog.actionTarget && <span className="text-primary font-black ml-1">{selectedLog.actionTarget}</span>}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Kejadian</label>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${statusColorClass(selectedLog.status)}`}>
                          <span className={`size-2 rounded-full animate-pulse ${statusDotClass(selectedLog.status)}`} />
                          {selectedLog.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Waktu Eksekusi</label>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-300">{selectedLog.date} • {selectedLog.time}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Technical Details */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">terminal</span>
                      Detail Metadata & Sistem
                    </label>
                    <button 
                      onClick={() => {
                        const data = JSON.stringify(selectedLog.metadata || {}, null, 2);
                        navigator.clipboard.writeText(data);
                        alert('Data teknis berhasil disalin!');
                      }}
                      className="text-[10px] font-black text-primary hover:text-primary-dark uppercase tracking-widest flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      Salin JSON
                    </button>
                  </div>
                  
                  <div className="flex-1 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-inner group relative overflow-hidden min-h-[300px]">
                    {/* Fake code decoration */}
                    <div className="absolute top-0 right-0 p-6 opacity-5 flex flex-col gap-2 pointer-events-none text-white font-mono text-xs">
                      <span>{"{"}</span>
                      <span>  "status": "active",</span>
                      <span>  "debug": true</span>
                      <span>{"}"}</span>
                    </div>

                    <div className="space-y-6 relative z-10">
                      {/* System Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">IP Address</label>
                          <p className="text-xs font-mono font-bold text-emerald-400">{selectedLog.metadata?.ip_address || '127.0.0.1'}</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Informasi Perangkat</label>
                          <p className="text-xs font-mono font-bold text-slate-400">
                            {parseUserAgent(selectedLog.metadata?.user_agent)}
                          </p>
                        </div>
                      </div>

                      {/* JSON Viewer */}
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Data Perubahan & Context
                        </label>
                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5 max-h-[160px] overflow-y-auto custom-scrollbar font-mono text-[11px] leading-relaxed">
                          {selectedLog.metadata ? (
                            <pre className="text-emerald-400/90 whitespace-pre-wrap">
                              {JSON.stringify(selectedLog.metadata, null, 2)}
                            </pre>
                          ) : (
                            <div className="py-4 text-center">
                              <span className="material-symbols-outlined text-slate-700 text-[24px] mb-1 block">database</span>
                              <p className="text-slate-600 italic">Tidak ada data metadata tambahan untuk log ini.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-10 flex border-t border-slate-100 dark:border-slate-800 pt-8">
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="ml-auto px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/10"
                >
                  Selesaikan Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ActivityLogScreen;
