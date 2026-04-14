
import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface SphManagementScreenProps {
  onCreateClick: () => void;
}

const SphManagementScreen: React.FC<SphManagementScreenProps> = ({ onCreateClick }) => {
  const [sphList, setSphList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Sent', label: 'Menunggu Approval' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  useEffect(() => {
    fetchSph();
  }, [dateFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchSph();
      else setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSph = async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (search) params.search = search;
      if (dateFilter) params.date = dateFilter;
      const data: any = await api.getSphList(params);
      const list = data.data || data;
      setSphList(list.data || list);
      setLastPage(list.last_page || 1);
      setTotal(list.total || 0);
    } catch (error) {
      console.error('Failed to fetch SPH', error);
      setSphList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchSph();
  };

  const handleGenerate = async (id: number) => {
    try {
      await api.generateSph(id.toString());
      fetchSph();
    } catch (e) {
      console.error(e);
      alert('Gagal generate SPH');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.approveSph(id.toString());
      fetchSph();
    } catch (e) {
      console.error(e);
      alert('Gagal approve SPH');
    }
  };

  const handleDecision = async (id: string, decision: 'accepted' | 'rejected') => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${decision === 'accepted' ? 'Diterima' : 'Ditolak'}?`)) return;
    try {
      await api.clientDecisionSph(id, decision);
      fetchSph();
    } catch (e) {
      console.error(e);
      alert('Gagal mengubah status');
    }
  };

  const getStatusLabel = (status: string, isNewApplication?: boolean) => {
    if (isNewApplication && (status === 'Sent' || status === 'Draft')) {
      return 'Tanda Tangan Basah';
    }
    const statusMap: Record<string, string> = {
      'Draft': 'Draft',
      'Sent': 'Menunggu Persetujuan',
      'waiting_head_section': 'Menunggu Head Section',
      'waiting_senior_manager': 'Menunggu Senior Manager',
      'waiting_general_manager': 'Menunggu General Manager',
      'waiting_client': 'Menunggu Klien',
      'Approved': 'Disetujui',
      'accepted': 'Diterima',
      'Rejected': 'Ditolak',
      'rejected': 'Ditolak',
    };
    return statusMap[status] || status;
  };

  const getStatusStyle = (status: string, isNewApplication?: boolean) => {
    if (isNewApplication && (status === 'Sent' || status === 'Draft')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    switch (status) {
      case 'Approved': 
      case 'accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'Sent': 
      case 'waiting_head_section':
      case 'waiting_senior_manager':
      case 'waiting_general_manager':
      case 'waiting_client':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'Draft': 
        return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
      case 'Rejected': 
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      default: 
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getStatusDot = (status: string, isNewApplication?: boolean) => {
    if (isNewApplication && (status === 'Sent' || status === 'Draft')) {
      return 'bg-emerald-500';
    }
    switch (status) {
      case 'Approved': 
      case 'accepted': 
        return 'bg-emerald-500';
      case 'Sent': 
      case 'waiting_head_section':
      case 'waiting_senior_manager':
      case 'waiting_general_manager':
      case 'waiting_client':
        return 'bg-amber-500';
      case 'Draft': 
        return 'bg-slate-500';
      case 'Rejected': 
      case 'rejected':
        return 'bg-red-500';
      default: 
        return 'bg-gray-400';
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50 dark:bg-slate-900">
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"></div>
      <div className="mx-auto max-w-7xl flex flex-col gap-6 pb-12">
        {/* Page Heading & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Surat Penawaran Harga</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl">Kelola, lacak, dan buat dokumen penawaran harga untuk klien Anda secara efisien.</p>
          </div>
          <button 
            id="create-sph-btn"
            onClick={onCreateClick}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Buat SPH Baru
          </button>
        </div>

        {/* Filters and Table Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
          {/* Filters Header */}
          <div id="sph-filters" className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] group-focus-within:text-primary transition-colors">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:bg-white dark:bg-slate-800 focus:border-primary rounded-lg text-sm transition-all outline-none" 
                placeholder="Cari Doc No, Klien, atau Proyek..." 
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
                    id="sph-date-filter"
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
                onClick={fetchSph}
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4">Doc No</th>
                  <th className="px-6 py-4">Tanggal Dibuat</th>
                  <th className="px-6 py-4">Klien & Proyek</th>
                  <th className="px-6 py-4 text-right">Nilai (IDR)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr><td className="px-6 py-5 text-center text-slate-400" colSpan={6}>Memuat data...</td></tr>
                ) : sphList.length === 0 ? (
                  <tr><td className="px-6 py-5 text-center text-slate-400" colSpan={6}>Tidak ada SPH</td></tr>
                ) : (
                  sphList.map((sph) => (
                    <tr key={sph.id} className="group hover:bg-slate-50 dark:bg-slate-900 transition-colors">
                      <td className="px-6 py-5 font-bold text-slate-900 dark:text-white font-mono tracking-tight">{sph.sph_no}</td>
                      <td className="px-6 py-5 text-slate-500 dark:text-slate-400 font-medium">
                        {sph.date_created ? format(new Date(sph.date_created), 'dd MMM yyyy', { locale: id }) : '-'}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 text-slate-500 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                            {sph.client?.logo ? (
                              <img 
                                src={sph.client.logo.startsWith('http') ? sph.client.logo : `${(((import.meta as any).env.VITE_API_URL) || 'http://localhost:8000/api').replace(/\/api$/, '')}/storage/${sph.client.logo}`} 
                                alt={sph.client.company_name}
                                className="size-full object-contain p-1"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-lg">domain</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white truncate">{sph.client?.company_name || '-'}</span>
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate uppercase tracking-tight">{sph.project_name || sph.project?.title || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white tabular-nums">
                        {Number(sph.value || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(sph.status, sph.is_new_application)}`}>
                          <span className={`size-1.5 rounded-full ${getStatusDot(sph.status, sph.is_new_application)}`}></span>
                          {getStatusLabel(sph.status, sph.is_new_application)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {sph.is_new_application && sph.status !== 'Approved' && sph.status !== 'Rejected' && (
                            <>
                              <button
                                onClick={() => handleDecision(sph.id.toString(), 'accepted')}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Diterima Klien"
                              >
                                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                              </button>
                              <button
                                onClick={() => handleDecision(sph.id.toString(), 'rejected')}
                                className="p-1.5 text-red-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ditolak Klien"
                              >
                                <span className="material-symbols-outlined text-[20px]">cancel</span>
                              </button>
                            </>
                          )}
                          {sph.status === 'Draft' && (
                            <button onClick={() => handleGenerate(sph.id)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors" title="Kirim ke Approver">
                              <span className="material-symbols-outlined text-[20px]">send</span>
                            </button>
                          )}
                          {sph.status === 'Sent' && (
                            <button onClick={() => handleApprove(sph.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                              <span className="material-symbols-outlined text-[20px]">check_circle</span>
                            </button>
                          )}
                          {(sph.generated_file_path || sph.is_new_application) && (
                            <a href={sph.generated_file_path?.startsWith('http') 
                              ? sph.generated_file_path 
                              : `${(((import.meta as any).env.VITE_API_URL) || 'http://localhost:8000/api').replace(/\/api$/, '')}/storage/${sph.generated_file_path}`}
                              target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-200 rounded-lg transition-colors" title="Download PDF">
                              <span className="material-symbols-outlined text-[20px]">download</span>
                            </a>
                          )}
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
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hal {page} dari {lastPage} • Total {total} SPH</p>
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
      </div>
    </main>
  );
};

export default SphManagementScreen;
