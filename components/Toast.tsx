import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

let addToastGlobal: (message: string, type?: ToastType) => void = () => {};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastGlobal = (message: string, type: ToastType = 'info') => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border outline-none
            animate-in fade-in slide-in-from-top-2 duration-300
            ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
              'bg-blue-50 border-blue-200 text-blue-800'} 
            dark:bg-slate-800 dark:border-slate-700 dark:text-white`}
        >
          <span className="material-symbols-outlined shrink-0 text-xl">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <p className="text-sm font-medium pr-4">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};

// Global initializer
let rootInitialzed = false;

export const showToast = (message: string, type: ToastType = 'info') => {
  if (!rootInitialzed) {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);
    root.render(<ToastContainer />);
    rootInitialzed = true;
    
    // allow mounting
    setTimeout(() => {
      addToastGlobal(message, type);
    }, 50);
  } else {
    addToastGlobal(message, type);
  }
};
