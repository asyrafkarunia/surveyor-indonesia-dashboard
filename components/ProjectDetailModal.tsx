import React, { useEffect, useMemo, useState, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from './Toast';

interface ProjectDetailModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updatedProject: any) => void;
}

const formatCurrency = (value: any) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

const formatNumberInput = (value: string | number) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
};

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ projectId, isOpen, onClose, onUpdated }) => {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const [form, setForm] = useState({
    status: 'PENDING',
    progress: 0,
    budget: '',
    actual_revenue: '',
    revenue_increment: '',
    description: '',
  });

  const [activeTab, setActiveTab] = useState<'general' | 'scurve'>('general');
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const overlayRef = useRef<boolean>(false);

  const generateMonthTimeline = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = [];
    
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= last) {
        months.push({
          month_label: current.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          planned: 0,
          actual: 0
        });
        current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  // Sync progress with latest actual value from scheduleData
  useEffect(() => {
    if (scheduleData.length > 0) {
      // Find the latest entry that has an actual value (or just take the last one if we assume sequential)
      // For simplicity and realism, we'll take the last entry in the list as the 'current' progress target
      // but we search backwards for the first non-zero actual value to be more precise.
      let latestProgress = 0;
      for (let i = scheduleData.length - 1; i >= 0; i--) {
        if (scheduleData[i].actual > 0) {
          latestProgress = scheduleData[i].actual;
          break;
        }
      }
      setForm(f => ({ ...f, progress: latestProgress }));
    }
  }, [scheduleData]);

  useEffect(() => {
    if (!isOpen) return;
    const run = async () => {
      setLoading(true);
      try {
        const data: any = await api.getProject(projectId);
        setProject(data);
        setForm({
          status: data?.status || 'PENDING',
          progress: Number(data?.progress ?? 0),
          budget: data?.budget ? String(data.budget).split('.')[0] : '',
          actual_revenue: data?.actual_revenue ? String(data.actual_revenue).split('.')[0] : '',
          revenue_increment: '',
          description: '',
        });
        setScheduleData(data?.schedule_data?.timeline || generateMonthTimeline(data.start_date, data.end_date));
      } catch (e) {
        console.error('Failed to load project detail:', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [isOpen, projectId]);

  useEffect(() => {
    if (!isOpen) {
      setIsReviewing(false);
      setProject(null);
    }
  }, [isOpen]);

  const newTotalRevenue = useMemo(() => {
    const current = Number(form.actual_revenue) || 0;
    const increment = Number(form.revenue_increment) || 0;
    return current + increment;
  }, [form.actual_revenue, form.revenue_increment]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        status: form.status,
        progress: form.progress,
        budget: form.budget ? Number(form.budget) : null,
        actual_revenue: newTotalRevenue,
        schedule_data: { timeline: scheduleData }
      };

      const updatedDetails: any = await api.updateProject(projectId, payload);
      
      const oldProgress = Number(project?.progress ?? 0);
      if (form.description.trim() || form.progress !== oldProgress) {
        let note = `[Sistem] Capaian progres diperbarui menjadi ${form.progress}%.`;
        if (form.description.trim()) {
          note += `\nCatatan Tambahan: ${form.description.trim()}`;
        }
        try {
          await api.addProjectComment(projectId, note);
        } catch (e) {
          console.error("Gagal menambahkan catatan capaian ke komentar:", e);
        }
      }

      setProject(updatedDetails);
      onUpdated?.(updatedDetails);
      showToast('Pembaruan capaian berhasil disimpan', 'success');
      onClose();
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan error tidak diketahui', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]" 
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) overlayRef.current = true;
      }}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget && overlayRef.current) {
          onClose();
        }
        overlayRef.current = false;
      }}
    >
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        onMouseDown={(e) => { e.stopPropagation(); overlayRef.current = false; }}
      >
        {/* Header */}
        <div className="p-7 pb-0 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-teal-600 text-2xl font-bold">sync_alt</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">Pembaruan Capaian</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1.5 truncate max-w-[300px]">
                  {project?.title} • {project?.code}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          {!isReviewing && (
            <div className="flex gap-6 mt-4 border-b border-transparent">
              <button 
                onClick={() => setActiveTab('general')}
                className={`pb-4 px-2 text-[12px] font-black tracking-wider uppercase transition-colors relative
                  ${activeTab === 'general' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                Capaian Umum
                {activeTab === 'general' && <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-t-full bg-teal-500" />}
              </button>
              <button 
                onClick={() => setActiveTab('scurve')}
                className={`pb-4 px-2 text-[12px] font-black tracking-wider uppercase transition-colors relative
                  ${activeTab === 'scurve' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                Data Kurva S (Manual)
                {activeTab === 'scurve' && <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-t-full bg-teal-500" />}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-teal-500/20 border-t-teal-500 animate-spin"></div>
            <p className="text-xs font-black uppercase text-slate-400">Loading details...</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-7 custom-scrollbar space-y-8">
              {!isReviewing ? (
                activeTab === 'scurve' ? (
                  <div key="scurve-tab" className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Tabel Data Kurva S</h4>
                      <p className="text-[11px] text-slate-500 font-bold max-w-lg mt-1">Input akumulatif total persentase (%) Rencana dan Realisasi pada masing-masing bulan untuk dicetak di diagram S-Curve.</p>
                    </div>
                    <button 
                      onClick={() => setScheduleData([...scheduleData, { month_label: 'Custom Bulan', planned: 0, actual: 0 }])}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Bulan Ekstra
                    </button>
                  </div>
                  
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="p-4 border-b border-slate-200 dark:border-slate-800">Bulan</th>
                          <th className="p-4 border-b border-slate-200 dark:border-slate-800 w-32">Rencana (%)</th>
                          <th className="p-4 border-b border-slate-200 dark:border-slate-800 w-32">Realisasi (%)</th>
                          <th className="p-4 border-b border-slate-200 dark:border-slate-800 w-16 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleData.length === 0 ? (
                           <tr><td colSpan={4} className="p-8 text-center text-xs font-bold text-slate-400">Belum ada data bulan yang di-generate.</td></tr>
                        ) : (
                          scheduleData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 group">
                              <td className="p-2 px-4">
                                <input 
                                  className="w-full bg-transparent font-black text-xs text-slate-700 dark:text-slate-200 outline-none p-2 border border-transparent rounded hover:border-slate-200 dark:hover:border-slate-700 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800"
                                  value={row.month_label}
                                  onChange={(e) => {
                                    const newData = [...scheduleData];
                                    newData[idx].month_label = e.target.value;
                                    setScheduleData(newData);
                                  }}
                                />
                              </td>
                              <td className="p-2 px-4">
                                <input 
                                  type="number"
                                  className="w-full bg-slate-50 dark:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200 outline-none p-2 rounded border border-slate-200 dark:border-slate-700 focus:border-teal-500"
                                  value={row.planned}
                                  onChange={(e) => {
                                    const newData = [...scheduleData];
                                    newData[idx].planned = Number(e.target.value);
                                    setScheduleData(newData);
                                  }}
                                />
                              </td>
                              <td className="p-2 px-4">
                                <input 
                                  type="number"
                                  className="w-full bg-slate-50 dark:bg-slate-800 font-bold text-sm text-emerald-600 dark:text-emerald-400 outline-none p-2 rounded border border-slate-200 dark:border-slate-700 focus:border-emerald-500"
                                  value={row.actual}
                                  onChange={(e) => {
                                    const newData = [...scheduleData];
                                    newData[idx].actual = Number(e.target.value);
                                    setScheduleData(newData);
                                  }}
                                />
                              </td>
                              <td className="p-2 px-4 text-center">
                                <button
                                  onClick={() => setScheduleData(scheduleData.filter((_, i) => i !== idx))}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div key="general-tab" className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                  {/* Status & Progress Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">flag</span> Status Proyek
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['RUNNING', 'DONE', 'PENDING', 'REJECTED'].map((st) => (
                          <button
                            key={st}
                            onClick={() => setForm(f => ({ ...f, status: st }))}
                            className={`px-4 py-2.5 rounded-xl text-[11px] font-black border transition-all
                              ${form.status === st 
                                ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-teal-200'}`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">trending_up</span> Progress Kerja
                      </label>
                      <div className="bg-white dark:bg-slate-900/40 p-4 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <span className="text-3xl font-black text-teal-600 tracking-tighter">{form.progress}%</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Progres Saat Ini</span>
                          </div>
                          
                          <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800" />
                          
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Metode Sinkronisasi</h4>
                              <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-500/10 text-teal-600 text-[8px] font-black rounded-full uppercase border border-teal-100 dark:border-teal-500/20">Otomatis</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Data terhubung langsung dengan timeline Kurva S</p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => setActiveTab('scurve')}
                          className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-500/10 border border-slate-200 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-500/30 text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-sm">tune</span>
                          Edit Kurva S
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Financial Section (Incremental Updates) */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">payments</span> Financial Update (Incremental)
                    </label>
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Budget Edit with Confirmation */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400">NILAI KONTRAK SAAT INI</p>
                        <p className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(project?.budget)}</p>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 group-focus-within:text-teal-500">IDR</span>
                          <input
                            type="text"
                            placeholder="Revisi Nilai Kontrak..."
                            value={formatNumberInput(form.budget)}
                            onChange={(e) => setForm(f => ({ ...f, budget: e.target.value.replace(/\D/g, '') }))}
                            className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                          />
                        </div>
                      </div>

                      {/* Realisasi Increment (The "Neraca" Flow) */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Input Penambahan Realisasi (Neraca)</p>
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 mb-2">
                          <p className="text-[9px] font-black text-emerald-600/60 uppercase mb-1">Total Terserap Sekarang</p>
                          <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(project?.actual_revenue)}</p>
                        </div>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-emerald-600 transition-transform group-hover:scale-110">+</span>
                          <input
                            type="text"
                            placeholder="Contoh: 50.000.000"
                            value={formatNumberInput(form.revenue_increment)}
                            onChange={(e) => setForm(f => ({ ...f, revenue_increment: e.target.value.replace(/\D/g, '') }))}
                            className="w-full bg-white dark:bg-slate-800 border-emerald-200/60 dark:border-emerald-800/40 rounded-xl py-3.5 pl-10 pr-4 text-sm font-black text-emerald-700 dark:text-emerald-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none animate-pulse-subtle"
                          />
                        </div>
                        {form.revenue_increment && (
                          <div className="pt-2 border-t border-dashed border-emerald-200 dark:border-emerald-800 flex justify-between items-center text-[11px] font-black">
                            <span className="text-slate-400 italic font-medium">Preview Total Realisasi Baru:</span>
                            <span className="text-emerald-600">{formatCurrency(newTotalRevenue)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">history_edu</span> Keterangan Progress (Opsional)
                    </label>
                    <textarea
                      placeholder="Masukkan catatan pembaruan jika ada..."
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-teal-500/10 outline-none transition-all resize-none"
                    />
                  </div>
                </>
                )
              ) : (
                /* Confirmation View */
                <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-amber-600 text-3xl font-bold">fact_check</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">Konfirmasi Pembaruan</h4>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-[320px] mx-auto">
                      Harap periksa kembali detail perubahan di bawah ini sebelum menyimpan ke sistem permanen.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                      <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Status Proyek</span>
                          <p className="text-xs font-black text-teal-600">{form.status}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Progress Akhir</span>
                          <p className="text-xs font-black text-teal-600">{form.progress}%</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">Nilai Kontrak Baru</span>
                        <span className="text-sm font-black text-slate-700 dark:text-white">
                          {form.budget ? formatCurrency(Number(form.budget)) : formatCurrency(project?.budget)}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">PENAMBAHAN REALISASI (NERACA)</p>
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-bold text-slate-400 mb-1">Total Realisasi Akhir</span>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 line-through block mb-0.5">{formatCurrency(project?.actual_revenue)}</span>
                            <span className="text-base font-black text-emerald-600">{formatCurrency(newTotalRevenue)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <span className="material-symbols-outlined">auto_graph</span>
                      </div>
                      <div>
                        <p className="text-xs font-black text-blue-700 dark:text-blue-400">Data Jadwal & Kurva S Terintegrasi</p>
                        <p className="text-[10px] text-blue-600/70 font-bold uppercase">Seluruh titik koordinat rencana & realisasi telah disinkronkan.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-7 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
              {!isReviewing ? (
                <>
                  <button
                    onClick={() => setIsReviewing(true)}
                    className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    Tinjau Perubahan
                  </button>
                  <button
                    onClick={onClose}
                    className="px-8 h-12 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </button>
                </>
              ) : (
                <>
                  <button
                    disabled={saving}
                    onClick={handleSave}
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">{saving ? 'sync' : 'save_as'}</span>
                    {saving ? 'Sedang Menyimpan...' : 'Konfirmasi & Simpan'}
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => setIsReviewing(false)}
                    className="px-8 h-12 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all disabled:opacity-50"
                  >
                    Kembali Edit
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailModal;

