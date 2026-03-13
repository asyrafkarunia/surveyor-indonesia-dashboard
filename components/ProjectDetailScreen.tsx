import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import BackButton from './BackButton';

interface ProjectDetailScreenProps {
  projectId: string;
  onBack: () => void;
}

const formatCurrency = (value: any) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
};

const formatDate = (value: any) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toPascalCase = (str: string) => {
  if (!str) return '';
  return str.replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
};

const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ projectId, onBack }) => {
  const auth = useAuth();
  const isMarketing = auth?.isMarketing || (() => false);
  const canEdit = isMarketing();

  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    budget: '',
    actual_revenue: '',
    target_margin: '',
    location_address: '',
    latitude: '',
    longitude: '',
    compliance_requirements: '',
    quality_standard: '',
    target_compliance: '',
    description: '',
  });
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [attachmentLabel, setAttachmentLabel] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submittingAttachment, setSubmittingAttachment] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data: any = await api.getProject(projectId);
        if (cancelled) return;
        setProject(data);
        setEditData({
          budget: data?.budget != null ? String(data.budget) : '',
          actual_revenue: data?.actual_revenue != null ? String(data.actual_revenue) : '',
          target_margin: data?.target_margin != null ? String(data.target_margin) : '',
          location_address: data?.location_address || '',
          latitude: data?.latitude != null ? String(data.latitude) : '',
          longitude: data?.longitude != null ? String(data.longitude) : '',
          compliance_requirements: data?.compliance_requirements || '',
          quality_standard: data?.quality_standard || '',
          target_compliance: data?.target_compliance || '',
          description: data?.description || '',
        });
      } catch (e: any) {
        if (cancelled) return;
        console.error('Failed to load project detail page:', e);
        setError(e?.message || 'Gagal memuat detail proyek');
        setProject(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleCancelEdit = () => {
    if (!project) return;
    setEditData({
      budget: project.budget != null ? String(project.budget) : '',
      actual_revenue: project.actual_revenue != null ? String(project.actual_revenue) : '',
      target_margin: project.target_margin != null ? String(project.target_margin) : '',
      location_address: project.location_address || '',
      latitude: project.latitude != null ? String(project.latitude) : '',
      longitude: project.longitude != null ? String(project.longitude) : '',
      compliance_requirements: project.compliance_requirements || '',
      quality_standard: project.quality_standard || '',
      target_compliance: project.target_compliance || '',
      description: project.description || '',
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!project) return;
    try {
      setSaving(true);
      const payload: any = {
        budget: editData.budget !== '' ? Number(editData.budget) : null,
        actual_revenue: editData.actual_revenue !== '' ? Number(editData.actual_revenue) : null,
        target_margin: editData.target_margin !== '' ? Number(editData.target_margin) : null,
        location_address: editData.location_address || null,
        latitude: editData.latitude !== '' ? Number(editData.latitude) : null,
        longitude: editData.longitude !== '' ? Number(editData.longitude) : null,
        compliance_requirements: editData.compliance_requirements || null,
        quality_standard: editData.quality_standard || null,
        target_compliance: editData.target_compliance || null,
        description: editData.description || null,
      };
      await api.updateProject(projectId, payload);
      const refreshed = await api.getProject(projectId);
      setProject(refreshed);
      setIsEditing(false);
    } catch (e: any) {
      console.error('Failed to update project detail page:', e);
      alert(e?.message || 'Gagal menyimpan perubahan proyek');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentInput.trim() || !project) return;
    try {
      setSubmittingComment(true);
      const res: any = await api.addProjectComment(String(project.id), commentInput.trim());
      const newComment = res?.data || res;
      setProject((prev: any) => {
        if (!prev) return prev;
        const existing = Array.isArray(prev.comments) ? prev.comments : [];
        return { ...prev, comments: [newComment, ...existing] };
      });
      setCommentInput('');
    } catch (e: any) {
      console.error('Failed to add project comment:', e);
      alert(e?.message || 'Gagal menambahkan komentar');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddAttachment = async () => {
    if (!attachmentUrl.trim() || !project) return;
    try {
      setSubmittingAttachment(true);
      const payload = { url: attachmentUrl.trim(), label: attachmentLabel || null };
      const res: any = await api.addProjectAttachmentLink(String(project.id), payload);
      const newAttachment = res?.data || res;
      setProject((prev: any) => {
        if (!prev) return prev;
        const existing = Array.isArray(prev.attachments) ? prev.attachments : [];
        return { ...prev, attachments: [newAttachment, ...existing] };
      });
      setAttachmentLabel('');
      setAttachmentUrl('');
    } catch (e: any) {
      console.error('Failed to add project attachment link:', e);
      alert(e?.message || 'Gagal menyimpan link attachment');
    } finally {
      setSubmittingAttachment(false);
    }
  };

  const attachments = project?.attachments || [];
  const comments = project?.comments || [];

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        <BackButton onClick={onBack} />

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 md:p-8 shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
              Memuat detail proyek...
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm font-bold text-red-500">
              {error}
            </div>
          ) : !project ? (
            <div className="py-16 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
              Detail proyek tidak ditemukan.
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center justify-between mb-6">
                <div className="min-w-0 space-y-1">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white break-words">
                    {project.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <span>{project.code}</span>
                    {project.client?.company_name && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>Client: {project.client.company_name}</span>
                      </>
                    )}
                    {project.project_type && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{toPascalCase(project.project_type)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-stretch md:items-end gap-3">
                  <div className="flex flex-wrap gap-3 justify-start md:justify-end">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700">
                      Status: {project.status}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700">
                      Progress: {project.progress ?? 0}%
                    </span>
                    {project.approval_status && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700">
                        Approval: {project.approval_status}
                      </span>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 justify-end">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 disabled:opacity-50"
                        >
                          Batal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={isEditing ? handleSaveEdit : () => setIsEditing(true)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.18em] hover:bg-primary-dark disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isEditing ? 'save' : 'edit'}
                        </span>
                        {isEditing ? 'Simpan Perubahan' : 'Edit Detail'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Nilai Kontrak
                  </p>
                  {isEditing ? (
                    <input
                      type="number"
                      className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                      value={editData.budget}
                      onChange={(e) => setEditData((prev) => ({ ...prev, budget: e.target.value }))}
                    />
                  ) : (
                    <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(project.budget)}
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Aktualisasi (Terserap)
                  </p>
                  {isEditing ? (
                    <input
                      type="number"
                      className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                      value={editData.actual_revenue}
                      onChange={(e) => setEditData((prev) => ({ ...prev, actual_revenue: e.target.value }))}
                    />
                  ) : (
                    <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(project.actual_revenue)}
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Target Margin
                  </p>
                  {isEditing ? (
                    <input
                      type="number"
                      className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                      value={editData.target_margin}
                      onChange={(e) => setEditData((prev) => ({ ...prev, target_margin: e.target.value }))}
                    />
                  ) : (
                    <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                      {project.target_margin != null ? `${project.target_margin}%` : 'N/A'}
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Periode Proyek
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                    {formatDate(project.start_date)} – {formatDate(project.end_date)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-5">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest">
                      Informasi Proyek
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold text-slate-900 dark:text-white">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          PIC
                        </p>
                        <p>{project.pic?.name || project.custom_pic_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Lokasi
                        </p>
                        {isEditing ? (
                          <textarea
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                            rows={3}
                            value={editData.location_address}
                            onChange={(e) => setEditData((prev) => ({ ...prev, location_address: e.target.value }))}
                          />
                        ) : (
                          <p className="whitespace-pre-line">
                            {project.location_address || 'N/A'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Koordinat
                        </p>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Latitude"
                              className="w-1/2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                              value={editData.latitude}
                              onChange={(e) => setEditData((prev) => ({ ...prev, latitude: e.target.value }))}
                            />
                            <input
                              type="number"
                              placeholder="Longitude"
                              className="w-1/2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                              value={editData.longitude}
                              onChange={(e) => setEditData((prev) => ({ ...prev, longitude: e.target.value }))}
                            />
                          </div>
                        ) : (
                          <p>
                            {project.latitude && project.longitude
                              ? `${project.latitude}, ${project.longitude}`
                              : 'N/A'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Compliance Requirements
                        </p>
                        {isEditing ? (
                          <textarea
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                            rows={3}
                            value={editData.compliance_requirements}
                            onChange={(e) => setEditData((prev) => ({ ...prev, compliance_requirements: e.target.value }))}
                          />
                        ) : (
                          <p className="whitespace-pre-line">
                            {project.compliance_requirements || 'N/A'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Quality Standard
                        </p>
                        {isEditing ? (
                          <textarea
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                            rows={3}
                            value={editData.quality_standard}
                            onChange={(e) => setEditData((prev) => ({ ...prev, quality_standard: e.target.value }))}
                          />
                        ) : (
                          <p className="whitespace-pre-line">
                            {project.quality_standard || 'N/A'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Target Compliance
                        </p>
                        {isEditing ? (
                          <textarea
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                            rows={3}
                            value={editData.target_compliance}
                            onChange={(e) => setEditData((prev) => ({ ...prev, target_compliance: e.target.value }))}
                          />
                        ) : (
                          <p className="whitespace-pre-line">
                            {project.target_compliance || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Deskripsi Proyek
                      </p>
                      {isEditing ? (
                        <textarea
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                          rows={4}
                          value={editData.description}
                          onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
                        />
                      ) : (
                        <p className="text-sm font-bold text-slate-900 dark:text-white whitespace-pre-line">
                          {project.description || 'N/A'}
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        attachment
                      </span>
                      Attachments & Dokumen
                    </h2>
                    {attachments.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium italic">
                        Belum ada dokumen yang diunggah untuk proyek ini.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {attachments.map((att: any) => {
                          const isLink = att.file_type === 'link' || (att.file_path && /^https?:\/\//i.test(att.file_path));
                          const href = isLink
                            ? att.file_path
                            : api.getAttachmentDownloadUrl(String(project.id), String(att.id));
                          const mainLabel = att.file_name || att.label || (isLink ? att.file_path : `Dokumen #${att.id}`);
                          const metaLabel = isLink ? 'Link' : att.file_type || 'Dokumen';
                          const sizeLabel = att.file_size ? `${att.file_size} KB` : 'Ukuran tidak tersedia';
                          return (
                            <div
                              key={att.id}
                              className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-400">
                                  <span className="material-symbols-outlined text-[20px]">
                                    {isLink ? 'link' : 'description'}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {mainLabel}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium truncate">
                                    {metaLabel} • {sizeLabel}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-[0.18em] hover:bg-primary-dark transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {isLink ? 'open_in_new' : 'download'}
                                </span>
                                {isLink ? 'Buka Link' : 'Download'}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {canEdit && project && (
                      <div className="mt-4 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_2.5fr_auto] gap-2 items-center">
                          <input
                            value={attachmentLabel}
                            onChange={(e) => setAttachmentLabel(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                            placeholder="Judul / nama file (opsional)"
                          />
                          <input
                            value={attachmentUrl}
                            onChange={(e) => setAttachmentUrl(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                            placeholder="Tempelkan link Google Drive atau URL lain"
                          />
                          <button
                            type="button"
                            onClick={handleAddAttachment}
                            disabled={submittingAttachment || !attachmentUrl.trim()}
                            className="px-3 py-2 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
                          >
                            Simpan Link
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Sistem hanya menyimpan link, bukan file fisik, sehingga hemat storage server.
                        </p>
                      </div>
                    )}
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        forum
                      </span>
                      Komentar Proyek
                    </h2>
                    {comments.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium italic">
                        Belum ada komentar untuk proyek ini.
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                        {comments.map((c: any) => (
                          <div
                            key={c.id}
                            className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {c.user?.name || 'User'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {formatDate(c.created_at)}
                              </p>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line">
                              {c.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="relative group">
                        <input
                          className="w-full pl-4 pr-12 py-3 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                          placeholder="Tulis komentar..."
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmitComment();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleSubmitComment}
                          disabled={submittingComment || !commentInput.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-primary transition-colors group-focus-within:text-primary disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[20px] fill">send</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">
                        Semua role dapat menambahkan komentar untuk kolaborasi proyek.
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default ProjectDetailScreen;