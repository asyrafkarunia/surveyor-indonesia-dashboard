
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface CreateMarketingTaskScreenProps {
  onCancel: () => void;
  onSave: () => void;
}

const CreateMarketingTaskScreen: React.FC<CreateMarketingTaskScreenProps> = ({ onCancel, onSave }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    client: '',
    priority: 'Medium',
    date: '',
    assignee_id: '',
    status: 'ide_baru',
    project_id: '',
    client_id: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchClients();
    fetchProjects();
  }, []);

  const fetchUsers = async () => {
    try {
      const res: any = await (api as any).getUsers();
      const data = res.data || res;
      const list = Array.isArray(data) ? data : [];
      if (list.length === 0) {
        setUsers([
          { id: 'm1', name: 'Rimsal Djalil (Head Section)' },
          { id: 'm2', name: 'Mutia Asfarina (Marketing)' },
          { id: 'm3', name: 'Afrial Syarli (Marketing)' },
          { id: 'm4', name: 'Arsy Ranah Malaya Suhada (Marketing)' },
          { id: 'm5', name: 'Sadikin (Tender)' },
          { id: 'm6', name: 'Maria Sinaga (Tender)' },
        ]);
      } else {
        setUsers(list);
      }
    } catch (e) {
      console.error(e);
      // fallback data marketing team
      setUsers([
        { id: 'm1', name: 'Rimsal Djalil (Head Section)' },
        { id: 'm2', name: 'Mutia Asfarina (Marketing)' },
        { id: 'm3', name: 'Afrial Syarli (Marketing)' },
        { id: 'm4', name: 'Arsy Ranah Malaya Suhada (Marketing)' },
        { id: 'm5', name: 'Sadikin (Tender)' },
        { id: 'm6', name: 'Maria Sinaga (Tender)' },
      ]);
    }
  };

  const fetchClients = async () => {
    try {
      const res: any = await api.getClients({ page: 1 });
      const data = res.data || res;
      const list = data.data || data;
      setClients(list.data || list || []);
    } catch (e) {
      console.error(e);
      setClients([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const res: any = await api.getProjects({ page: 1 });
      const data = res.data || res;
      const list = data.data || data;
      setProjects(list.data || list || []);
    } catch (e) {
      console.error(e);
      setProjects([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.assignee_id || !form.date) {
      alert('Judul, assignee, dan tanggal wajib diisi');
      return;
    }
    setSaving(true);
    try {
      // Prepare data - only include fields that have values
      const taskData: any = {
        title: form.title,
        priority: form.priority,
        date: form.date,
        assignee_id: parseInt(form.assignee_id),
        status: form.status,
      };

      // Add optional fields only if they have values
      if (form.description && form.description.trim()) {
        taskData.description = form.description.trim();
      }
      
      if (form.client && form.client.trim()) {
        taskData.client = form.client.trim();
      }
      
      if (form.project_id && form.project_id !== '') {
        taskData.project_id = parseInt(form.project_id);
      }
      
      if (form.client_id && form.client_id !== '') {
        taskData.client_id = parseInt(form.client_id);
      }

      await api.createMarketingTask(taskData);
      onSave();
    } catch (error: any) {
      console.error('Error creating marketing task:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Gagal menyimpan task. Pastikan semua field wajib sudah diisi.';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 custom-scrollbar">
      <div className="max-w-5xl mx-auto px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex mb-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <button onClick={onCancel} className="inline-flex items-center hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px] mr-2">dashboard</span>
                Dashboard
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-400 text-[18px]">chevron_right</span>
                <button onClick={onCancel} className="ml-1 md:ml-2 hover:text-primary transition-colors">Kanban Board</button>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-400 text-[18px]">chevron_right</span>
                <span className="ml-1 md:ml-2 text-slate-900 dark:text-white font-bold uppercase text-[10px] tracking-widest">Tambah Kegiatan</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Tambah Kegiatan Marketing Baru</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl font-medium">
            Isi formulir di bawah ini untuk menambahkan kartu kegiatan baru ke papan Kanban. Pastikan semua informasi penting terisi untuk memudahkan pelacakan tim.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-10">
          <form className="space-y-10" onSubmit={handleSubmit}>
            
            {/* Section: Informasi Umum */}
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px] fill">info</span>
                  Informasi Umum
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">
                    Judul Kegiatan <span className="text-primary">*</span>
                  </label>
                  <input 
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary h-12 px-4 transition-all" 
                    placeholder="Contoh: Kampanye Instagram Q3 2024" 
                    required 
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">
                    Deskripsi Lengkap
                  </label>
                  <textarea 
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-primary/20 focus:border-primary min-h-[140px] px-4 py-3 resize-none" 
                    placeholder="Jelaskan detail tujuan, target audience, dan deliverables dari kegiatan ini..."
                  ></textarea>
                  <p className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-400 text-right uppercase tracking-widest">
                    {(form.description || '').length}/500 karakter
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Penugasan & Status */}
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px] fill">assignment_ind</span>
                  Detail Penugasan & Status
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Ditugaskan Ke</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-400">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </span>
                    <select 
                      name="assignee_id"
                      value={form.assignee_id}
                      onChange={handleChange}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary h-12 pl-10 pr-10 appearance-none transition-all outline-none"
                      required
                    >
                      <option value="">Pilih anggota tim</option>
                      {users.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-400">
                      <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Klien / Proyek Terkait</label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">apartment</span>
                      </span>
                      <select
                        name="client_id"
                        value={form.client_id}
                        onChange={(e) => {
                          handleChange(e);
                          const selected = clients.find((c: any) => `${c.id}` === e.target.value);
                          setForm((prev) => ({ ...prev, client: selected?.company_name || selected?.companyName || '' }));
                        }}
                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary h-12 pl-10 pr-10 appearance-none transition-all outline-none"
                      >
                        <option value="">(Opsional) Pilih klien dari database</option>
                        {clients.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.company_name || c.companyName}</option>
                        ))}
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">expand_more</span>
                      </span>
                    </div>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">work</span>
                      </span>
                      <select
                        name="project_id"
                        value={form.project_id}
                        onChange={handleChange}
                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary h-12 pl-10 pr-10 appearance-none transition-all outline-none"
                      >
                        <option value="">(Opsional) Pilih proyek terkait</option>
                        {projects.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.title || p.name}</option>
                        ))}
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">expand_more</span>
                      </span>
                    </div>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </span>
                      <input 
                        name="client"
                        value={form.client}
                        onChange={handleChange}
                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary h-12 pl-10 pr-10 transition-all outline-none" 
                        placeholder="(Opsional) Tulis manual nama klien/proyek..." 
                        type="text"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Prioritas</label>
                  <div className="relative">
                    <select 
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary h-12 px-4 appearance-none transition-all outline-none"
                    >
                      <option value="High">Tinggi (High) 🔥</option>
                      <option value="Medium">Sedang (Medium)</option>
                      <option value="Low">Rendah (Low)</option>
                    </select>
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-400">
                      <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Tenggat Waktu</label>
                  <div className="relative">
                    <input 
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary h-12 px-4 transition-all outline-none" 
                      type="date"
                      required
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Status Awal (Kolom Kanban)</label>
                  <div className="relative">
                    <select 
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary h-12 px-4 appearance-none transition-all outline-none"
                    >
                      <option value="ide_baru">Ide Baru (Backlog)</option>
                      <option value="review">Dalam Review</option>
                      <option value="sph">Persiapan SPH</option>
                      <option value="berjalan">Sedang Berjalan</option>
                      <option value="selesai">Selesai</option>
                    </select>
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-400">
                      <span className="material-symbols-outlined text-[20px]">view_column</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-700 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4">
              <button 
                className="w-full sm:w-auto px-8 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700 font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm flex justify-center items-center" 
                type="button"
                onClick={onCancel}
              >
                Batal
              </button>
              <button 
                disabled={saving}
                className="w-full sm:w-auto px-10 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 transition-all flex justify-center items-center gap-2 group active:scale-95 disabled:opacity-60" 
                type="submit"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">save</span>
                {saving ? 'Menyimpan...' : 'Simpan Kegiatan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default CreateMarketingTaskScreen;
