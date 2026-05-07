import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import BackButton from './BackButton';
import ProjectUpdateModal from './ProjectDetailModal'; // Reusing the over-hauled update modal
import ProjectScheduleView from './ProjectScheduleView';

interface ProjectDetailScreenProps {
  projectId: string;
  onBack: () => void;
}

const formatCurrency = (value: any) => {
  if (value === null || value === undefined || value === '') return 'Rp 0';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
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
  const canUpdateProject = auth?.canUpdateProject || (() => false);
  const canEdit = canUpdateProject();

  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    budget: '',
    actual_revenue: '',
    target_margin: '',
    location_address: '',
    latitude: '',
    longitude: '',
    description: '',
  });
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [attachmentLabel, setAttachmentLabel] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submittingAttachment, setSubmittingAttachment] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data: any = await api.getProject(projectId);
      setProject(data);
      setEditData({
        budget: data?.budget != null ? String(data.budget) : '',
        actual_revenue: data?.actual_revenue != null ? String(data.actual_revenue) : '',
        target_margin: data?.target_margin != null ? String(data.target_margin) : '',
        location_address: data?.location_address || '',
        latitude: data?.latitude != null ? String(data.latitude) : '',
        longitude: data?.longitude != null ? String(data.longitude) : '',
        description: data?.description || '',
      });
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat detail proyek');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (project) {
       setEditData({
        budget: project.budget != null ? String(project.budget) : '',
        actual_revenue: project.actual_revenue != null ? String(project.actual_revenue) : '',
        target_margin: project.target_margin != null ? String(project.target_margin) : '',
        location_address: project.location_address || '',
        latitude: project.latitude != null ? String(project.latitude) : '',
        longitude: project.longitude != null ? String(project.longitude) : '',
        description: project.description || '',
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const payload: any = {
        budget: editData.budget !== '' ? Number(editData.budget) : null,
        actual_revenue: editData.actual_revenue !== '' ? Number(editData.actual_revenue) : null,
        target_margin: editData.target_margin !== '' ? Number(editData.target_margin) : null,
        location_address: editData.location_address || null,
        latitude: editData.latitude !== '' ? Number(editData.latitude) : null,
        longitude: editData.longitude !== '' ? Number(editData.longitude) : null,
        description: editData.description || null,
      };
      await api.updateProject(projectId, payload);
      await fetchProject();
      setIsEditing(false);
    } catch (e: any) {
       alert(e?.message || 'Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return;
    try {
      setSubmittingComment(true);
      await api.addProjectComment(String(project.id), commentInput.trim());
      await fetchProject(true);
      setCommentInput('');
    } catch (e: any) {
      alert(e?.message || 'Gagal menambahkan komentar');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddAttachment = async () => {
    if (!attachmentUrl.trim()) return;
    try {
      setSubmittingAttachment(true);
      await api.addProjectAttachmentLink(String(project.id), { url: attachmentUrl.trim(), label: attachmentLabel || null });
      await fetchProject(true);
      setAttachmentLabel('');
      setAttachmentUrl('');
    } catch (e: any) {
      alert(e?.message || 'Gagal menyimpan attachment');
    } finally {
      setSubmittingAttachment(false);
    }
  };

  if (loading) return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
      <p className="text-xs font-black uppercase text-slate-400">Memuat Dashboard Proyek...</p>
    </div>
  );

  if (error || !project) return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8">
      <div className="text-red-500 mb-4 scale-150">
        <span className="material-symbols-outlined">error</span>
      </div>
      <p className="text-sm font-black text-slate-900 dark:text-white mb-6 text-center">{error || 'Proyek tidak ditemukan'}</p>
      <BackButton onClick={onBack} />
    </div>
  );

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0f172a] custom-scrollbar">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-teal-500 hover:text-white transition-all shadow-sm">
             <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Project Code</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white">{project.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsScheduleOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-600 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">timeline</span>
            Lihat Schedule
          </button>

          {canEdit && (
            <button 
              id="update-capaian-btn"
              onClick={() => setIsUpdateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:bg-teal-700 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">sync_alt</span>
              Update Capaian
            </button>
          )}
          {canEdit && (
            <button 
              onClick={isEditing ? handleSaveEdit : () => setIsEditing(true)}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${isEditing 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{isEditing ? 'done_all' : 'edit_square'}</span>
              {isEditing ? 'Selesai Edit' : 'Edit Detail'}
            </button>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl p-6 md:p-8 space-y-8">
        {/* Hero Section */}
        <div id="project-header" className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start justify-between">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
                  ${project.status === 'RUNNING' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                  {project.status}
                </span>
                <span className="text-xs font-bold text-slate-400">Terdaftar {formatDate(project.created_at)}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-[1.1]">{project.title}</h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                  <span className="material-symbols-outlined text-teal-600">apartment</span>
                  {project.client?.company_name || 'No Client'}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                   <span className="material-symbols-outlined text-teal-600">category</span>
                   {toPascalCase(project.project_type || 'Uncategorized')}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-72 space-y-4">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Progress Lapangan</span>
                  <span className="text-2xl font-black text-teal-600">{project.progress ?? 0}%</span>
               </div>
               <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${project.progress ?? 0}%` }}></div>
               </div>
               <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center">
                  Target Penyelesaian: <span className="text-slate-900 dark:text-white">{formatDate(project.end_date)}</span>
               </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Nilai Kontrak', value: formatCurrency(project.budget), sub: 'Anggaran Dasar', icon: 'payments', color: 'text-teal-600', bg: 'bg-teal-500/5' },
            { label: 'Realisasi Serapan', value: formatCurrency(project.actual_revenue), sub: `${((project.actual_revenue / project.budget) * 100 || 0).toFixed(1)}% dari budget`, icon: 'receipt_long', color: 'text-emerald-600', bg: 'bg-emerald-500/5' },
            { label: 'Target Margin', value: project.target_margin ? `${project.target_margin}%` : 'N/A', sub: 'Ekspektasi Laba', icon: 'monitoring', color: 'text-blue-600', bg: 'bg-blue-500/5' },
            { label: 'Durasi Proyek', value: formatDate(project.start_date), sub: `Sampai ${formatDate(project.end_date)}`, icon: 'calendar_today', color: 'text-orange-600', bg: 'bg-orange-500/5' },
          ].map((m, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group">
              <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <span className={`material-symbols-outlined ${m.color}`}>{m.icon}</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{m.value}</p>
              <p className="text-[10px] font-bold text-slate-500 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Main Info Area */}
          <div className="xl:col-span-8 space-y-6">
            {/* Project Information */}
            <div id="project-tabs" className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-7 shadow-sm">
               <h2 className="text-sm font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-teal-600">article</span>
                  Deskripsi & Informasi Dasar
               </h2>
               <div className="space-y-6">


                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi Proyek</label>
                     {isEditing ? (
                       <textarea 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                        rows={4} 
                        value={editData.description} 
                        onChange={(e) => setEditData(p => ({ ...p, description: e.target.value }))}
                       />
                     ) : (
                       <p className="text-sm font-bold text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed italic bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10">
                          {project.description || 'Tidak ada deskripsi rinci.'}
                       </p>
                     )}
                  </div>
               </div>
            </div>

            {/* Locations */}
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-7 shadow-sm">
               <h2 className="text-sm font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-teal-600">map</span>
                  Lokasi Kerja
               </h2>
               <div className="space-y-3">
                   {project.locations && project.locations.length > 0 ? (
                    project.locations.map((loc: any, idx: number) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                           <span className="material-symbols-outlined">location_on</span>
                        </div>
                        <div className="flex-1 pt-1">
                           <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{loc.address}</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase">Koordinat: {loc.latitude}, {loc.longitude}</p>
                        </div>
                      </div>
                    ))
                  ) : project.location_address ? (
                    <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                         <span className="material-symbols-outlined">location_on</span>
                      </div>
                      <div className="flex-1 pt-1">
                         <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{project.location_address}</p>
                         {project.latitude && project.longitude && (
                           <p className="text-[10px] font-black text-slate-400 uppercase">Koordinat: {project.latitude}, {project.longitude}</p>
                         )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                       <p className="text-xs font-bold text-slate-400">Belum ada lokasi tercatat secara spesifik.</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Comments/Feed Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-7 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-teal-600">forum</span>
                  Kolaborasi (Komentar)
                </h2>
                <div className="space-y-4 mb-6 h-[320px] max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
                   {project.comments?.map((c: any) => (
                     <div key={c.id} className="flex gap-4">
                        <div className="size-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-teal-600 shrink-0">
                           {c.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                           <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs font-black text-slate-900 dark:text-white">{c.user?.name}</span>
                              <span className="text-[10px] font-bold text-slate-400">{formatDate(c.created_at)}</span>
                           </div>
                           <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{c.comment}</p>
                        </div>
                     </div>
                   ))}
                </div>
                <div className="relative group">
                  <input 
                    className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl px-6 pr-16 text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none"
                    placeholder="Apa kabar proyek hari ini?"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                  />
                   <button 
                    onClick={handleSubmitComment}
                    disabled={submittingComment || !commentInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-10 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 transition-colors shadow-md shadow-teal-500/20"
                   >
                      <span className="material-symbols-outlined fill text-[18px]">send</span>
                   </button>
                </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="xl:col-span-4 space-y-6">
             {/* Stakeholders Card */}
             <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest">Stakeholders</h2>
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-black text-lg">
                        {project.pic?.name?.[0]?.toUpperCase() || 'P'}
                      </div>
                      <div className="min-w-0">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PIC Internal</p>
                         <p className="text-sm font-black text-slate-900 dark:text-white truncate">{project.pic?.name || project.custom_pic_name || 'N/A'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-lg border border-blue-100">
                        <span className="material-symbols-outlined">corporate_fare</span>
                      </div>
                      <div className="min-w-0">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Company</p>
                         <p className="text-sm font-black text-slate-900 dark:text-white truncate">{project.client?.company_name || 'No Client'}</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Team Members */}
             <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 dark:text-white mb-5 uppercase tracking-widest flex items-center justify-between">
                  Anggota Tim
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500">{project.team_member_users?.length || 0}</span>
                </h2>
                <div className="space-y-3">
                   {project.team_member_users?.length > 0 ? (
                     project.team_member_users.map((u: any) => (
                       <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-50 dark:border-slate-800">
                          <div className="size-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-xs text-slate-400 border border-slate-100">
                             {u.name?.[0]}
                          </div>
                          <div className="min-w-0">
                             <p className="text-xs font-black text-slate-900 dark:text-white truncate">{u.name}</p>
                             <p className="text-[10px] font-bold text-slate-500 truncate">{u.email}</p>
                          </div>
                       </div>
                     ))
                   ) : (
                     <p className="text-[11px] font-bold text-slate-400 italic py-2">Belum ada anggota spesifik.</p>
                   )}
                </div>
             </div>

             {/* Attachments */}
             <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 dark:text-white mb-5 uppercase tracking-widest">Lampiran & File</h2>
                <div className="space-y-2 mb-6">
                  {project.attachments?.length > 0 ? (
                    project.attachments.map((att: any) => (
                      <a 
                        key={att.id} 
                        href={att.file_path} 
                        target="_blank" 
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 hover:bg-teal-50 dark:hover:bg-teal-900/10 border border-transparent hover:border-teal-100 transition-all group"
                      >
                         <span className="material-symbols-outlined text-teal-600 group-hover:scale-110 transition-transform">attachment</span>
                         <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">{att.label || att.file_name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Download / Open Link</p>
                         </div>
                      </a>
                    ))
                  ) : (
                    <p className="text-[11px] font-bold text-slate-400 italic py-2">Tidak ada lampiran.</p>
                  )}
                </div>

                {canEdit && (
                  <div className="p-4 rounded-[22px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tambah Link Baru</p>
                     <input 
                      placeholder="Label Link..."
                      className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-[11px] font-bold outline-none ring-teal-500/10 focus:ring-4"
                      value={attachmentLabel}
                      onChange={(e) => setAttachmentLabel(e.target.value)}
                     />
                     <div className="flex gap-2">
                        <input 
                          placeholder="Paste URL..."
                          className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-[11px] font-bold outline-none ring-teal-500/10 focus:ring-4"
                          value={attachmentUrl}
                          onChange={(e) => setAttachmentUrl(e.target.value)}
                        />
                        <button 
                          onClick={handleAddAttachment}
                          disabled={submittingAttachment}
                          className="size-9 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 active:scale-90 transition-all"
                        >
                           <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Update Capaian Modal (Reusing existing component) */}
      <ProjectUpdateModal 
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        projectId={projectId}
        onUpdated={() => fetchProject()}
      />

      {/* Holistic Executive Schedule Drawer */}
      <ProjectScheduleView 
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        project={project}
      />
    </main>
  );
};

export default ProjectDetailScreen;