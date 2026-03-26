
import React, { useEffect, useState } from 'react';
import { KanbanCard } from '../types';
import { api } from '../services/api';

interface MarketingTaskComment {
  id: number;
  comment: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    avatar?: string | null;
  };
}

interface MarketingTaskHistoryEntry {
  id: number;
  action: string;
  status: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    avatar?: string | null;
  } | null;
  metadata?: any;
}

interface MarketingTaskAttachment {
  id: number;
  label?: string | null;
  url: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    avatar?: string | null;
  } | null;
}

interface MarketingTaskDetailProps {
  task: KanbanCard;
  onClose: () => void;
}

const statusLabelMap: Record<string, string> = {
  ide_baru: 'Ide Baru (Backlog)',
  review: 'Dalam Review',
  sph: 'Persiapan SPH',
  berjalan: 'Sedang Berjalan',
  selesai: 'Selesai',
};

const statusStyleMap: Record<string, string> = {
  ide_baru: 'bg-slate-100 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  review: 'bg-amber-50 text-amber-700 border-amber-100',
  sph: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  berjalan: 'bg-blue-50 text-blue-700 border-blue-100',
  selesai: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const timeAgo = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const MarketingTaskDetail: React.FC<MarketingTaskDetailProps> = ({ task, onClose }) => {
  const [comments, setComments] = useState<MarketingTaskComment[]>([]);
  const [history, setHistory] = useState<MarketingTaskHistoryEntry[]>([]);
  const [attachments, setAttachments] = useState<MarketingTaskAttachment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [attachmentLabel, setAttachmentLabel] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submittingAttachment, setSubmittingAttachment] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [commentsRes, historyRes, attachmentsRes]: any = await Promise.all([
          api.getMarketingTaskComments(task.id),
          api.getMarketingTaskHistory(task.id),
          api.getMarketingTaskAttachments(task.id),
        ]);
        setComments(commentsRes.data || commentsRes || []);
        setHistory(historyRes.data || historyRes || []);
        setAttachments(attachmentsRes.data || attachmentsRes || []);
      } catch (error) {
        console.error('Failed to load marketing task details', error);
      }
    };
    load();
  }, [task.id]);

  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return;
    try {
      setSubmittingComment(true);
      const res: any = await api.addMarketingTaskComment(task.id, commentInput.trim());
      const newComment = res.data || res;
      setComments(prev => [newComment, ...prev]);
      setCommentInput('');
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Gagal mengirim komentar');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddAttachment = async () => {
    if (!attachmentUrl.trim()) return;
    try {
      setSubmittingAttachment(true);
      const payload = { url: attachmentUrl.trim(), label: attachmentLabel || null };
      const res: any = await api.addMarketingTaskAttachment(task.id, payload);
      const newAttachment = res.data || res;
      setAttachments(prev => [newAttachment, ...prev]);
      setAttachmentLabel('');
      setAttachmentUrl('');
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Gagal menyimpan link attachment');
    } finally {
      setSubmittingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm('Hapus attachment ini dari aktivitas?')) return;
    try {
      await api.deleteMarketingTaskAttachment(task.id, attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Gagal menghapus attachment');
    }
  };

  const handleLinkedProjectClick = () => {
    window.location.hash = 'monitoring';
  };

  const statusKey = (task as any).status || 'ide_baru';
  const statusLabel = statusLabelMap[statusKey] || statusKey;
  const statusStyle = statusStyleMap[statusKey] || 'bg-slate-100 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 w-full max-w-5xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-3 mb-2">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${statusStyle}`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                {statusLabel}
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-purple-50 text-purple-700 uppercase tracking-wider border border-purple-100">
                Branding
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{task.title} - {task.client}</h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-medium">
              Added to <span className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Marketing Plan</span> list
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-primary transition-colors bg-slate-50 dark:bg-slate-900 rounded-xl p-2 hover:bg-red-50 group"
          >
            <span className="material-symbols-outlined text-[24px] block group-hover:rotate-90 transition-transform">close</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row">
          {/* Main Content (Left) */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-slate-800">
            <div className="mb-10">
              <h3 className="text-[10px] font-black text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                <span className="material-symbols-outlined text-[18px]">description</span>
                Description
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-4 font-medium whitespace-pre-line">
                {task.description ? (
                  <p>{task.description}</p>
                ) : (
                  <p className="text-slate-400 italic">Belum ada deskripsi untuk kegiatan ini. Gunakan tombol Edit Activity untuk menambahkan detail.</p>
                )}
              </div>
            </div>

            {task.client && (
              <div className="mb-10">
                <h3 className="text-[10px] font-black text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                  <span className="material-symbols-outlined text-[18px]">business_center</span>
                  Linked Project/Client
                </h3>
                <button
                  type="button"
                  onClick={handleLinkedProjectClick}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 p-2 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="material-symbols-outlined text-slate-400 text-[24px]">apartment</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{task.client}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Lihat detail proyek/klien di Monitoring Project</p>
                  </div>
                  <span className="material-symbols-outlined ml-auto text-slate-300 group-hover:text-primary transition-colors">open_in_new</span>
                </button>
              </div>
            )}

            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                  <span className="material-symbols-outlined text-[18px]">attachment</span>
                  Attachments
                </h3>
              </div>

              {/* Daftar attachment (link) */}
              {attachments.length === 0 ? (
                <div className="text-xs text-slate-400 font-medium italic mb-3">
                  Belum ada attachment yang terhubung ke aktivitas ini.
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {attachments.map((att) => {
                    const userName = att.user?.name || 'Pengguna';
                    const label = att.label || att.url;
                    return (
                      <div key={att.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-primary/30 transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">attach_file</span>
                        <div className="flex-1 min-w-0">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs font-bold text-primary truncate hover:underline"
                          >
                            {label}
                          </a>
                          <p className="text-[10px] text-slate-400 truncate">
                            Ditambahkan oleh {userName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          title="Hapus attachment"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Form tambah attachment (link) */}
              <div className="space-y-2">
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
                    Save Link
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Sistem hanya menyimpan link, bukan file fisik, sehingga hemat storage server.
                </p>
              </div>
            </div>

            {/* History Section */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                  <span className="material-symbols-outlined text-[18px]">history</span>
                  Riwayat Perubahan
                </h3>
              </div>
              <div className="relative ml-2 border-l-2 border-slate-50 space-y-8 pl-8">
                {history.length === 0 && (
                  <p className="text-[11px] font-semibold text-slate-400 ml-[-24px]">Belum ada riwayat perubahan untuk aktivitas ini.</p>
                )}
                {history.map((item, index) => {
                  const userName = item.user?.name || 'Sistem';
                  const initials = userName
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  const fromStatus = item.metadata?.old_status ? statusLabelMap[item.metadata.old_status] || item.metadata.old_status : null;
                  const toStatus = item.metadata?.new_status ? statusLabelMap[item.metadata.new_status] || item.metadata.new_status : null;

                  return (
                    <div key={item.id} className="relative">
                      <div className="absolute -left-[41px] top-1 h-5 w-5 rounded-full bg-primary ring-4 ring-white shadow-sm flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-slate-800"></div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-baseline">
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-slate-200 border border-slate-300 dark:border-slate-600 bg-cover bg-center overflow-hidden">
                              {item.user?.avatar ? (
                                <img src={item.user.avatar} alt={userName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 flex items-center justify-center w-full h-full">{initials}</span>
                              )}
                            </div>
                            <span className="text-sm font-black text-slate-900 dark:text-white">{userName}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.action}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 font-mono">{formatDateTime(item.created_at)}</span>
                        </div>
                        {fromStatus && toStatus && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
                              <span className="line-through opacity-50">{fromStatus}</span>
                              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                              <span className="text-primary font-black uppercase tracking-widest">{toStatus}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className="w-full md:w-[340px] bg-slate-50 dark:bg-slate-900 flex flex-col flex-none border-l border-slate-100 dark:border-slate-700">
            <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Assignees</p>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  {task.assignee.avatar ? (
                    <div
                      className="size-10 rounded-full border-2 border-slate-50 shadow-sm bg-cover bg-center"
                      style={{ backgroundImage: `url(${task.assignee.avatar})` }}
                    ></div>
                  ) : (
                    <div className="size-10 rounded-full border-2 border-slate-50 shadow-sm bg-slate-200 flex items-center justify-center text-[11px] font-black text-slate-600 dark:text-slate-300">
                      {task.assignee.initials}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">{task.assignee.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Assignee</p>
                  </div>
                  <button className="ml-auto w-8 h-8 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-300 hover:text-primary hover:border-primary transition-all">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Due Date</p>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <span className="material-symbols-outlined text-[18px] text-slate-300">event</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{task.date}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Priority</p>
                  <div
                    className={"flex items-center gap-2 p-2.5 rounded-xl shadow-sm " +
                      (task.priority === 'High'
                        ? 'bg-red-50 border border-red-100 text-red-700'
                        : task.priority === 'Medium'
                        ? 'bg-amber-50 border border-amber-100 text-amber-700'
                        : 'bg-emerald-50 border border-emerald-100 text-emerald-700')}
                  >
                    <span className="material-symbols-outlined text-[18px] fill">flag</span>
                    <span className="text-xs font-black uppercase tracking-widest">{task.priority}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col h-full min-h-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    Discussion
                  </h3>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{comments.length} comments</span>
                </div>
                <div className="space-y-4">
                  {comments.length === 0 && (
                    <p className="text-[11px] font-semibold text-slate-400">Belum ada komentar. Tambahkan catatan pertama untuk aktivitas ini.</p>
                  )}
                  {comments.map((comment) => {
                    const userName = comment.user?.name || 'Pengguna';
                    const initials = userName
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 border border-white shadow-sm shrink-0 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter overflow-hidden">
                          {comment.user?.avatar ? (
                            <img src={comment.user.avatar} alt={userName} className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[11px] font-black text-slate-900 dark:text-white">{userName}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{timeAgo(comment.created_at)}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line">
                            <p>{comment.comment}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Discussion Input */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="relative group">
                <input
                  className="w-full pl-4 pr-12 py-3 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:bg-white dark:bg-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                  placeholder="Write a comment..."
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
                  onClick={handleSubmitComment}
                  disabled={submittingComment || !commentInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-primary transition-colors group-focus-within:text-primary disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px] fill">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center z-10">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-primary hover:bg-red-50 text-[10px] font-black uppercase tracking-[0.2em] transition-all group">
            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">delete</span>
            Delete Task
          </button>
          <div className="flex gap-3">
            <button className="px-6 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 dark:bg-slate-900 transition-all shadow-sm">
              Mark as Complete
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-primary/20 active:scale-95 group">
              <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">edit</span>
              Edit Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingTaskDetail;
