
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface SphManagementScreenProps {
  onCreateClick: () => void;
}

const SphManagementScreen: React.FC<SphManagementScreenProps> = ({ onCreateClick }) => {
  const [sphList, setSphList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Sent', label: 'Menunggu Approval' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  useEffect(() => {
    fetchSph();
  }, [statusFilter, startDate, endDate, page]);

  const fetchSph = async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }
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

  const getStatusStyle = (status: string, isNewApplication?: boolean) => {
    if (isNewApplication && (status === 'Sent' || status === 'Draft')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    switch (status) {
      case 'Approved': return 'bg-green-50 text-green-700 border-green-100';
      case 'Sent': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getStatusDot = (status: string, isNewApplication?: boolean) => {
    if (isNewApplication && (status === 'Sent' || status === 'Draft')) {
      return 'bg-emerald-500';
    }
    switch (status) {
      case 'Approved': return 'bg-green-500';
      case 'Sent': return 'bg-blue-500';
      case 'Draft': return 'bg-gray-500';
      case 'Rejected': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
      <div className="mx-auto max-w-[1200px] flex flex-col gap-6 pb-12">
        {/* Page Heading & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Surat Penawaran Harga</h2>
            <p className="text-slate-500 text-sm max-w-xl">Kelola, lacak, dan buat dokumen penawaran harga untuk klien Anda secara efisien.</p>
          </div>
          <button 
            onClick={onCreateClick}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Buat SPH Baru
          </button>
        </div>

        {/* Filters and Table Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Filters Header */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative w-full group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] group-focus-within:text-primary transition-colors">search</span>
                <input 
                  className="pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-primary rounded-lg text-sm w-full transition-all outline-none" 
                  placeholder="Cari No. SPH, Klien, atau Proyek..." 
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setPage(1); fetchSph(); } }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-black uppercase tracking-widest text-slate-600 border border-slate-200"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input type="date" className="px-3 py-2.5 border rounded-lg text-xs font-semibold text-slate-600" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <input type="date" className="px-3 py-2.5 border rounded-lg text-xs font-semibold text-slate-600" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                <button onClick={() => { setPage(1); fetchSph(); }} className="px-3 py-2.5 bg-slate-50 border rounded-lg text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100">Terapkan</button>
                <button
                  onClick={fetchSph}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                  title="Refresh Data"
                >
                  <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                  {loading ? '...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                  <th className="px-6 py-4">No. SPH</th>
                  <th className="px-6 py-4">Klien & Proyek</th>
                  <th className="px-6 py-4 text-right">Nilai (IDR)</th>
                  <th className="px-6 py-4">Tanggal Dibuat</th>
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
                    <tr key={sph.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5 font-bold text-slate-900">{sph.sph_no}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 truncate">{sph.client?.company_name || '-'}</span>
                          <span className="text-[10px] font-medium text-slate-500 truncate uppercase tracking-tight">{sph.project_name || sph.project?.title || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-slate-900 tabular-nums">
                        {Number(sph.value || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-5 text-slate-500 font-medium">
                        {sph.date_created ? format(new Date(sph.date_created), 'dd MMM yyyy', { locale: id }) : '-'}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(sph.status, sph.is_new_application)}`}>
                          <span className={`size-1.5 rounded-full ${getStatusDot(sph.status, sph.is_new_application)}`}></span>
                          {sph.is_new_application && (sph.status === 'Sent' || sph.status === 'Draft') ? 'Tanda Tangan Basah' : sph.status}
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
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Ditolak Klien"
                              >
                                <span className="material-symbols-outlined text-[20px]">cancel</span>
                              </button>
                            </>
                          )}
                          {sph.status === 'Draft' && !sph.is_new_application && (
                            <button onClick={() => handleGenerate(sph.id)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-red-50 rounded-lg transition-colors" title="Generate & Kirim ke Approver">
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
                              target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors" title="Download PDF">
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
          <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Menampilkan halaman {page} dari {lastPage} • Total {total}</span>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-black uppercase tracking-widest text-slate-400 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <button
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-black uppercase tracking-widest text-slate-600 bg-white hover:bg-slate-50 shadow-sm transition-all"
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SphManagementScreen;
