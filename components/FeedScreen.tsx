import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Activity {
  id: number;
  type: 'project_update' | 'alert' | 'meeting' | 'post';
  content: string;
  project_id?: number;
  project?: {
    id: number;
    code: string;
    title: string;
  };
  tags?: string[];
  mentions?: number[];
  is_urgent: boolean;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
  user: {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
  };
  attachments?: Array<{
    id: number;
    name: string;
    path: string;
    type: string;
    size: number;
  }>;
  comments?: Array<{
    id: number;
    comment: string;
    created_at: string;
    user: {
      id: number;
      name: string;
      email?: string;
      avatar?: string;
    };
  }>;
}

interface User {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
}

interface Deadline {
  id: number;
  title: string;
  type: 'deadline' | 'meeting';
  date: string;
  month: string;
  day: string;
  time?: string;
  team: string;
  project?: string;
}

const FeedItem: React.FC<{ 
  item: Activity;
  onLike: (id: number) => void;
  onComment: (id: number, comment: string) => void;
  onEdit: (id: number, content: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  currentUserId: number;
}> = ({ item, onLike, onComment, onEdit, onDelete, currentUserId }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    try {
      await onEdit(item.id, editContent);
      setIsEditing(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to update post:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await onComment(item.id, commentText);
      setCommentText('');
      setShowComments(true);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {item.user.avatar ? (
            <div className="size-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700" style={{ backgroundImage: `url("${item.user.avatar}")` }}></div>
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:text-slate-300 font-bold">
              {item.user.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">{item.user.name}</span>
              {item.type === 'project_update' && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                  Update Proyek
                </span>
              )}
              {item.type === 'meeting' && (
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600">
                  Meeting
                </span>
              )}
              {item.is_urgent && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">error</span>
                  Urgent
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{formatTime(item.created_at)}</p>
          </div>
        </div>

        {item.user.id === currentUserId && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-50 dark:bg-slate-900 hover:text-slate-600 dark:text-slate-300"
            >
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 z-10 w-32 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                <button 
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Apakah Anda yakin ingin menghapus postingan ini?')) {
                      onDelete(item.id);
                    }
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Hapus
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 pl-[52px]">
        {isEditing ? (
          <div className="mb-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 text-sm focus:border-primary focus:ring-primary"
              rows={3}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900"
              >
                Batal
              </button>
              <button 
                onClick={handleEditSubmit}
                disabled={isSaving}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{item.content}</p>
            
            {item.project && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2">
                <div className="flex size-8 items-center justify-center rounded bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm">
                  {item.project.code.substring(0, 2)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.project.code}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[200px]">{item.project.title}</p>
                </div>
              </div>
            )}

            {item.attachments && item.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.attachments.map(file => {
                  const storageUrl = (import.meta as any).env.VITE_API_URL ? (import.meta as any).env.VITE_API_URL.replace('/api', '/storage/') : 'http://localhost:8000/storage/';
                  return (
                    <a 
                      key={file.id}
                      href={`${storageUrl}${file.path}`}
                      download={file.name}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 hover:text-primary transition-colors cursor-pointer shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px] text-slate-400">description</span>
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex items-center gap-6 border-t border-slate-100 dark:border-slate-700 pt-3">
          <button 
            onClick={() => onLike(item.id)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              item.is_liked ? 'text-pink-600' : 'text-slate-500 dark:text-slate-400 hover:text-pink-600'
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${item.is_liked ? 'fill' : ''}`}>favorite</span>
            {item.likes_count > 0 ? item.likes_count : null}
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
            {item.comments_count > 0 ? item.comments_count : 'Komentar'}
          </button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-4 border-t border-slate-100 dark:border-slate-700 pt-4">
            {item.comments && item.comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                {comment.user.avatar ? (
                  <div className="size-6 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700" style={{ backgroundImage: `url("${comment.user.avatar}")` }}></div>
                ) : (
                  <div className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {comment.user.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 rounded-lg bg-slate-50 dark:bg-slate-900 p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{comment.user.name}</span>
                    <span className="text-[10px] text-slate-400">{formatTime(comment.created_at)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{comment.comment}</p>
                </div>
              </div>
            ))}
            
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Tulis komentar..."
                className="flex-1 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs focus:border-primary focus:ring-primary"
              />
              <button 
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Kirim
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const FeedScreen: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showAllOnlineUsers, setShowAllOnlineUsers] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePullStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
      isDragging.current = true;
    }
  };

  const handlePullMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = currentY - startY.current;

    if (diff > 0 && scrollContainerRef.current?.scrollTop === 0) {
      const newDistance = Math.min(diff * 0.6, 120); // More sensitive (0.6), lower max limit
      setPullDistance(newDistance);
    } else {
      setPullDistance(0);
      isDragging.current = false;
    }
  };

  const handlePullEnd = async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullDistance > 50) { // Lower threshold for easier activation
      setIsRefreshing(true);
      setPullDistance(80); // Snap to loading height
      
      try {
        // Minimum wait time of 1.5 seconds to ensure animation is seen
        await Promise.all([
          fetchData(),
          new Promise(resolve => setTimeout(resolve, 1500))
        ]);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const fetchData = async () => {
    try {
      const [activitiesData, deadlinesData, onlineUsersData] = await Promise.all([
        api.getActivities(),
        api.getUpcomingDeadlines(),
        api.getOnlineUsers(),
      ]);
      setActivities(activitiesData.data || []);
      setDeadlines(deadlinesData);
      setOnlineUsers(onlineUsersData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching feed data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && files.length === 0) return;

    setIsPosting(true);
    try {
      await api.createActivity({
        content: newPostContent,
        type: 'post',
        is_urgent: false,
      }, files);
      setNewPostContent('');
      setFiles([]);
      fetchData();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (id: number) => {
    try {
      await api.likeActivity(id.toString());
      fetchData();
    } catch (error) {
      console.error('Error liking activity:', error);
    }
  };

  const handleComment = async (id: number, comment: string) => {
    try {
      await api.commentActivity(id.toString(), comment);
      fetchData();
    } catch (error) {
      console.error('Error commenting activity:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteActivity(id.toString());
      fetchData();
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const handleEdit = async (id: number, content: string) => {
    try {
      await api.updateActivity(id.toString(), { content });
      fetchData();
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      let hasOversizedFile = false;

      selectedFiles.forEach(file => {
        if (file.size > 10 * 1024 * 1024) { // 10MB Limit
          hasOversizedFile = true;
        } else {
          validFiles.push(file);
        }
      });

      if (hasOversizedFile) {
        alert('File tidak dapat dilampirkan karena melebihi batas maksimal 10MB.');
      }

      if (validFiles.length > 0) {
        setFiles(validFiles);
      } else {
        // if all were oversized, just ignore
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <div className="flex h-full gap-6 p-6">
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-w-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 relative select-none"
        onTouchStart={handlePullStart}
        onTouchMove={handlePullMove}
        onTouchEnd={handlePullEnd}
        onMouseDown={handlePullStart}
        onMouseMove={handlePullMove}
        onMouseUp={handlePullEnd}
        onMouseLeave={handlePullEnd}
      >
        {/* Pull to Refresh Indicator */}
        <div 
          className="w-full flex items-center justify-center overflow-hidden transition-all duration-200 ease-out bg-gradient-to-b from-slate-900/10 to-transparent backdrop-blur-[2px]"
          style={{ 
            height: isRefreshing ? '80px' : `${pullDistance}px`, 
            opacity: isRefreshing ? 1 : (pullDistance > 0 ? Math.min(pullDistance / 40, 1) : 0) 
          }}
        >
          {isRefreshing ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="p-2 bg-white dark:bg-slate-800/80 backdrop-blur rounded-full shadow-sm">
                <svg className="animate-spin h-6 w-6 text-slate-700 dark:text-slate-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-2 text-slate-500 dark:text-slate-400 font-semibold">
              <span 
                className="material-symbols-outlined transition-transform duration-200 text-2xl bg-white dark:bg-slate-800/50 p-1.5 rounded-full"
                style={{ transform: `rotate(${pullDistance * 2}deg)` }}
              >
                arrow_downward
              </span>
            </div>
          )}
        </div>

        {/* Pull Hint Text */}
        <div className="w-full flex items-center justify-center py-2 -mb-2 cursor-grab active:cursor-grabbing">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700/50">
            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            Tarik ke bawah untuk refresh
          </span>
        </div>

        {/* Post Input */}
        <div id="post-input" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex gap-4">
            {user?.avatar ? (
              <div className="size-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700" style={{ backgroundImage: `url("${user.avatar}")` }}></div>
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined">person</span>
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Apa yang sedang Anda kerjakan?"
                className="w-full resize-none border-0 bg-transparent p-0 text-sm placeholder:text-slate-400 focus:ring-0 outline-none"
                rows={2}
              />
              {files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button onClick={() => setFiles(files.filter((_, i) => i !== index))} className="text-slate-400 hover:text-red-500">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3">
                <div className="flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">attach_file</span>
                    Lampirkan File
                  </button>
                  <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                </div>
                <button 
                  onClick={handlePost}
                  disabled={isPosting || (!newPostContent.trim() && files.length === 0)}
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPosting ? 'Memposting...' : 'Posting'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed List */}
        <div id="feed-list" className={`flex flex-col gap-4 pb-6 transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Memuat aktivitas...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">Belum ada aktivitas</div>
          ) : (
            activities.map(item => (
              <FeedItem 
                key={item.id} 
                item={item} 
                onLike={handleLike} 
                onComment={handleComment}
                onDelete={handleDelete}
                onEdit={handleEdit}
                currentUserId={user?.id || 0}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Widgets */}
      <div className="w-80 flex-none flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
        {/* Aktivitas Mendatang Widget */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Aktivitas Mendatang</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {deadlines.length}
            </span>
          </div>
          {deadlines.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">Tidak ada aktivitas mendatang</div>
          ) : (
            <div className="flex flex-col gap-4">
              {deadlines.map(deadline => (
                <div key={deadline.id} className="flex items-start gap-3">
                  <div className={`flex flex-col items-center rounded-lg px-2 py-1.5 text-center min-w-[44px] border ${
                    deadline.type === 'meeting' 
                      ? 'bg-purple-50 border-purple-100' 
                      : 'bg-red-50 border-red-100'
                  }`}>
                    <span className={`text-[9px] font-black ${
                      deadline.type === 'meeting' ? 'text-purple-600/60' : 'text-primary/60'
                    }`}>{deadline.month}</span>
                    <span className={`text-lg font-black leading-none mt-0.5 ${
                      deadline.type === 'meeting' ? 'text-purple-600' : 'text-primary'
                    }`}>{deadline.day}</span>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{deadline.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{deadline.team}</p>
                      {deadline.time && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{deadline.time}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tim Online Widget */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tim Online</h3>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-tight">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
              </span>
              {onlineUsers.length} Aktif
            </span>
          </div>
          {onlineUsers.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">Tidak ada yang online</div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {onlineUsers.slice(0, 10).map(member => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="relative">
                      {member.avatar ? (
                        <div className="size-9 rounded-full bg-cover bg-center border border-slate-100 dark:border-slate-700 shadow-sm" style={{ backgroundImage: `url("${member.avatar}")` }}></div>
                      ) : (
                        <div className="size-9 rounded-full bg-slate-100 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm text-slate-600 dark:text-slate-300">person</span>
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-green-500"></span>
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{member.name}</span>
                  </div>
                ))}
              </div>
              {onlineUsers.length > 10 && (
                <button 
                  onClick={() => setShowAllOnlineUsers(true)}
                  className="mt-6 w-full rounded-xl bg-slate-50 dark:bg-slate-900 py-2.5 text-[11px] font-black text-slate-500 dark:text-slate-400 hover:bg-slate-100 transition-colors uppercase tracking-widest border border-slate-200 dark:border-slate-700/50"
                >
                  Lihat Semua Anggota
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Online Users Modal */}
      {showAllOnlineUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 p-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Semua Anggota Online ({onlineUsers.length})</h3>
              <button 
                onClick={() => setShowAllOnlineUsers(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-50 dark:bg-slate-900 hover:text-slate-600 dark:text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="flex flex-col gap-4">
                {onlineUsers.map(member => (
                  <div key={member.id} className="flex items-center gap-4">
                    <div className="relative">
                      {member.avatar ? (
                        <div className="size-12 rounded-full bg-cover bg-center border border-slate-100 dark:border-slate-700 shadow-sm" style={{ backgroundImage: `url("${member.avatar}")` }}></div>
                      ) : (
                        <div className="size-12 rounded-full bg-slate-100 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">person</span>
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-white bg-green-500"></span>
                    </div>
                    <div>
                      <span className="block text-base font-bold text-slate-900 dark:text-white">{member.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{member.email || 'Anggota Tim'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700 p-5">
              <button 
                onClick={() => setShowAllOnlineUsers(false)}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedScreen;