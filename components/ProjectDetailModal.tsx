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
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
};

const toPascalCase = (str: string) => {
  if (!str) return '';
  return str.replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
};

const formatDateForInput = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

const formatNumberInput = (value: string | number) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
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

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ projectId, isOpen, onClose, onUpdated }) => {
  const auth = useAuth();
  const isMarketing = auth?.isMarketing || (() => false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);

  const [form, setForm] = useState({
    title: '',
    status: 'PENDING',
    start_date: '',
    end_date: '',
    progress: 0,
    budget: '',
    actual_revenue: '',
    project_type: '',
    description: '',
  });

  const header = useMemo(() => {
    const code = project?.code ? ` • ${project.code}` : '';
    return `${project?.title || 'Detail Proyek'}${code}`;
  }, [project]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const data: any = await api.getProject(projectId);
        if (cancelled) return;
        setProject(data);
        setForm({
          title: data?.title || '',
          status: data?.status || 'PENDING',
          start_date: formatDateForInput(data?.start_date),
          end_date: formatDateForInput(data?.end_date),
          progress: Number(data?.progress ?? 0),
          budget: data?.budget ? String(data.budget).split('.')[0] : '',
          actual_revenue: data?.actual_revenue ? String(data.actual_revenue).split('.')[0] : '',
          project_type: data?.project_type ?? '',
          description: data?.description ?? '',
        });
      } catch (e) {
        console.error('Failed to load project detail:', e);
        if (!cancelled) setProject(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, projectId]);

  useEffect(() => {
    if (!isOpen) {
      setIsEdit(false);
      setProject(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('Judul proyek wajib diisi');
      return;
    }
    const progress = Math.max(0, Math.min(100, Number(form.progress)));
    if (Number.isNaN(progress)) {
      alert('Progress harus berupa angka 0-100');
      return;
    }
    if (form.start_date && form.end_date) {
      const s = new Date(form.start_date);
      const e = new Date(form.end_date);
      if (e < s) {
        alert('Tanggal selesai harus setelah tanggal mulai');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        status: form.status,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        progress,
        project_type: form.project_type || null,
        description: form.description || null,
      };
      if (form.budget === '' || form.budget === null) {
        payload.budget = null;
      } else {
        const budgetNum = Number(form.budget);
        payload.budget = Number.isNaN(budgetNum) ? null : budgetNum;
      }

      if (form.actual_revenue === '' || form.actual_revenue === null) {
        payload.actual_revenue = null;
      } else {
        const actualNum = Number(form.actual_revenue);
        payload.actual_revenue = Number.isNaN(actualNum) ? null : actualNum;
      }

      const updated: any = await api.updateProject(projectId, payload);
      setProject(updated);
      onUpdated?.(updated);
      setIsEdit(false);
      alert('Proyek berhasil diperbarui');
    } catch (e: any) {
      console.error('Failed to update project:', e);
      alert(`Gagal memperbarui proyek: ${e?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 md:px-8 md:pt-8 md:pb-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="min-w-0">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white truncate">{header}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              {project?.client?.company_name ? `Client: ${project.client.company_name}` : 'Client: N/A'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:text-slate-200 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm font-bold text-slate-500 dark:text-slate-400">Memuat detail proyek...</div>
        ) : !project ? (
          <div className="py-16 text-center text-sm font-bold text-slate-500 dark:text-slate-400">Detail proyek tidak tersedia.</div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 md:px-8 md:py-6 space-y-6">
              {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                {isEdit ? (
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="mt-2 w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-bold text-slate-900 dark:text-white"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="RUNNING">RUNNING</option>
                    <option value="DONE">DONE</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                ) : (
                  <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{project.status}</p>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
                {isEdit ? (
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form.progress}
                      onChange={(e) => setForm((p) => ({ ...p, progress: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.progress}
                      onChange={(e) => setForm((p) => ({ ...p, progress: Number(e.target.value) }))}
                      className="w-20 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-black text-slate-900 dark:text-white"
                    />
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {project.progress}%
                        {project.start_date && (
                          <span className={`ml-2 text-xs font-bold ${project.progress >= 100 || project.status === 'DONE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary dark:text-slate-400'}`}>
                            • {getTimelineText(project)}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{project.approval_status || 'N/A'}</p>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nilai Kontrak</p>
                {isEdit ? (
                  <input
                    type="text"
                    value={formatNumberInput(form.budget)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setForm((p) => ({ ...p, budget: val }));
                    }}
                    placeholder="contoh: 150.000.000"
                    className="mt-2 w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(project.budget)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portofolio / Jenis Pekerjaan</p>
                {isEdit ? (
                  <input
                    value={form.project_type as any}
                    onChange={(e) => setForm((p) => ({ ...p, project_type: e.target.value }))}
                    placeholder="contoh: Inspection"
                    className="mt-2 w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{toPascalCase(project.project_type || 'Uncategorized')}</p>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktualisasi (Terserap)</p>
                {isEdit ? (
                  <input
                    type="text"
                    value={formatNumberInput(form.actual_revenue)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setForm((p) => ({ ...p, actual_revenue: val }));
                    }}
                    placeholder="contoh: 50.000.000"
                    className="mt-2 w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(project.actual_revenue)}</p>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Judul Proyek</label>
                {isEdit ? (
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <div className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white leading-snug break-all">
                    {project.title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PIC</label>
                <div className="h-11 flex items-center px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white">
                  {project?.pic?.name || project?.custom_pic_name || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tanggal Mulai</label>
                {isEdit ? (
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <div className="h-11 flex items-center px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white">
                    {formatDateForInput(project.start_date) || 'N/A'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tanggal Selesai</label>
                {isEdit ? (
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <div className="h-11 flex items-center px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white">
                    {formatDateForInput(project.end_date) || 'N/A'}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deskripsi</label>
              {isEdit ? (
                <textarea
                  value={form.description as any}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full min-h-[110px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm font-bold text-slate-900 dark:text-white"
                />
              ) : (
                <textarea
                  readOnly
                  value={project.description || 'N/A'}
                  className="w-full min-h-[110px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm font-bold text-slate-900 dark:text-white resize-y focus:outline-none"
                />
              )}
            </div>

            </div>

            {/* Actions */}
            <div className="p-4 md:px-8 md:py-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex items-center justify-between">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Attachments: <span className="text-slate-900 dark:text-white">{(project.attachments || []).length}</span> • Comments:{' '}
                <span className="text-slate-900 dark:text-white">{(project.comments || []).length}</span>
              </div>
              <div className="flex items-center gap-2">
                {!isEdit ? (
                  <>
                    {isMarketing() && (
                      <button
                        onClick={() => setIsEdit(true)}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                      >
                        Edit Detail
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:bg-slate-900 transition-all"
                    >
                      Tutup
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      disabled={saving}
                      onClick={handleSave}
                      className="px-5 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button
                      disabled={saving}
                      onClick={() => {
                        setIsEdit(false);
                        setForm({
                          title: project?.title || '',
                          status: project?.status || 'PENDING',
                          start_date: project?.start_date || '',
                          end_date: project?.end_date || '',
                          progress: Number(project?.progress ?? 0),
                          budget: project?.budget ? String(project.budget).split('.')[0] : '',
                          actual_revenue: project?.actual_revenue ? String(project.actual_revenue).split('.')[0] : '',
                          project_type: project?.project_type ?? '',
                          description: project?.description ?? '',
                        });
                      }}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:bg-slate-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Batal
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailModal;

