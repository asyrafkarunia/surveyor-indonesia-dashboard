import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import BackButton from './BackButton';
import ProjectUpdateModal from './ProjectDetailModal'; // Reusing the over-hauled update modal
import ProjectScheduleView from './ProjectScheduleView';
import { showToast } from './Toast';

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
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [useCustomPic, setUseCustomPic] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([]);
  const [customTeamNotes, setCustomTeamNotes] = useState('');
  const [teamSearch, setTeamSearch] = useState('');

  useEffect(() => {
    fetchProject();
    api.getUsers().then(data => {
      const raw = (data as any)?.data || data;
      setUsers(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []));
    }).catch(console.error);
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
        pic_id: data?.pic_id || '',
        custom_pic_name: data?.custom_pic_name || '',
      });
      setUseCustomPic(!!data?.custom_pic_name);
      setSelectedTeamMembers(data?.team_member_users?.map((u: any) => u.id) || []);
      setCustomTeamNotes(data?.custom_team_notes || '');
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
        pic_id: project.pic_id || '',
        custom_pic_name: project.custom_pic_name || '',
      });
      setUseCustomPic(!!project.custom_pic_name);
      setSelectedTeamMembers(project.team_member_users?.map((u: any) => u.id) || []);
      setCustomTeamNotes(project.custom_team_notes || '');
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
        pic_id: useCustomPic ? null : (editData.pic_id ? Number(editData.pic_id) : null),
        custom_pic_name: useCustomPic ? editData.custom_pic_name || null : null,
        team_members: selectedTeamMembers,
        custom_team_notes: customTeamNotes || null,
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
      showToast('Link lampiran berhasil ditambahkan', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan attachment', 'error');
    } finally {
      setSubmittingAttachment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setSubmittingAttachment(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 20 * 1024 * 1024) {
          showToast(`File ${file.name} melebihi 20MB dan dilewati`, 'error');
          continue;
        }
        await api.uploadProjectAttachment(String(project.id), file);
      }
      await fetchProject(true);
      showToast('File berhasil diunggah', 'success');
    } catch (error: any) {
      showToast(error.message || 'Gagal mengunggah file', 'error');
    } finally {
      setSubmittingAttachment(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete) return;
    try {
      setSubmittingAttachment(true);
      await api.deleteProjectAttachment(String(project.id), attachmentToDelete);
      await fetchProject(true);
      showToast('Lampiran berhasil dihapus', 'success');
      setAttachmentToDelete(null);
    } catch (error: any) {
      showToast(error.message || 'Gagal menghapus lampiran', 'error');
    } finally {
      setSubmittingAttachment(false);
    }
  };

  const getFileUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    const base = (((import.meta as any).env.VITE_API_URL) || 'http://localhost:8000/api').replace(/\/api$/, '');
    // Bersihkan prefix public/ jika tersimpan di DB
    const cleanPath = path.replace(/^public\//, '');
    return `${base}/storage/${cleanPath}`;
  };

  const handleDownloadAttachment = async (att: any) => {
    // 1. Cek apakah ini eksternal link (berdasarkan flag tipe, ketiadaan nama file, atau isi string)
    const isLink = att.type === 'link' || (!att.file_name && (att.url || att.file_path));
    const linkUrl = att.url || att.file_path;
    
    if (isLink && linkUrl) {
      const formattedUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      window.open(formattedUrl, '_blank');
      return;
    }
    
    // 2. Jika file biasa, langsung buka URL storage-nya seperti pada SPH
    if (att.file_path) {
      window.open(getFileUrl(att.file_path), '_blank');
      return;
    }

    // 3. Fallback jika file path tidak ada sama sekali
    showToast('Tautan dokumen tidak tersedia', 'error');
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
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0f172a] custom-scrollbar pb-12">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3 md:py-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={onBack} className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-teal-500 hover:text-white transition-all shadow-sm shrink-0">
               <span className="material-symbols-outlined text-[20px] md:text-[24px]">arrow_back</span>
            </button>
            <div className="min-w-0">
              <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5 md:mb-1">Project Code</p>
              <p className="text-[11px] md:text-xs font-bold text-slate-900 dark:text-white truncate">{project.code}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 md:gap-3 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 custom-scrollbar-hide w-full sm:w-auto">
            <button 
              onClick={() => setIsScheduleOpen(true)}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-orange-500 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-600 active:scale-95 transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px] md:text-[18px]">timeline</span>
              <span className="hidden xs:inline">Lihat</span> Schedule
            </button>

            {canEdit && (
              <button 
                id="update-capaian-btn"
                onClick={() => setIsUpdateModalOpen(true)}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-teal-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:bg-teal-700 active:scale-95 transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[16px] md:text-[18px]">sync_alt</span>
                Update <span className="hidden xs:inline">Capaian</span>
              </button>
            )}
            {canEdit && (
              <button 
                onClick={isEditing ? handleSaveEdit : () => setIsEditing(true)}
                disabled={saving}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                  ${isEditing 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-50 shadow-sm'}`}
              >
                <span className="material-symbols-outlined text-[16px] md:text-[18px]">{isEditing ? 'done_all' : 'edit_square'}</span>
                {isEditing ? 'Selesai' : 'Edit'} <span className="hidden xs:inline">Detail</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Hero Section */}
        <div id="project-header" className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start justify-between">
            <div className="flex-1 space-y-5">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <span className={`px-3 md:px-4 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border
                  ${project.status === 'RUNNING' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                  {project.status}
                </span>
                <span className={`px-3 md:px-4 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border
                  ${project.is_tender ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                  {project.is_tender ? 'Tender' : 'Non-Tender'}
                </span>
                <span className="text-[10px] md:text-xs font-bold text-slate-400">Terdaftar {formatDate(project.created_at)}</span>
              </div>
              <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight md:leading-[1.1] max-w-4xl">{project.title}</h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300">
                  <span className="material-symbols-outlined text-teal-600 text-lg md:text-xl">apartment</span>
                  <span className="truncate">{project.client?.company_name || 'No Client'}</span>
                </div>
                <div className="flex items-start gap-2 text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 max-w-[280px]">
                   <span className="material-symbols-outlined text-teal-600 text-lg md:text-xl mt-0.5 shrink-0">category</span>
                   {(() => {
                      const pType = (project.project_type || '').toLowerCase();
                      const isValidDBS = ['minyak, gas, & energi terbarukan', 'infrastruktur & transportasi', 'mineral & batubara', 'institusi & pemerintahan', 'layanan industri', 'lingkungan & keberlanjutan'].includes(pType);
                      const displayLabel = isValidDBS ? project.project_type : 'Minyak, Gas, & Energi Terbarukan';
                      return <span className="whitespace-normal break-words leading-snug">{displayLabel}</span>;
                   })()}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-72 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
               <div className="flex justify-between items-end mb-2.5">
                  <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress Lapangan</span>
                  <span className="text-xl md:text-2xl font-black text-teal-600">{project.progress ?? 0}%</span>
               </div>
               <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-teal-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(20,184,166,0.3)]" style={{ width: `${project.progress ?? 0}%` }}></div>
               </div>
               <p className="mt-3 text-[10px] md:text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center">
                  Target: <span className="text-slate-900 dark:text-white font-black">{formatDate(project.end_date)}</span>
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
                           <p className="text-[10px] text-slate-400 font-medium wrap-break-word leading-relaxed">{c.comment}</p>
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
                   {isEditing ? (
                     <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Manager</label>
                       <div className="flex gap-4 items-center">
                         <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                           <input type="radio" name="detail_pic_mode" checked={!useCustomPic} onChange={() => setUseCustomPic(false)} className="text-teal-500 focus:ring-teal-500 w-4 h-4 cursor-pointer" />
                           Pilih dari daftar
                         </label>
                         <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                           <input type="radio" name="detail_pic_mode" checked={useCustomPic} onChange={() => setUseCustomPic(true)} className="text-teal-500 focus:ring-teal-500 w-4 h-4 cursor-pointer" />
                           Ketik manual
                         </label>
                       </div>
                       {!useCustomPic ? (
                         <select
                           value={editData.pic_id}
                           onChange={(e) => setEditData({ ...editData, pic_id: e.target.value })}
                           className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                         >
                           <option value="">Pilih Project Manager</option>
                           {Array.isArray(users) && users.map((u: any) => (
                             <option key={u.id} value={u.id}>{u.name}</option>
                           ))}
                         </select>
                       ) : (
                         <input
                           type="text"
                           value={editData.custom_pic_name}
                           onChange={(e) => setEditData({ ...editData, custom_pic_name: e.target.value })}
                           className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                           placeholder="Masukkan nama Project Manager..."
                         />
                       )}
                     </div>
                   ) : (
                     <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-black text-lg">
                          {project.pic?.name?.[0]?.toUpperCase() || project.custom_pic_name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div className="min-w-0">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Manager</p>
                           <p className="text-sm font-black text-slate-900 dark:text-white truncate">{project.pic?.name || project.custom_pic_name || 'N/A'}</p>
                        </div>
                     </div>
                   )}
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
                  {!isEditing && <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500">{(project.team_member_users?.length || 0) + (project.custom_team_notes ? project.custom_team_notes.split(/[,\n]/).filter((x: string) => x.trim()).length : 0)}</span>}
                </h2>
                
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Berdasarkan Akun Sistem</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                        <input
                          type="text"
                          placeholder="Cari anggota tim..."
                          value={teamSearch}
                          onChange={(e) => setTeamSearch(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                      </div>
                      {teamSearch && (
                        <div className="max-h-40 overflow-y-auto mt-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm custom-scrollbar p-2">
                          {users.filter(u => u.name.toLowerCase().includes(teamSearch.toLowerCase())).slice(0, 10).map((user: any) => (
                            <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedTeamMembers.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedTeamMembers(prev => [...prev, user.id]);
                                  else setSelectedTeamMembers(prev => prev.filter(id => id !== user.id));
                                }}
                                className="text-teal-500 focus:ring-teal-500 rounded"
                              />
                              <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-500">{user.name[0]}</div>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {selectedTeamMembers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {selectedTeamMembers.map(id => {
                            const user = users.find(u => u.id === id);
                            if (!user) return null;
                            return (
                              <div key={id} className="flex items-center gap-2 bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 rounded-lg px-2 py-1">
                                <span className="text-xs font-bold text-teal-700 dark:text-teal-400">{user.name}</span>
                                <button onClick={() => setSelectedTeamMembers(prev => prev.filter(x => x !== id))} className="text-teal-400 hover:text-teal-600">
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tambahan Manual</label>
                      <textarea
                        value={customTeamNotes}
                        onChange={(e) => setCustomTeamNotes(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                        rows={3}
                        placeholder="Ketik nama anggota tim manual (pisahkan dengan koma atau baris baru)..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                     {project.team_member_users?.length > 0 || project.custom_team_notes ? (
                       <>
                         {project.team_member_users?.map((u: any) => (
                           <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-50 dark:border-slate-800">
                              <div className="size-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-xs text-slate-400 border border-slate-100">
                                 {u.name?.[0]}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-xs font-black text-slate-900 dark:text-white truncate">{u.name}</p>
                                 <p className="text-[10px] font-bold text-slate-500 truncate">{u.email || 'Akun Sistem'}</p>
                              </div>
                           </div>
                         ))}
                         {project.custom_team_notes && project.custom_team_notes.split(/[,\n]/).filter((x: string) => x.trim()).map((name: string, i: number) => (
                           <div key={`custom-${i}`} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-50 dark:border-slate-800">
                              <div className="size-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-xs text-slate-400 border border-slate-100">
                                 {name.trim()[0]?.toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-xs font-black text-slate-900 dark:text-white truncate">{name.trim()}</p>
                                 <p className="text-[10px] font-bold text-slate-500 truncate">Tambahan Manual</p>
                              </div>
                           </div>
                         ))}
                       </>
                     ) : (
                       <p className="text-[11px] font-bold text-slate-400 italic py-2">Belum ada anggota spesifik.</p>
                     )}
                  </div>
                )}
             </div>

             {/* Attachments */}
             <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 dark:text-white mb-5 uppercase tracking-widest">Lampiran & File</h2>
                <div className="space-y-2 mb-6">
                  {project.attachments?.length > 0 ? (
                    project.attachments.map((att: any) => (
                      <div key={att.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-transparent group">
                         <button 
                           onClick={() => handleDownloadAttachment(att)}
                           className="flex items-center gap-3 flex-1 min-w-0 hover:bg-teal-50 dark:hover:bg-teal-900/10 hover:border-teal-100 transition-all rounded-xl px-2 py-1 text-left"
                         >
                           <span className="material-symbols-outlined text-teal-600 group-hover:scale-110 transition-transform">attachment</span>
                           <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 dark:text-white truncate">{att.label || att.file_name || 'Lampiran'}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Download / Open Link</p>
                           </div>
                         </button>
                         {canEdit && (
                           <button
                             onClick={() => setAttachmentToDelete(att.id)}
                             disabled={submittingAttachment}
                             className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                             title="Hapus Lampiran"
                           >
                             <span className="material-symbols-outlined text-[18px]">delete</span>
                           </button>
                         )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] font-bold text-slate-400 italic py-2">Tidak ada lampiran.</p>
                  )}
                </div>

                {canEdit && (
                  <div className="p-4 rounded-[22px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Upload File Baru</p>
                       <div className="flex gap-2">
                         <div
                           onClick={() => fileInputRef.current?.click()}
                           className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 transition-all cursor-pointer ${submittingAttachment ? 'opacity-50 pointer-events-none' : ''}`}
                         >
                           <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                           <span className="text-[11px] font-bold">Pilih File (Max 20MB)</span>
                         </div>
                         <input
                           ref={fileInputRef}
                           type="file"
                           className="hidden"
                           multiple
                           onChange={handleFileUpload}
                         />
                       </div>
                     </div>

                     <div className="relative">
                       <div className="absolute inset-0 flex items-center" aria-hidden="true">
                         <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                       </div>
                       <div className="relative flex justify-center">
                         <span className="bg-slate-50 dark:bg-slate-800/50 px-2 text-[10px] font-bold text-slate-400 uppercase">Atau Tambah Link</span>
                       </div>
                     </div>

                     <div className="space-y-3">
                       <input 
                        placeholder="Label Link (Opsional)..."
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
                            disabled={submittingAttachment || !attachmentUrl.trim()}
                            className="size-9 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 hover:bg-teal-700 active:scale-90 transition-all disabled:opacity-50"
                          >
                             <span className="material-symbols-outlined text-[18px]">{submittingAttachment ? 'hourglass_empty' : 'add'}</span>
                          </button>
                       </div>
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

      {/* Delete Confirmation Modal */}
      {attachmentToDelete && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white text-center mb-2">Hapus Lampiran?</h3>
            <p className="text-sm font-medium text-slate-500 text-center mb-8">
              Apakah Anda yakin ingin menghapus lampiran ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setAttachmentToDelete(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAttachment}
                disabled={submittingAttachment}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {submittingAttachment ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProjectDetailScreen;