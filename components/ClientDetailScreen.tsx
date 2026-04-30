import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ClientData } from '../types';
import BackButton from './BackButton';
import { showToast } from './Toast';
import { CLIENT_PROJECT_HISTORY, CLIENT_RECENT_ACTIVITY, CLIENT_CONTRACT_HISTORY } from '../constants';

interface ClientDetailScreenProps {
  client: ClientData;
  onBack: () => void;
  onNewProject?: (client: ClientData) => void;
  onEdit?: (client: ClientData) => void;
}

const ClientDetailScreen: React.FC<ClientDetailScreenProps> = ({ client: initialClient, onBack, onNewProject, onEdit }) => {
  const [client, setClient] = useState(initialClient);
  const [stats, setStats] = useState<any>(null);
  const [projectsHistory, setProjectsHistory] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isInactiveSuggestion, setIsInactiveSuggestion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProjectHistoryOpen, setIsProjectHistoryOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [fullProjectsHistory, setFullProjectsHistory] = useState<any[] | null>(null);
  const [fullActivities, setFullActivities] = useState<any[] | null>(null);
  const [loadingProjectHistory, setLoadingProjectHistory] = useState(false);
  const [loadingActivityLog, setLoadingActivityLog] = useState(false);
  const [recentMenuOpen, setRecentMenuOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingActivityContent, setEditingActivityContent] = useState('');
  const [editingSubmitting, setEditingSubmitting] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivityCategory, setNewActivityCategory] = useState<string>('meeting');
  const [newActivityProjectId, setNewActivityProjectId] = useState<string>('');
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityContent, setNewActivityContent] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [noteActivity, setNoteActivity] = useState<any | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(client?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (client) {
      setLocalNotes(client.notes || '');
    }
  }, [client]);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} berhasil disalin!`, 'success');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      showToast('Gagal menyalin', 'error');
    });
  };

  const saveNotes = async () => {
    if (!client) return;
    if (localNotes === (client.notes || '')) return; // No change
    
    setIsSavingNotes(true);
    try {
      await api.updateClient(String(client.id), { notes: localNotes });
      // Update local client object if needed or just show toast
      client.notes = localNotes;
      showToast('Catatan tersimpan otomatis', 'success');
    } catch (error) {
      console.error('Error saving notes:', error);
      showToast('Gagal menyimpan catatan', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
  }, [initialClient.id]);

  const fetchClientDetails = async () => {
    setLoading(true);
    try {
      const response = await api.getClient(initialClient.id);
      const data = (response as any).data || response;
      
      if (data.client) {
        setClient(data.client);
        setStats(data.stats);
        setProjectsHistory(data.projects_history || []);
        setActivities(data.activities || []);
        setIsInactiveSuggestion(data.is_inactive_suggestion);
      } else {
        setClient(data);
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirm(`Are you sure you want to change status to ${client.status === 'Aktif' ? 'Non-Aktif' : 'Aktif'}?`)) return;
    
    try {
      const newStatus = client.status === 'Aktif' ? 'Non-Aktif' : 'Aktif';
      await api.updateClient(client.id, { status: newStatus });
      fetchClientDetails();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'On Progress': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Completed': return 'bg-green-50 text-green-700 border-green-100';
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Expired': return 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      case 'Delayed': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'mail': return <span className="material-symbols-outlined text-[16px]">mail</span>;
      case 'check': return <span className="material-symbols-outlined text-[16px]">check</span>;
      case 'groups': return <span className="material-symbols-outlined text-[16px]">groups</span>;
      case 'edit_document': return <span className="material-symbols-outlined text-[16px]">edit_document</span>;
      case 'meeting': return <span className="material-symbols-outlined text-[16px]">groups</span>;
      case 'project_update': return <span className="material-symbols-outlined text-[16px]">edit</span>;
      default: return <span className="material-symbols-outlined text-[16px]">info</span>;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'mail': return 'bg-blue-100 text-blue-600';
      case 'check': return 'bg-green-100 text-green-600';
      case 'groups': return 'bg-orange-100 text-orange-600';
      case 'meeting': return 'bg-blue-100 text-blue-600';
      case 'project_update': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-slate-100 text-slate-500 dark:text-slate-400';
    }
  };

  const openProjectHistoryModal = async () => {
    setIsProjectHistoryOpen(true);
    setLoadingProjectHistory(true);
    try {
      const res = await api.getClientHistory(String(client.id));
      const data: any = (res as any).data || res;
      const list = Array.isArray(data.projects_history)
        ? data.projects_history
        : Array.isArray(data.projects)
        ? data.projects
        : Array.isArray(data)
        ? data
        : [];
      setFullProjectsHistory(list);
    } catch (error) {
      console.error('Error fetching full project history:', error);
    } finally {
      setLoadingProjectHistory(false);
    }
  };

  const openActivityLogModal = async () => {
    setIsActivityLogOpen(true);
    setLoadingActivityLog(true);
    try {
      const res = await api.getClientActivities(String(client.id));
      const data: any = (res as any).data || res;
      const list = Array.isArray(data) ? data : (Array.isArray(data.activities) ? data.activities : []);
      setFullActivities(list);
    } catch (error) {
      console.error('Error fetching full activity log:', error);
    } finally {
      setLoadingActivityLog(false);
    }
  };

  const historyList = (fullProjectsHistory && fullProjectsHistory.length > 0) ? fullProjectsHistory : projectsHistory;
  const activityList = (fullActivities && fullActivities.length > 0) ? fullActivities : activities;
  const contractList = (client as any)?.projects || [];
  const recentActivities = activityList.slice(0, 5);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim() || !newActivityContent.trim()) return;

    try {
      setSubmittingActivity(true);

      const category = newActivityCategory;
      const type = category === 'meeting' || category === 'zoom' ? 'meeting' : 'project_update';

      const payload: any = {
        type,
        title: newActivityTitle,
        content: newActivityContent,
        project_id: newActivityProjectId || undefined,
        tags: [category],
      };

      await api.createActivity(payload);

      setNewActivityTitle('');
      setNewActivityContent('');
      setNewActivityProjectId('');
      setNewActivityCategory('meeting');
      setIsAddingActivity(false);

      const res = await api.getClientActivities(String(client.id));
      const data: any = (res as any).data || res;
      const list = Array.isArray(data) ? data : (Array.isArray(data.activities) ? data.activities : []);
      setFullActivities(list);
    } catch (error) {
      console.error('Error creating activity:', error);
    } finally {
      setSubmittingActivity(false);
    }
  };

  const startEditActivity = (act: any) => {
    const title = act.title || act.description || act.message || '';
    setEditingActivityId(act.id);
    setEditingActivityContent(title);
  };

  const cancelEditActivity = () => {
    setEditingActivityId(null);
    setEditingActivityContent('');
  };

  const handleUpdateActivity = async (act: any) => {
    if (!act.activity_id) return;
    if (!editingActivityContent.trim()) return;

    try {
      setEditingSubmitting(true);
      await api.updateActivity(String(act.activity_id), { content: editingActivityContent });

      const res = await api.getClientActivities(String(client.id));
      const data: any = (res as any).data || res;
      const list = Array.isArray(data) ? data : (Array.isArray(data.activities) ? data.activities : []);
      setFullActivities(list);
      cancelEditActivity();
    } catch (error) {
      console.error('Error updating activity:', error);
    } finally {
      setEditingSubmitting(false);
    }
  };

  const handleDeleteActivity = async (act: any) => {
    if (!act.activity_id) return;
    if (!confirm('Yakin ingin menghapus aktivitas ini?')) return;

    try {
      setEditingSubmitting(true);
      await api.deleteActivity(String(act.activity_id));

      const res = await api.getClientActivities(String(client.id));
      const data: any = (res as any).data || res;
      const list = Array.isArray(data) ? data : (Array.isArray(data.activities) ? data.activities : []);
      setFullActivities(list);
      if (editingActivityId === act.id) {
        cancelEditActivity();
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
    } finally {
      setEditingSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        <div className="flex justify-end">
          <BackButton onClick={onBack} className="mb-0" />
        </div>
        {/* Profile Header Card */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center flex-1">
              <div className="size-24 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                {client.logo ? (
                  <img src={client.logo} alt={client.company_name} className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-slate-300">domain</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{client.company_name}</h2>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    client.status === 'Aktif' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-slate-100 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {client.status === 'Aktif' ? 'Active Client' : 'Inactive Client'}
                  </span>
                  {isInactiveSuggestion && client.status === 'Aktif' && (
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      Inactive Candidate
                    </span>
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{client.industry || 'General Industry'} • ID: {client.code}</p>
                <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-400 flex-wrap uppercase tracking-tighter">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    <span>{client.location || 'Jakarta Selatan'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => copyToClipboard(client.contact_person, 'Nama Kontak')}>
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    <span>{client.contact_role || 'PIC'}: {client.contact_person}</span>
                    <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">content_copy</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => copyToClipboard(client.email, 'Email')}>
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                      <span>{client.email}</span>
                      <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">content_copy</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => copyToClipboard(client.phone, 'Nomor Telepon')}>
                    <span className="material-symbols-outlined text-[18px]">call</span>
                    <span className="text-[13px]">{client.phone}</span>
                    <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">content_copy</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto flex-wrap">
               <button 
                onClick={handleToggleStatus}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors shadow-sm ${
                  client.status === 'Aktif' 
                    ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' 
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {client.status === 'Aktif' ? 'pause_circle' : 'play_circle'}
                </span>
                {client.status === 'Aktif' ? 'Set Inactive' : 'Set Active'}
              </button>
              <button 
                onClick={() => onEdit?.(client)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-900 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit Profile
              </button>
              <button 
                onClick={() => setShowNotes(!showNotes)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors shadow-sm ${
                  showNotes 
                    ? 'border-yellow-300 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-700' 
                    : 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-slate-800 dark:text-yellow-500 dark:border-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{showNotes ? 'drafts' : 'mail'}</span>
                Tambah Catatan
              </button>
              <button 
                onClick={() => onNewProject?.(client)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-primary-dark transition-colors shadow-sm shadow-red-200"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Project
              </button>
            </div>
          </div>
        </section>

        {/* Animated Notes Section */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showNotes ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-[#fffdf2] dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-2xl p-6 shadow-inner relative">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded-2xl text-yellow-600 dark:text-yellow-400 shrink-0">
                <span className="material-symbols-outlined text-2xl">description</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs font-black text-yellow-800 dark:text-yellow-500 uppercase tracking-widest">Catatan Internal / Instruksi Khusus</h4>
                    {isSavingNotes && <span className="text-[10px] text-yellow-600 font-bold animate-pulse">Menyimpan...</span>}
                  </div>
                  <button onClick={() => setShowNotes(false)} className="text-yellow-600/50 hover:text-yellow-600 transition-colors bg-transparent border-none">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <textarea
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  onBlur={saveNotes}
                  placeholder="Ketik catatan atau instruksi khusus untuk klien ini... (Otomatis tersimpan)"
                  className="w-full min-h-[100px] bg-transparent border-none text-sm text-yellow-900/80 dark:text-yellow-200/80 italic leading-relaxed whitespace-pre-wrap resize-y focus:ring-0 p-0 placeholder-yellow-600/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-primary border border-blue-100">
                <span className="material-symbols-outlined">attach_money</span>
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Contract Value</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats ? `IDR ${Number(stats.total_contract_value).toLocaleString('id-ID')}` : '-'}
            </h3>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <span className="material-symbols-outlined">assignment</span>
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Projects</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats ? stats.active_projects : '-'} <span className="text-sm font-bold text-slate-300">/ {stats ? stats.total_projects : '-'} Total</span>
            </h3>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Invoices</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats ? `IDR ${Number(stats.pending_invoices).toLocaleString('id-ID')}` : '-'}
            </h3>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <span className="material-symbols-outlined">calendar_month</span>
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Since</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats ? stats.client_since : '-'}</h3>
          </div>
        </section>

        {/* Split Layout: Content (Left) & Timeline (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* Riwayat Kontrak Section (Mapped from Projects for now) */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Riwayat Kontrak</h3>
                <button 
                  onClick={() => onNewProject?.(client)}
                  className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 hover:underline transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  New Contract
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Contract No.</th>
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Value</th>
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Doc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {contractList.length > 0 ? contractList.map((project: any) => (
                      <tr key={project.id} className="group hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                        <td className="py-5 px-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{project.code || project.title}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{project.project_type || 'General'}</span>
                          </div>
                        </td>
                        <td className="py-5 px-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                          {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'} - {project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-5 px-2 text-sm font-black text-slate-900 dark:text-white">
                           {project.budget ? `IDR ${Number(project.budget).toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="py-5 px-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight border ${getStatusBadge(project.status)}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="py-5 px-2 text-right">
                          <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors" title="Download Contract">
                            <span className="material-symbols-outlined text-[20px]">description</span>
                          </button>
                        </td>
                      </tr>
                    )) : (
                       <tr>
                         <td colSpan={5} className="py-5 text-center text-sm text-slate-400">No contracts found</td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Status Tagihan / Termin Pembayaran Section */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Status Tagihan / Termin Pembayaran</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Project</th>
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Termin</th>
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Jatuh Tempo</th>
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {contractList.flatMap((p: any) => (p.payment_terms || []).map((term: any) => ({ ...term, project: p }))).length > 0 ? (
                      contractList.flatMap((p: any) => (p.payment_terms || []).map((term: any) => ({ ...term, project: p }))).map((term: any) => (
                        <tr key={term.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="py-5 px-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{term.project.title || term.project.code}</span>
                            </div>
                          </td>
                          <td className="py-5 px-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                            Termin {term.term_number} ({term.percentage}%)
                          </td>
                          <td className="py-5 px-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                            {term.term_date ? new Date(term.term_date).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="py-5 px-2 text-sm font-black text-slate-900 dark:text-white text-right">
                             {term.amount ? `IDR ${Number(term.amount).toLocaleString('id-ID')}` : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                       <tr>
                         <td colSpan={4} className="py-5 text-center text-sm text-slate-400">Belum ada termin pembayaran</td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Project History Section */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Project History</h3>
                <button
                  type="button"
                  onClick={openProjectHistoryModal}
                  className="text-[11px] font-black uppercase tracking-widest text-primary hover:underline transition-all"
                >
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Contract</th>
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Project</th>
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {projectsHistory.length > 0 ? projectsHistory.map((item) => (
                      <tr key={item.id} className="group hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                        <td className="py-5 px-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{item.contract_code || item.project_title || '-'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                          </p>
                        </td>
                        <td className="py-5 px-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{item.project_title || '-'}</td>
                        <td className="py-5 px-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight border ${getStatusBadge(item.project_status || 'Completed')}`}>
                            {item.project_status || 'Completed'}
                          </span>
                        </td>
                        <td className="py-5 px-2 text-sm font-black text-slate-900 dark:text-white text-right">
                          {item.amount ? `IDR ${Number(item.amount).toLocaleString('id-ID')}` : '-'}
                        </td>
                      </tr>
                    )) : (
                        <tr>
                            <td colSpan={4} className="py-5 text-center text-sm text-slate-400">No projects found</td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Activity Timeline (Right Column) */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm h-fit">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Recent Activity</h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRecentMenuOpen(!recentMenuOpen)}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
                >
                  <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                </button>
                {recentMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setRecentMenuOpen(false);
                        openActivityLogModal();
                        setIsAddingActivity(true);
                      }}
                      className="w-full px-4 py-2 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900"
                    >
                      Tambah Aktivitas Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentMenuOpen(false);
                        openActivityLogModal();
                      }}
                      className="w-full px-4 py-2 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900"
                    >
                      Edit Aktivitas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentMenuOpen(false);
                        openActivityLogModal();
                      }}
                      className="w-full px-4 py-2 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-red-600 hover:bg-red-50"
                    >
                      Hapus Aktivitas
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="relative pl-2 flex flex-col gap-8">
              <div className="absolute left-6 top-2 bottom-2 w-px bg-slate-100"></div>
              
              {recentActivities.length > 0 ? recentActivities.map((activity: any) => {
                const type = activity.type || activity.action_type || 'info';
                const title = activity.title || activity.message || '';
                const by = activity.user?.name || activity.by || 'System';
                const time = activity.time || (activity.created_at ? new Date(activity.created_at).toLocaleString('id-ID') : '');
                const note = activity.note || activity.description || activity.content || '';
                return (
                  <div key={activity.id} className="relative flex gap-4 group">
                    <div className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white shadow-sm ${getActivityColor(type)}`}>
                      {getActivityIcon(type)}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => setNoteActivity(activity)}
                        className="text-left text-sm font-bold text-slate-900 dark:text-white leading-snug hover:text-primary"
                      >
                        {title}
                      </button>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        By <span className="text-slate-600 dark:text-slate-300 font-black">{by}</span>{time ? ` • ${time}` : ''}
                      </p>
                    </div>
                  </div>
                );
              }) : (
                  <div className="text-center text-sm text-slate-400 py-4">No recent activity</div>
              )}
            </div>
            <button
              type="button"
              onClick={openActivityLogModal}
              className="mt-6 w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors border-t border-slate-50"
            >
              View Full Log
            </button>
          </div>
        </div>

        {isProjectHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 md:p-8 backdrop-blur-sm">
            <div className="relative w-full max-w-[70vw] max-h-[85vh] rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4">
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-[0.18em]">Project History</h3>
                <button
                  type="button"
                  onClick={() => setIsProjectHistoryOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                {loadingProjectHistory ? (
                  <div className="py-10 text-center text-sm font-bold text-slate-400">
                    Memuat seluruh riwayat proyek...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700">
                          <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Contract</th>
                            <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Project</th>
                            <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                            <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {historyList.length > 0 ? historyList.map((item: any) => (
                          <tr key={item.id} className="group hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                            <td className="py-3 px-2">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{item.contract_code || item.project_title || '-'}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.project_title || '-'}</p>
                            </td>
                            <td className="py-3 px-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{item.project_title || '-'}</td>
                            <td className="py-3 px-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight border ${getStatusBadge(item.project_status || 'Completed')}`}>
                                {item.project_status || 'Completed'}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="py-3 px-2 text-sm font-black text-slate-900 dark:text-white text-right">
                              {item.amount ? `IDR ${Number(item.amount).toLocaleString('id-ID')}` : '-'}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-sm text-slate-400">Tidak ada riwayat proyek.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isActivityLogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 md:p-8 backdrop-blur-sm">
            <div className="relative w-full max-w-[70vw] max-h-[85vh] rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4">
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-[0.18em]">Activity Log</h3>
                <button
                  type="button"
                  onClick={() => setIsActivityLogOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                {loadingActivityLog ? (
                  <div className="py-10 text-center text-sm font-bold text-slate-400">
                    Memuat seluruh aktivitas klien...
                  </div>
                ) : (
                  <>
                    <div className="mb-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Tambah Aktivitas Manual</p>
                        <button
                          type="button"
                          onClick={() => setIsAddingActivity(!isAddingActivity)}
                          className="text-[11px] font-black uppercase tracking-widest text-primary hover:underline"
                        >
                          {isAddingActivity ? 'Batal' : 'Tambah'}
                        </button>
                      </div>
                      {isAddingActivity && (
                        <form onSubmit={handleCreateActivity} className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kategori</label>
                              <select
                                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={newActivityCategory}
                                onChange={(e) => setNewActivityCategory(e.target.value)}
                              >
                                <option value="meeting">Meeting</option>
                                <option value="negosiasi">Negosiasi</option>
                                <option value="follow_up">Follow Up</option>
                                <option value="zoom">Zoom</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Project (Opsional)</label>
                              <select
                                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={newActivityProjectId}
                                onChange={(e) => setNewActivityProjectId(e.target.value)}
                              >
                                <option value="">Tanpa Project</option>
                                {contractList.map((p: any) => (
                                  <option key={p.id} value={p.id}>
                                    {p.code || p.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Judul Aktivitas</label>
                            <input
                              type="text"
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="Contoh: Negosiasi berjalan lancar"
                              value={newActivityTitle}
                              onChange={(e) => setNewActivityTitle(e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Catatan Aktivitas</label>
                            <textarea
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]"
                              placeholder="Contoh: Meeting negosiasi dengan klien terkait penawaran baru..."
                              value={newActivityContent}
                              onChange={(e) => setNewActivityContent(e.target.value)}
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingActivity(false);
                                setNewActivityTitle('');
                                setNewActivityContent('');
                                setNewActivityProjectId('');
                                setNewActivityCategory('meeting');
                              }}
                              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 hover:text-slate-600 dark:text-slate-300"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={submittingActivity || !newActivityTitle.trim() || !newActivityContent.trim()}
                              className="px-4 py-1.5 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-[0.18em] disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary-dark"
                            >
                              {submittingActivity ? 'Menyimpan...' : 'Simpan Aktivitas'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {activityList.length === 0 ? (
                      <div className="py-10 text-center text-sm text-slate-400">Tidak ada aktivitas untuk klien ini.</div>
                    ) : (
                      <div className="space-y-4">
                        {activityList.map((act: any) => {
                          const type = act.type || act.action_type || 'info';
                          const title = act.title || act.message || '';
                          const by = act.user?.name || act.by || 'System';
                          const time = act.time || (act.created_at ? new Date(act.created_at).toLocaleString('id-ID') : '');
                          const note = act.note || act.description || act.content || '';
                          const projectTitle = act.project?.title || act.project?.name || null;
                          const isEditing = editingActivityId === act.id;
                          const canManage = act.source === 'activity' && act.activity_id;

                          return (
                            <div key={act.id} className="flex gap-3 items-start border-b border-slate-100 dark:border-slate-700 pb-3 last:border-b-0">
                              <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white shadow-sm ${getActivityColor(type)}`}>
                                {getActivityIcon(type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    {isEditing ? (
                                      <textarea
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]"
                                        value={editingActivityContent}
                                        onChange={(e) => setEditingActivityContent(e.target.value)}
                                      />
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setNoteActivity(act)}
                                        className="text-left text-sm font-bold text-slate-900 dark:text-white leading-snug hover:text-primary truncate"
                                      >
                                        {title}
                                      </button>
                                    )}
                                  </div>
                                  {time && (
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight whitespace-nowrap mt-0.5">{time}</p>
                                  )}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                                  By <span className="text-slate-600 dark:text-slate-300 font-black">{by}</span>
                                  {projectTitle && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <span className="text-slate-500 dark:text-slate-400">Project: {projectTitle}</span>
                                    </>
                                  )}
                                </p>

                                {canManage && (
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em]">
                                    {isEditing ? (
                                      <>
                                        <button
                                          type="button"
                                          disabled={editingSubmitting}
                                          onClick={() => handleUpdateActivity(act)}
                                          className="px-3 py-1 rounded-full bg-primary text-white hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                          Simpan
                                        </button>
                                        <button
                                          type="button"
                                          disabled={editingSubmitting}
                                          onClick={cancelEditActivity}
                                          className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900"
                                        >
                                          Batal
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          disabled={editingSubmitting}
                                          onClick={() => startEditActivity(act)}
                                          className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          disabled={editingSubmitting}
                                          onClick={() => handleDeleteActivity(act)}
                                          className="px-3 py-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                                        >
                                          Hapus
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {noteActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Activity Detail</h4>
                <button
                  type="button"
                  onClick={() => setNoteActivity(null)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white mb-2">
                {noteActivity?.title || noteActivity?.message || ''}
              </p>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-pre-line bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl p-3">
                {noteActivity?.note || noteActivity?.description || noteActivity?.content || '-'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetailScreen;