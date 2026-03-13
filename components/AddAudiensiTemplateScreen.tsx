
import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

interface AddAudiensiTemplateScreenProps {
  onBack: () => void;
  onSave: () => void;
}

const AddAudiensiTemplateScreen: React.FC<AddAudiensiTemplateScreenProps> = ({ onBack, onSave }) => {
  const [form, setForm] = useState({
    name: '',
    sector: '',
    subject: '',
    content: '',
    status: 'Aktif',
  });
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    // Set default content
    const defaultContent = `Kepada Yth,<br/>
<strong>{{NamaPimpinan}}</strong><br/>
{{Jabatan}}<br/>
{{NamaPerusahaan}}<br/>
di Tempat<br/><br/>
Dengan hormat,<br/><br/>
Sehubungan dengan program pengembangan bisnis strategis yang sedang kami jalankan, kami dari <strong>PT Surveyor Indonesia</strong> bermaksud mengajukan permohonan audiensi untuk mendiskusikan potensi kerjasama di bidang {{SektorBisnis}}.<br/><br/>
Adapun waktu yang kami usulkan adalah sebagai berikut:<br/>
<ul>
<li>Hari/Tanggal: {{TanggalUsulan}}</li>
<li>Waktu: {{WaktuUsulan}}</li>
<li>Tempat: {{Lokasi}}</li>
</ul>
<br/>
Demikian permohonan ini kami sampaikan. Atas perhatian dan kesempatan yang diberikan, kami ucapkan terima kasih.<br/><br/>
Hormat kami,<br/><br/>
<strong>{{NamaPengirim}}</strong><br/>
PT Surveyor Indonesia`;
    
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = defaultContent;
      setForm(prev => ({ ...prev, content: defaultContent }));
      updatePreview(defaultContent);
    }
  }, []);

  const updatePreview = (content: string) => {
    // Replace variables with sample data
    const sample = content
      .replace(/\{\{NamaPimpinan\}\}/g, 'Bpk. Hartono')
      .replace(/\{\{Jabatan\}\}/g, 'Direktur Operasional')
      .replace(/\{\{NamaPerusahaan\}\}/g, 'PT Contoh Jaya')
      .replace(/\{\{SektorBisnis\}\}/g, 'Minyak & Gas')
      .replace(/\{\{TanggalUsulan\}\}/g, '1 Januari 2026')
      .replace(/\{\{WaktuUsulan\}\}/g, '10:00 WIB')
      .replace(/\{\{Lokasi\}\}/g, 'Kantor Pusat PT Surveyor Indonesia')
      .replace(/\{\{NamaPengirim\}\}/g, 'Rizky Pratama');
    setPreviewContent(sample);
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setForm(prev => ({ ...prev, content }));
      updatePreview(content);
    }
  };

  const insertVariable = (variable: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(`{{${variable}}}`);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.innerHTML += `{{${variable}}}`;
      }
      handleEditorChange();
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleEditorChange();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sector || !form.subject || !form.content) {
      alert('Nama template, sektor, subjek, dan isi surat wajib diisi');
      return;
    }

    setSaving(true);
    try {
      await api.createAudiensiTemplate({
        name: form.name,
        sector: form.sector,
        subject: form.subject,
        template_content: form.content,
        status: form.status,
        version: '1.0',
        format: 'HTML',
      });
      onSave();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Gagal menyimpan template');
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-8 flex flex-col">
        
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
          <button 
            onClick={onBack}
            className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1 font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Dashboard
          </button>
          <span className="text-slate-300 material-symbols-outlined text-[16px]">chevron_right</span>
          <button 
            onClick={onBack}
            className="text-slate-400 hover:text-primary transition-colors font-medium"
          >
            Template Surat
          </button>
          <span className="text-slate-300 material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-slate-900 dark:text-white font-bold">Tambah Baru</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Tambah Template Surat Audiensi</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl font-medium">Buat template surat standar dengan variabel dinamis. Pratinjau otomatis tersedia di panel kanan.</p>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <form className="h-full flex flex-col" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full">
              
              {/* Left Column: Form Editor */}
              <div className="lg:col-span-7 flex flex-col gap-8">
                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex flex-col gap-2">
                      <span className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest">Nama Template <span className="text-primary">*</span></span>
                      <input 
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 placeholder:text-slate-300 text-slate-900 dark:text-white font-bold transition-all" 
                        placeholder="Contoh: Surat Perkenalan Digital" 
                        required 
                        type="text"
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest">Sektor Bisnis / Unit Kerja <span className="text-primary">*</span></span>
                      <div className="relative">
                        <select 
                          value={form.sector}
                          onChange={(e) => setForm(prev => ({ ...prev, sector: e.target.value }))}
                          className="w-full appearance-none rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 pr-10 text-slate-900 dark:text-white font-bold cursor-pointer transition-all outline-none"
                        >
                          <option disabled value="">Pilih Sektor Terkait</option>
                          <option value="Sektor Migas">Minyak & Gas</option>
                          <option value="Sektor Minerba">Mineral & Batubara</option>
                          <option value="Sektor Infrastruktur">Infrastruktur</option>
                          <option value="Sektor Lingkungan">Lingkungan Hidup</option>
                          <option value="Umum">Umum</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                      </div>
                    </label>
                  </div>
                  <label className="flex flex-col gap-2">
                    <span className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest">Subjek Default <span className="text-primary">*</span></span>
                    <input 
                      value={form.subject}
                      onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 placeholder:text-slate-300 text-slate-900 dark:text-white font-bold transition-all" 
                      placeholder="Contoh: Permohonan Audiensi - PT Surveyor Indonesia" 
                      required 
                      type="text"
                    />
                  </label>
                </div>

                <hr className="border-slate-100 dark:border-slate-700" />

                {/* Editor Area */}
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest">Isi Surat / Badan Email <span className="text-primary">*</span></span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Variabel Cepat:</span>
                      <button onClick={() => insertVariable('NamaPimpinan')} className="text-[10px] font-black uppercase bg-slate-100 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg hover:border-primary hover:text-primary transition-colors" type="button">{"{{NamaPimpinan}}"}</button>
                      <button onClick={() => insertVariable('Tanggal')} className="text-[10px] font-black uppercase bg-slate-100 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg hover:border-primary hover:text-primary transition-colors" type="button">{"{{Tanggal}}"}</button>
                      <button onClick={() => insertVariable('Jabatan')} className="text-[10px] font-black uppercase bg-slate-100 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg hover:border-primary hover:text-primary transition-colors" type="button">{"{{Jabatan}}"}</button>
                      <button onClick={() => insertVariable('NamaPerusahaan')} className="text-[10px] font-black uppercase bg-slate-100 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg hover:border-primary hover:text-primary transition-colors" type="button">{"{{NamaPerusahaan}}"}</button>
                      <button onClick={() => insertVariable('SektorBisnis')} className="text-[10px] font-black uppercase bg-slate-100 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg hover:border-primary hover:text-primary transition-colors" type="button">{"{{SektorBisnis}}"}</button>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col min-h-[500px] shadow-sm focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    {/* Toolbar */}
                    <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10">
                      <div className="flex items-center border-r border-slate-300 dark:border-slate-600 pr-2 mr-1 gap-1">
                        <button onClick={() => execCommand('bold')} className="p-2 rounded-lg hover:bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary transition-all" title="Bold" type="button">
                          <span className="material-symbols-outlined text-[20px] font-bold">format_bold</span>
                        </button>
                        <button onClick={() => execCommand('italic')} className="p-2 rounded-lg hover:bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary transition-all" title="Italic" type="button">
                          <span className="material-symbols-outlined text-[20px]">format_italic</span>
                        </button>
                        <button onClick={() => execCommand('underline')} className="p-2 rounded-lg hover:bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary transition-all" title="Underline" type="button">
                          <span className="material-symbols-outlined text-[20px]">format_underlined</span>
                        </button>
                      </div>
                      <div className="flex items-center border-r border-slate-300 dark:border-slate-600 pr-2 mr-1 gap-1">
                        <button onClick={() => execCommand('justifyLeft')} className="p-2 rounded-lg hover:bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary transition-all" title="Align Left" type="button">
                          <span className="material-symbols-outlined text-[20px]">format_align_left</span>
                        </button>
                        <button onClick={() => execCommand('justifyCenter')} className="p-2 rounded-lg hover:bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary transition-all" title="Align Center" type="button">
                          <span className="material-symbols-outlined text-[20px]">format_align_center</span>
                        </button>
                      </div>
                      <button onClick={() => execCommand('insertUnorderedList')} className="p-2 rounded-lg hover:bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary transition-all" title="Bullet List" type="button">
                        <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                      </button>
                      <div className="ml-auto">
                        <button onClick={() => {
                          const vars = ['NamaPimpinan', 'Jabatan', 'NamaPerusahaan', 'SektorBisnis', 'TanggalUsulan', 'WaktuUsulan', 'Lokasi', 'NamaPengirim'];
                          const selected = prompt(`Pilih variabel:\n${vars.map((v, i) => `${i + 1}. ${v}`).join('\n')}`);
                          if (selected && vars[parseInt(selected) - 1]) {
                            insertVariable(vars[parseInt(selected) - 1]);
                          }
                        }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary text-[10px] font-black uppercase tracking-widest transition-all hover:text-white" type="button">
                          <span className="material-symbols-outlined text-[18px]">data_object</span>
                          <span className="hidden sm:inline">Sisipkan Variabel</span>
                        </button>
                      </div>
                    </div>

                    {/* Content Input Area */}
                    <div 
                      ref={editorRef}
                      onInput={handleEditorChange}
                      className="bg-white dark:bg-slate-800 flex-1 p-8 overflow-y-auto custom-scrollbar relative font-medium text-slate-700 dark:text-slate-200 leading-relaxed" 
                      contentEditable="true"
                      style={{ minHeight: '500px' }}
                    />
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <button 
                    onClick={onBack}
                    className="px-8 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:bg-slate-900 transition-all shadow-sm" 
                    type="button"
                  >
                    Batal
                  </button>
                  <button 
                    disabled={saving}
                    className="px-10 py-3 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50" 
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    {saving ? 'Menyimpan...' : 'Simpan Template'}
                  </button>
                </div>
              </div>

              {/* Right Column: Live Preview */}
              <div className="lg:col-span-5 hidden lg:flex flex-col gap-4 relative">
                <div className="sticky top-6 flex flex-col gap-4">
                  <div className="flex justify-between items-end pb-3 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[24px]">preview</span>
                        Pratinjau Dokumen
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Estimasi tampilan dengan data sampel.</p>
                    </div>
                    <div className="bg-blue-50 text-blue-600 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-blue-100 animate-pulse">
                      Live Mode
                    </div>
                  </div>

                  {/* Paper Layout */}
                  <div className="relative group">
                    <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-sm shadow-xl border border-slate-200 dark:border-slate-700 p-10 min-h-[750px] flex flex-col relative z-10">
                      <div className="text-[10pt] leading-relaxed font-serif text-justify">
                        <div className="flex justify-between mb-10">
                          <div>
                            <p className="font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-1 italic">Sample Preview Only</p>
                          </div>
                          <div className="text-right font-sans font-bold">
                            <p>Jakarta, 1 Januari 2026</p> 
                          </div>
                        </div>

                        <div className="mb-8 font-sans">
                          <p><span className="font-black text-slate-900 dark:text-white">Hal:</span> {form.subject || 'Permohonan Audiensi - PT Surveyor Indonesia'}</p>
                        </div>

                        <div className="mb-8 space-y-1" dangerouslySetInnerHTML={{ __html: previewContent || '<p>Mulai mengetik di editor untuk melihat pratinjau...</p>' }} />
                      </div>
                      
                      {/* Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none overflow-hidden">
                        <span className="text-[12rem] font-black -rotate-45 whitespace-nowrap">PREVIEW</span>
                      </div>
                    </div>
                    {/* Layered Effect */}
                    <div className="absolute inset-0 bg-slate-200 rounded-sm translate-x-2 translate-y-2 -z-10"></div>
                    <div className="absolute inset-0 bg-slate-100 rounded-sm translate-x-4 translate-y-4 -z-20"></div>
                  </div>

                  {/* Legend */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest text-slate-400 flex gap-6 items-center justify-center shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm shadow-red-200"></div>
                      <span>Variabel Diganti</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-sm"></div>
                      <span>Teks Statis</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>

        <footer className="mt-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] pb-10">
          © 2024 PT Surveyor Indonesia. All rights reserved.
        </footer>
      </div>
    </main>
  );
};

export default AddAudiensiTemplateScreen;
