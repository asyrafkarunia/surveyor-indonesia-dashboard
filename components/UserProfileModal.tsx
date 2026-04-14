import React from 'react';

interface UserProfileModalProps {
  user: {
    id: number | string;
    name: string;
    email?: string;
    avatar?: string;
    division?: string;
    phone?: string;
    roleName?: string;
    status?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose }) => {
  const [copiedType, setCopiedType] = React.useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with extreme blur */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-800 shadow-2xl shadow-slate-900/20 border border-white dark:border-slate-700 animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-500 ease-out">
        
        {/* Dynamic Header Decoration */}
        <div className="absolute top-0 inset-x-0 h-32 bg-linear-to-br from-primary via-primary/80 to-teal-500 opacity-10 dark:opacity-20 pointer-events-none" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 size-8 flex items-center justify-center rounded-full bg-slate-900/5 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-900/10 dark:hover:bg-white/10 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="px-8 pb-10 pt-12 relative flex flex-col items-center text-center">
          
          {/* Avatar Section with Pulse Effect */}
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-primary/10 rounded-full animate-pulse blur-xl" />
            <div className="size-28 rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl relative z-10 bg-slate-100 dark:bg-slate-700">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-400 dark:text-slate-500 font-black text-3xl">
                  {initials}
                </div>
              )}
            </div>
            
            {/* Status Indicator */}
            <div className={`absolute bottom-1 right-1 size-6 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center z-20 ${user.status === 'Aktif' || !user.status ? 'bg-green-500' : 'bg-amber-500'}`}>
              <span className="material-symbols-outlined text-white text-[12px] font-black">
                {user.status === 'Aktif' || !user.status ? 'check' : 'schedule'}
              </span>
            </div>
          </div>

          {/* Identity Section */}
          <div className="space-y-1 mb-8">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h3>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                {user.division || 'Umum'}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-600">
                {user.roleName || 'Surveyor'}
              </span>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="w-full grid grid-cols-1 gap-3">
            
            {/* Email Card */}
            <div 
              onClick={() => user.email && handleCopy(user.email, 'email')}
              className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 group hover:border-primary/50 transition-all text-left cursor-pointer relative overflow-hidden"
            >
              <div className="size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">{copiedType === 'email' ? 'check' : 'mail'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Alamat Email</p>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{user.email || 'Email tidak tersedia'}</p>
              </div>
              <div className={`absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-primary text-white text-[8px] font-black uppercase tracking-wider transition-all ${copiedType === 'email' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                Copied!
              </div>
              <span className={`material-symbols-outlined text-slate-300 group-hover:text-primary transition-all ${copiedType === 'email' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>content_copy</span>
            </div>

            {/* Phone Card */}
            <div 
              onClick={() => user.phone && handleCopy(user.phone, 'phone')}
              className={`flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 group transition-all text-left relative overflow-hidden ${user.phone ? 'hover:border-teal-500/50 cursor-pointer' : 'opacity-60 grayscale'}`}
            >
              <div className="size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-teal-500 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">{copiedType === 'phone' ? 'double_check' : 'call'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Nomor Telepon</p>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{user.phone || 'Belum diatur'}</p>
              </div>
              <div className={`absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-teal-600 text-white text-[8px] font-black uppercase tracking-wider transition-all ${copiedType === 'phone' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                Copied!
              </div>
              {user.phone && <span className={`material-symbols-outlined text-slate-300 group-hover:text-teal-500 transition-all ${copiedType === 'phone' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>content_copy</span>}
            </div>
            
          </div>

          <p className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] pointer-events-none">
            PT Surveyor Indonesia
          </p>
          
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
