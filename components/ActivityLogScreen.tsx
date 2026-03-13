
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { ActivityLogEntry } from '../types';
import { ADMIN_ACTIVITY_LOGS } from '../constants';

const ActivityLogScreen: React.FC = () => {
  const { isMarketing } = useAuth();
  const isAdmin = isMarketing();

  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLogEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [selectedActionTypes, setSelectedActionTypes] = useState<string[]>([]);
  const [showActionTypeDropdown, setShowActionTypeDropdown] = useState(false);
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [userOptions, setUserOptions] = useState<{ id: string; name: string }[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
      loadUsers();
    }
  }, [isAdmin, currentPage, selectedActionTypes, moduleFilter, statusFilter, searchQuery, dateRange, userFilter]);

  const loadUsers = async () => {
    try {
      const res: any = await api.getUsers();
      const payload = res.data || res;
      const users = payload.data || payload || [];
      const mapped = (users || []).map((u: any) => ({ id: u.id?.toString?.() || String(u.id), name: u.name || 'Unknown User' }));
      setUserOptions(mapped);
    } catch (error) {
      console.error('Failed to load users for activity log filter', error);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = { page: currentPage };
      if (selectedActionTypes.length > 0) {
        params.action_types = selectedActionTypes;
      }
      if (moduleFilter) params.module = moduleFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      if (dateRange) {
        params.date_from = dateRange;
        params.date_to = dateRange;
      }
      if (userFilter) params.user_id = userFilter;
      
      const response: any = await api.getActivityLogs(params);
      if (response && response.data) {
        // Map API response to ActivityLogEntry format
        const mappedLogs: ActivityLogEntry[] = response.data.map((log: any) => {
          const user = log.user || {};
          const createdAt = new Date(log.created_at);
          const dateStr = createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const timeStr = createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          
          // Determine module icon and color based on module name
          const getModuleInfo = (module: string) => {
            const moduleLower = module.toLowerCase();
            if (moduleLower.includes('sph')) {
              return { icon: 'description', color: 'purple' };
            } else if (moduleLower.includes('client')) {
              return { icon: 'apartment', color: 'blue' };
            } else if (moduleLower.includes('project')) {
              return { icon: 'folder', color: 'orange' };
            } else if (moduleLower.includes('user') || moduleLower.includes('permission')) {
              return { icon: 'manage_accounts', color: 'orange' };
            } else if (moduleLower.includes('marketing')) {
              return { icon: 'campaign', color: 'blue' };
            } else if (moduleLower.includes('auth')) {
              return { icon: 'lock', color: 'red' };
            }
            return { icon: 'settings', color: 'slate' };
          };
          
          const moduleInfo = getModuleInfo(log.module);
          
          return {
            id: log.id.toString(),
            date: dateStr,
            time: timeStr,
            adminName: user.name || 'Unknown User',
            adminId: user.id?.toString() || 'N/A',
            adminInitials: user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??',
            adminAvatar: user.avatar || undefined,
            action: log.action,
            actionTarget: log.action_target || '',
            module: log.module,
            moduleIcon: moduleInfo.icon,
            moduleColor: moduleInfo.color,
            status: log.status || 'Success',
          };
        });
        
        setLogs(mappedLogs);
        setTotalPages(response.last_page || 1);
        setTotalResults(response.total || 0);
      } else {
        // Fallback to mock data if API not available
        setLogs(ADMIN_ACTIVITY_LOGS);
        setTotalPages(1);
        setTotalResults(ADMIN_ACTIVITY_LOGS.length);
      }
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      // Fallback to mock data
      setLogs(ADMIN_ACTIVITY_LOGS);
      setTotalPages(1);
      setTotalResults(ADMIN_ACTIVITY_LOGS.length);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setCurrentPage(1);
    loadLogs();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateRange('');
    setSelectedActionTypes([]);
    setModuleFilter('');
    setStatusFilter('');
    setUserFilter('');
    setCurrentPage(1);
    loadLogs();
  };

  const toggleActionType = (actionType: string) => {
    setSelectedActionTypes(prev => {
      if (prev.includes(actionType)) {
        return prev.filter(type => type !== actionType);
      } else {
        return [...prev, actionType];
      }
    });
  };

  const selectAllInCategory = (categoryActions: string[]) => {
    setSelectedActionTypes(prev => {
      const allSelected = categoryActions.every(action => prev.includes(action));
      if (allSelected) {
        // Deselect all in category
        return prev.filter(action => !categoryActions.includes(action));
      } else {
        // Select all in category
        const newSelections = [...prev];
        categoryActions.forEach(action => {
          if (!newSelections.includes(action)) {
            newSelections.push(action);
          }
        });
        return newSelections;
      }
    });
  };

  const actionTypeCategories = {
    'Authentication': ['Authentication', 'Login', 'Logout'],
    'User Management': ['User Management', 'User Created', 'User Updated', 'User Deleted', 'Password Changed'],
    'Project Management': ['Project Management', 'Project Created', 'Project Updated', 'Project Approved', 'Project Rejected'],
    'Marketing': ['Marketing', 'Marketing Task Created', 'Marketing Task Updated', 'Marketing Task Deleted', 'Marketing Task Moved'],
    'Client Management': ['Client Management', 'Client Created', 'Client Updated', 'Client Deleted'],
    'SPH Management': ['SPH Management', 'SPH Created', 'SPH Approved'],
    'Permissions': ['Permissions', 'Permissions Updated'],
  };

  const handleExportCSV = () => {
    // Convert logs to CSV
    const headers = ['Timestamp', 'Administrator', 'Action', 'Module', 'Status'];
    const rows = logs.map(log => [
      `${log.date} ${log.time}`,
      log.adminName,
      `${log.action} ${log.actionTarget || ''}`,
      log.module,
      log.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewDetails = (log: ActivityLogEntry) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const filteredLogs = logs.filter(log => {
    // Filter by selected user (client-side safety net)
    if (userFilter && log.adminId !== userFilter) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.adminName.toLowerCase().includes(query) ||
        log.adminId.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        (log.actionTarget && log.actionTarget.toLowerCase().includes(query)) ||
        log.module.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (!isAdmin) {
    return (
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Akses Ditolak</h2>
            <p className="text-slate-500 dark:text-slate-400">Hanya tim marketing yang dapat mengakses halaman ini.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20">
          
          {/* Breadcrumbs */}
          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
            <span className="hover:text-primary transition-colors cursor-pointer">Dashboard</span>
            <span className="text-slate-300 dark:text-slate-400">/</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Settings</span>
            <span className="text-slate-300 dark:text-slate-400">/</span>
            <span className="text-slate-900 dark:text-white">Activity Log</span>
          </div>

          {/* Page Heading & Export */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black tracking-tight leading-none">Log Aktivitas Sistem</h1>
              <p className="text-slate-500 dark:text-slate-400 text-base font-medium max-w-2xl">Monitor semua aktivitas, perubahan sistem, dan kejadian keamanan di seluruh platform.</p>
            </div>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-6 py-3 rounded-xl hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 font-black text-[10px] uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              <span>Export CSV</span>
            </button>
          </div>

          {/* Filters Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row gap-6 items-end">
              {/* Search */}
              <div className="flex-1 min-w-[250px] w-full">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Cari Log</label>
                <div className="relative group flex items-center">
                  <input 
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-primary/20 focus:border-primary text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-400 pl-11 transition-all text-slate-900 dark:text-white" 
                    placeholder="Cari berdasarkan ID, Nama, atau Kata Kunci..." 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute left-4 text-slate-400 dark:text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                </div>
              </div>
              
              {/* User Filter */}
              <div className="w-full lg:w-1/4 min-w-[200px]">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Filter Pengguna</label>
                <div className="relative group flex items-center">
                  <select
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-primary/20 focus:border-primary text-sm font-bold pl-11 pr-3 transition-all text-slate-900 dark:text-white cursor-pointer"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                  >
                    <option value="">Semua pengguna</option>
                    {userOptions.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute left-4 text-slate-400 dark:text-slate-400 group-focus-within:text-primary transition-colors">person</span>
                </div>
              </div>
              
              {/* Date Range */}
              <div className="w-full lg:w-1/4 min-w-[200px]">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Rentang Tanggal</label>
                <div className="relative group flex items-center">
                  <input 
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-primary/20 focus:border-primary text-sm font-bold pl-11 transition-all text-slate-900 dark:text-white" 
                    placeholder="Pilih tanggal..." 
                    type="date"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute left-4 text-slate-400 dark:text-slate-400 group-focus-within:text-primary transition-colors">calendar_month</span>
                </div>
              </div>
              
              {/* Action Type Multi-Select */}
              <div className="w-full lg:w-1/3 min-w-[280px]">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Kategori Tipe Aksi (Multi-Select)</label>
                <div className="relative z-50">
                  <button
                    type="button"
                    onClick={() => setShowActionTypeDropdown(!showActionTypeDropdown)}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-primary/20 focus:border-primary text-sm font-bold px-4 pr-10 cursor-pointer text-slate-900 dark:text-white flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <span className="truncate">
                      {selectedActionTypes.length === 0 
                        ? 'Pilih Kategori Aksi...' 
                        : `${selectedActionTypes.length} kategori dipilih`}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-400">
                      {showActionTypeDropdown ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showActionTypeDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-[500px] overflow-y-auto custom-scrollbar">
                      <div className="p-4 space-y-4">
                        {/* Selected Badges */}
                        {selectedActionTypes.length > 0 && (
                          <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {selectedActionTypes.map((type) => (
                                <span
                                  key={type}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 dark:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-tight rounded-lg"
                                >
                                  {type}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleActionType(type);
                                    }}
                                    className="hover:text-red-600 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                  </button>
                                </span>
                              ))}
                            </div>
                            <button
                              onClick={() => setSelectedActionTypes([])}
                              className="text-[10px] font-black text-slate-400 dark:text-slate-400 hover:text-primary uppercase tracking-widest transition-colors"
                            >
                              Hapus Semua
                            </button>
                          </div>
                        )}
                        
                        {/* Categories */}
                        {Object.entries(actionTypeCategories).map(([categoryName, actions]) => {
                          const categorySelected = actions.filter(a => selectedActionTypes.includes(a));
                          const allSelected = categorySelected.length === actions.length;
                          const someSelected = categorySelected.length > 0 && categorySelected.length < actions.length;
                          
                          return (
                            <div key={categoryName} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-200 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(input) => {
                                      if (input) input.indeterminate = someSelected;
                                    }}
                                    onChange={() => selectAllInCategory(actions)}
                                    className="w-4 h-4 text-primary border-slate-300 dark:border-slate-600 rounded focus:ring-primary/20 cursor-pointer"
                                  />
                                  <span>{categoryName}</span>
                                </label>
                              </div>
                              <div className="pl-6 space-y-1.5">
                                {actions.map((action) => (
                                  <label
                                    key={action}
                                    className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white dark:hover:text-slate-200 cursor-pointer py-1"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedActionTypes.includes(action)}
                                      onChange={() => toggleActionType(action)}
                                      className="w-3.5 h-3.5 text-primary border-slate-300 dark:border-slate-600 rounded focus:ring-primary/20 cursor-pointer"
                                    />
                                    <span>{action}</span>
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

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <button 
                  onClick={handleFilter}
                  className="h-12 px-8 bg-primary hover:bg-primary-dark text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 flex-1 lg:flex-none justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">filter_list</span>
                  <span>Filter</span>
                </button>
                <button 
                  onClick={handleResetFilters}
                  className="h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-300 rounded-xl transition-all flex items-center justify-center shadow-sm" 
                  title="Reset Filters"
                >
                  <span className="material-symbols-outlined text-[22px]">restart_alt</span>
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap w-48">Timestamp</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap w-64">Pengguna</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">Deskripsi Aksi</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap w-40">Modul</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap w-32">Status</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap w-20 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">Memuat data...</td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">Tidak ada data log aktivitas</td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-700/50 transition-colors group">
                      <td className="p-6 whitespace-nowrap">
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{log.date}</span>
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight">{log.time}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          {log.adminAvatar ? (
                              <img src={log.adminAvatar} className="size-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm" alt={log.adminName} />
                          ) : (
                              <div className="size-9 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-primary text-xs font-black border border-red-100 dark:border-red-800 shadow-sm">
                                {log.adminInitials || log.adminName.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-black text-slate-900 dark:text-white truncate">{log.adminName}</span>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest truncate">{log.adminId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                            {log.action} {log.actionTarget && <span className="font-black text-slate-900 dark:text-white ml-1">{log.actionTarget}</span>}
                        </p>
                      </td>
                      <td className="p-6">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight border ${
                            log.moduleColor === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800' :
                            log.moduleColor === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800' :
                            log.moduleColor === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800' :
                            log.moduleColor === 'red' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800' :
                            'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}>
                          <span className="material-symbols-outlined text-[16px]">{log.moduleIcon}</span>
                          {log.module}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                            log.status === 'Success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800' :
                            log.status === 'Warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800' :
                            'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800'
                        }`}>
                          <span className={`size-1.5 rounded-full ${
                            log.status === 'Success' ? 'bg-emerald-500' :
                            log.status === 'Warning' ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}></span>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                          <button 
                            onClick={() => handleViewDetails(log)}
                            className="p-2 text-slate-400 dark:text-slate-400 hover:text-primary hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-red-100 dark:hover:border-red-800"
                          >
                          <span className="material-symbols-outlined text-[22px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 dark:bg-slate-900/30">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
                Menampilkan <span className="text-slate-900 dark:text-white">{(currentPage - 1) * 10 + 1}</span> sampai <span className="text-slate-900 dark:text-white">{Math.min(currentPage * 10, totalResults)}</span> dari <span className="text-slate-900 dark:text-white">{totalResults}</span> hasil
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest cursor-not-allowed disabled:opacity-50 disabled:cursor-not-allowed enabled:text-slate-600 dark:text-slate-300 enabled:dark:text-slate-300 enabled:hover:bg-slate-50 dark:bg-slate-900 enabled:dark:hover:bg-slate-700 enabled:cursor-pointer enabled:transition-all"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`size-9 flex items-center justify-center rounded-xl text-[11px] font-black transition-all ${
                          currentPage === page
                            ? 'bg-primary text-white shadow-lg shadow-red-500/20'
                            : 'border border-transparent hover:border-slate-200 dark:border-slate-700 dark:hover:border-slate-600 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close action type dropdown */}
      {showActionTypeDropdown && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowActionTypeDropdown(false)}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Detail Log Aktivitas</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Timestamp</label>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedLog.date} {selectedLog.time}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Pengguna</label>
                <div className="flex items-center gap-3">
                  {selectedLog.adminAvatar ? (
                    <img src={selectedLog.adminAvatar} className="size-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" alt={selectedLog.adminName} />
                  ) : (
                    <div className="size-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-primary text-sm font-black border border-red-100 dark:border-red-800">
                      {selectedLog.adminInitials || selectedLog.adminName.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-black text-slate-900 dark:text-white">{selectedLog.adminName}</p>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{selectedLog.adminId}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Aksi</label>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedLog.action} {selectedLog.actionTarget && <span className="text-primary">{selectedLog.actionTarget}</span>}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Modul</label>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight border ${
                  selectedLog.moduleColor === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800' :
                  selectedLog.moduleColor === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800' :
                  selectedLog.moduleColor === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800' :
                  selectedLog.moduleColor === 'red' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800' :
                  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">{selectedLog.moduleIcon}</span>
                  {selectedLog.module}
                </span>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Status</label>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${
                  selectedLog.status === 'Success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800' :
                  selectedLog.status === 'Warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800' :
                  'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800'
                }`}>
                  <span className={`size-2 rounded-full ${
                    selectedLog.status === 'Success' ? 'bg-emerald-500' :
                    selectedLog.status === 'Warning' ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}></span>
                  {selectedLog.status}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-red-500/20"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ActivityLogScreen;
