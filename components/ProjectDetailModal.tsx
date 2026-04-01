import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
          description: data?.description ?? '',
        });
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
        description: form.description || null,
      };

      const updatedDetails: any = await api.updateProject(projectId, payload);
      setProject(updatedDetails);
      onUpdated?.(updatedDetails);
      alert('Pembaruan capaian berhasil disimpan');
      onClose();
    } catch (e: any) {
      alert(`Gagal menyimpan: ${e?.message || 'Error tidak diketahui'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-7 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
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

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-teal-500/20 border-t-teal-500 animate-spin"></div>
            <p className="text-xs font-black uppercase text-slate-400">Loading details...</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-7 custom-scrollbar space-y-8">
              {!isReviewing ? (
                <>
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
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-2xl font-black text-teal-600">{form.progress}%</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Target 100%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={form.progress}
                          onChange={(e) => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
                          className="w-full transition-all appearance-none bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full accent-teal-500"
                        />
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
                      <div className="flex justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-400">Status & Progress</span>
                        <span className="text-xs font-black text-teal-600">{form.status} • {form.progress}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">Nilai Kontrak Baru</span>
                        <span className="text-sm font-black text-slate-700 dark:text-white">
                          {form.budget ? formatCurrency(Number(form.budget)) : formatCurrency(project?.budget)}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                        <p className="text-[10px] font-black text-emerald-600 uppercase">PENAMBAHAN REALISASI</p>
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-bold text-slate-400 mb-1">Total Realisasi Baru</span>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 line-through block mb-0.5">{formatCurrency(project?.actual_revenue)}</span>
                            <span className="text-base font-black text-emerald-600">{formatCurrency(newTotalRevenue)}</span>
                          </div>
                        </div>
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

