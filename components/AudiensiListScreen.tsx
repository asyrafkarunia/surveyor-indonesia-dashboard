import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AudiensiListScreenProps {
  onCreateNew: () => void;
  onManageTemplates: () => void;
}

const AudiensiListScreen: React.FC<AudiensiListScreenProps> = ({ onCreateNew, onManageTemplates }) => {
  const [letters, setLetters] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateFilter, setDateFilter] = useState('');
  const [stats, setStats] = useState<{ total_sent?: number; upcoming?: number; completed?: number; rejected?: number }>({});
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLetters();
    fetchStats();
  }, [page, dateFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchLetters();
      else setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (search) params.search = search;
      if (dateFilter) params.date = dateFilter;
      const res: any = await api.getAudiensiList(params);
      const data = res.data || res;
      const list = data.data || data;
      setLetters(list.data || list);
      setLastPage(list.last_page || 1);
      setTotal(list.total || 0);
    } catch (e) {
      console.error(e);
      setLetters([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res: any = await api.getAudiensiStats();
      const data = res.data || res;
      setStats({
        total_sent: data.total_sent ?? data.total ?? 0,
        upcoming: data.upcoming ?? 0,
        completed: data.completed ?? 0,
        rejected: data.rejected ?? 0,
      });
    } catch (e) {
      console.error(e);
      setStats({});
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchLetters();
  };

  const handleDecision = async (id: string, decision: 'accepted' | 'rejected') => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${decision === 'accepted' ? 'Diterima' : 'Ditolak'}?`)) return;
    try {
      await api.clientDecisionAudiensi(id, decision);
      fetchLetters();
      fetchStats();
    } catch (e) {
      console.error(e);
      alert('Gagal mengubah status');
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return '-';
    try { return format(new Date(d), 'dd MMM yyyy', { locale: id }); } catch { return d; }
  };

  const getStatusBadge = (status: string, isNewApplication?: boolean) => {
    if (isNewApplication && (status === 'submitted' || status.startsWith('waiting_'))) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
          <span className="size-1.5 rounded-full bg-emerald-500"></span>
          Tanda Tangan Basah
        </span>
      );
    }

    const statusMap: Record<string, { label: string; className: string; dot: string }> = {
      'submitted': { label: 'Diajukan', className: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
      'waiting_head_section': { label: 'Menunggu Head Section', className: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
      'waiting_senior_manager': { label: 'Menunggu Senior Manager', className: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
      'waiting_general_manager': { label: 'Menunggu General Manager', className: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
      'waiting_client': { label: 'Menunggu Klien', className: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
      'accepted': { label: 'Diterima', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
      'approved': { label: 'Disetujui', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
      'rejected': { label: 'Ditolak', className: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' },
      'draft': { label: 'Draft', className: 'bg-slate-50 text-slate-700 border-slate-100', dot: 'bg-slate-500' },
    };

    const config = statusMap[status] || { label: status, className: 'bg-slate-50 text-slate-700 border-slate-100', dot: 'bg-slate-400' };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.className}`}>
        <span className={`size-1.5 rounded-full ${config.dot}`}></span>
        {config.label}
      </span>
    );
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900 relative">


      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Daftar Surat Audiensi</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl">Manajemen dan pemantauan seluruh permohonan surat audiensi yang telah dibuat.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={onManageTemplates}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                <span className="material-symbols-outlined text-lg">tune</span>
                Kelola Template
              </button>
              <button 
                id="create-audiensi-btn"
                onClick={onCreateNew}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg shadow-sm shadow-primary/20 transition-all font-semibold text-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Buat Surat Baru
              </button>
            </div>
          </div>

          {/* Search & Toolbar */}
          <div id="audiensi-search" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-primary transition-colors">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none" 
                placeholder="Cari nomor surat, perusahaan, atau tujuan..." 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto items-center">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input 
                    type="date"
                    id="audiensi-date-filter"
                    ref={dateInputRef}
                    className="absolute inset-0 opacity-0 pointer-events-none -z-10"
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                  />
                  <button 
                    onClick={() => dateInputRef.current?.showPicker()}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all ${dateFilter ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                    {dateFilter && <span className="text-sm font-bold">{format(new Date(dateFilter), 'dd MMM yyyy', { locale: id })}</span>}
                  </button>
                  {dateFilter && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDateFilter(''); setPage(1); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full size-4 flex items-center justify-center z-20 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[10px] font-bold">close</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold transition-all shadow-sm shadow-primary/20 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-lg">search</span>
                  Cari
                </button>
              </div>
              <button
                onClick={() => { fetchLetters(); fetchStats(); }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50 whitespace-nowrap"
                title="Refresh Data"
              >
                <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
                {loading ? '...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Doc No</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Surat</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Perusahaan/Instansi</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Pimpinan/Tujuan</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td className="px-6 py-4 text-center text-slate-400" colSpan={6}>Memuat data...</td></tr>
                  ) : letters.length === 0 ? (
                    <tr><td className="px-6 py-4 text-center text-slate-400" colSpan={6}>Tidak ada surat audiensi</td></tr>
                  ) : (
                    letters.map((letter) => (
                      <tr key={letter.id} className="hover:bg-blue-50/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono tracking-tight">{letter.letter_number}</span>
                            <span className="text-[10px] text-primary font-bold uppercase mt-0.5">{letter.sector}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(letter.date)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 text-slate-500 overflow-hidden border border-slate-200 dark:border-slate-700">
                              {letter.client?.logo ? (
                                <img 
                                  src={letter.client.logo.startsWith('http') ? letter.client.logo : `${((import.meta as any).env.VITE_API_URL || 'http://localhost:8000').replace(/\/api$/, '')}/storage/${letter.client.logo}`} 
                                  alt={letter.company_name}
                                  className="size-full object-contain p-1"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-lg">domain</span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{letter.company_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{letter.purpose}</td>
                        <td className="px-6 py-4">
                          {getStatusBadge(letter.status, letter.is_new_application)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(letter.status === 'waiting_client' || (!!letter.is_new_application && letter.status !== 'accepted' && letter.status !== 'rejected')) && (
                              <>
                                <button
                                  onClick={() => handleDecision(letter.id, 'accepted')}
                                  className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                  title="Diterima Klien"
                                >
                                  <span className="material-symbols-outlined text-lg">check</span>
                                </button>
                                <button
                                  onClick={() => handleDecision(letter.id, 'rejected')}
                                  className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                                  title="Ditolak Klien"
                                >
                                  <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                              </>
                            )}
                            <div className={`flex items-center justify-end gap-2 ${(letter.status === 'waiting_client' || !!letter.is_new_application) ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                              {letter.generated_file_path && (
                  <a
                    href={letter.generated_file_path.startsWith('http') 
                      ? letter.generated_file_path 
                      : `${((import.meta as any).env.VITE_API_URL || 'http://localhost:8000').replace(/\/api$/, '')}/storage/${letter.generated_file_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
                    title="Download PDF"
                  >
                    <span className="material-symbols-outlined text-xl">download</span>
                  </a>
                )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hal {page} dari {lastPage} • Total {total} surat</p>
              <div className="flex items-center gap-2">
                <button
                  className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:bg-slate-900 disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="px-3 py-1 rounded bg-primary text-white text-xs font-bold">{page}</button>
                <button
                  className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:bg-slate-900 disabled:opacity-50"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div id="audiensi-stats" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">send</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Total Dikirim</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total_sent ?? 0}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="size-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Audiensi Mendatang</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.upcoming ?? 0}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="flex-1 flex items-center gap-4">
                <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined">done_all</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Diterima</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.completed ?? 0}</p>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="flex-1 flex items-center gap-4 pl-4">
                <div className="size-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <span className="material-symbols-outlined">cancel</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Ditolak</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.rejected ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-4 text-center text-xs text-slate-400 pb-4">
            © 2024 PT Surveyor Indonesia. All rights reserved.
          </footer>
        </div>
      </div>
    </main>
  );
};

export default AudiensiListScreen;