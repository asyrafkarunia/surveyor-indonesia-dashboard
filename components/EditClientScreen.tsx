import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { ClientData } from '../types';
import BackButton from './BackButton';

interface EditClientScreenProps {
  client: ClientData;
  onBack: () => void;
  onSave: (updatedClient: ClientData) => void;
}

const EditClientScreen: React.FC<EditClientScreenProps> = ({ client, onBack, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: client.company_name,
    type: client.type,
    industry: client.industry || '',
    contact_person: client.contact_person,
    contact_role: client.contact_role || '',
    email: client.email,
    phone: client.phone,
    address: client.address || '',
    location: client.location || '',
    status: client.status,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(client.logo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data
      // Note: Since we might have a file, we should use FormData
      // However, api.updateClient currently expects JSON.
      // We will need to update api.updateClient to handle FormData or send Base64?
      // For now, let's assume we update api.ts to handle FormData if passed, 
      // OR we use the POST _method=PUT trick.

      const data = new FormData();
      data.append('_method', 'PUT'); // Laravel trick for PUT with files
      data.append('company_name', formData.company_name);
      data.append('type', formData.type);
      if (formData.industry) data.append('industry', formData.industry);
      data.append('contact_person', formData.contact_person);
      if (formData.contact_role) data.append('contact_role', formData.contact_role);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      if (formData.address) data.append('address', formData.address);
      if (formData.location) data.append('location', formData.location);
      data.append('status', formData.status);
      
      if (logoFile) {
        data.append('logo', logoFile);
      }

      // We need a special call for this because standard updateClient uses JSON
      const response = await api.updateClientWithLogo(client.id, data);
      onSave(response.data || response);
    } catch (error) {
      console.error('Failed to update client:', error);
      alert('Gagal menyimpan perubahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50 dark:bg-slate-900">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end mb-4">
          <BackButton onClick={onBack} />
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Edit Profil Klien</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Perbarui informasi dan logo perusahaan.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Logo Upload */}
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
                className="text-sm font-bold text-primary hover:text-primary-dark"
              >
                Upload Logo Perusahaan
              </button>
              <p className="text-xs text-slate-400 mt-1">Maksimal 1MB. Format JPG, PNG.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Perusahaan <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipe Instansi <span className="text-red-500">*</span></label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                >
                  <option value="BUMN">BUMN</option>
                  <option value="Swasta">Swasta</option>
                  <option value="Pemerintah">Pemerintah</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Industri</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">Informasi Kontak</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Kontak <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jabatan</label>
                  <input
                    type="text"
                    name="contact_role"
                    value={formData.contact_role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Telepon <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">Lokasi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lokasi (Kota/Provinsi)</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alamat Lengkap</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:bg-slate-900 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30 flex items-center gap-2"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditClientScreen;