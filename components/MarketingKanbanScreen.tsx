
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { KanbanCard, KanbanColumn } from '../types';
import MarketingTaskDetail from './MarketingTaskDetail';

interface MarketingKanbanScreenProps {
  onAddTask?: () => void;
}

const PriorityBadge: React.FC<{ priority: KanbanCard['priority'] }> = ({ priority }) => {
  const styles: Record<string, string> = {
    High: 'bg-blue-50 text-blue-700 border-blue-100',
    Medium: 'bg-amber-50 text-amber-700 border-amber-100',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${styles[priority] || styles.Medium}`}>
      {priority}
    </span>
  );
};

const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) return <>{text}</>;
  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((p, i) => 
        p.toLowerCase() === highlight.toLowerCase() 
          ? <mark key={i} className="bg-yellow-300 dark:bg-yellow-500/50 text-yellow-900 dark:text-yellow-50 rounded px-0.5">{p}</mark> 
          : p
      )}
    </>
  );
};

const TaskCard: React.FC<{ 
  card: KanbanCard; 
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  searchQuery?: string;
}> = ({ card, onClick, onDelete, onDragStart, onDragEnd, searchQuery = '' }) => {
  const isMatch = searchQuery.trim() !== '' && (card.title.toLowerCase().includes(searchQuery.toLowerCase()) || card.client.toLowerCase().includes(searchQuery.toLowerCase()));
  const containerClass = isMatch 
    ? "bg-yellow-50/80 dark:bg-yellow-900/20 p-4 rounded-xl border-2 border-yellow-400 dark:border-yellow-500/50 shadow-md transform transition-all cursor-move group relative z-10"
    : (searchQuery.trim() !== '' ? "bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm transition-all cursor-move group opacity-60" : "bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-move group");

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={containerClass}
      data-search-match={isMatch ? "true" : undefined}
    >
      <div className="flex justify-between items-start mb-2">
        <PriorityBadge priority={card.priority} />
        <button 
          onClick={onDelete}
          className="text-slate-300 hover:text-red-600 transition-colors"
          title="Hapus card"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-snug mb-1">
        <HighlightedText text={card.title} highlight={searchQuery} />
      </h4>
      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 mb-4">
        <HighlightedText text={card.client} highlight={searchQuery} />
      </p>
      
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
          {card.date}
        </div>
        <div className="flex items-center">
          {card.assignee.avatar ? (
            <img 
              src={card.assignee.avatar} 
              alt={card.assignee.name}
              className="size-6 rounded-full border border-white shadow-sm object-cover"
            />
          ) : (
            <div className="size-6 rounded-full bg-slate-100 border border-white shadow-sm flex items-center justify-center text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase">
              {card.assignee.initials}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Skeleton Card for Loading State ─── */
const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2" />
    <div className="h-3 w-24 bg-slate-100 dark:bg-slate-700 rounded mb-4" />
    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
      <div className="h-3 w-20 bg-slate-100 dark:bg-slate-700 rounded" />
      <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
);

const SkeletonColumn: React.FC = () => (
  <div className="w-80 flex flex-col gap-4">
    <div className="flex items-center justify-between pb-3 mb-2 border-b-2 border-slate-200">
      <div className="flex items-center gap-2">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-5 w-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
      </div>
      <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
    </div>
    <div className="flex flex-col gap-3">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

const MarketingKanbanScreen: React.FC<MarketingKanbanScreenProps> = ({ onAddTask }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [selectedTask, setSelectedTask] = useState<KanbanCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<{ card: KanbanCard; sourceColumn: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  const fetchColumns = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true);
      setError(null);
    }
    try {
      const res: any = await api.getMarketingPlanColumns();
      const data = res.data || res;
      const normalized: KanbanColumn[] = Array.isArray(data)
        ? data.map((col: any) => ({
            ...col,
            cards: Array.isArray(col.cards)
              ? col.cards.map((card: any) => ({
                  ...card,
                  id: card?.id?.toString?.() ?? String(card?.id ?? ''),
                }))
              : [],
          }))
        : [];
      setColumns(normalized);
      setError(null);
      retryCountRef.current = 0;
    } catch (e: any) {
      console.error('Failed to fetch marketing plan columns:', e);
      
      // Auto-retry with exponential backoff
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        const delay = retryCountRef.current * 1500; // 1.5s, 3s
        console.log(`Retrying... attempt ${retryCountRef.current}/${MAX_RETRIES} in ${delay}ms`);
        setTimeout(() => fetchColumns(true), delay);
        return;
      }
      
      setError(e.message || 'Gagal memuat data Marketing Plan. Silakan coba lagi.');
      setColumns([]);
    } finally {
      if (!isRetry || retryCountRef.current >= MAX_RETRIES) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    retryCountRef.current = 0;
    fetchColumns();
  }, [fetchColumns]);

  const handleRetry = () => {
    retryCountRef.current = 0;
    fetchColumns();
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setSearchQuery(searchInput);
      
      if (searchInput.trim()) {
        setTimeout(() => {
          const el = document.querySelector('[data-search-match="true"]');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            el.classList.add('ring-4', 'ring-yellow-400/50', 'scale-105', 'z-50');
            setTimeout(() => {
              el.classList.remove('ring-4', 'ring-yellow-400/50', 'scale-105', 'z-50');
            }, 1500);
          }
        }, 100);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, card: KanbanCard, sourceColumn: string) => {
    setDraggedCard({ card, sourceColumn });
    e.dataTransfer.effectAllowed = 'move';
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedCard(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedCard) return;

    const { card, sourceColumn } = draggedCard;
    
    if (sourceColumn === targetColumnId) {
      setDraggedCard(null);
      return;
    }

    try {
      const statusMap: { [key: string]: string } = {
        'ide_baru': 'ide_baru',
        'review': 'review',
        'sph': 'sph',
        'berjalan': 'berjalan',
        'selesai': 'selesai',
      };

      const newStatus = statusMap[targetColumnId] || targetColumnId;
      await api.moveMarketingTask(card.id.toString(), newStatus);
      
      setColumns(prev => {
        const newColumns = prev.map(col => {
          if (col.id === sourceColumn) {
            return { ...col, cards: col.cards.filter(c => c.id !== card.id) };
          }
          if (col.id === targetColumnId) {
            return { ...col, cards: [...col.cards, card] };
          }
          return col;
        });
        return newColumns;
      });
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Gagal memindahkan card');
    } finally {
      setDraggedCard(null);
    }
  };

  const handleDeleteCard = async (cardId: string, columnId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) return;
    
    try {
      await api.deleteMarketingTask(cardId);
      setColumns(prev => prev.map(col => {
        if (col.id === columnId) {
          return { ...col, cards: col.cards.filter(c => c.id?.toString?.() !== cardId) };
        }
        return col;
      }));
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Gagal menghapus card');
    }
  };

  const handleMoveToColumn = async (cardId: string, currentColumnId: string, targetColumnId: string) => {
    try {
      const statusMap: { [key: string]: string } = {
        'ide_baru': 'ide_baru',
        'review': 'review',
        'sph': 'sph',
        'berjalan': 'berjalan',
        'selesai': 'selesai',
      };

      const newStatus = statusMap[targetColumnId] || targetColumnId;
      await api.moveMarketingTask(cardId, newStatus);
      
      setColumns(prev => {
        const card = prev.find(col => col.id === currentColumnId)?.cards.find(c => c.id === cardId);
        if (!card) return prev;
        
        return prev.map(col => {
          if (col.id === currentColumnId) {
            return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
          }
          if (col.id === targetColumnId) {
            return { ...col, cards: [...col.cards, card] };
          }
          return col;
        });
      });
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Gagal memindahkan card');
    }
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
      {/* Kanban Header */}
      <div className="px-6 py-6 md:px-10 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Perencanaan Marketing</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola kampanye dan kegiatan pemasaran strategis PT SI.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] group-focus-within:text-primary transition-colors">search</span>
              <input 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold w-48 md:w-64 focus:bg-white dark:bg-slate-800 dark:focus:bg-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-400" 
                placeholder="Cari kegiatan... (Tekan Enter)" 
                type="text"
              />
            </div>
            <button 
              id="kanban-add-btn"
              onClick={onAddTask}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-xs font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tambah Kegiatan Baru
            </button>
          </div>
        </div>
      </div>

      {/* Board Layout */}
      <div id="kanban-board" className="flex-1 overflow-x-auto p-6 md:p-10 custom-scrollbar">
        {loading ? (
          /* ─── Skeleton Loading State ─── */
          <div className="flex gap-6 h-full min-w-max">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonColumn key={i} />
            ))}
          </div>
        ) : error ? (
          /* ─── Error State with Retry ─── */
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,56,104,0.08), rgba(0,180,174,0.08))' }}>
              <span className="material-symbols-outlined text-3xl text-slate-400">cloud_off</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">Gagal Memuat Data</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95"
              style={{ background: 'linear-gradient(135deg, #003868, #00B4AE)', boxShadow: '0 2px 10px rgba(0,56,104,0.2)' }}
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Coba Lagi
            </button>
          </div>
        ) : columns.length === 0 ? (
          /* ─── Empty State ─── */
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <span className="material-symbols-outlined text-3xl text-slate-300">view_kanban</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">Belum Ada Data</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">Mulai buat kegiatan marketing pertama Anda.</p>
            </div>
            <button
              onClick={onAddTask}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95"
              style={{ background: 'linear-gradient(135deg, #003868, #00B4AE)' }}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tambah Kegiatan Baru
            </button>
          </div>
        ) : (
          <div className="flex gap-6 h-full min-w-max">
            {columns.map((column) => {
              // We no longer filter out cards, we show all but highlight matches.
              const cardsToRender = column.cards;
              const matchCount = searchQuery ? cardsToRender.filter(card => 
                card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.client.toLowerCase().includes(searchQuery.toLowerCase())
              ).length : cardsToRender.length;

              return (
                <div 
                  key={column.id} 
                  className="w-80 flex flex-col gap-4"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className={`flex items-center justify-between border-b-2 ${column.color} pb-3 mb-2`}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">{column.title}</h3>
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {searchQuery ? `${matchCount}/${cardsToRender.length}` : cardsToRender.length}
                      </span>
                    </div>
                    <button 
                      onClick={onAddTask}
                      className="text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar min-h-[200px]">
                    {cardsToRender.map((card) => (
                      <TaskCard 
                        key={card.id} 
                        card={card} 
                        searchQuery={searchQuery}
                        onClick={() => setSelectedTask(card)}
                        onDelete={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(card.id.toString(), column.id);
                        }}
                        onDragStart={(e) => handleDragStart(e, card, column.id)}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                    
                    <button 
                      onClick={onAddTask}
                      className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-400 hover:text-primary hover:border-primary/50 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group"
                    >
                      <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">add</span>
                      Add Card
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <MarketingTaskDetail 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
    </main>
  );
};

export default MarketingKanbanScreen;
