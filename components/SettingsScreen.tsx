import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { SystemUser, UserRoleType, UserRoleName } from '../types';
import { SYSTEM_USERS } from '../constants';

interface SettingsScreenProps {
  onManagePermissions: (userId?: string) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onManagePermissions }) => {
  const { user, isMarketing } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const isAdmin = isMarketing();

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: '',
    division: user?.division || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Security state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [securityLoading, setSecurityLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState({
    sphNew: true,
    clientUpdate: true,
    weeklyDigest: false,
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // User management state
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'common' as UserRoleType,
    roleName: 'Surveyor' as UserRoleName,
    division: '',
    employeeId: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: '',
        division: user.division || '',
      });
    }
    if (isAdmin) {
      loadUsers();
    }
  }, [user, isAdmin]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      // Fetch users from API
      const response: any = await api.getUsers();
      const usersData = response.data || response;
      // Handle paginated response
      let usersList: any[] = [];
      if (Array.isArray(usersData)) {
        usersList = usersData;
      } else if (usersData && Array.isArray(usersData.data)) {
        usersList = usersData.data;
      }
      
      // Map API response to SystemUser format
      const mappedUsers: SystemUser[] = usersList.map((u: any) => {
        // Determine roleName based on role
        let roleName: UserRoleName = 'Surveyor';
        if (u.role === 'marketing') {
          roleName = 'Marketing Staff';
        } else if (u.role === 'head_section') {
          roleName = 'Head Section Marketing';
        } else if (u.role === 'approver') {
          roleName = 'Approver';
        } else if (u.role === 'senior_manager') {
          roleName = 'Senior Manager';
        } else if (u.role === 'general_manager') {
          roleName = 'General Manager';
        } else if (u.role === 'common') {
          roleName = 'Surveyor';
        }
        
        return {
          id: u.id?.toString() || '',
          name: u.name || '',
          email: u.email || '',
          avatar: u.avatar || undefined,
          role: (u.role || 'common') as UserRoleType,
          roleName: roleName,
          division: u.division || '',
          status: (u.status || 'Aktif') as 'Aktif' | 'Cuti' | 'Nonaktif',
          employeeId: '', // Not stored in database currently
          isCurrentUser: u.id?.toString() === user?.id?.toString()
        };
      });
      
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Fallback to constants if API fails
      const allUsers = SYSTEM_USERS.map(u => ({
        ...u,
        isCurrentUser: u.id === user?.id?.toString()
      }));
      setUsers(allUsers);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await api.updateProfile(profileData);
      alert('Profil berhasil diperbarui');
    } catch (error: any) {
      alert('Gagal memperbarui profil: ' + (error.message || 'Unknown error'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Kata sandi baru dan konfirmasi tidak cocok');
      return;
    }
    if (passwordData.newPassword.length < 5) {
      alert('Kata sandi minimal 5 karakter');
      return;
    }
    setSecurityLoading(true);
    try {
      await api.updatePassword(passwordData.currentPassword, passwordData.newPassword);
      alert('Kata sandi berhasil diubah');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      alert('Gagal mengubah kata sandi: ' + (error.message || 'Unknown error'));
    } finally {
      setSecurityLoading(false);
    }
  };

  const handlePreferencesSave = async () => {
    setPreferencesLoading(true);
    try {
      await api.updatePreferences({ notifications, darkMode: isDarkMode });
      alert('Preferensi berhasil disimpan');
    } catch (error: any) {
      alert('Gagal menyimpan preferensi: ' + (error.message || 'Unknown error'));
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.division || !newUser.roleName) {
      alert('Harap lengkapi semua field');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      alert('Format email tidak valid');
      return;
    }
    
    try {
      // Create user with default password 12345
      // Only send fields that exist in the database schema
      const userData: any = {
        name: newUser.name.trim(),
        email: newUser.email.trim().toLowerCase(),
        password: '12345', // Default password
        // Map roleName to backend role
        role: (() => {
          if (newUser.roleName === 'Head Section Marketing') return 'head_section';
          if (newUser.roleName === 'Senior Manager') return 'senior_manager';
          if (newUser.roleName === 'General Manager') return 'general_manager';
          if (newUser.roleName === 'Approver') return 'approver';
          return newUser.role;
        })(),
        division: newUser.division.trim(),
        status: 'Aktif',
      };
      
      const response = await api.createUser(userData);
      console.log('User created successfully:', response);
      alert('Pengguna berhasil ditambahkan. Password default: 12345');
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', role: 'common', roleName: 'Surveyor', division: '', employeeId: '' });
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      let errorMessage = 'Unknown error';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors) {
          // Laravel validation errors - format as readable string
          const errorMessages: string[] = [];
          Object.keys(errorData.errors).forEach(key => {
            errorMessages.push(`${key}: ${errorData.errors[key].join(', ')}`);
          });
          errorMessage = errorMessages.join('\n');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(`Gagal menambahkan pengguna:\n${errorMessage}`);
    }
  };


  const getRoleDisplayName = (role: UserRoleType, roleName: UserRoleName) => {
    const roleGroups: Record<UserRoleType, string> = {
      'marketing': 'Administrator',
      'approver': 'Approver',
      'senior_manager': 'Approver',
      'general_manager': 'Approver',
      'common': 'Umum',
      'head_section': 'Head Section'
    };
    return `${roleGroups[role]} - ${roleName}`;
  };

  const getRoleBadgeColor = (role: UserRoleType) => {
    switch (role) {
      case 'marketing':
        return 'bg-red-50 dark:bg-red-900/20 text-primary border-red-100 dark:border-red-800';
      case 'head_section':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800';
      case 'approver':
      case 'senior_manager':
      case 'general_manager':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800';
      case 'common':
        return 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    
    // Cek apakah user yang akan dihapus adalah administrator
    if (userToDelete?.role === 'marketing') {
      alert('Tidak dapat menghapus akun Administrator. Akses Administrator bersifat mutlak dan tidak dapat diganggu.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna ${userToDelete?.name}?`)) return;
    
    try {
      await api.deleteUser(userId);
      alert('Pengguna berhasil dihapus');
      loadUsers();
    } catch (error: any) {
      alert('Gagal menghapus pengguna: ' + (error.message || 'Unknown error'));
    }
  };

  // Fungsi untuk mengecek apakah user bisa di-edit atau dihapus
  const canModifyUser = (userItem: SystemUser) => {
    // Administrator tidak bisa diubah atau dihapus
    if (userItem.role === 'marketing') {
      return false;
    }
    // User sendiri tidak bisa diubah
    if (userItem.isCurrentUser) {
      return false;
    }
    return true;
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 custom-scrollbar">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-8 lg:py-12 flex flex-col gap-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Pengaturan Akun</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium max-w-2xl">Kelola profil pribadi Anda, preferensi keamanan, dan notifikasi untuk akun PT Surveyor Indonesia Anda.</p>
        </div>

        {/* Section 1: Profile Header & Basic Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-24 border-4 border-white dark:border-slate-800 shadow-md" style={{ backgroundImage: user?.avatar ? `url("${user.avatar}")` : 'none', backgroundColor: user?.avatar ? 'transparent' : '#e2e8f0' }}>
                  {!user?.avatar && (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-2xl">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-sm hover:bg-primary-dark transition-colors">
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{user?.name || 'User'}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-tight">
                  {user?.role === 'marketing' ? 'Administrator' : user?.role === 'approver' ? 'Approver' : 'Umum'}
                </p>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 mt-1 uppercase tracking-widest">
                  ID Karyawan: {users.find(u => u.isCurrentUser)?.employeeId || user?.id || 'N/A'}
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors w-full md:w-auto shadow-sm border border-red-100 dark:border-red-800">
              Ubah Foto Profil
            </button>
          </div>
          
          <div className="p-8">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2 uppercase tracking-widest">
              <span className="material-symbols-outlined text-primary fill">person</span>
              Informasi Pribadi
            </h3>
            <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none transition-all" 
                  type="text" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Alamat Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </span>
                  <input 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 pl-10 pr-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                    disabled 
                    type="email" 
                    value={user?.email || ''}
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium italic">Email perusahaan tidak dapat diubah secara mandiri.</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Nomor Telepon</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none transition-all" 
                  type="tel" 
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Divisi</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none transition-all" 
                  type="text" 
                  value={profileData.division}
                  onChange={(e) => setProfileData({ ...profileData, division: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 flex justify-end mt-4">
                <button 
                  type="submit"
                  disabled={profileLoading}
                  className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  {profileLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* User Role Management Section (Administrator Only) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-primary fill">manage_accounts</span>
                  Manajemen Peran Pengguna
                </h3>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Kelola akses dan peran pengguna dalam sistem internal PT SI.</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => onManagePermissions()}
                  className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  Konfigurasi Izin
                </button>
                <button 
                  onClick={() => setShowAddUserModal(true)}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center gap-2 flex-1 md:flex-none justify-center shadow-lg shadow-red-500/20"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Tambah Pengguna
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
                    <th className="px-6 py-4">Identitas Pengguna</th>
                    <th className="px-6 py-4">Peran (Role)</th>
                    <th className="px-6 py-4">Divisi</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Memuat data...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Belum ada pengguna</td>
                    </tr>
                  ) : (
                    users.map((userItem) => {
                      const isAdministrator = userItem.role === 'marketing';
                      const canModify = canModifyUser(userItem);
                      const isGreyedOut = isAdministrator && !userItem.isCurrentUser;
                      
                      return (
                        <tr 
                          key={userItem.id} 
                          className={`transition-colors group ${
                            isGreyedOut 
                              ? 'opacity-50 bg-slate-50 dark:bg-slate-900/30' 
                              : 'hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700/50'
                          }`}
                        >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                              {userItem.avatar ? (
                                <div className={`w-9 h-9 rounded-full bg-cover bg-center border ${
                                  isGreyedOut 
                                    ? 'border-slate-300 dark:border-slate-600 opacity-50' 
                                    : 'border-slate-200 dark:border-slate-700'
                                }`} style={{ backgroundImage: `url("${userItem.avatar}")` }}></div>
                          ) : (
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black border text-xs ${
                                  isGreyedOut
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-400 border-slate-300 dark:border-slate-600 opacity-50'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                }`}>
                                  {userItem.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          <div>
                                <p className={`font-bold text-sm ${
                                  isGreyedOut 
                                    ? 'text-slate-400 dark:text-slate-400' 
                                    : 'text-slate-900 dark:text-white'
                                }`}>
                                  {userItem.name} 
                                  {userItem.isCurrentUser && <span className="text-[9px] font-black text-primary bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded ml-1 uppercase tracking-widest">(Anda)</span>}
                                  {isGreyedOut && <span className="text-[9px] font-black text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded ml-1 uppercase tracking-widest">(Protected)</span>}
                                </p>
                                <p className={`text-[11px] font-medium ${
                                  isGreyedOut 
                                    ? 'text-slate-400 dark:text-slate-400' 
                                    : 'text-slate-400 dark:text-slate-400'
                                }`}>{userItem.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight border w-fit ${
                                isGreyedOut ? 'opacity-50' : ''
                              } ${getRoleBadgeColor(userItem.role)}`}>
                                {userItem.role === 'marketing' ? 'Administrator' : 
                                 userItem.role === 'head_section' ? 'Head Section' : 
                                 ['approver', 'senior_manager', 'general_manager'].includes(userItem.role) ? 'Approver' : 'Umum'}
                        </span>
                              <span className={`text-[10px] font-bold ${
                                isGreyedOut 
                                  ? 'text-slate-400 dark:text-slate-400' 
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}>{userItem.roleName}</span>
                            </div>
                      </td>
                          <td className={`px-6 py-4 font-bold text-xs ${
                            isGreyedOut 
                              ? 'text-slate-400 dark:text-slate-400' 
                              : 'text-slate-600 dark:text-slate-300'
                          }`}>
                            {userItem.division}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 font-black text-[10px] uppercase tracking-tighter ${
                              userItem.status === 'Aktif' 
                                ? isGreyedOut 
                                  ? 'text-slate-400 dark:text-slate-400' 
                                  : 'text-green-600 dark:text-green-400'
                                : 'text-slate-400 dark:text-slate-400'
                        }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                userItem.status === 'Aktif' 
                                  ? isGreyedOut 
                                    ? 'bg-slate-400' 
                                    : 'bg-green-500'
                                  : 'bg-slate-400'
                              }`}></span>
                              {userItem.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                            <div className={`flex items-center justify-end gap-1 ${
                              !canModify ? 'opacity-50 cursor-not-allowed' : ''
                            }`}>
                          <button 
                                className={`p-1.5 rounded-lg transition-colors ${
                                  canModify
                                    ? 'text-slate-400 dark:text-slate-400 hover:text-primary hover:bg-red-50 dark:hover:bg-red-900/20'
                                    : 'text-slate-300 dark:text-slate-400 cursor-not-allowed'
                                }`}
                                disabled={!canModify}
                                title={canModify ? 'Edit Role' : isAdministrator ? 'Administrator tidak dapat diubah' : 'Tidak dapat mengubah akun sendiri'}
                                onClick={() => {
                                  if (canModify) {
                                    onManagePermissions(userItem.id);
                                  } else if (isAdministrator) {
                                    alert('Tidak dapat mengubah akun Administrator. Akses Administrator bersifat mutlak dan tidak dapat diganggu.');
                                  }
                                }}
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                              <button 
                                className={`p-1.5 rounded-lg transition-colors ${
                                  canModify
                                    ? 'text-slate-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    : 'text-slate-300 dark:text-slate-400 cursor-not-allowed'
                                }`}
                                disabled={!canModify}
                                title={canModify ? 'Hapus User' : isAdministrator ? 'Administrator tidak dapat dihapus' : 'Tidak dapat menghapus akun sendiri'}
                                onClick={() => {
                                  if (canModify) {
                                    handleDeleteUser(userItem.id);
                                  } else if (isAdministrator) {
                                    alert('Tidak dapat menghapus akun Administrator. Akses Administrator bersifat mutlak dan tidak dapat diganggu.');
                                  }
                                }}
                              >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                      </td>
                    </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/30">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Menampilkan {users.length} dari {users.length} pengguna</span>
            </div>
          </div>
        )}

        {/* Two Column Layout for Security & Preferences */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Security Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col h-full">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2 uppercase tracking-widest">
              <span className="material-symbols-outlined text-primary fill">lock</span>
              Keamanan Akun
            </h3>
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-6 flex-1">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Kata Sandi Saat Ini</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none transition-all" 
                  placeholder="••••••••" 
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Kata Sandi Baru</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none transition-all" 
                  placeholder="Minimal 8 karakter" 
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Konfirmasi Kata Sandi Baru</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none transition-all" 
                  placeholder="Ulangi kata sandi baru" 
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={securityLoading}
                className="w-full py-3 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm disabled:opacity-50 mt-auto"
              >
                {securityLoading ? 'Memperbarui...' : 'Perbarui Keamanan'}
              </button>
            </form>
          </div>

          {/* Preferences Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col h-full">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2 uppercase tracking-widest">
              <span className="material-symbols-outlined text-primary fill">tune</span>
              Preferensi & Notifikasi
            </h3>
              <div className="flex flex-col gap-6">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Tampilan</h4>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Mode Tampilan</label>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Dark Mode</span>
                    <button
                      onClick={toggleDarkMode}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        isDarkMode ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-600'
                      }`}
                      role="switch"
                      aria-checked={isDarkMode}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-800 shadow ring-0 transition duration-200 ease-in-out ${
                        isDarkMode ? 'translate-x-5' : 'translate-x-0'
                      }`}></span>
                    </button>
                  </div>
                </div>
              </div>
        </div>
      </div>
        {/* Danger Zone */}
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-black text-primary uppercase tracking-tight">Area Berbahaya</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Keluar dari sesi saat ini di perangkat ini atau hapus data lokal.</p>
          </div>
          <button 
            onClick={async () => {
              if (confirm('Apakah Anda yakin ingin keluar?')) {
                await api.logout();
                window.location.reload();
              }
            }}
            className="px-8 py-3 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-primary font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm whitespace-nowrap"
          >
            Keluar Akun
          </button>
        </div>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Tambah Pengguna Baru</h3>
                <button 
                  onClick={() => setShowAddUserModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-300"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Role Utama</label>
                  <select
                    value={newUser.role === 'head_section' ? 'marketing' : newUser.role}
                    onChange={(e) => {
                      const role = e.target.value as UserRoleType;
                      setNewUser({ 
                        ...newUser, 
                        role,
                        roleName: role === 'marketing' ? 'Marketing Staff' : role === 'approver' ? 'Senior Manager' : 'Surveyor'
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none"
                  >
                    <option value="marketing">Administrator (Marketing)</option>
                    <option value="approver">Approver</option>
                    <option value="common">Umum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Nama Role</label>
                  <select
                    value={newUser.roleName}
                    onChange={(e) => {
                      const newRoleName = e.target.value as UserRoleName;
                      let newRole = newUser.role;
                      
                      // Automatically switch role to head_section if that specific role name is selected
                      if (newRoleName === 'Head Section Marketing') {
                        newRole = 'head_section';
                      } else if (newUser.role === 'head_section') {
                        // Revert to marketing if switching away from Head Section
                        newRole = 'marketing';
                      }
                      
                      setNewUser({ ...newUser, roleName: newRoleName, role: newRole });
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none"
                  >
                    {(newUser.role === 'marketing' || newUser.role === 'head_section') && (
                      <>
                        <option value="Head Section Marketing">Head Section Marketing</option>
                        <option value="Marketing Staff">Marketing Staff</option>
                        <option value="Social Media Specialist">Social Media Specialist</option>
                        <option value="Content Strategist">Content Strategist</option>
                        <option value="Brand Manager">Brand Manager</option>
                      </>
                    )}
                    {newUser.role === 'approver' && (
                      <>
                        <option value="Senior Manager">Senior Manager</option>
                        <option value="General Manager">General Manager</option>
                      </>
                    )}
                    {newUser.role === 'common' && (
                      <>
                        <optgroup label="Operasi">
                          <option value="Senior Surveyor">Senior Surveyor</option>
                          <option value="Surveyor">Surveyor</option>
                          <option value="Field Staff">Field Staff</option>
                          <option value="Technical Lead">Technical Lead</option>
                          <option value="Project Manager">Project Manager</option>
                        </optgroup>
                        <optgroup label="SDM">
                          <option value="HR Manager">HR Manager</option>
                          <option value="HR Staff">HR Staff</option>
                          <option value="Recruitment Specialist">Recruitment Specialist</option>
                        </optgroup>
                        <optgroup label="Keuangan">
                          <option value="Finance Manager">Finance Manager</option>
                          <option value="Finance Staff">Finance Staff</option>
                          <option value="Accountant">Accountant</option>
                          <option value="Accounting Staff">Accounting Staff</option>
                        </optgroup>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">ID Karyawan</label>
                  <input
                    type="text"
                    value={newUser.employeeId}
                    onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none"
                    placeholder="SI-YYYY-XXX"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Divisi</label>
                  <input
                    type="text"
                    value={newUser.division}
                    onChange={(e) => setNewUser({ ...newUser, division: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddUser}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-red-500/20"
                >
                  Tambah
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="pt-4 pb-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-400">© 2024 PT Surveyor Indonesia. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
};

export default SettingsScreen;