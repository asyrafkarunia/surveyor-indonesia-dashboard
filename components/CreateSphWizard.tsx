import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface CreateSphWizardProps {
  onCancel: () => void;
  onFinish: () => void;
}

const CreateSphWizard: React.FC<CreateSphWizardProps> = ({ onCancel, onFinish }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({
    client_id: '',
    project_id: '',
    project_name: '',
    project_location: '',
    project_ref: '',
    pic_name: '',
    pic_position: '',
    date_created: '',
    description: '',
    items: [] as any[],
    validity_period: '',
    time_period: '',
    term_payment: '',
    bank_name: 'Bank Mandiri cabang Pekanbaru',
    bank_acc_no: '108.000.21704.97',
    terms_conditions: '',
    is_new_application: false,
  });
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const steps = [
    { id: 1, label: 'Data Klien & Proyek' },
    { id: 2, label: 'Syarat & Ketentuan' },
    { id: 3, label: 'Layanan & Biaya' },
    { id: 4, label: 'Review' },
  ];

  useEffect(() => {
    fetchClients();
    fetchUsers();
  }, []);

  const fetchClients = async () => {
    try {
      const res: any = await api.getClients();
      const data = res.data || res;
      setClients(Array.isArray(data.data) ? data.data : data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res: any = await (api as any).getUsers();
      const data = res.data || res;
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      if (currentStep === 3) {
        // Fetch preview when moving to review step
        handlePreview();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const progressWidth = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const addServiceItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { service: '', qty: 1, person: 1, unit: '', unit_price: 0, total: 0 }]
    }));
  };

  const removeServiceItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateServiceItem = (index: number, field: string, value: any) => {
    setForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      if (['qty','unit_price','person'].includes(field)) {
        const qty = parseFloat(newItems[index].qty) || 0;
        const price = parseFloat(newItems[index].unit_price) || 0;
        const person = parseFloat(newItems[index].person) || 1;
        newItems[index].total = qty * person * price;
      }
      return { ...prev, items: newItems };
    });
  };

  const calculateTotal = () => {
    const subtotal = form.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    return { subtotal, ppn: 0, total: subtotal };
  };

  const Info = ({ label, value }: { label: string; value: string }) => (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex flex-col gap-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-slate-900 dark:text-white">{value || '-'}</span>
    </div>
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePreview = async () => {
    setLoadingPreview(true);
    try {
      const total = calculateTotal().total;
      const payload = {
        client_id: parseInt(form.client_id),
        project_name: form.project_name,
        value: total,
        date_created: form.date_created,
        description: form.description || null,
        items: form.items,
        validity_period: form.validity_period,
        time_period: form.time_period || null,
        term_payment: form.term_payment || null,
        bank_name: form.bank_name || null,
        bank_acc_no: form.bank_acc_no || null,
        terms_conditions: form.terms_conditions || null,
        is_new_application: form.is_new_application,
      };

      const blob = await (api as any).previewSph(payload);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (e: any) {
      console.error(e);
      // alert('Gagal memuat preview SPH: ' + (e.message || 'Unknown error'));
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSaveDraft = async (submitForApproval: boolean) => {
    setSaving(true);
    try {
      if (!form.client_id || !form.project_name || !form.date_created) {
        alert('Klien, nama proyek, dan tanggal wajib diisi');
        setSaving(false);
        return;
      }
      if (form.items.length === 0) {
        alert('Minimal harus ada 1 item layanan');
        setSaving(false);
        return;
      }
      if (!form.validity_period) {
        alert('Masa berlaku penawaran wajib diisi');
        setSaving(false);
        return;
      }

      const total = calculateTotal().total;
      const payload: any = {
        client_id: parseInt(form.client_id),
        project_name: form.project_name,
        value: total,
        date_created: form.date_created,
        description: form.description || null,
        items: form.items,
        validity_period: form.validity_period,
        terms_conditions: form.terms_conditions || null,
        is_new_application: form.is_new_application,
      };
      
      const sph: any = await api.createSph(payload);
      
      if (submitForApproval && sph?.id) {
        // Status akan tetap 'Draft' dan perlu di-approve terlebih dahulu
        alert('Draft SPH berhasil dibuat. Silakan tunggu persetujuan dari approver sebelum dapat di-generate menjadi PDF.');
      } else {
        alert('Draft SPH berhasil disimpan.');
      }
      
      onFinish();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Gagal menyimpan SPH');
    } finally {
      setSaving(false);
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const selectedClient = clients.find((c: any) => c.id.toString() === clientId);
    
    setForm(prev => ({
      ...prev,
        client_id: clientId,
      pic_name: selectedClient?.contact_person || selectedClient?.pic_name || selectedClient?.picName || prev.pic_name,
      pic_position: selectedClient?.contact_role || selectedClient?.pic_position || selectedClient?.picPosition || prev.pic_position,
      project_location: '',
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Breadcrumbs */}
        <nav className="flex text-sm font-medium text-slate-400">
          <ol className="flex items-center space-x-2">
            <li><button onClick={onCancel} className="hover:text-primary transition-colors">Manage SPH</button></li>
            <li><span className="mx-1">/</span></li>
            <li className="text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest">Buat SPH Baru</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Buat SPH Baru</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-tight">Wizard pembuatan Surat Penawaran Harga.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:bg-slate-900 transition-colors shadow-sm"
            >
              Batal
            </button>
            <button 
              onClick={() => handleSaveDraft(false)}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:bg-slate-900 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Draft'}
            </button>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between relative px-2 md:px-12">
            <div className="absolute left-12 right-12 top-5 h-1 bg-slate-100 -z-0"></div>
            <div 
              className="absolute left-12 top-5 h-1 bg-primary z-0 transition-all duration-500" 
              style={{ width: `${progressWidth}%` }}
            ></div>
            
            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                <div className={`size-10 rounded-full flex items-center justify-center font-black text-sm shadow-sm ring-8 ring-white transition-all ${
                  currentStep >= step.id ? 'bg-primary text-white scale-110' : 'bg-slate-50 dark:bg-slate-900 text-slate-300 border-2 border-slate-100 dark:border-slate-700'
                }`}>
                  {currentStep > step.id ? (
                    <span className="material-symbols-outlined text-[20px]">check</span>
                  ) : (
                    step.id
                  )}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-tighter text-center w-24 ${
                  currentStep >= step.id ? 'text-primary' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-8 flex-1">
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                    <div className="size-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined fill">domain</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Informasi Klien</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih klien dan tentukan PIC untuk proyek ini.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pilih Klien <span className="text-primary">*</span></label>
                      <select 
                        name="client_id"
                        value={form.client_id}
                        onChange={handleClientChange}
                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4 appearance-none"
                        required
                      >
                        <option value="">Pilih Klien</option>
                        {clients.map((client: any) => (
                          <option key={client.id} value={client.id}>{client.company_name || client.companyName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama PIC (Person in Charge)</label>
                      <input 
                        name="pic_name"
                        value={form.pic_name}
                        onChange={handleChange}
                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4" 
                        placeholder="Ex: Bpk. Haryanto" 
                        type="text"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jabatan PIC</label>
                      <input 
                        name="pic_position"
                        value={form.pic_position}
                        onChange={handleChange}
                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4" 
                        placeholder="Ex: Direktur Operasional" 
                        type="text"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Alamat Perusahaan</label>
                      <textarea 
                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm font-medium text-slate-500 dark:text-slate-400 focus:ring-primary/20 focus:border-primary px-4 py-3" 
                        readOnly 
                        rows={3}
                        value={(clients.find((c: any) => c.id === parseInt(form.client_id)) as any)?.address || (clients.find((c: any) => c.id === parseInt(form.client_id)) as any)?.location || 'Pilih klien untuk melihat alamat'}
                      />
                      <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        Alamat terisi otomatis berdasarkan data klien.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                    <div className="size-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined fill">work</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Detail Proyek</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi umum mengenai proyek yang ditawarkan.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Proyek <span className="text-primary">*</span></label>
                      <input 
                        name="project_name"
                        value={form.project_name}
                        onChange={handleChange}
                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4" 
                        placeholder="Ex: Jasa Konsultansi Pengawasan Pembangunan Gedung..." 
                        type="text"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Lokasi Proyek</label>
                      <div className="relative">
                        <input 
                          name="project_location"
                          value={form.project_location}
                          onChange={handleChange}
                          className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary pl-11 px-4" 
                          placeholder="Ex: Jakarta" 
                          type="text"
                        />
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">location_on</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nomor Referensi (Opsional)</label>
                      <input 
                        name="project_ref"
                        value={form.project_ref}
                        onChange={handleChange}
                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4" 
                        placeholder="Nomor RFQ / Tender" 
                        type="text"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Dibuat <span className="text-primary">*</span></label>
                      <input 
                        name="date_created"
                        value={form.date_created}
                        onChange={handleChange}
                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4" 
                        type="date"
                        required
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              name="is_new_application"
                              checked={form.is_new_application}
                              onChange={(e) => setForm(prev => ({ ...prev, is_new_application: e.target.checked }))}
                              className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary transition-all cursor-pointer"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Pengajuan Baru (Tanda Tangan Basah)</span>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Ceklis jika SPH tidak memerlukan persetujuan digital dan akan ditandatangani manual.</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                  <div className="size-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined fill">receipt_long</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Rincian Biaya & Lingkup</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TENTUKAN ITEM LAYANAN DAN HARGA SATUAN.</p>
                  </div>
                  <button
                    onClick={addServiceItem}
                    className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    TAMBAH ITEM
                  </button>
                </div>

                {form.items.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <span className="material-symbols-outlined text-6xl mb-4">receipt_long</span>
                    <p className="text-sm font-bold">Belum ada item layanan</p>
                    <p className="text-xs mt-2">Klik tombol "TAMBAH ITEM" untuk menambahkan layanan</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                            <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">URAIAN</th>
                            <th className="text-center py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ITEM</th>
                            <th className="text-center py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">QTY</th>
                            <th className="text-center py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PERSON</th>
                            <th className="text-right py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">HARGA SATUAN (IDR)</th>
                            <th className="text-right py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL (IDR)</th>
                            <th className="text-center py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">AKSI</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.items.map((item, index) => (
                            <tr key={index} className="border-b border-slate-100 dark:border-slate-700">
                              <td className="py-4 px-4 font-bold text-slate-600 dark:text-slate-300">{index + 1}</td>
                              <td className="py-4 px-4">
                                <input
                                  value={item.service || ''}
                                  onChange={(e) => updateServiceItem(index, 'service', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold focus:ring-primary/20 focus:border-primary"
                                  placeholder="Uraian layanan..."
                                />
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={item.unit || ''}
                                    onChange={(e) => updateServiceItem(index, 'unit', e.target.value)}
                                    className="w-28 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold focus:ring-primary/20 focus:border-primary"
                                  >
                                    <option value="">-</option>
                                    <option value="Mandays">Mandays</option>
                                    <option value="PP">PP</option>
                                    <option value="Days">Days</option>
                                    <option value="Lumpsum">Lumpsum</option>
                                    <option value="pcs">pcs</option>
                                    <option value="Pax">Pax</option>
                                    <option value="Manual">Manual</option>
                                  </select>
                                  {item.unit === 'Manual' && (
                                    <input
                                      value={item.manualUnit || ''}
                                      onChange={(e) => updateServiceItem(index, 'manualUnit', e.target.value)}
                                      className="w-28 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold focus:ring-primary/20 focus:border-primary"
                                      placeholder="Tulis item..."
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <input
                                  type="number"
                                  value={item.qty || 1}
                                  onChange={(e) => updateServiceItem(index, 'qty', e.target.value)}
                                  className="w-20 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-center focus:ring-primary/20 focus:border-primary"
                                  min="1"
                                />
                              </td>
                              <td className="py-4 px-4">
                                <input
                                  type="number"
                                  value={item.person || 1}
                                  onChange={(e) => updateServiceItem(index, 'person', e.target.value)}
                                  className="w-20 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-center focus:ring-primary/20 focus:border-primary"
                                  min="1"
                                />
                              </td>
                              <td className="py-4 px-4">
                                <input
                                  type="number"
                                  value={item.unit_price || 0}
                                  onChange={(e) => updateServiceItem(index, 'unit_price', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-right focus:ring-primary/20 focus:border-primary"
                                  min="0"
                                />
                              </td>
                              <td className="py-4 px-4 text-right font-bold text-slate-900 dark:text-white">
                                {Number(item.total || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <button
                                  onClick={() => removeServiceItem(index)}
                                  className="p-2 text-red-500 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end">
                      <div className="w-full max-w-md space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-slate-600 dark:text-slate-300">SUBTOTAL:</span>
                          <span className="font-black text-slate-900 dark:text-white">IDR {calculateTotal().subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-lg pt-3 border-t border-slate-200 dark:border-slate-700">
                          <span className="font-black text-slate-900 dark:text-white">TOTAL AKHIR:</span>
                          <span className="font-black text-primary">IDR {calculateTotal().total.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                  <div className="size-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined fill">gavel</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Syarat & Ketentuan</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KETENTUAN HUKUM DAN MASA BERLAKU PENAWARAN.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      MASA BERLAKU PENAWARAN <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <input
                        name="validity_period"
                        value={form.validity_period}
                        onChange={handleChange}
                        className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary pl-11 px-4"
                        placeholder="dd/mm/yyyy"
                        type="date"
                        required
                      />
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">calendar_today</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      Tanggal berakhirnya validitas harga.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      TERM & CONDITIONS
                    </label>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Durasi Waktu / Time Period</label>
                        <input
                          name="time_period"
                          value={form.time_period}
                          onChange={handleChange}
                          className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4"
                          placeholder="Contoh: 30 Hari Kerja (Tentatif)"
                          type="text"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Termin Pembayaran / Term of Payment</label>
                        <textarea
                          name="term_payment"
                          value={form.term_payment}
                          onChange={handleChange}
                          className="w-full min-h-[120px] p-4 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary/20 focus:border-primary resize-none"
                          placeholder="Contoh: Termin 1: 60% setelah BA pekerjaan; Termin 2: 40% setelah LP"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Rekening Bank / Bank Name</label>
                          <input
                            name="bank_name"
                            value={form.bank_name}
                            onChange={handleChange}
                            className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4"
                            type="text"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ACC No</label>
                          <input
                            name="bank_acc_no"
                            value={form.bank_acc_no}
                            onChange={handleChange}
                            className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4"
                            type="text"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Uraian & Ketentuan Tambahan</label>
                        <textarea
                          name="terms_conditions"
                          value={form.terms_conditions}
                          onChange={handleChange}
                          className="w-full min-h-[180px] p-4 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary/20 focus:border-primary resize-none"
                          placeholder="Tambahkan ketentuan lainnya bila diperlukan"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center space-y-3 py-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Review & Finalisasi</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Pastikan data sudah benar sebelum menyimpan draft. Draft akan dikirim ke approver untuk disetujui sebelum dapat di-generate menjadi PDF.</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Info label="Klien" value={(clients.find((c: any) => c.id === parseInt(form.client_id)) as any)?.company_name || (clients.find((c: any) => c.id === parseInt(form.client_id)) as any)?.companyName || '-'} />
                      <Info label="Nama Proyek" value={form.project_name || '-'} />
                      <Info label="Lokasi Proyek" value={form.project_location || '-'} />
                      <Info label="Tanggal Dibuat" value={form.date_created || '-'} />
                      <Info label="PIC" value={form.pic_name || '-'} />
                      <Info label="Jabatan PIC" value={form.pic_position || '-'} />
                    </div>
                    
                    {form.items.length > 0 && (
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 uppercase tracking-widest">Rincian Biaya</h4>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900">
                              <tr>
                                <th className="text-left py-2 px-4 text-[10px] font-black text-slate-400 uppercase">Item</th>
                                <th className="text-left py-2 px-4 text-[10px] font-black text-slate-400 uppercase">Uraian</th>
                                <th className="text-center py-2 px-4 text-[10px] font-black text-slate-400 uppercase">Qty</th>
                                <th className="text-center py-2 px-4 text-[10px] font-black text-slate-400 uppercase">Person</th>
                                <th className="text-right py-2 px-4 text-[10px] font-black text-slate-400 uppercase">Harga</th>
                                <th className="text-right py-2 px-4 text-[10px] font-black text-slate-400 uppercase">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {form.items.map((item, index) => (
                                <tr key={index} className="border-t border-slate-100 dark:border-slate-700">
                                  <td className="py-2 px-4 font-medium">{item.manualUnit || item.unit || '-'}</td>
                                  <td className="py-2 px-4">{item.service || '-'}</td>
                                  <td className="py-2 px-4 text-center">{item.qty}</td>
                                  <td className="py-2 px-4 text-center">{item.person || 1}</td>
                                  <td className="py-2 px-4 text-right">{Number(item.unit_price || 0).toLocaleString('id-ID')}</td>
                                  <td className="py-2 px-4 text-right font-bold">{Number(item.total || 0).toLocaleString('id-ID')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="bg-slate-50 dark:bg-slate-900 p-4 flex justify-end">
                            <div className="text-right space-y-1">
                              <div className="text-sm"><span className="font-bold">Total: </span><span className="font-black text-primary">IDR {calculateTotal().total.toLocaleString('id-ID')}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {form.validity_period && (
                      <Info label="Masa Berlaku" value={form.validity_period} />
                    )}

                    {form.terms_conditions && (
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">Syarat & Ketentuan</h4>
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm whitespace-pre-wrap">{form.terms_conditions}</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Preview Surat</h4>
                      <button 
                        onClick={handlePreview}
                        disabled={loadingPreview}
                        className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline"
                      >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        Refresh Preview
                      </button>
                    </div>
                    <div className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-100 h-[600px] relative">
                      {loadingPreview ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-800/80 z-10">
                          <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membuat Preview...</p>
                        </div>
                      ) : previewUrl ? (
                        <iframe 
                          src={previewUrl} 
                          className="w-full h-full border-none"
                          title="SPH Preview"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                          <span className="material-symbols-outlined text-4xl mb-4">description</span>
                          <p className="text-sm font-bold">Gagal memuat preview</p>
                          <p className="text-xs mt-2">Klik refresh untuk mencoba lagi</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="bg-slate-50 dark:bg-slate-900 p-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center mt-auto">
            <button 
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                currentStep === 1 
                  ? 'text-slate-300 border border-slate-200 dark:border-slate-700 cursor-not-allowed' 
                  : 'text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Kembali
            </button>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                Step {currentStep} of {totalSteps}
              </span>
              {currentStep === totalSteps ? (
                <button 
                  onClick={() => handleSaveDraft(true)}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all group disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Draft & Kirim ke Approver'}
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">send</span>
                </button>
              ) : (
                <button 
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all group"
                >
                  {`Lanjut: ${steps[currentStep]?.label || 'Selesai'}`}
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSphWizard;