import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { SystemUser, UserRoleType, UserRoleName } from '../types';
import { SYSTEM_USERS } from '../constants';
import { showToast } from './Toast';
import { formatPhoneForWhatsApp } from '../utils/phoneFormat';

/**
 * Helper to center crop and compress an image file to a perfect square (300x300 JPEG)
 * for optimal performance and exact border fit.
 */
const compressAndCropToSquare = (file: File, size: number = 300): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses gambar pada canvas.'));
          return;
        }

        // Center crop calculation
        const sourceSize = Math.min(img.width, img.height);
        const sourceX = (img.width - sourceSize) / 2;
        const sourceY = (img.height - sourceSize) / 2;

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          size,
          size
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], 'avatar.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Gagal melakukan kompresi gambar.'));
            }
          },
          'image/jpeg',
          0.85 // 85% quality is the exact performance sweet spot
        );
      };
      img.onerror = () => reject(new Error('Gagal memuat file gambar.'));
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
  });
};

interface SettingsScreenProps {
  onNavigate: (id: string) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const { user, isMarketing, isSuperAdmin, isHeadSection, setUser } = useAuth();
  const isAdmin = isMarketing();

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    division: user?.division || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Security state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [securityLoading, setSecurityLoading] = useState(false);

  // Broadcast state (Super Admin only)
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

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

