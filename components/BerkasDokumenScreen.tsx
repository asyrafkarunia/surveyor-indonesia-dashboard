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

  useEffect(() => {
    const h = setTimeout(() => {
      loadDocuments(search.trim() || undefined);
    }, 300);
    return () => clearTimeout(h);
  }, [search]);

  const isAdmin = isMarketing();

  const loadDocuments = async (keyword?: string) => {
    setLoading(true);
    try {
      const data = await api.getEssentialDocuments(keyword ? { search: keyword } : undefined);
      setDocuments(data as EssentialDocument[]);
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
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Berkas Dokumen</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Kumpulan dokumen PDF essensial yang siap diunduh oleh Administrator.
            </p>
          </div>
          <div className="hidden"></div>
        </header>

        <section id="upload-form" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">picture_as_pdf</span>
            Tambah Dokumen Baru
          </h3>
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
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
            <div className="md:col-span-1">
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
            <div className="md:col-span-1 flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                File PDF
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null) }
                className="text-xs"
              />
              <button
                type="submit"
                disabled={uploading}
                className="mt-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-xs font-black uppercase tracking-[0.16em] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Mengunggah...' : 'Simpan Dokumen'}
              </button>
            </div>
          </form>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        </section>

        <section id="doc-list" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Daftar Dokumen</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input
                  id="doc-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary w-64"
                  placeholder="Cari dokumen..."
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{documents.length} item</span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex-1"></div>
                  <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex-1 px-4 hidden md:block"></div>
                  <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg w-20"></div>
                  <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg w-40"></div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              Belum ada dokumen yang disimpan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Judul
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Keterangan
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Ukuran
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Diunggah Oleh
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:bg-slate-900">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {doc.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                        {doc.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                        {formatSize(doc.file_size || null)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                        {doc.uploader?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            Preview
                          </button>
                          <button
                            onClick={() => handleDownload(doc.id, doc.file_name)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-[0.14em] text-primary hover:bg-red-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">download</span>
                            Download
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-100 text-[10px] font-black uppercase tracking-[0.14em] text-red-600 hover:bg-red-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {previewDoc && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 w-[90%] h-[80%] rounded-2xl shadow-xl overflow-hidden relative">
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  title="Tutup Preview"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
                <a
                  href={getFileUrl(previewDoc.file_path)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  title="Buka di Tab"
                >
                  <span className="material-symbols-outlined">open_in_new</span>
                </a>
              </div>
              <iframe
                src={getFileUrl(previewDoc.file_path)}
                className="w-full h-full border-none"
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