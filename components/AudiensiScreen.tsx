
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface AudiensiScreenProps {
  onManageTemplates: () => void;
  onBack: () => void;
}

const AudiensiScreen: React.FC<AudiensiScreenProps> = ({ onManageTemplates, onBack }) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [form, setForm] = useState({
    client_id: '',
    company_name: '',
    sector: '',
    purpose: '',
    position: '',
    template_id: '',
    content: '',
    date: '',
    is_new_application: false,
  });

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchTemplates();
    fetchClients();
  }, []);

  useEffect(() => {
    calculateProgress();
  }, [form]);

  const calculateProgress = () => {
    let p = 0;
    // Step 1: Template Selection (50%)
    if (form.template_id) p += 50;
    
    // Step 2: Detail Surat (50%)
    // Weighted: Company (10%), Leader (10%), Date (10%), Content (20%)
    // But simplified: If details started -> increment
    // Let's do:
    // Base 0
    // Template selected: 50%
    // If template not selected but details filled, still show progress?
    // User requirement: "jika masih ditahap 1 maka hanya menampilkan 50 %, dan saat menuliskan detail surat maka akan berubah"
    
    if (form.template_id) {
        p = 50;
        // Check step 2 progress
        let step2 = 0;
        if (form.company_name) step2 += 10;
        if (form.purpose) step2 += 10;
        if (form.position) step2 += 10;
        if (form.date) step2 += 20;
        p += step2;
    } else {
        // Even if no template, if they fill details, show some progress?
        // Let's stick to the requirement: Step 1 (Template) = 50%.
        // If they skip template (Tanpa Template), maybe that counts as Step 1 done?
        // "Tanpa Template" value is empty string in the select options usually, but I should check.
        // If "Tanpa Template" is a valid choice (meaning they chose to go without), it should be 50%.
        // But currently value="" for "Tanpa Template".
        // I'll assume if they interact with Step 2, they passed Step 1.
        if (form.company_name || form.purpose || form.position || form.date) {
            p = 50;
            if (form.company_name) p += 10;
            if (form.purpose) p += 10;
            if (form.position) p += 10;
            if (form.date) p += 20;
        }
    }
    
    setProgress(Math.min(p, 100));
  };

  const fetchTemplates = async () => {
    try {
      const res: any = await api.getAudiensiTemplates();
      const data = res.data || res;
      setTemplates(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setTemplates([]);
    }
  };

  const fetchClients = async () => {
    try {
      const res: any = await api.getClients({ page: 1 }); // Fetch first page/all
      // Assuming getClients returns { data: [...] } or [...]
      const data = res.data?.data || res.data || res;
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setClients([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'template_id') {
      const selectedTemplate = templates.find(t => t.id.toString() === value);
      setForm(prev => ({
        ...prev,
        template_id: value,
        sector: selectedTemplate ? selectedTemplate.sector : prev.sector
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'custom') {
      setIsCustomCompany(true);
      setForm(prev => ({
        ...prev,
        client_id: '',
        company_name: '',
        purpose: '',
        position: ''
      }));
    } else {
      setIsCustomCompany(false);
      const client = clients.find(c => c.id.toString() === value);
      if (client) {
        setForm(prev => ({
          ...prev,
          client_id: client.id.toString(),
          company_name: client.company_name,
          purpose: client.contact_person || prev.purpose, // Auto-fill leader name
          position: client.contact_role || prev.position // Auto-fill position
        }));
      } else {
        // Reset
        setForm(prev => ({
          ...prev,
          client_id: '',
          company_name: '',
          purpose: '',
          position: ''
        }));
      }
    }
  };

  const handleSubmit = async (generate: boolean) => {
    setSaving(true);
    try {
      if (!form.company_name || !form.purpose || !form.position || !form.date) {
        alert('Nama perusahaan, nama pimpinan, jabatan, dan tanggal wajib diisi');
        setSaving(false);
        return;
      }
      const payload: any = {
        company_name: form.company_name,
        sector: form.sector || 'Umum',
        purpose: form.purpose,
        position: form.position,
        template_id: form.template_id || null,
        content: form.content || null,
        date: form.date,
        client_id: form.client_id ? parseInt(form.client_id) : null,
        is_new_application: form.is_new_application,
      };
      const letter: any = await api.createAudiensi(payload);
      if (generate && letter?.id) {
        await api.generateAudiensi(letter.id.toString());
      }
      onBack();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Gagal menyimpan surat audiensi');
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Top Header / Breadcrumbs */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-8 shrink-0">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
          <button onClick={onBack} className="hover:text-primary transition-colors">Dashboard</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button onClick={onBack} className="hover:text-primary transition-colors">Surat Audiensi</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-slate-900 font-black">Buat Baru</span>
        </div>
      </header>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          
          {/* Back Button and Page Header */}
          <div className="flex flex-col gap-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors w-fit group"
            >
              <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span className="text-[11px] font-black uppercase tracking-widest">Kembali ke Daftar</span>
            </button>
            
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Pengajuan Surat Audiensi</h1>
                <p className="text-slate-500 text-sm">Buat surat permohonan audiensi baru untuk klien atau instansi.</p>
              </div>
              <button 
                onClick={onManageTemplates}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all text-[11px] font-black uppercase tracking-widest text-slate-600"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-400">tune</span>
                Kelola Template Surat
              </button>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Progress Bar */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                  {progress < 50 ? 'Langkah 1 dari 2' : 'Langkah 2 dari 2'}
                </span>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{progress}% Completed</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Left Panel: Step 1 (Template Selection) */}
              <div className="p-8 flex-1 lg:border-r border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center size-7 rounded-full bg-primary text-white text-[12px] font-black">1</span>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pilih Template Sektor</h2>
                </div>
                <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">Pilih jenis template surat yang sesuai dengan sektor tujuan.</p>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Pilih Template</label>
                    <select
                      name="template_id"
                      value={form.template_id}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="">Tanpa Template</option>
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} • {tpl.sector}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Sektor</label>
                    <input
                      name="sector"
                      value={form.sector}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500 focus:outline-none cursor-not-allowed"
                      placeholder="Otomatis dari template"
                    />
                  </div>
                </div>
              </div>

              {/* Right Panel: Step 2 (Details Form) */}
              <div className="p-8 flex-1 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center size-7 rounded-full bg-slate-200 text-slate-500 text-[12px] font-black">2</span>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Detail Surat</h2>
                </div>
                <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">Lengkapi informasi detail untuk isi surat.</p>
                
                <form className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nomor Surat Audiensi</label>
                    <div className="relative">
                      <input 
                        className="w-full bg-slate-100 text-slate-500 border-slate-200 rounded-lg text-sm px-4 py-3 cursor-not-allowed select-none font-mono" 
                        disabled 
                        type="text" 
                        value="Auto-generated setelah disimpan"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-widest">Auto</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tanggal Surat</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                      </span>
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-lg text-sm pl-10 px-4 py-3 font-bold text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Perusahaan / Instansi</label>
                    <div className="space-y-3">
                      <select
                        className="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 font-bold text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                        onChange={handleClientChange}
                        value={isCustomCompany ? 'custom' : (form.client_id || '')}
                      >
                        <option value="">Pilih Klien Terdaftar</option>
                        {clients.map((client: any) => (
                          <option key={client.id} value={client.id}>{client.company_name}</option>
                        ))}
                        <option value="custom">+ Input Manual (Klien Baru/Lainnya)</option>
                      </select>
                      
                      {isCustomCompany && (
                        <input 
                          className="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 font-bold text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all animate-in fade-in slide-in-from-top-2" 
                          placeholder="Tuliskan nama perusahaan..." 
                          type="text"
                          name="company_name"
                          value={form.company_name}
                          onChange={handleChange}
                          autoFocus
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Pimpinan / Tujuan Surat</label>
                    <input 
                      className="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 font-bold text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                      placeholder="Contoh: Arsy" 
                      type="text"
                      name="purpose"
                      value={form.purpose}
                      onChange={handleChange}
                    />
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter italic">Sebutkan nama lengkap beserta gelar jika ada.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jabatan Pimpinan</label>
                    <input 
                      className="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 font-bold text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                      placeholder="Contoh: Direktur Utama" 
                      type="text"
                      name="position"
                      value={form.position}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Isi/Body Surat (Opsional)</label>
                    <textarea
                      name="content"
                      value={form.content}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                      rows={6}
                      placeholder="Isi surat atau poin-poin penting"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          name="is_new_application"
                          checked={form.is_new_application}
                          onChange={(e) => setForm(prev => ({ ...prev, is_new_application: e.target.checked }))}
                          className="peer appearance-none size-5 rounded border border-slate-300 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                        />
                        <span className="material-symbols-outlined absolute text-white text-[16px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">check</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">Pengajuan Baru (Tanda Tangan Basah)</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Ceklis jika surat tidak memerlukan persetujuan digital dan akan ditandatangani manual.</span>
                      </div>
                    </label>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
                    <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0 mt-0.5">info</span>
                    <p className="text-[11px] font-medium text-blue-800 leading-relaxed">Nomor surat akan di-generate otomatis setelah disimpan. Anda bisa menyimpan draft (belum generate PDF) atau langsung buat surat (create + generate).</p>
                  </div>
                </form>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
              <button 
                onClick={onBack}
                className="px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Draft'}
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={saving}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-red-700 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  {saving ? 'Memproses...' : 'Buat Surat'}
                </button>
              </div>
            </div>
          </div>

          {/* Helper / Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 group hover:border-primary transition-colors">
              <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                <span className="material-symbols-outlined text-[20px] fill">verified_user</span>
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Validasi Otomatis</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Sistem akan mengecek duplikasi nomor surat secara real-time.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 group hover:border-primary transition-colors">
              <div className="size-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors">
                <span className="material-symbols-outlined text-[20px] fill">history_edu</span>
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Arsip Digital</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Salinan surat akan otomatis tersimpan di menu Arsip Dokumen.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 group hover:border-primary transition-colors">
              <div className="size-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition-colors">
                <span className="material-symbols-outlined text-[20px] fill">notifications_active</span>
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Notifikasi</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Reminder akan dikirim H-3 sebelum tanggal audiensi.</p>
              </div>
            </div>
          </div>
          
          <footer className="mt-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">© 2024 PT Surveyor Indonesia. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </main>
  );
};

export default AudiensiScreen;
