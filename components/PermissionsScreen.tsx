
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { PermissionCategory } from '../types';
import { SystemUser } from '../types';

const PermissionsScreen: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastModified, setLastModified] = useState<string>('');

  useEffect(() => {
    // Get selected user ID from sessionStorage (set when clicking edit in user management)
    const storedUserId = sessionStorage.getItem('selectedUserId');
    if (storedUserId) {
      setSelectedUserId(storedUserId);
      sessionStorage.removeItem('selectedUserId');
    }
    
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadPermissions(selectedUserId);
    } else {
      loadPermissions();
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const response: any = await api.getUsers();
      const usersData = response.data || response;
      const usersList = Array.isArray(usersData) ? usersData : (usersData?.data || []);
      
      const mappedUsers: SystemUser[] = usersList.map((u: any) => ({
        id: u.id?.toString() || '',
        name: u.name || '',
        email: u.email || '',
        role: (u.role || 'common') as any,
        roleName: u.role === 'marketing' ? 'Marketing Staff' : u.role === 'approver' ? 'Senior Manager' : 'Surveyor',
        division: u.division || '',
        status: (u.status || 'Aktif') as any,
        employeeId: '',
      }));
      
      setUsers(mappedUsers);
      
      // If selectedUserId is set, find and set the user
      if (selectedUserId) {
        const user = mappedUsers.find(u => u.id === selectedUserId);
        if (user) {
          setSelectedUser(user);
        }
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadPermissions = async (userId?: string) => {
    setLoading(true);
    try {
      const response: any = await api.getPermissions(userId);
      
      if (userId && response.user) {
        setSelectedUser({
          id: response.user.id?.toString() || '',
          name: response.user.name || '',
          email: response.user.email || '',
          role: response.user.role || 'common',
          roleName: response.user.role === 'marketing' ? 'Marketing Staff' : response.user.role === 'approver' ? 'Senior Manager' : 'Surveyor',
          division: response.user.division || '',
          status: response.user.status || 'Aktif',
          employeeId: '',
        });
        setCategories(response.categories || []);
      } else {
        setCategories(response || []);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
      alert('Gagal memuat izin. Pastikan backend berjalan dengan benar.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u.id === userId);
    setSelectedUser(user || null);
    loadPermissions(userId);
  };

  const togglePermission = async (catId: string, permId: string) => {
    if (!selectedUserId) {
      alert('Pilih pengguna terlebih dahulu');
      return;
    }

    const category = categories.find(cat => cat.id === catId);
    if (!category) return;

    const permission = category.permissions.find(p => p.id === permId);
    if (!permission) return;

    const newEnabled = !permission.isEnabled;

    // Optimistic update
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        permissions: cat.permissions.map(p => 
          p.id === permId ? { ...p, isEnabled: newEnabled } : p
        )
      };
    }));

    try {
      await api.updatePermission(permId, newEnabled, selectedUserId);
    } catch (error) {
      console.error('Failed to update permission:', error);
      // Revert on error
      setCategories(prev => prev.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          permissions: cat.permissions.map(p => 
            p.id === permId ? { ...p, isEnabled: !newEnabled } : p
          )
        };
      }));
      alert('Gagal mengubah izin');
    }
  };

  const toggleCategoryAll = (catId: string) => {
    if (!selectedUserId) {
      alert('Pilih pengguna terlebih dahulu');
      return;
    }

    const category = categories.find(cat => cat.id === catId);
    if (!category) return;

    const allEnabled = category.permissions.every(p => p.isEnabled);
    const newState = !allEnabled;

    // Optimistic update
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        permissions: cat.permissions.map(p => ({ ...p, isEnabled: newState }))
      };
    }));

    // Update all permissions in category
    category.permissions.forEach(async (perm) => {
      try {
        await api.updatePermission(perm.id, newState, selectedUserId);
      } catch (error) {
        console.error('Failed to update permission:', error);
      }
    });
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      alert('Pilih pengguna terlebih dahulu');
      return;
    }

    setSaving(true);
    try {
      const allPermissions: Array<{ id: number; isEnabled: boolean }> = [];
      categories.forEach(cat => {
        cat.permissions.forEach(perm => {
          allPermissions.push({
            id: parseInt(perm.id),
            isEnabled: perm.isEnabled,
          });
        });
      });

      await api.updatePermissionsBulk(selectedUserId, allPermissions);
      setLastModified(new Date().toLocaleString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }) + ' WIB');
      alert('Izin berhasil disimpan');
    } catch (error: any) {
      console.error('Failed to save permissions:', error);
      alert('Gagal menyimpan izin: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (selectedUserId) {
      loadPermissions(selectedUserId);
    } else {
      loadPermissions();
    }
  };

  const filteredCategories = categories.filter(cat => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return cat.title.toLowerCase().includes(query) ||
           cat.permissions.some(p => 
             p.name.toLowerCase().includes(query) || 
             p.description.toLowerCase().includes(query)
           );
  });

  // Get role-based permission templates
  const getRolePermissionTemplate = (role: string) => {
    const templates: Record<string, Record<string, boolean>> = {
      marketing: {
        'view_sph': true,
        'create_sph': true,
        'delete_sph': true,
        'approve_sph': false,
        'view_client_detail': true,
        'edit_pic': true,
        'export_data': true,
      },
      approver: {
        'view_sph': true,
        'create_sph': false,
        'delete_sph': false,
        'approve_sph': true,
        'view_client_detail': true,
        'edit_pic': false,
        'export_data': true,
      },
      common: {
        'view_sph': true,
        'create_sph': false,
        'delete_sph': false,
        'approve_sph': false,
        'view_client_detail': true,
        'edit_pic': false,
        'export_data': false,
      },
    };
    return templates[role] || {};
  };

  const applyRoleTemplate = () => {
    if (!selectedUser || !selectedUserId) {
      alert('Pilih pengguna terlebih dahulu');
      return;
    }

    const template = getRolePermissionTemplate(selectedUser.role);
    
    setCategories(prev => prev.map(cat => ({
      ...cat,
      permissions: cat.permissions.map(perm => ({
        ...perm,
        isEnabled: template[perm.id] !== undefined ? template[perm.id] : perm.isEnabled,
      }))
    })));
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 custom-scrollbar pb-32">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-8">
        {/* Page Heading */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Konfigurasi Izin Akses</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium max-w-2xl">
            Kelola hak akses untuk setiap peran pengguna dalam sistem. Perubahan akan berlaku saat pengguna masuk kembali.
          </p>
        </div>

        {/* Filters & Controls Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8 sticky top-0 z-20">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            {/* User/Role Dropdown */}
            <div className="flex flex-col w-full md:w-1/3 gap-2">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pilih Pengguna</span>
              <div className="relative">
                <select 
                  value={selectedUserId || ''}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Pilih Pengguna --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleName})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 dark:text-slate-500">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
              {selectedUser && (
                <button
                  onClick={applyRoleTemplate}
                  className="mt-2 text-xs text-primary font-bold hover:underline transition-all"
                >
                  Terapkan Template untuk {selectedUser.roleName}
                </button>
              )}
            </div>
            
            {/* Search Permissions */}
            <div className="flex flex-col w-full md:flex-1 gap-2">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cari Izin</span>
              <div className="relative w-full group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                </div>
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-3 pl-10 pr-4 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:ring-primary/20 outline-none transition-all" 
                  placeholder="Cari izin (contoh: edit, hapus, SPH)..." 
                  type="text"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400 dark:text-slate-500 text-sm font-bold">Memuat izin...</div>
          </div>
        ) : (
          <>
            {!selectedUserId && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Pilih pengguna dari dropdown di atas untuk mulai mengatur izin akses.
                </p>
              </div>
            )}

            {/* Permission Categories */}
            <div className="flex flex-col gap-8">
              {filteredCategories.map((category) => (
                <div key={category.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="bg-slate-50/50 dark:bg-slate-700/50 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl text-primary border border-red-100 dark:border-red-900/50 shadow-sm">
                        <span className="material-symbols-outlined fill">{category.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{category.title}</h3>
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{category.description}</p>
                      </div>
                    </div>
                    {selectedUserId && (
                      <button 
                        onClick={() => toggleCategoryAll(category.id)}
                        className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline transition-all"
                      >
                        Pilih Semua
                      </button>
                    )}
                  </div>
                  
                  <div className="divide-y divide-slate-50 dark:divide-slate-700">
                    {category.permissions.map((perm) => (
                      <div key={perm.id} className="px-8 py-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{perm.name}</span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{perm.description}</span>
                        </div>
                        
                        {/* Switch Toggle */}
                        <button 
                          onClick={() => togglePermission(category.id, perm.id)}
                          disabled={!selectedUserId}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            !selectedUserId ? 'opacity-50 cursor-not-allowed' : ''
                          } ${perm.isEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-600'}`}
                          role="switch"
                          aria-checked={perm.isEnabled}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${perm.isEnabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sticky Footer Action Bar */}
      <div className="fixed bottom-0 left-72 right-0 bg-white/95 dark:bg-slate-800/95 border-t border-slate-200 dark:border-slate-700 px-10 py-5 backdrop-blur-sm z-30 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden lg:block">
            {lastModified ? (
              <>Terakhir diubah: <span className="text-slate-900 dark:text-white">{lastModified}</span> oleh {currentUser?.name || 'Administrator'}</>
            ) : (
              <>Pilih pengguna untuk mulai mengatur izin</>
            )}
          </p>
          <div className="flex gap-4 w-full lg:w-auto justify-end">
            <button 
              onClick={handleCancel}
              className="px-8 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:outline-none lg:w-auto w-1/2"
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              disabled={!selectedUserId || saving}
              className={`px-8 py-3 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 lg:w-auto w-1/2 ${
                !selectedUserId || saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PermissionsScreen;
