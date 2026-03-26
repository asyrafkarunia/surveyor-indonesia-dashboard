
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date | null;
  onSave?: () => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, selectedDate, onSave }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number[]>([]);
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [durationUnit, setDurationUnit] = useState<'Hari' | 'Jam'>('Hari');
  const [durationDays, setDurationDays] = useState(1);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [projectId, setProjectId] = useState('');
  const [type, setType] = useState('activity');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('weekly');
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringEndType, setRecurringEndType] = useState('date');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [recurringCount, setRecurringCount] = useState(10);

  // Helper function to format date to YYYY-MM-DD in local timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setTitle('');
      setDescription('');
      // Always set date first - use selectedDate if available, otherwise today
      if (selectedDate) {
        // Use local date format to avoid timezone issues
        const formattedDate = formatDateLocal(selectedDate);
        setDate(formattedDate);
      } else {
        setDate(formatDateLocal(new Date()));
      }
      setDurationDays(1);
      setStartTime('');
      setEndTime('');
      setProjectId('');
      setSelectedTeam([]);
      setTeamSearchTerm('');
      setIsTeamDropdownOpen(false);
      setType('activity');
      setIsRecurring(false);
      setRecurringFrequency('weekly');
      setRecurringInterval(1);
      setRecurringEndType('date');
      setRecurringEndDate('');
      setRecurringCount(10);
      
      // Fetch projects and users
      fetchProjects();
      fetchUsers();
    }
  }, [isOpen]);

  // Update date when selectedDate changes while modal is open
  useEffect(() => {
    if (isOpen && selectedDate) {
      const formattedDate = formatDateLocal(selectedDate);
      setDate(formattedDate);
    }
  }, [selectedDate, isOpen]);

  const fetchProjects = async () => {
    try {
      const response: any = await api.getProjects();
      if (response.data) {
        setProjects(response.data);
      } else {
        setProjects(response || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data: any = await (api as any).getUsers();
      if (data.data) {
        setUsers(data.data);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventData: any = {
        title,
        description: description || null,
        date,
        duration_days: durationUnit === 'Hari' ? durationDays : 1,
        type,
        project_id: projectId || null,
        is_recurring: isRecurring,
      };

      if (selectedTeam.length > 0) {
        eventData.team_members = selectedTeam;
      }

      if (durationUnit === 'Jam' && startTime && endTime) {
        eventData.start_time = startTime;
        eventData.end_time = endTime;
      }

      if (isRecurring) {
        eventData.recurring_frequency = recurringFrequency;
        eventData.recurring_interval = recurringInterval;
        eventData.recurring_end_type = recurringEndType;
        
        if (recurringEndType === 'date') {
          eventData.recurring_end_date = recurringEndDate;
        } else if (recurringEndType === 'count') {
          eventData.recurring_count = recurringCount;
        }
      }

      await api.createCalendarEvent(eventData);
      
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to create event:', error);
      alert(error.message || 'Gagal menyimpan aktivitas');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl transition-all border border-slate-100 dark:border-slate-700">
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-5 bg-white dark:bg-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Tambah Aktivitas Baru</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-primary transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="max-h-[80vh] overflow-y-auto px-8 py-8 custom-scrollbar space-y-8">
            {/* Activity Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Nama Aktivitas <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50/30 px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                placeholder="Contoh: Rapat Koordinasi Mingguan"
                type="text"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Deskripsi</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50/30 px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                placeholder="Tambahkan deskripsi aktivitas..."
                rows={3}
              />
            </div>

            {/* Date and Duration Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50/30 px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    type="date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  {durationUnit === 'Hari' ? 'Durasi (Hari)' : 'Rentang Waktu'}
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50/30 overflow-hidden focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary transition-all min-h-[50px]">
                  {durationUnit === 'Hari' ? (
                    <input
                      required
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full bg-transparent py-3.5 px-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                      type="number"
                      min="1"
                      max="365"
                    />
                  ) : (
                    <div className="flex items-center w-full px-2 gap-1 animate-in slide-in-from-left-2 duration-200">
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-transparent border-none p-1 text-sm font-bold text-slate-900 dark:text-white focus:ring-0 text-center"
                      />
                      <span className="text-slate-300 font-bold">-</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-transparent border-none p-1 text-sm font-bold text-slate-900 dark:text-white focus:ring-0 text-center"
                      />
                    </div>
                  )}
                  <div className="h-8 w-px bg-slate-200 shrink-0 mx-1"></div>
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as 'Hari' | 'Jam')}
                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 focus:ring-0 cursor-pointer pr-8 pl-2"
                  >
                    <option value="Hari">Hari</option>
                    <option value="Jam">Jam</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Tipe Aktivitas</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50/30 px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none cursor-pointer pr-10"
              >
                <option value="activity">Aktivitas</option>
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Proyek (Opsional)</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50/30 px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none cursor-pointer pr-10"
              >
                <option value="">Pilih Proyek</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Members Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Pilih Anggota Tim (Opsional)</label>
              
              {/* Selected Chips */}
              {selectedTeam.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTeam.map(userId => {
                    const user = users.find(u => u.id === userId);
                    if (!user) return null;
                    return (
                      <div key={userId} className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg border border-primary/20">
                        <div className="size-4 rounded-full bg-white/50 flex items-center justify-center text-[8px] font-black">
                          {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold leading-none">{user.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedTeam(prev => prev.filter(id => id !== userId))}
                          className="ml-1 opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Searchable Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
                </div>
                <input
                  type="text"
                  placeholder="Cari dan tambah anggota tim..."
                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50/30 py-3.5 pl-10 pr-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  value={teamSearchTerm}
                  onChange={(e) => {
                    setTeamSearchTerm(e.target.value);
                    if (!isTeamDropdownOpen) setIsTeamDropdownOpen(true);
                  }}
                  onFocus={() => setIsTeamDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsTeamDropdownOpen(false), 200)}
                />

                {/* Dropdown Options */}
                {isTeamDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl max-h-[200px] overflow-y-auto custom-scrollbar">
                    {users.filter(u => 
                      !selectedTeam.includes(u.id) &&
                      (u.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) || 
                      u.email.toLowerCase().includes(teamSearchTerm.toLowerCase()))
                    ).length > 0 ? (
                      users.filter(u => 
                        !selectedTeam.includes(u.id) &&
                        (u.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) || 
                        u.email.toLowerCase().includes(teamSearchTerm.toLowerCase()))
                      ).map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                          onMouseDown={() => {
                            setSelectedTeam((prev) => [...prev, u.id]);
                            setTeamSearchTerm('');
                          }}
                        >
                          <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                              {u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{u.name}</span>
                            <span className="text-[10px] font-medium text-slate-500">{u.email}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <span className="text-xs text-slate-400 font-medium">
                          {users.length === 0 ? "Memuat anggota tim..." : "Tidak ada anggota tim yang cocok"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recurring Switch Section */}
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/5">
                    <span className="material-symbols-outlined text-[24px]">update</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Aktivitas Berulang</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1.5">Jadwalkan aktivitas ini secara otomatis</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-800 after:border-slate-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Conditional rendering: Only show if isRecurring is true */}
              {isRecurring && (
                <div className="space-y-6 pl-2 md:pl-14 border-l border-primary/5 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Frekuensi</label>
                      <div className="relative">
                        <select
                          value={recurringFrequency}
                          onChange={(e) => setRecurringFrequency(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 focus:border-primary focus:ring-0 outline-none shadow-sm"
                        >
                          <option value="daily">Harian</option>
                          <option value="weekly">Mingguan</option>
                          <option value="monthly">Bulanan</option>
                          <option value="yearly">Tahunan</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Setiap</label>
                      <div className="flex items-center gap-3">
                        <input
                          value={recurringInterval}
                          onChange={(e) => setRecurringInterval(Number(e.target.value))}
                          className="w-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-xs font-black text-slate-900 dark:text-white focus:border-primary focus:ring-0 outline-none shadow-sm"
                          type="number"
                          min="1"
                        />
                        <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
                          {recurringFrequency === 'daily' ? 'Hari' : recurringFrequency === 'weekly' ? 'Minggu' : recurringFrequency === 'monthly' ? 'Bulan' : 'Tahun'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* End Condition Section */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block">Berakhir Pada</label>
                    <div className="flex flex-col gap-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="end-condition"
                          checked={recurringEndType === 'never'}
                          onChange={() => setRecurringEndType('never')}
                          className="size-4 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20 bg-white dark:bg-slate-800"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">Selamanya</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="end-condition"
                          checked={recurringEndType === 'date'}
                          onChange={() => setRecurringEndType('date')}
                          className="size-4 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20 bg-white dark:bg-slate-800"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">Tanggal Tertentu</span>
                        {recurringEndType === 'date' && (
                          <input
                            required={recurringEndType === 'date'}
                            value={recurringEndDate}
                            onChange={(e) => setRecurringEndDate(e.target.value)}
                            className="ml-auto w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-black text-slate-700 dark:text-slate-200 focus:border-primary focus:ring-0 transition-all outline-none shadow-sm"
                            type="date"
                          />
                        )}
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="end-condition"
                          checked={recurringEndType === 'count'}
                          onChange={() => setRecurringEndType('count')}
                          className="size-4 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20 bg-white dark:bg-slate-800"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">Setelah</span>
                        {recurringEndType === 'count' && (
                          <div className="ml-auto flex items-center gap-3">
                            <input
                              required={recurringEndType === 'count'}
                              value={recurringCount}
                              onChange={(e) => setRecurringCount(Number(e.target.value))}
                              className="w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-black text-slate-700 dark:text-slate-200 focus:border-primary focus:ring-0 outline-none shadow-sm"
                              type="number"
                              min="1"
                            />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Kali</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-center gap-4 border-t border-slate-100 dark:border-slate-700 px-8 py-6 bg-slate-50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 max-w-[240px] rounded-xl bg-primary px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : 'Simpan Aktivitas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityModal;