  // Delete user verification state
  const [deleteConfirmationUser, setDeleteConfirmationUser] = useState<SystemUser | null>(null);
  const [deleteVerifyNameInput, setDeleteVerifyNameInput] = useState('');
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);

  // Edit user state
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  
  // Invite code management state
  const [inviteCodes, setInviteCodes] = useState<any[]>([]);
  const [inviteCodesLoading, setInviteCodesLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateRole, setGenerateRole] = useState('common');
  const [generateDivision, setGenerateDivision] = useState('');

  const getAvailableDivisionsForRole = (role: string) => {
    if (role === 'marketing' || role === 'head_section') {
      return [{ value: 'Divisi Marketing & Sales', label: 'Divisi Marketing & Sales' }];
    }
    if (['approver', 'senior_manager', 'general_manager'].includes(role)) {
      return [{ value: 'Divisi Manajemen', label: 'Divisi Manajemen' }];
    }
    return [
      { value: 'Divisi Operasi', label: 'Divisi Operasi' },
      { value: 'Divisi Keuangan', label: 'Divisi Keuangan' },
      { value: 'Divisi SDM & Umum', label: 'Divisi SDM & Umum' },
    ];
  };

  const handleGenerateRoleChange = (role: string) => {
    setGenerateRole(role);
    setGenerateDivision(''); // Reset selected division to force choosing a valid one
  };
  
  // User management filters
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'division' | 'role'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        division: user.division || '',
      });
    }
    if (isAdmin) {
      loadUsers();
      loadInviteCodes();
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
        } else if (u.role === 'super_admin') {
          roleName = 'Super Admin';
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
          isCurrentUser: u.id?.toString() === user?.id?.toString(),
          phone: u.phone || ''
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
      const updatedUser = await api.updateProfile(profileData);
      setUser(updatedUser);
      showToast('Profil berhasil diperbarui', 'success');
      await loadUsers();
    } catch (error: any) {
      showToast('Gagal memperbarui profil: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB client-side before compression)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran file awal maksimal 10MB', 'error');
      return;
    }

    setProfileLoading(true);
    showToast('Mengompresi & mengunggah foto...', 'info');
    try {
      // 1. Center crop and compress image to optimized JPEG square (300x300)
      const optimizedFile = await compressAndCropToSquare(file);
      
      // 2. Upload to backend
      const response = await api.uploadAvatar(optimizedFile);
      
      // 3. Update React global Auth state instantly without any page reload!
      setUser(prev => prev ? { ...prev, avatar: response.avatar } : null);
      
      showToast('Foto profil berhasil diperbarui', 'success');
      await loadUsers();
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      showToast('Gagal memperbarui foto profil: ' + (error.message || 'Error tidak diketahui'), 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Kata sandi baru dan konfirmasi tidak cocok', 'error');
      return;
    }
    if (passwordData.newPassword.length < 5) {
      showToast('Kata sandi minimal 5 karakter', 'error');
      return;
    }
    setSecurityLoading(true);
    try {
      await api.updatePassword(passwordData.currentPassword, passwordData.newPassword);
      showToast('Kata sandi berhasil diubah', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      showToast('Gagal mengubah kata sandi: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      showToast('Judul dan isi broadcast tidak boleh kosong', 'error');
      return;
    }
    if (!confirm('Kirim broadcast ini ke SEMUA pengguna sistem?')) return;
    setBroadcastLoading(true);
    try {
      const res: any = await api.broadcastNotification({ title: broadcastTitle.trim(), content: broadcastContent.trim() });
      showToast(`Broadcast berhasil dikirim ke ${res.sent_to || 'semua'} pengguna`, 'success');
      setBroadcastTitle('');
      setBroadcastContent('');
    } catch (error: any) {
      showToast('Gagal mengirim broadcast: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    setEditLoading(true);
    try {
      let mappedRoleName = editingUser.roleName;
      if (editingUser.role === 'marketing') mappedRoleName = 'Admin';
      else if (editingUser.role === 'head_section') mappedRoleName = 'Head Section';
      else if (['approver', 'senior_manager', 'general_manager'].includes(editingUser.role)) mappedRoleName = 'Approver';
      else if (editingUser.role === 'umum') mappedRoleName = 'Staff Umum';

      const updateData = {
        name: editingUser.name,
        email: editingUser.email,
        division: editingUser.division,
        role: editingUser.role,
        roleName: mappedRoleName,
        status: editingUser.status
      };

      await api.updateUser(editingUser.id, updateData);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updateData } : u));
      showToast('Peran dan profil pengguna berhasil diperbarui', 'success');
      setShowEditUserModal(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error('Failed to update user:', error);
      showToast(error?.message || 'Gagal memperbarui pengguna', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.division || !newUser.roleName) {
      showToast('Harap lengkapi semua field', 'error');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      showToast('Format email tidak valid', 'error');
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
      showToast('Pengguna berhasil ditambahkan. Password default: 12345', 'success');
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
      
      showToast(`Gagal menambahkan pengguna: ${errorMessage}`, 'error');
    }
  };


  const getRoleDisplayName = (role: UserRoleType, roleName: UserRoleName) => {
    const roleGroups: Record<UserRoleType, string> = {
      'super_admin': 'Super Admin',
      'marketing': 'Administrator',
      'approver': 'Approver',
      'senior_manager': 'Approver',
      'general_manager': 'Approver',
      'common': 'Umum',
      'head_section': 'Head Section'
    };
    return `${roleGroups[role]} - ${roleName}`;
  };

  

  const loadInviteCodes = async () => {
    setInviteCodesLoading(true);
    try {
      const response: any = await api.listInviteCodes();
      const codes = response.data || response;
      if (Array.isArray(codes)) {
        setInviteCodes(codes);
      }
    } catch (error) {
      console.error('Failed to load invite codes:', error);
    } finally {
      setInviteCodesLoading(false);
    }
  };

  const handleGenerateInviteCode = async () => {
    if (!generateDivision) {
      showToast('Silakan pilih divisi target terlebih dahulu.', 'error');
      return;
    }
    setGenerateLoading(true);
    try {
      const response = await api.generateInviteCode({
        role: generateRole,
        division: generateDivision,
      });
      const codeData: any = (response as any).data || response;
      showToast(`Kode undangan berhasil dibuat: ${codeData.code || codeData?.invite_code?.code || 'Buka tab kode untuk melihatnya'}`, 'success');
      loadInviteCodes();
    } catch (error) {
      console.error('Failed to generate invite code:', error);
      showToast('Gagal membuat kode undangan', 'error');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleRevokeInviteCode = async (id: string | number) => {
    if (!confirm('Yakin ingin mencabut kode undangan ini? Kode tidak akan bisa digunakan lagi.')) return;
    try {
      await api.revokeInviteCode(id);
      showToast('Kode undangan berhasil dicabut', 'success');
      loadInviteCodes();
    } catch (error: any) {
      showToast(error?.message || 'Gagal mencabut kode undangan', 'error');
    }
  };

  const handleDeleteInviteCode = async (id: string | number) => {
    if (!confirm('Yakin ingin menghapus kode undangan ini secara permanen?')) return;
    try {
      await api.deleteInviteCode(id);
      showToast('Kode undangan berhasil dihapus', 'success');
      loadInviteCodes();
    } catch (error: any) {
      showToast(error?.message || 'Gagal menghapus kode undangan', 'error');
    }
  };

  const handleSort = (field: 'name' | 'division' | 'role') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Kode disalin ke clipboard', 'success');
  };

  const getInviteCodeStatus = (ic: any) => {
    if (ic.used_by) return { label: 'Digunakan', color: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600' };
    if (!ic.is_active) return { label: 'Nonaktif', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' };
    if (new Date(ic.expires_at) < new Date()) return { label: 'Kedaluwarsa', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' };
    return { label: 'Tersedia', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };
  };

  const getRoleBadgeColor = (role: UserRoleType) => {
    switch (role) {
      case 'super_admin':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
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

  // Role hierarchy levels for comparison
  const getRoleLevel = (role: string) => {
    const levels: Record<string, number> = {
      'common': 1,
      'marketing': 2,
      'approver': 3,
      'senior_manager': 3,
      'general_manager': 3,
      'head_section': 4,
      'super_admin': 5,
    };
    return levels[role] || 0;
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    
    // Cannot delete yourself
    if (userToDelete.isCurrentUser) {
      showToast('Tidak dapat menghapus akun Anda sendiri.', 'error');
      return;
    }

    // Cannot delete super_admin
    if (userToDelete.role === 'super_admin') {
      showToast('Akun Super Admin tidak dapat dihapus.', 'error');
      return;
    }

    // Privileged accounts can only be deleted by super_admin
    const privilegedRoles = ['marketing', 'head_section', 'approver', 'senior_manager', 'general_manager'];
    if (privilegedRoles.includes(userToDelete.role) && user?.role !== 'super_admin') {
      showToast('Hanya Super Admin yang dapat menghapus akun dengan hak akses tinggi.', 'error');
      return;
    }

    // Open custom confirmation modal
    setDeleteConfirmationUser(userToDelete);
    setDeleteVerifyNameInput('');
  };

  const executeDeleteUser = async () => {
    if (!deleteConfirmationUser) return;

    if (deleteVerifyNameInput.trim() !== deleteConfirmationUser.name.toUpperCase()) {
      showToast('Nama yang Anda masukkan tidak cocok.', 'error');
      return;
    }

    setDeleteConfirmLoading(true);
    try {
      await api.deleteUser(deleteConfirmationUser.id);
      showToast('Pengguna berhasil dihapus', 'success');
      setDeleteConfirmationUser(null);
      setDeleteVerifyNameInput('');
      loadUsers();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Unknown error';
      showToast('Gagal menghapus pengguna: ' + msg, 'error');
    } finally {
      setDeleteConfirmLoading(false);
    }
  };

  // === HIERARCHY-BASED ACCESS CONTROL ===
  // Determines if the current user can EDIT a target user
  const canModifyUser = (userItem: SystemUser) => {
    const actorRole = user?.role || 'common';
    const actorLevel = getRoleLevel(actorRole);
    const targetLevel = getRoleLevel(userItem.role);
    
    // Self-edit is always allowed (profile only, not role)
    if (userItem.isCurrentUser) return true;
    
    // super_admin can edit anyone
    if (actorRole === 'super_admin') return true;
    
    // head_section can edit everyone except super_admin
    if (actorRole === 'head_section' && userItem.role !== 'super_admin') return true;
    
    // marketing can only edit users with lower privilege level
    if (actorRole === 'marketing' && targetLevel < actorLevel) return true;
    
    return false;
  };

  // Determines if the current user can DELETE a target user
  const canDeleteUser = (userItem: SystemUser) => {
    // Can never delete yourself
    if (userItem.isCurrentUser) return false;
    
    // Can never delete super_admin
    if (userItem.role === 'super_admin') return false;
    
    // Privileged accounts can only be deleted by super_admin
    const privilegedRoles = ['marketing', 'head_section', 'approver', 'senior_manager', 'general_manager'];
    if (privilegedRoles.includes(userItem.role) && user?.role !== 'super_admin') return false;
    
    // super_admin can delete anyone (except themselves and other super_admins, already handled)
    if (user?.role === 'super_admin') return true;
    
    // head_section and marketing can delete common users
    if (['head_section', 'marketing'].includes(user?.role || '') && userItem.role === 'common') return true;
    
    return false;
  };

  // Check if editing self (used to disable role selector)
  const isEditingSelf = (userItem: SystemUser | null) => {
    return userItem?.isCurrentUser || false;
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 custom-scrollbar">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-8 lg:py-12 flex flex-col gap-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Pengaturan Akun</h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl">Kelola profil pribadi Anda, preferensi keamanan, dan notifikasi untuk akun PT Surveyor Indonesia Anda.</p>
        </div>

        {/* Section 1: Profile Header & Basic Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer">
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-24 border-4 border-white dark:border-slate-800 shadow-md" 
                  style={{ 
                    backgroundImage: user?.avatar ? `url("${user.avatar}")` : 'none', 
                    backgroundColor: user?.avatar ? 'transparent' : '#e2e8f0' 
                  }}
                >
                  {!user?.avatar && (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-2xl">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-sm hover:bg-primary-dark transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                </button>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{user?.name || 'User'}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-tight">
                  {user?.division || 'Divisi Belum Diatur'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors w-full md:w-auto shadow-sm border border-red-100 dark:border-red-800"
            >
              Ubah Foto Profil
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange} 
            />
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
                  placeholder="08xx-xxxx-xxxx"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Divisi</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                  </span>
                  <input 
                    className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 ${!isSuperAdmin ? 'bg-slate-100 dark:bg-slate-900/50 cursor-not-allowed text-slate-500 dark:text-slate-400' : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20'} pl-10 pr-4 py-3 text-sm font-bold outline-none transition-all`}
                    type="text" 
                    value={profileData.division}
                    onChange={(e) => setProfileData({ ...profileData, division: e.target.value })}
                    disabled={!isSuperAdmin()}
                  />
                </div>
                {!isSuperAdmin() && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium italic">Divisi tidak dapat diubah secara mandiri. Hubungi Super Admin untuk pembaruan.</p>
                )}
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
        {isAdmin && (() => {
          // Compute filtered users
          const filteredUsers = users.filter(u => {
            const matchesDivision = divisionFilter === 'all' || u.division === divisionFilter;
            const matchesSearch = searchQuery === '' || 
              u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
              u.roleName.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesDivision && matchesSearch;
          });

          // Sort users dynamically
          const sortedUsers = [...filteredUsers].sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'name') {
              comparison = a.name.localeCompare(b.name);
            } else if (sortBy === 'division') {
              const divA = a.division || '';
              const divB = b.division || '';
              comparison = divA.localeCompare(divB);
              if (comparison === 0) {
                comparison = a.name.localeCompare(b.name); // secondary sort by name
              }
            } else if (sortBy === 'role') {
              const roleWeights: Record<string, number> = {
                'super_admin': 1,
                'head_section': 2,
                'approver': 3,
                'senior_manager': 4,
                'general_manager': 5,
                'marketing': 6,
                'common': 7
              };
              const weightA = roleWeights[a.role] || 99;
              const weightB = roleWeights[b.role] || 99;
              comparison = weightA - weightB;
              if (comparison === 0) {
                comparison = a.name.localeCompare(b.name); // secondary sort by name
              }
            }
            return sortOrder === 'asc' ? comparison : -comparison;
          });

          // Get unique divisions
          const uniqueDivisions = [...new Set(users.map(u => u.division).filter(Boolean))];

          // Group users by division
          const groupedUsers: Record<string, SystemUser[]> = {};
          filteredUsers.forEach(u => {
            const div = u.division || 'Belum Ditentukan';
            if (!groupedUsers[div]) groupedUsers[div] = [];
            groupedUsers[div].push(u);
          });

          // Stats
          const totalUsers = users.length;
          const activeDivisions = uniqueDivisions.length;
          const activeUsers = users.filter(u => u.status === 'Aktif').length;
          const pendingUsers = users.filter(u => u.status !== 'Aktif').length;

          // Division colors
          const divisionColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
            'Marketing': { bg: 'bg-blue-50 dark:bg-blue-900/15', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', icon: 'campaign' },
            'Operasi': { bg: 'bg-emerald-50 dark:bg-emerald-900/15', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', icon: 'engineering' },
            'Management': { bg: 'bg-purple-50 dark:bg-purple-900/15', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', icon: 'supervisor_account' },
            'Keuangan': { bg: 'bg-amber-50 dark:bg-amber-900/15', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', icon: 'account_balance' },
            'SDM & Umum': { bg: 'bg-rose-50 dark:bg-rose-900/15', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', icon: 'people' },
            'System Administrator': { bg: 'bg-amber-50 dark:bg-amber-900/15', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', icon: 'terminal' },
          };
          const getColor = (div: string) => divisionColors[div] || { bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-300', icon: 'folder' };

          return (
          <div className="space-y-5">
            {/* Section Header */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                    <span className="material-symbols-outlined text-primary fill">manage_accounts</span>
                    Manajemen Pengguna Terkategori
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Kelola akses dan peran pengguna dalam sistem internal PT SI.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => setShowAddUserModal(true)}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center gap-2 flex-1 md:flex-none justify-center shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    Tambah Pengguna
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Pengguna', value: totalUsers, icon: 'group', color: 'text-primary', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { label: 'Divisi Aktif', value: activeDivisions, icon: 'business', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                { label: 'Pengguna Aktif', value: activeUsers, icon: 'check_circle', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                { label: 'Menunggu/Nonaktif', value: pendingUsers, icon: 'pending', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              ].map(stat => (
                <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3 shadow-sm">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined text-xl ${stat.color}`}>{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter Tabs + Search */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                {/* Filter pills */}
                <div className="flex flex-wrap gap-2 flex-1 items-center">
                  <button
                    onClick={() => setDivisionFilter('all')}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      divisionFilter === 'all'
                        ? 'text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                    style={divisionFilter === 'all' ? { background: 'linear-gradient(135deg, #003868, #00B4AE)' } : {}}
                  >
                    Semua Divisi ({totalUsers})
                  </button>
                  {uniqueDivisions.map(div => {
                    const count = users.filter(u => u.division === div).length;
                    return (
                      <button
                        key={div}
                        onClick={() => setDivisionFilter(div)}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                          divisionFilter === div
                            ? 'text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                        style={divisionFilter === div ? { background: 'linear-gradient(135deg, #003868, #00B4AE)' } : {}}
                      >
                        {div} ({count})
                      </button>
                    );
                  })}
                </div>
                {/* Search */}
                <div className="relative w-full md:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari pengguna..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Compact User Table */}
            {usersLoading ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Memuat data pengguna...</p>
                </div>
              </div>
            ) : sortedUsers.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">person_search</span>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {searchQuery ? `Tidak ada pengguna yang cocok dengan "${searchQuery}"` : 'Belum ada pengguna'}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 select-none">
                        <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-[30%]" onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-1">
                            Pengguna
                            {sortBy === 'name' ? (
                              <span className="material-symbols-outlined text-xs text-primary font-black">
                                {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-[10px] text-slate-300 dark:text-slate-600">swap_vert</span>
                            )}
                          </div>
                        </th>
                        <th className="px-5 py-3.5 hidden md:table-cell cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-[22%]" onClick={() => handleSort('division')}>
                          <div className="flex items-center gap-1">
                            Divisi
                            {sortBy === 'division' ? (
                              <span className="material-symbols-outlined text-xs text-primary font-black">
                                {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-[10px] text-slate-300 dark:text-slate-600">swap_vert</span>
                            )}
                          </div>
                        </th>
                        <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-[20%]" onClick={() => handleSort('role')}>
                          <div className="flex items-center gap-1">
                            Peran
                            {sortBy === 'role' ? (
                              <span className="material-symbols-outlined text-xs text-primary font-black">
                                {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-[10px] text-slate-300 dark:text-slate-600">swap_vert</span>
                            )}
                          </div>
                        </th>
                        <th className="px-5 py-3.5 hidden sm:table-cell text-slate-400 dark:text-slate-400 w-[18%]">Kontak</th>
                        <th className="px-5 py-3.5 text-right text-slate-400 dark:text-slate-400 w-[10%]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {sortedUsers.map(userItem => {
                        const canEdit = canModifyUser(userItem);
                        const canDelete = canDeleteUser(userItem);
                        const isSuperAdminUser = userItem.role === 'super_admin';

                        return (
                          <tr
                            key={userItem.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group ${
                              isSuperAdminUser ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''
                            }`}
                          >
                            {/* User info */}
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                {userItem.avatar ? (
                                  <div className="w-8 h-8 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700 shrink-0" style={{ backgroundImage: `url("${userItem.avatar}")` }} />
                                ) : (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black border text-[10px] shrink-0 ${
                                    userItem.role === 'super_admin' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                      : userItem.role === 'marketing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                      : userItem.role === 'head_section' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                      : ['approver', 'senior_manager', 'general_manager'].includes(userItem.role) ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                                  }`}>
                                    {userItem.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{userItem.name}</p>
                                    {userItem.isCurrentUser && (
                                      <span className="text-[7px] font-black text-primary bg-blue-50 dark:bg-blue-900/20 px-1 py-0.5 rounded uppercase tracking-widest shrink-0">(Anda)</span>
                                    )}
                                    {isSuperAdminUser && (
                                      <span className="text-[7px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-1 py-0.5 rounded uppercase tracking-widest shrink-0">Master</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 truncate">{userItem.email}</p>
                                </div>
                              </div>
                            </td>
                            {/* Division */}
                            <td className="px-5 py-3 hidden md:table-cell">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{userItem.division || '-'}</span>
                            </td>
                            {/* Role */}
                            <td className="px-5 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight border w-fit ${getRoleBadgeColor(userItem.role)}`}>
                                  {userItem.role === 'super_admin' ? 'Super Admin' :
                                   userItem.role === 'marketing' ? 'Admin' :
                                   userItem.role === 'head_section' ? 'Head Section' :
                                   ['approver', 'senior_manager', 'general_manager'].includes(userItem.role) ? 'Approver' : 'Umum'}
                                </span>
                                <span className="text-[10px] text-slate-400">{userItem.roleName}</span>
                              </div>
                            </td>
                             {/* Kontak */}
                            <td className="px-5 py-3 hidden sm:table-cell">
                              {userItem.phone ? (
                                <a 
                                  href={`https://wa.me/${formatPhoneForWhatsApp(userItem.phone)}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors group/link"
                                  title="Hubungi via WhatsApp"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-emerald-500 group-hover/link:scale-110 transition-transform">chat</span>
                                  {userItem.phone}
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">-</span>
                              )}
                            </td>
                            {/* Actions */}
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center gap-0.5 justify-end">
                                <button
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    canEdit ? 'text-slate-400 dark:text-slate-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                                  }`}
                                  disabled={!canEdit}
                                  title={canEdit ? (userItem.isCurrentUser ? 'Edit Profil Saya' : 'Edit Profil & Peran') : 'Tidak memiliki izin'}
                                  onClick={() => {
                                    if (canEdit) {
                                      setEditingUser(userItem);
                                      setShowEditUserModal(true);
                                    }
                                  }}
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    canDelete ? 'text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                                  }`}
                                  disabled={!canDelete}
                                  title={canDelete ? 'Hapus User' : userItem.isCurrentUser ? 'Tidak dapat menghapus akun sendiri' : 'Tidak memiliki izin hapus'}
                                  onClick={() => {
                                    if (canDelete) handleDeleteUser(userItem.id);
                                  }}
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer summary */}
            <div className="text-center py-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Menampilkan {sortedUsers.length} dari {totalUsers} pengguna
                {divisionFilter !== 'all' && ` · Divisi: ${divisionFilter}`}
                {searchQuery && ` · Pencarian: "${searchQuery}"`}
              </span>
            </div>
          </div>
          );
        })()}

        {/* Invite Code Management (Admin Only) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                    <span className="material-symbols-outlined text-primary fill">key</span>
                    Kode Undangan Form Registrasi
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Generate kode untuk pendaftaran akun baru. Kode membawa role dan divisi yang ditentukan oleh admin. Berlaku 24 jam dan sekali pakai.</p>
                </div>
              </div>
              {/* Generate Invite Code Form */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Konfigurasi Kode Undangan Baru</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Divisi Target</label>
                    <select
                      value={generateDivision}
                      onChange={(e) => setGenerateDivision(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:border-primary outline-none"
                    >
                      <option value="">Pilih Divisi...</option>
                      {getAvailableDivisionsForRole(generateRole).map((div) => (
                        <option key={div.value} value={div.value}>{div.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Level Akses</label>
                    <select
                      value={generateRole}
                      onChange={(e) => handleGenerateRoleChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:border-primary outline-none"
                    >
                      <option value="common">Umum (Common)</option>
                      <option value="marketing">Administrator (Marketing)</option>
                      {user?.role !== 'marketing' && (
                        <>
                          <option value="head_section">Head Section</option>
                          <option value="approver">Approver</option>
                          <option value="senior_manager">Senior Manager</option>
                          <option value="general_manager">General Manager</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleGenerateInviteCode}
                      disabled={generateLoading || !generateDivision}
                      className="w-full px-5 py-2.5 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center gap-2 justify-center shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">{generateLoading ? 'hourglass_empty' : 'add'}</span>
                      {generateLoading ? 'Membuat...' : 'Generate Kode'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
                    <th className="px-6 py-4">Kode</th>
                    <th className="px-6 py-4">Divisi / Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Dibuat Oleh</th>
                    <th className="px-6 py-4">Digunakan Oleh</th>
                    <th className="px-6 py-4">Kedaluwarsa</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {inviteCodesLoading ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Memuat data...</td></tr>
                  ) : inviteCodes.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Belum ada kode undangan</td></tr>
                  ) : (
                    inviteCodes.map((ic: any) => {
                      const status = getInviteCodeStatus(ic);
                      const roleLabels: Record<string, string> = {
                        marketing: 'Admin',
                        head_section: 'Head Section',
                        approver: 'Approver',
                        senior_manager: 'SR Manager',
                        general_manager: 'GM',
                        common: 'Umum',
                      };
                      return (
                        <tr key={ic.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-sm tracking-wider" style={{ color: '#003868' }}>{ic.code}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {ic.division && <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{ic.division}</span>}
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight w-fit ${
                                ic.role === 'marketing' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                                ic.role === 'common' ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' :
                                'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                              }`}>{roleLabels[ic.role] || 'Umum'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight border w-fit ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                            {ic.creator?.name || '-'}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                            {ic.used_by_user ? `${ic.used_by_user.name} (${ic.used_by_user.email})` : '-'}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                            {new Date(ic.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              {/* Copy — only for active unused codes */}
                              {!ic.used_by && new Date(ic.expires_at) > new Date() && ic.is_active && (
                                <button
                                  onClick={() => copyToClipboard(ic.code)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                  title="Salin Kode"
                                >
                                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                </button>
                              )}
                              {/* Revoke — only for active unused codes, and authorized user */}
                              {!ic.used_by && ic.is_active && (user?.role === 'super_admin' || user?.role === 'head_section' || ic.created_by === user?.id) && (
                                <button
                                  onClick={() => handleRevokeInviteCode(ic.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                  title="Cabut Kode"
                                >
                                  <span className="material-symbols-outlined text-[18px]">block</span>
                                </button>
                              )}
                              {/* Delete — only for used, expired, or revoked codes, and authorized user */}
                              {(ic.used_by || !ic.is_active || new Date(ic.expires_at) <= new Date()) && (user?.role === 'super_admin' || user?.role === 'head_section' || ic.created_by === user?.id) && (
                                <button
                                  onClick={() => handleDeleteInviteCode(ic.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Hapus Kode"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
                {inviteCodes.length} kode undangan
              </span>
            </div>
          </div>
        )}

        {/* Security Section - Full Width */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2 uppercase tracking-widest">
            <span className="material-symbols-outlined text-primary fill">lock</span>
            Keamanan Akun
          </h3>
          <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                placeholder="Minimal 5 karakter" 
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={5}
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
            <div className="md:col-span-3 flex justify-end mt-2">
              <button 
                type="submit"
                disabled={securityLoading}
                className="px-8 py-3 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {securityLoading ? 'Memperbarui...' : 'Perbarui Keamanan'}
              </button>
            </div>
          </form>
        </div>

        {/* Broadcast Notification Section - Super Admin Only */}
        {isSuperAdmin() && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-primary/5 to-transparent">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                <span className="material-symbols-outlined text-primary fill">campaign</span>
                Broadcast Notifikasi
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-1">
                Kirim pengumuman ke seluruh pengguna sistem secara instan.
              </p>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Judul Broadcast</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none transition-all" 
                  placeholder="Contoh: Pemeliharaan Sistem Dijadwalkan"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Isi Pesan Broadcast</label>
                <textarea 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none transition-all resize-none min-h-[120px]" 
                  placeholder="Tulis isi pengumuman lengkap di sini. Mendukung teks dan link (contoh: https://example.com)."
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  rows={5}
                />
                <p className="text-[10px] text-slate-400 font-medium italic">Link URL yang ditulis akan otomatis dapat diklik oleh penerima.</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleBroadcast}
                  disabled={broadcastLoading || !broadcastTitle.trim() || !broadcastContent.trim()}
                  className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                      <span className="material-symbols-outlined text-[20px]">send</span>
                  {broadcastLoading ? 'Mengirim...' : 'Kirim Broadcast'}
                </button>
              </div>
            </div>
          </div>
        )}

        
        {/* Edit User Modal */}
        {showEditUserModal && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Ubah Peran & Profil</h3>
                <button 
                  onClick={() => setShowEditUserModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-400 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Divisi</label>
                  <select
                    value={editingUser.division}
                    onChange={(e) => setEditingUser({ ...editingUser, division: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none"
                    required
                  >
                    <option value="">Pilih Divisi...</option>
                    {user?.role !== 'marketing' && (
                      <option value="Divisi Manajemen">Divisi Manajemen</option>
                    )}
                    <option value="Divisi Operasi">Divisi Operasi</option>
                    <option value="Divisi Keuangan">Divisi Keuangan</option>
                    <option value="Divisi Marketing & Sales">Divisi Marketing & Sales</option>
                    <option value="Divisi SDM & Umum">Divisi SDM & Umum</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
                
                {/* Self-edit restriction notice */}
                {isEditingSelf(editingUser) && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <span className="material-symbols-outlined text-blue-500 text-[16px]">info</span>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Anda dapat mengubah profil sendiri, tetapi tidak dapat mengubah role Anda sendiri.</span>
                  </div>
                )}

                {/* Role Status Select */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Peran Akses (Role)</label>
                  <select
                    value={editingUser.role === 'head_section' ? 'marketing' : editingUser.role}
                    onChange={(e) => {
                      const role = e.target.value as UserRoleType;
                      const updates: Partial<SystemUser> = { 
                        ...editingUser, 
                        role,
                        roleName: role === 'marketing' ? 'Marketing Staff' : role === 'approver' ? 'Senior Manager' : 'Surveyor'
                      };
                      // Auto-couple: marketing/head_section → Divisi Marketing & Sales
                      if (role === 'marketing' || role === 'head_section') {
                        updates.division = 'Divisi Marketing & Sales';
                      }
                      setEditingUser(updates as SystemUser);
                    }}
                    disabled={isEditingSelf(editingUser)}
                    className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none ${isEditingSelf(editingUser) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {user?.role === 'super_admin' && <option value="super_admin">Super Admin (IT)</option>}
                    <option value="marketing">Administrator (Marketing)</option>
                    {user?.role !== 'marketing' && <option value="approver">Approver / Manajemen</option>}
                    <option value="common">User Umum</option>
                  </select>
                </div>
                
                {/* Spesific Role Name Select */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Posisi Spesifik</label>
                  <select
                    value={editingUser.roleName}
                    onChange={(e) => {
                      const newRoleName = e.target.value as UserRoleName;
                      let newRole = editingUser.role;
                      
                      if (newRoleName === 'Head Section Marketing') newRole = 'head_section';
                      else if (editingUser.role === 'head_section') newRole = 'marketing';
                      
                      setEditingUser({ ...editingUser, roleName: newRoleName, role: newRole });
                    }}
                    disabled={isEditingSelf(editingUser)}
                    className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none ${isEditingSelf(editingUser) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {(editingUser.role === 'marketing' || editingUser.role === 'head_section') && (
                      <>
                        {user?.role !== 'marketing' && <option value="Head Section Marketing">Head Section Marketing</option>}
                        <option value="Marketing Staff">Marketing Staff</option>
                        <option value="Social Media Specialist">Social Media Specialist</option>
                        <option value="Content Strategist">Content Strategist</option>
                        <option value="Brand Manager">Brand Manager</option>
                      </>
                    )}
                    {editingUser.role === 'approver' && (
                      <>
                        <option value="Senior Manager">Senior Manager</option>
                        <option value="General Manager">General Manager</option>
                      </>
                    )}
                    {editingUser.role === 'common' && (
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


              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditUser}
                  disabled={editLoading}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {editLoading ? 'Menyimpan...' : 'Simpan Peran'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                      const updates = { 
                        ...newUser, 
                        role,
                        roleName: (role === 'marketing' ? 'Marketing Staff' : role === 'approver' ? 'Senior Manager' : 'Surveyor') as UserRoleName
                      };
                      // Auto-couple: marketing/head_section → Divisi Marketing & Sales
                      if (role === 'marketing' || role === 'head_section') {
                        updates.division = 'Divisi Marketing & Sales';
                      }
                      setNewUser(updates);
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none"
                  >
                    {user?.role === 'super_admin' && <option value="super_admin">Super Admin (IT)</option>}
                    <option value="marketing">Administrator (Marketing)</option>
                    {user?.role !== 'marketing' && <option value="approver">Approver</option>}
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
                        {user?.role !== 'marketing' && <option value="Head Section Marketing">Head Section Marketing</option>}
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
                  <select
                    value={newUser.division}
                    onChange={(e) => setNewUser({ ...newUser, division: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-primary/20 outline-none"
                    required
                  >
                    <option value="">Pilih Divisi...</option>
                    {user?.role !== 'marketing' && (
                      <option value="Divisi Manajemen">Divisi Manajemen</option>
                    )}
                    <option value="Divisi Operasi">Divisi Operasi</option>
                    <option value="Divisi Keuangan">Divisi Keuangan</option>
                    <option value="Divisi Marketing & Sales">Divisi Marketing & Sales</option>
                    <option value="Divisi SDM & Umum">Divisi SDM & Umum</option>
                    <option value="IT">IT</option>
                  </select>
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

        {/* Delete Confirmation Modal */}
        {deleteConfirmationUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-2xl transition-all border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
              {/* Header with warning style */}
              <div className="flex items-center gap-3 mb-5 text-red-600 dark:text-red-500">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30 border-2 border-current shrink-0">
                  <span className="material-symbols-outlined text-[26px]">warning</span>
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Konfirmasi Penghapusan</h3>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-red-500/70 dark:text-red-400/60">Tindakan Sangat Berbahaya</p>
                </div>
              </div>

              {/* Warnings details */}
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                <p>
                  Tindakan ini tidak dapat dibatalkan. Menghapus akun <strong className="font-extrabold text-slate-900 dark:text-white">{deleteConfirmationUser.name}</strong> ({deleteConfirmationUser.email}) akan menghapus seluruh data dan aksesnya secara permanen dari sistem.
                </p>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] mt-0.5 select-none">info</span>
                  <span>Silakan ketik nama lengkap pengguna berikut dalam huruf kapital (**CAPSLOCK**) untuk melanjutkan.</span>
                </div>
              </div>

              {/* Target name display container */}
              <div className="mb-4">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama yang harus diketik:</label>
                <div className="select-all tracking-widest font-black text-center text-sm py-3 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100">
                  {deleteConfirmationUser.name.toUpperCase()}
                </div>
              </div>

              {/* Input for verification */}
              <div className="mb-6">
                <input
                  type="text"
                  value={deleteVerifyNameInput}
                  onChange={(e) => setDeleteVerifyNameInput(e.target.value.toUpperCase())}
                  placeholder="Ketik nama lengkap pengguna di sini..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none transition-all uppercase"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteConfirmationUser(null);
                    setDeleteVerifyNameInput('');
                  }}
                  disabled={deleteConfirmLoading}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={executeDeleteUser}
                  disabled={deleteVerifyNameInput.trim() !== deleteConfirmationUser.name.toUpperCase() || deleteConfirmLoading}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/20"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  {deleteConfirmLoading ? 'Menghapus...' : 'Hapus Akun'}
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