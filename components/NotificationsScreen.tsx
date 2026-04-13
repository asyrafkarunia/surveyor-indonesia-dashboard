import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface Notification {
  id: number;
  type: 'comment' | 'alert' | 'assignment' | 'system' | 'finance';
  title: string;
  content: string;
  project_name?: string;
  project_id?: number;
  tag?: string;
  is_read: boolean;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
  };
  project?: {
    id: number;
    code: string;
    title: string;
  };
  data?: any;
}

interface Project {
  id: number;
  code: string;
  title: string;
}

const NotificationItem: React.FC<{ 
  item: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (item: Notification) => void;
}> = ({ item, onMarkAsRead, onDelete, onClick }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'comment': return <span className="material-symbols-outlined text-sm text-blue-600 bg-blue-100 rounded-full p-0.5 fill">chat_bubble</span>;
      case 'alert': return <span className="material-symbols-outlined text-2xl text-orange-500 fill">warning</span>;
      case 'assignment': return <span className="material-symbols-outlined text-2xl text-green-600 fill">assignment_ind</span>;
      case 'system': return <span className="material-symbols-outlined text-2xl text-slate-500 dark:text-slate-400">dns</span>;
      case 'finance': return <span className="material-symbols-outlined text-2xl text-slate-500 dark:text-slate-400">receipt_long</span>;
      default: return null;
    }
  };

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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const isSpecialIcon = item.type !== 'comment' && item.type !== 'finance';
  const projectName = item.project?.title || item.project_name || 'Proyek tidak tersedia';

  return (
    <div 
      className={`group relative flex gap-4 p-4 sm:p-6 transition-colors cursor-pointer border-l-4 ${
        item.is_read ? 'border-l-transparent hover:bg-slate-50 dark:bg-slate-900' : 'border-l-primary bg-red-50/50'
      }`}
      onClick={() => onClick(item)}
    >
        <div className="relative size-12 shrink-0">
          {item.user?.avatar ? (
            <img 
              src={item.user.avatar} 
              alt={item.user.name} 
              className="size-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm transition-opacity duration-300" 
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = '0';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.opacity = '1';
              }}
            />
          ) : null}
          <div className={`absolute inset-0 size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 dark:border-slate-700 shadow-sm ${item.user?.avatar ? 'hidden' : ''}`}>
            {item.user?.name?.charAt(0) || '?'}
          </div>
        </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.user?.name || 'System'}</p>
            <span className="hidden sm:block text-slate-300 text-xs">•</span>
            {projectName && (
              <p 
                className="text-slate-500 dark:text-slate-400 text-xs font-medium hover:text-primary cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(item);
                }}
              >
                Proyek: {projectName}
              </p>
            )}
            {item.tag && (
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                item.tag.includes('Approval') ? 'bg-orange-100 text-orange-800 ring-orange-600/20' : 
                item.tag.includes('Assignment') ? 'bg-green-100 text-green-800 ring-green-600/20' : 
                'bg-slate-100 text-slate-700 dark:text-slate-200 ring-slate-600/20'
              }`}>
                {item.tag}
              </span>
            )}
          </div>
          <span className={`shrink-0 text-xs font-medium whitespace-nowrap ${item.is_read ? 'text-slate-400' : 'text-primary'}`}>
            {formatTime(item.created_at)}
          </span>
        </div>

        <p className={`text-sm leading-relaxed ${item.is_read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white font-medium'}`}>
          {item.content}
        </p>

        <div className="mt-2 flex gap-3">
          {item.type === 'comment' && (
            <>
              <button 
                className="text-xs font-bold text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Balas
              </button>
              {item.project_id && (
                <button 
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(item);
                  }}
                >
                  Lihat Proyek
                </button>
              )}
            </>
          )}
          {item.type === 'alert' && (
            <button 
              className="text-xs font-bold text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onClick(item);
              }}
            >
              Tinjau Sekarang
            </button>
          )}
        </div>
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex gap-2">
        {!item.is_read && (
          <button 
            className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-blue-50 shadow-sm border border-slate-200 dark:border-slate-700" 
            title="Tandai sudah dibaca"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(item.id);
            }}
          >
            <span className="material-symbols-outlined text-lg">mark_email_read</span>
          </button>
        )}
        <button 
          className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-200 dark:border-slate-700" 
          title="Hapus"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
    </div>
  );
};

interface NotificationsScreenProps {
  onNavigate?: (tab: string, data?: any) => void;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [selectedType, setSelectedType] = useState('Semua Tipe');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const { unreadCount, fetchUnreadCount, decrementUnreadCount, resetUnreadCount } = useNotification();

  useEffect(() => {
    fetchProjects();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab, selectedProject, selectedType, selectedDate, searchQuery, currentPage]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
      };

      if (activeTab !== 'Semua') {
        params.type = activeTab;
      }

      if (selectedProject) {
        params.project_id = selectedProject;
      }

      if (selectedType !== 'Semua Tipe') {
        params.type = selectedType;
      }

