import React from 'react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, label = 'Kembali', className = '' }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group mb-4 ${className}`}
      type="button"
    >
      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-primary group-hover:bg-primary/5 transition-all">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
      </div>
      <span className="font-bold text-sm">{label}</span>
    </button>
  );
};

export default BackButton;