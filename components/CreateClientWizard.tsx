
import React, { useState } from 'react';
import { api } from '../services/api';
import BackButton from './BackButton';

interface CreateClientWizardProps {
  onCancel: () => void;
  onFinish: () => void;
}

interface FormData {
  company_name: string;
  type: 'BUMN' | 'Swasta' | 'Pemerintah';
  industry: string;
  contact_person: string;
  contact_role: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  notes: string;
}

const CreateClientWizard: React.FC<CreateClientWizardProps> = ({ onCancel, onFinish }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const totalSteps = 5;

  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    type: 'Swasta',
    industry: '',
    contact_person: '',
    contact_role: '',
    email: '',
    phone: '',
    address: '',
    location: '',
    notes: '',
  });

  const steps = [
    { id: 1, label: 'Info Dasar', icon: 'domain' },
    { id: 2, label: 'Kontak', icon: 'person' },
    { id: 3, label: 'Alamat', icon: 'location_on' },
    { id: 4, label: 'Catatan', icon: 'note_add' },
    { id: 5, label: 'Pratinjau & Konfirmasi', icon: 'fact_check' },
  ];

  const INDUSTRY_SECTORS = [
    'Minyak & Gas',
    'Pertambangan & Mineral',
    'Pembangkitan Listrik (Power)',
    'Infrastruktur & Konstruksi',
    'Manufaktur & Industri',
    'Transportasi & Logistik',
    'Pemerintahan & Sektor Publik',
    'Telekomunikasi & Media',
    'Perbankan & Keuangan',
    'Kesehatan & Farmasi',
    'Pertanian & Perkebunan',
    'Lainnya'
  ];

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate size (1MB)
      if (file.size > 1024 * 1024) {
        alert('Ukuran file maksimal 1MB');
        e.target.value = '';
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSave();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const goToStep = (stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.company_name.trim()) {
      alert('Nama perusahaan harus diisi');
      setCurrentStep(1);
      return;
    }
    if (!formData.contact_person.trim()) {
      alert('Nama kontak person harus diisi');
      setCurrentStep(2);
      return;
    }
    if (!formData.email.trim()) {
      alert('Email harus diisi');
      setCurrentStep(2);
      return;
    }
    if (!formData.phone.trim()) {
      alert('Nomor telepon harus diisi');
      setCurrentStep(2);
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('company_name', formData.company_name);
      data.append('type', formData.type);
      if (formData.industry) data.append('industry', formData.industry);
      data.append('contact_person', formData.contact_person);
      if (formData.contact_role) data.append('contact_role', formData.contact_role);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      if (formData.address) data.append('address', formData.address);
      if (formData.location) data.append('location', formData.location);
      
      if (logoFile) {
        data.append('logo', logoFile);
      }

      await api.createClientWithLogo(data);
      onFinish();
    } catch (error: any) {
      console.error('Error creating client:', error);
      alert(error.message || 'Gagal menyimpan klien. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const progressWidth = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="flex justify-end">
          <BackButton onClick={onCancel} />
        </div>

        {/* Stepper Indicator */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="relative flex items-center justify-between px-2 md:px-10">
            {/* Progress Track */}
            <div className="absolute left-10 right-10 top-5 h-1 bg-slate-100 -z-0 rounded-full"></div>
            <div 
              className="absolute left-10 top-5 h-1 bg-primary z-0 transition-all duration-500 rounded-full" 
              style={{ width: `${progressWidth}%` }}
            ></div>

            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-3 w-20">
                <button 
                  onClick={() => goToStep(step.id)}
                  disabled={step.id >= currentStep}
                  className={`size-10 rounded-full flex items-center justify-center font-black text-sm shadow-sm ring-8 ring-white transition-all duration-300 ${
                    currentStep >= step.id ? 'bg-primary text-white scale-110' : 'bg-white dark:bg-slate-800 text-slate-300 border-2 border-slate-100 dark:border-slate-700'
                  }`}
                >
                  {currentStep > step.id ? (
                    <span className="material-symbols-outlined text-[20px]">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                  )}
                </button>
                <span className={`text-[10px] font-black uppercase tracking-tighter text-center leading-tight hidden sm:block ${
                  currentStep >= step.id ? 'text-primary' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-8 md:p-10 flex-1">
            
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                  <div className="size-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined fill">domain</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Informasi Dasar Perusahaan</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas legal dan profil industri klien.</p>
                  </div>
                </div>

                {/* Logo Upload Section */}
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden mb-4 shadow-sm relative group">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-slate-300">domain</span>
                    )}
                    <div 
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="material-symbols-outlined text-white">edit</span>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-black text-primary hover:text-primary-dark uppercase tracking-widest"
                  >
                    Upload Logo Perusahaan
                  </button>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Maksimal 1MB. Format JPG, PNG.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Nama Perusahaan <span className="text-primary">*</span>
                    </label>
                    <input 
                      className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary transition-all px-4" 
                      placeholder="Contoh: PT Sumber Daya Energi Tbk" 
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => updateFormData('company_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Tipe Entitas <span className="text-primary">*</span>
                    </label>
                    <select 
                      className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary cursor-pointer px-4"
                      value={formData.type}
                      onChange={(e) => updateFormData('type', e.target.value as 'BUMN' | 'Swasta' | 'Pemerintah')}
                      required
                    >
                      <option value="Swasta">Swasta</option>
                      <option value="BUMN">BUMN</option>
                      <option value="Pemerintah">Pemerintah</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sektor Industri</label>
                    <select 
                      className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary cursor-pointer px-4"
                      value={formData.industry}
                      onChange={(e) => updateFormData('industry', e.target.value)}
                    >
                      <option value="" disabled>Pilih Sektor Industri</option>
                      {INDUSTRY_SECTORS.map((sector) => (
                        <option key={sector} value={sector}>{sector}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                  <div className="size-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined fill">person</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Detail Kontak Utama (PIC)</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orang yang dapat dihubungi untuk operasional.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Nama Lengkap PIC <span className="text-primary">*</span>
                    </label>
                    <input 
                      className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4" 
                      placeholder="Contoh: Budi Santoso" 
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => updateFormData('contact_person', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jabatan PIC</label>
                    <input 
                      className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4" 
                      placeholder="Contoh: Direktur Operasional" 
                      type="text"
                      value={formData.contact_role}
                      onChange={(e) => updateFormData('contact_role', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Email PIC <span className="text-primary">*</span>
                    </label>
                    <input 
                      className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4" 
                      placeholder="email@perusahaan.com" 
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Nomor Telepon <span className="text-primary">*</span>
                    </label>
                    <input 
                      className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4" 
                      placeholder="0812-xxxx-xxxx" 
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                  <div className="size-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined fill">location_on</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Alamat Perusahaan</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi domisili kantor pusat klien.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Alamat Lengkap</label>
                    <textarea 
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary p-4" 
                      placeholder="Nama Jalan, Gedung, Lantai..." 
                      rows={3}
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kota / Kabupaten</label>
                    <input 
                      className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary px-4" 
                      placeholder="Contoh: Jakarta Selatan" 
                      type="text"
                      value={formData.location}
                      onChange={(e) => updateFormData('location', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                  <div className="size-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined fill">note_add</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Catatan Tambahan</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi internal atau instruksi khusus.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Catatan Internal</label>
                  <textarea 
                    className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-primary/20 focus:border-primary p-6 italic" 
                    placeholder="Masukkan instruksi khusus atau kriteria prioritas klien..." 
                    rows={8}
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                  />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="border-b border-slate-100 dark:border-slate-700 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Pratinjau & Konfirmasi Data</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Mohon periksa kembali kelengkapan dan kebenaran data sebelum menyimpan ke database.</p>
                  </div>
                  <div className="hidden md:block">
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-[10px] font-black text-yellow-800 ring-1 ring-inset ring-yellow-600/20 uppercase tracking-widest">
                      <span className="flex w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                      Draft
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Preview Section: Basic Info */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 group hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-6 border-b border-slate-200 dark:border-slate-700/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-primary border border-blue-100">
                          <span className="material-symbols-outlined text-[20px] fill">domain</span>
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Info Dasar Perusahaan</h3>
                      </div>
                      <button 
                        onClick={() => goToStep(1)}
                        className="px-4 py-2 text-[10px] font-black text-primary hover:bg-primary hover:text-white rounded-xl transition-all flex items-center gap-2 border border-primary/20 uppercase tracking-widest"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                      <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Nama Perusahaan</p>
                        <p className="font-black text-slate-900 dark:text-white text-base">{formData.company_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Sektor Industri</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{formData.industry || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Tipe Badan Usaha</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{formData.type}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Status Klien</p>
                        <p className="font-black text-emerald-600 flex items-center gap-2 text-sm uppercase">
                          <span className="material-symbols-outlined text-[18px] fill">verified</span> Active Prospect
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview Section: Contact Info */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 group hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-6 border-b border-slate-200 dark:border-slate-700/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-primary border border-blue-100">
                          <span className="material-symbols-outlined text-[20px] fill">person</span>
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Detail Kontak Utama</h3>
                      </div>
                      <button 
                        onClick={() => goToStep(2)}
                        className="px-4 py-2 text-[10px] font-black text-primary hover:bg-primary hover:text-white rounded-xl transition-all flex items-center gap-2 border border-primary/20 uppercase tracking-widest"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                      <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Nama Lengkap</p>
                        <p className="font-black text-slate-900 dark:text-white">{formData.contact_person || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Jabatan</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{formData.contact_role || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Email</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{formData.email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Nomor Telepon</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{formData.phone || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Preview Section: Address */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 group hover:border-primary/30 transition-all h-full">
                      <div className="flex justify-between items-start mb-6 border-b border-slate-200 dark:border-slate-700/60 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-50 text-primary border border-blue-100">
                            <span className="material-symbols-outlined text-[20px] fill">location_on</span>
                          </div>
                          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Alamat Perusahaan</h3>
                        </div>
                        <button 
                          onClick={() => goToStep(3)}
                          className="p-2 text-primary hover:bg-primary hover:text-white rounded-xl transition-all border border-primary/20"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Alamat Lengkap</p>
                          <p className="font-bold text-slate-900 dark:text-white">{formData.address || '-'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Kota / Kab</p>
                          <p className="font-bold text-slate-700 dark:text-slate-200">{formData.location || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Preview Section: Notes */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 group hover:border-primary/30 transition-all h-full">
                      <div className="flex justify-between items-start mb-6 border-b border-slate-200 dark:border-slate-700/60 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-50 text-primary border border-blue-100">
                            <span className="material-symbols-outlined text-[20px] fill">note_add</span>
                          </div>
                          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Catatan Tambahan</h3>
                        </div>
                        <button 
                          onClick={() => goToStep(4)}
                          className="p-2 text-primary hover:bg-primary hover:text-white rounded-xl transition-all border border-primary/20"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Catatan Internal</p>
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-4">
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                            {formData.notes || 'Tidak ada catatan'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="bg-slate-50 dark:bg-slate-900 p-6 md:px-10 md:py-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center z-20 sticky bottom-0">
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
              Sebelumnya
            </button>
            <div className="flex items-center gap-6">
              {currentStep === totalSteps && (
                <button 
                  onClick={onCancel}
                  className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all"
                >
                  Batal
                </button>
              )}
              <div className="flex items-center gap-4">
                <span className="hidden md:inline text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                  Langkah {currentStep} dari {totalSteps}
                </span>
                <button 
                  onClick={nextStep}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[20px] fill">
                    {currentStep === totalSteps ? 'check_circle' : 'arrow_forward'}
                  </span>
                  {saving ? 'Menyimpan...' : currentStep === totalSteps ? 'Simpan Klien' : `Lanjut: ${steps[currentStep]?.label || 'Selesai'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClientWizard;