      if (selectedDate) {
        params.date = selectedDate;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.getNotifications(params);
      const data = (response as any).data || response;

      if (currentPage === 1) {
        setNotifications(data.data || data);
      } else {
        setNotifications(prev => [...prev, ...(data.data || data)]);
      }

      setHasMore(data.next_page_url ? true : false);
      fetchUnreadCount();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await api.getNotificationProjects();
      setProjects(data.data || data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    decrementUnreadCount();
    
    try {
      await api.markNotificationAsRead(id.toString());
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      fetchUnreadCount();
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteNotification(id.toString());
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    resetUnreadCount();
    
    try {
      await api.markAllNotificationsAsRead();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
      fetchUnreadCount();
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus semua notifikasi?')) {
      return;
    }
    try {
      await api.deleteAllNotifications();
      setNotifications([]);
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const handleProjectClick = (projectId: number) => {
    // Navigate to monitoring project page
    if (onNavigate) {
      onNavigate('monitoring');
    } else {
      // Fallback: use window location hash
      window.location.hash = 'monitoring';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    // Check for calendar deep link
    const data = typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data;
    if (notification.tag === 'Calendar' && data?.event_id) {
      if (onNavigate) {
        onNavigate('calendar', { eventId: data.event_id });
      }
      return;
    }
    
    // Navigate based on type
    if (onNavigate) {
      switch (notification.type) {
        case 'comment':
        case 'alert':
        case 'assignment':
          if (notification.project_id) {
            onNavigate('monitoring');
          }
          break;
        case 'system':
          onNavigate('settings');
          break;
        case 'finance':
          onNavigate('dashboard');
          break;
        default:
          break;
      }
    }
  };
  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      date.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let groupKey: string;
      if (diffDays === 0) {
        groupKey = 'Hari Ini';
      } else if (diffDays === 1) {
        groupKey = 'Kemarin';
      } else if (diffDays < 7) {
        groupKey = date.toLocaleDateString('id-ID', { weekday: 'long' });
      } else {
        groupKey = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    setCurrentPage(1);
  };

  const notificationGroups = groupNotificationsByDate(notifications);

  return (
    <main className="flex-1 w-full overflow-y-auto bg-slate-50 dark:bg-slate-900 px-4 py-8 sm:px-8 lg:px-20 custom-scrollbar">
      <div className="mx-auto max-w-5xl flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight">Daftar Notifikasi</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">Pantau pembaruan terbaru seputar proyek, tugas, dan aktivitas sistem Anda dalam satu tempat.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button 
              onClick={handleDeleteAll}
              className="group flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-10 px-4 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-50 dark:bg-slate-900 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-lg text-slate-400 group-hover:text-primary">delete_sweep</span>
              <span>Hapus Semua</span>
            </button>
            <button 
              onClick={handleMarkAllAsRead}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary h-10 px-4 text-white text-sm font-bold hover:bg-primary-dark transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">done_all</span>
              <span>Tandai Semua Dibaca</span>
            </button>
          </div>
        </div>

        {/* List Container */}
        <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-slate-100 dark:border-slate-700 px-6">
            <div className="flex gap-8 overflow-x-auto no-scrollbar">
              {['Semua', 'Belum Dibaca', 'Assignment', 'Sistem'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`relative flex items-center justify-center pb-4 pt-5 transition-all ${
                    activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className={`text-xs font-black uppercase tracking-widest`}>{tab}</span>
                  {tab === 'Belum Dibaca' && unreadCount > 0 && (
                    <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-black text-primary">
                      {unreadCount}
                    </span>
                  )}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-t-full bg-primary"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 items-center justify-between">
            <div className="w-full lg:w-auto relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </span>
              <input 
                className="w-full lg:w-72 pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-primary placeholder:text-slate-400 outline-none transition-all" 
                placeholder="Cari notifikasi..." 
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
              <select 
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value ? Number(e.target.value) : '');
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto text-xs font-bold py-2.5 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-primary focus:ring-0 cursor-pointer shadow-sm hover:bg-slate-50 dark:bg-slate-900 transition-colors uppercase tracking-tight outline-none"
              >
                <option value="">Semua Proyek</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.title}
                  </option>
                ))}
              </select>
              <select 
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto text-xs font-bold py-2.5 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-primary focus:ring-0 cursor-pointer shadow-sm hover:bg-slate-50 dark:bg-slate-900 transition-colors uppercase tracking-tight outline-none"
              >
                <option>Semua Tipe</option>
                <option>Komentar</option>
                <option>Update Proyek</option>
                <option>Assignment</option>
                <option>Sistem</option>
                <option>Finance</option>
              </select>
              <div className="relative">
                <button 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-primary transition-colors shadow-sm ${
                    selectedDate ? 'text-primary border-primary' : ''
                  }`}
                >
                  <span className="material-symbols-outlined">calendar_month</span>
                </button>
                {showDatePicker && (
                  <div className="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateSelect(e.target.value)}
                      className="text-sm border border-slate-200 dark:border-slate-700 rounded px-3 py-2 focus:border-primary focus:ring-primary outline-none"
                    />
                    {selectedDate && (
                      <button
                        onClick={() => {
                          setSelectedDate('');
                          setShowDatePicker(false);
                          setCurrentPage(1);
                        }}
                        className="mt-2 text-xs text-slate-500 dark:text-slate-400 hover:text-primary"
                      >
                        Hapus filter tanggal
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items List */}
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-400">Loading...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">notifications_off</span>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Tidak ada notifikasi</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {Object.entries(notificationGroups).map(([groupKey, groupNotifications]) => (
                <React.Fragment key={groupKey}>
                  <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {groupKey}
                  </div>
                  {groupNotifications.map(notification => (
                    <div key={notification.id} onClick={() => handleNotificationClick(notification)}>
                      <NotificationItem
                        item={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                        onClick={handleNotificationClick}
                      />
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Footer */}
          {hasMore && (
            <div className="bg-white dark:bg-slate-800 p-6 text-center border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={handleLoadMore}
                className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-2"
              >
                <span>Muat Lebih Banyak</span>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default NotificationsScreen;