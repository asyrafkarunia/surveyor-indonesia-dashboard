
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface AudiensiTemplateManagementScreenProps {
  onAddTemplate: () => void;
  onBack: () => void;
}

const AudiensiTemplateManagementScreen: React.FC<AudiensiTemplateManagementScreenProps> = ({ onAddTemplate, onBack }) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res: any = await api.getAudiensiTemplates();
      const data = res.data || res;
      setTemplates(Array.isArray(data) ? data : []);
      if (res.meta) {
        setCurrentPage(res.meta.current_page || 1);
        setTotalPages(res.meta.last_page || 1);
        setTotal(res.meta.total || 0);
      }
    } catch (e) {
      console.error(e);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return;
    try {
      await api.deleteAudiensiTemplate(id);
      fetchTemplates();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Gagal menghapus template');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-6 pb-20">
          
          {/* Breadcrumbs */}
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <button 
              onClick={onBack}
              className="text-gray-500 hover:text-primary transition-colors font-medium"
            >
              Dashboard
            </button>
            <span className="text-gray-400 font-medium">/</span>
            <button 
              onClick={onBack}
              className="text-gray-500 hover:text-primary transition-colors font-medium"
            >
              Surat Audiensi
            </button>
            <span className="text-gray-400 font-medium">/</span>
            <span className="text-primary font-semibold">Kelola Template</span>
          </div>

          {/* Page Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-gray-900 text-3xl font-bold tracking-tight">Kelola Template Surat Audiensi</h1>
              <p className="text-gray-500 text-base">Atur dan kelola template surat untuk berbagai sektor bisnis.</p>
            </div>
            <button 
              onClick={onAddTemplate}
              className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-sm transition-all hover:shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
              <span className="truncate">Tambah Template Baru</span>
            </button>
          </div>

          {/* Toolbar: Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Cari template berdasarkan nama..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          {/* Template Table */}
          <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Template</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sektor / Bisnis</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Dibuat</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 text-right uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {loading ? (
                    <tr><td className="px-6 py-4 text-center text-gray-400" colSpan={5}>Memuat template...</td></tr>
                  ) : templates.length === 0 ? (
                    <tr><td className="px-6 py-4 text-center text-gray-400" colSpan={5}>Belum ada template</td></tr>
                  ) : (
                    templates.map((tpl) => (
                      <tr key={tpl.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>description</span>
                            </div>
                            <div className="flex flex-col">
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{tpl.name}</p>
                              <p className="text-xs text-gray-500">Versi {tpl.version} • {tpl.format}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-600 ring-gray-500/10">
                            {tpl.sector}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {tpl.created_at ? new Date(tpl.created_at).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${tpl.status === 'Aktif' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-sm text-gray-600">{tpl.status || 'Aktif'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Preview">
                              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                            </button>
                            <button className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Hapus" onClick={() => handleDeleteTemplate(tpl.id)}>
                              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Menampilkan <span className="font-medium">{templates.length > 0 ? ((currentPage - 1) * 10 + 1) : 0}</span> sampai <span className="font-medium">{Math.min(currentPage * 10, total)}</span> dari <span className="font-medium">{total}</span> hasil
                  </p>
                </div>
                <div>
                  <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                    <button 
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageClick(pageNum)}
                          aria-current={currentPage === pageNum ? 'page' : undefined}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                            currentPage === pageNum
                              ? 'z-10 bg-primary text-white focus-visible:outline-primary'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button 
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
          
          <footer className="mt-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">© 2024 PT Surveyor Indonesia. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </main>
  );
};

export default AudiensiTemplateManagementScreen;
