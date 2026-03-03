
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ClientData } from '../types';

interface Client {
  id: number;
  code: string;
  company_name: string;
  contact_person: string;
  contact_role?: string;
  type: 'BUMN' | 'Swasta' | 'Pemerintah';
  status: 'Aktif' | 'Non-Aktif' | 'Suspended';
  email: string;
  phone: string;
  logo?: string;
  industry?: string;
  location?: string;
  address?: string;
}

interface ClientStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  trends: {
    total: number;
    active: number;
    inactive: number;
  };
}

interface ClientsScreenProps {
  onSelectClient: (client: ClientData) => void;
  onAddClient: () => void;
}

const ClientsScreen: React.FC<ClientsScreenProps> = ({ onSelectClient, onAddClient }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Semua Tipe');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Debugging logs
  useEffect(() => {
    console.log('Stats:', stats);
    console.log('Total from pagination:', total);
    console.log('Clients length:', clients.length);
  }, [stats, total, clients]);

  const counts = {
    total: (stats?.total && stats.total > 0) ? stats.total : (total > 0 ? total : clients.length),
    active: stats?.active ?? clients.filter(c => c.status === 'Aktif').length,
    inactive: stats?.inactive ?? clients.filter(c => c.status === 'Non-Aktif').length,
    suspended: stats?.suspended ?? clients.filter(c => c.status === 'Suspended').length,
    trends: stats?.trends ?? { total: 0, active: 0, inactive: 0 },
  };

  useEffect(() => {
    fetchStats();
    fetchClients();
  }, []);

  useEffect(() => {
    fetchClients();
  }, [searchQuery, selectedType, selectedStatus, currentPage]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (selectedType && selectedType !== 'Semua Tipe') {
        params.type = selectedType;
      }

      if (selectedStatus && selectedStatus !== 'Semua Status') {
        params.status = selectedStatus;
      }

      const response = await api.getClients(params);
      const data = (response as any).data || response;
      
      console.log('getClients response:', data);

      if (Array.isArray(data)) {
        // If data is just an array (no pagination)
        setClients(data);
        setTotal(data.length);
        setTotalPages(1);
      } else {
        // Pagination response
        setClients(data.data || []);
        setTotalPages(data.last_page || 1);
        setTotal(data.total || (data.data ? data.data.length : 0));
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getClientStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const startItem = total === 0 ? 0 : (currentPage - 1) * 15 + 1;
  const endItem = Math.min(currentPage * 15, total);

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        {/* Heading Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">Daftar Klien</h1>
            <p className="text-slate-500 text-sm">Kelola data seluruh klien yang terdaftar dalam sistem PT SI.</p>
          </div>
          <button 
            onClick={onAddClient}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl shadow-sm shadow-primary/30 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Tambah Klien Baru</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Total Klien Terdaftar</p>
              <h3 className="text-2xl font-black text-slate-900">{counts.total}</h3>
              {counts && (
                <div className="flex items-center gap-1 mt-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center ${
                    counts.trends.total >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <span className={`material-symbols-outlined text-[12px] mr-1 ${
                      counts.trends.total >= 0 ? '' : 'rotate-180'
                    }`}>trending_up</span>
                    {Math.abs(counts.trends.total)}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">vs bulan lalu</span>
                </div>
              )}
            </div>
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100/50 shadow-inner">
              <span className="material-symbols-outlined">domain</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Klien Aktif</p>
              <h3 className="text-2xl font-black text-slate-900">{counts.active}</h3>
              {counts && (
                <div className="flex items-center gap-1 mt-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center ${
                    counts.trends.active >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <span className={`material-symbols-outlined text-[12px] mr-1 ${
                      counts.trends.active >= 0 ? '' : 'rotate-180'
                    }`}>trending_up</span>
                    {Math.abs(counts.trends.active)}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">vs bulan lalu</span>
                </div>
              )}
            </div>
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100/50 shadow-inner">
              <span className="material-symbols-outlined fill">check_circle</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Klien Non-Aktif</p>
              <h3 className="text-2xl font-black text-slate-900">{counts.inactive}</h3>
              {counts && (
                <div className="flex items-center gap-1 mt-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center ${
                    counts.trends.inactive >= 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <span className={`material-symbols-outlined text-[12px] mr-1 ${
                      counts.trends.inactive >= 0 ? '' : 'rotate-180'
                    }`}>trending_down</span>
                    {Math.abs(counts.trends.inactive)}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">vs bulan lalu</span>
                </div>
              )}
            </div>
            <div className="h-10 w-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center border border-slate-200/50 shadow-inner">
              <span className="material-symbols-outlined">pause_circle</span>
            </div>
          </div>
        </div>

        {/* Table & Filters Container */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="relative w-full lg:max-w-md group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary text-sm transition-all" 
                placeholder="Cari nama klien, kontak, atau perusahaan..." 
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <select 
                value={selectedType}
                onChange={handleTypeChange}
                className="bg-white border border-slate-200 text-slate-600 py-2.5 pl-3 pr-10 rounded-xl text-xs font-bold uppercase tracking-tight focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary cursor-pointer min-w-[140px] shadow-sm outline-none"
              >
                <option>Semua Tipe</option>
                <option>BUMN</option>
                <option>Swasta</option>
                <option>Pemerintah</option>
              </select>
              <select 
                value={selectedStatus}
                onChange={handleStatusChange}
                className="bg-white border border-slate-200 text-slate-600 py-2.5 pl-3 pr-10 rounded-xl text-xs font-bold uppercase tracking-tight focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary cursor-pointer min-w-[140px] shadow-sm outline-none"
              >
                <option>Semua Status</option>
                <option>Aktif</option>
                <option>Non-Aktif</option>
                <option>Suspended</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading && clients.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-400">Loading...</div>
              </div>
            ) : clients.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">domain</span>
                  <p className="text-slate-500 text-sm">Tidak ada klien ditemukan</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="px-6 py-4 font-black">Nama Perusahaan</th>
                    <th className="px-6 py-4 font-black">Kontak Person</th>
                    <th className="px-6 py-4 font-black">Tipe</th>
                    <th className="px-6 py-4 font-black">Status</th>
                    <th className="px-6 py-4 font-black">Email / Telepon</th>
                    <th className="px-6 py-4 text-right font-black">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {clients.map((client) => (
                    <tr 
                      key={client.id} 
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer" 
                      onClick={() => onSelectClient(client as ClientData)}
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {client.logo ? (
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                              <img 
                                src={client.logo} 
                                alt={client.company_name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 shadow-sm">
                              <span className="material-symbols-outlined text-slate-400">domain</span>
                            </div>
                          )}
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{client.company_name}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID: {client.code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{client.contact_person}</span>
                          {client.contact_role && (
                            <span className="text-[11px] font-medium text-slate-400">{client.contact_role}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border ${
                          client.type === 'BUMN' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          client.type === 'Pemerintah' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          'bg-orange-50 text-orange-700 border-orange-100'
                        }`}>
                          {client.type}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                          client.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          client.status === 'Suspended' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            client.status === 'Aktif' ? 'bg-emerald-500' : 
                            client.status === 'Suspended' ? 'bg-yellow-500' : 
                            'bg-slate-400'
                          }`}></span>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col text-[11px]">
                          <span className="text-slate-700 font-bold">{client.email}</span>
                          <span className="text-slate-400 font-medium">{client.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-red-50 rounded-lg transition-colors" 
                            title="Lihat Detail"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectClient(client as ClientData);
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                Menampilkan <span className="text-slate-900">{startItem}</span>-<span className="text-slate-900">{endItem}</span> dari <span className="text-slate-900">{total}</span> data
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-400 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Sebelumnya
                </button>
                <div className="hidden sm:flex items-center gap-1">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="text-slate-300 px-1 font-black">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageClick(page as number)}
                        className={`h-9 w-9 flex items-center justify-center rounded-xl text-[11px] font-black transition-all ${
                          currentPage === page
                            ? 'bg-primary text-white shadow-sm shadow-primary/20'
                            : 'text-slate-500 hover:bg-white hover:border hover:border-slate-200'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>
                <button 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ClientsScreen;
