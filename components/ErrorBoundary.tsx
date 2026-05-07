import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Menggunakan 'as any' pada inheritance untuk mengatasi masalah inferensi tipe di lingkungan ini
class ErrorBoundary extends (Component as any) {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log technical details to console only (for developers with DevTools open)
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-10 shadow-xl text-center">
            {/* Friendly Icon */}
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-500 text-4xl">warning</span>
            </div>

            <h1 className="mb-3 text-xl font-black text-slate-900 dark:text-white">
              Terjadi Kesalahan
            </h1>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Halaman ini mengalami kendala yang tidak terduga. 
              Silakan muat ulang halaman atau kembali ke beranda.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full rounded-xl bg-primary px-4 py-3 font-black text-xs uppercase tracking-widest text-white transition-colors hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Muat Ulang Halaman
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/dashboard';
                }}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-700 px-4 py-3 font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">home</span>
                Kembali ke Beranda
              </button>
            </div>

            <p className="mt-6 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Jika masalah terus berlanjut, hubungi tim teknis.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
