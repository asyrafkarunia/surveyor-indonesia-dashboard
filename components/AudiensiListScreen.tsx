import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AudiensiListScreenProps {
  onCreateNew: () => void;
}

const AudiensiListScreen: React.FC<AudiensiListScreenProps> = ({ onCreateNew }) => {
  const [letters, setLetters] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{ total_sent?: number; upcoming?: number; completed?: number; rejected?: number }>({});

  useEffect(() => {
    fetchLetters();
    fetchStats();
  }, [page]);

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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
          Siap Tanda Tangan Basah
        </span>
      );
    }

    const statusMap: Record<string, { label: string; className: string }> = {
      'submitted': { label: 'Diajukan', className: 'bg-blue-100 text-blue-700' },
      'waiting_head_section': { label: 'Menunggu Head Section', className: 'bg-amber-100 text-amber-700' },
      'waiting_senior_manager': { label: 'Menunggu Senior Manager', className: 'bg-orange-100 text-orange-700' },
      'waiting_general_manager': { label: 'Menunggu General Manager', className: 'bg-purple-100 text-purple-700' },
      'waiting_client': { label: 'Menunggu Klien', className: 'bg-indigo-100 text-indigo-700' },
      'accepted': { label: 'Diterima', className: 'bg-emerald-100 text-emerald-700' },
      'approved': { label: 'Disetujui', className: 'bg-emerald-100 text-emerald-700' },
      'rejected': { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
      'draft': { label: 'Draft', className: 'bg-slate-100 text-slate-700 dark:text-slate-200' },
    };

    const config = statusMap[status] || { label: status, className: 'bg-slate-100 text-slate-700 dark:text-slate-200' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
      {/* Top Header / Breadcrumbs */}
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-base">chevron_right</span>
          <span className="text-slate-900 dark:text-white font-medium">Daftar Surat Audiensi</span>
        </div>
      </header>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Daftar Surat Audiensi</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manajemen dan pemantauan seluruh permohonan surat audiensi yang telah dibuat.</p>
            </div>
            <button 
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg shadow-sm shadow-primary/20 transition-all font-semibold text-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Buat Surat Baru
            </button>
          </div>

          {/* Search & Toolbar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-primary transition-colors">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all" 
                placeholder="Cari nomor surat, perusahaan, atau tujuan..." 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">search</span>
                Cari
              </button>
              <button
                onClick={() => { fetchLetters(); fetchStats(); }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                title="Refresh Data"
              >
                <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nomor Surat Audiensi</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tanggal Surat</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Perusahaan/Instansi</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Pimpinan/Tujuan</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td className="px-6 py-4 text-center text-slate-400" colSpan={6}>Memuat data...</td></tr>
                  ) : letters.length === 0 ? (
                    <tr><td className="px-6 py-4 text-center text-slate-400" colSpan={6}>Tidak ada surat audiensi</td></tr>
                  ) : (
                    letters.map((letter) => (
                      <tr key={letter.id} className="hover:bg-red-50/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono tracking-tight">{letter.letter_number}</span>
                            <span className="text-[10px] text-primary font-bold uppercase mt-0.5">{letter.sector}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(letter.date)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`size-8 rounded flex items-center justify-center bg-slate-100 text-slate-500 dark:text-slate-400`}>
                              <span className="material-symbols-outlined text-lg">domain</span>
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
                            {(letter.status === 'waiting_client' || (letter.is_new_application && letter.status !== 'accepted' && letter.status !== 'rejected')) && (
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
                            <div className={`flex items-center justify-end gap-2 ${(letter.status === 'waiting_client' || letter.is_new_application) ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                              {letter.generated_file_path && (
                  <a
                    href={letter.generated_file_path.startsWith('http') 
                      ? letter.generated_file_path 
                      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${letter.generated_file_path}`}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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