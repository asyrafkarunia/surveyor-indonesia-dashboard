import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface EssentialDocument {
  id: number;
  title: string;
  description?: string | null;
  file_name: string;
  file_path: string;
  file_size?: number | null;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  uploader?: {
    id: number;
    name: string;
    email: string;
  };
}

const BerkasDokumenScreen: React.FC = () => {
  const { user, isMarketing } = useAuth();
  const [documents, setDocuments] = useState<EssentialDocument[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewDoc, setPreviewDoc] = useState<EssentialDocument | null>(null);



  const isAdmin = isMarketing();

  const loadDocuments = async (keyword?: string) => {
    setLoading(true);
    try {
      const response: any = await api.getEssentialDocuments(keyword ? { search: keyword } : undefined);
      // API returns paginated object { data: [...], ... } — extract the array
      const docs = Array.isArray(response) ? response : (response?.data || []);
      setDocuments(docs as EssentialDocument[]);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat berkas dokumen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !title.trim()) {
      setError('Judul dan file PDF wajib diisi.');
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Hanya file PDF yang diperbolehkan.');
      return;
    }

    setUploading(true);
    try {
      const doc = await api.uploadEssentialDocument(title.trim(), file, description.trim() || undefined);
      setDocuments((prev) => [doc as EssentialDocument, ...prev]);
      setTitle('');
      setDescription('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Gagal mengunggah dokumen.');
    } finally {
      setUploading(false);
    }
  };

  const getFileUrl = (path: string) => {
    const base = (((import.meta as any).env.VITE_API_URL) || 'http://localhost:8000/api').replace(/\/api$/, '');
    return `${base}/storage/${path}`;
  };

  const handleDownload = async (id: number, fileName: string) => {
    try {
      const blob = await api.downloadEssentialDocument(String(id));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || 'Gagal mendownload dokumen.');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Hapus dokumen ini secara permanen?');
    if (!confirmed) return;
    try {
      await api.deleteEssentialDocument(String(id));
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Gagal menghapus dokumen.');
    }
  };

  const formatSize = (size?: number | null) => {
    if (!size || size <= 0) return '-';
    const mb = size / (1024 * 1024);
    if (mb < 1) {
      const kb = size / 1024;
      return `${kb.toFixed(1)} KB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loadDocuments(search.trim() || undefined);
  };

  if (!isAdmin) {
    return (
      <main className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          Halaman ini hanya dapat diakses oleh Administrator Marketing.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-900 custom-scrollbar">
      <div className="w-full px-6 md:px-10 lg:px-16 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Berkas Dokumen</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Kumpulan dokumen PDF essensial yang siap diunduh oleh Administrator.
            </p>
          </div>
          <div className="hidden"></div>
        </header>

        <section id="upload-form" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">picture_as_pdf</span>
            Tambah Dokumen Baru
          </h3>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Judul Dokumen
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                  placeholder="Contoh: Pedoman Mutu 2025"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Keterangan
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                  placeholder="Opsional"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  File PDF
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null) }
                  className="text-xs w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-white text-xs font-black uppercase tracking-[0.16em] shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
              >
                {uploading ? 'Mengunggah...' : 'Simpan Dokumen'}
              </button>
            </div>
          </form>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        </section>

        <section id="doc-list" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Daftar Dokumen</h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input
                  id="doc-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      loadDocuments(search.trim() || undefined);
                    }
                  }}
                  className="pl-9 pr-3 py-2 w-full sm:w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                  placeholder="Cari... (Enter)"
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 shrink-0">{documents.length} item</span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-50 dark:bg-slate-900/50 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              Belum ada dokumen yang disimpan.
            </div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Judul</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Ukuran</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</th>
                      <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">{doc.title}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{doc.description || '-'}</div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">{formatSize(doc.file_size || null)}</td>
                        <td className="px-4 py-4 text-xs text-slate-500">{formatDate(doc.created_at)}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setPreviewDoc(doc)} className="p-2 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
                            <button onClick={() => handleDownload(doc.id, doc.file_name)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><span className="material-symbols-outlined text-[20px]">download</span></button>
                            <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="md:hidden space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{doc.title}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-1">{doc.description || '-'}</div>
                      </div>
                      <div className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">
                        {formatSize(doc.file_size || null)}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mb-4">{formatDate(doc.created_at)}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setPreviewDoc(doc)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        Lihat
                      </button>
                      <button onClick={() => handleDownload(doc.id, doc.file_name)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-emerald-600">
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Simpan
                      </button>
                      <button onClick={() => handleDelete(doc.id)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-[10px] font-bold text-red-600">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {previewDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header bar - sits above the PDF iframe so it never overlaps PDF controls */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-red-500 text-[18px]">picture_as_pdf</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{previewDoc.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold truncate">{previewDoc.file_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={getFileUrl(previewDoc.file_path)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all text-xs font-bold"
                    title="Buka di Tab Baru"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    <span className="hidden sm:inline">Buka di Tab Baru</span>
                  </a>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="flex items-center justify-center size-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                    title="Tutup Preview"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              </div>
              {/* PDF iframe takes up remaining space */}
              <iframe
                src={getFileUrl(previewDoc.file_path)}
                className="w-full flex-1 border-none"
                title={previewDoc.title}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default BerkasDokumenScreen;