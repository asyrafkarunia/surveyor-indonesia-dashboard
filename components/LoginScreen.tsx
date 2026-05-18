import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

/* ─── Inline SVG: MARS Logo (globe + bar chart + orbiting arrow) ─── */
const MarsLogo: React.FC<{ className?: string; style?: React.CSSProperties; color?: string }> = ({ className, style, color = 'currentColor' }) => (
  <svg viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    {/* Minimalist Planet Core (Data Bars) */}
    <g transform="translate(40, 40)">
      <rect x="35" y="45" width="14" height="40" rx="7" fill={color} opacity="0.7" />
      <rect x="55" y="25" width="14" height="80" rx="7" fill={color} />
      <rect x="75" y="40" width="14" height="50" rx="7" fill={color} opacity="0.8" />
      
      {/* The AI Guardian Helmet — Geometric Orbit */}
      {/* The Cosmic Comet Path — Geometric Orbit */}
      <circle cx="65" cy="65" r="58" stroke={color} strokeWidth="8" strokeDasharray="300 100" strokeLinecap="round" opacity="0.6" transform="rotate(-30 65 65)" fill="none" />
      
      {/* The Moon/Planetoid — Professional minimalist head */}
      <circle cx="118" cy="42" r="10" fill={color} opacity="0.9" />
    </g>
    {/* MARS text */}
    <text x="185" y="105" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="88" fill={color} letterSpacing="-0.02em">
      MARS
    </text>
    {/* Subtitle */}
    <text x="188" y="136" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="16" fill={color} opacity="0.6" letterSpacing="0.4em">
      MARKETING ANALYST REPORT SYSTEM
    </text>
  </svg>
);

/* ─── MARS Icon Only (for sidebar/small contexts) ─── */
export const MarsIconLogo: React.FC<{ className?: string; color?: string }> = ({ className, color = 'currentColor' }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Glow background integrated in SVG if needed */}
    <circle cx="80" cy="80" r="55" fill="url(#iconGlow)" opacity="0.15" />
    
    {/* Planet Core (Stats) */}
    <rect x="52" y="70" width="14" height="40" rx="7" fill={color} opacity="0.7" />
    <rect x="73" y="45" width="14" height="85" rx="7" fill={color} />
    <rect x="94" y="65" width="14" height="50" rx="7" fill={color} opacity="0.8" />
    
    {/* Cosmic Orbit Path — Geometric Orbit */}
    <circle cx="80" cy="80" r="62" stroke={color} strokeWidth="9" strokeDasharray="320 100" strokeLinecap="round" opacity="0.6" transform="rotate(-35 80 80)" fill="none" />
    
    {/* The Moon/Planetoid — Sophisticated celestial head */}
    <circle cx="138" cy="52" r="12" fill={color} opacity="0.9" />
    
    <defs>
      <radialGradient id="iconGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(80 80) rotate(90) scale(60)">
        <stop stopColor={color} />
        <stop offset="1" stopColor={color} stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

/* ─── Danantara Indonesia Logo (image) ─── */
const DanantaraLogo: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <img src="/logos/Danantara_Indonesia_Logo_vector-White-1.png" alt="Danantara Indonesia" className={className} style={{ objectFit: 'contain', ...style }} />
);

/* ─── IDSurvey Logo (image) ─── */
const IDSurveyLogo: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <img src="/logos/logo-id-survey-white.png" alt="IDSurvey - Testing · Inspection · Certification" className={className} style={{ objectFit: 'contain', ...style }} />
);

/* ─── Surveyor Indonesia Logo (image) ─── */
const SurveyorIndonesiaLogo: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <img src="/logos/surveyor indonesia logo putih.webp" alt="Surveyor Indonesia" className={className} style={{ objectFit: 'contain', ...style }} />
);

/* ─── Large watermark logo for left panel background ─── */
const MarsWatermark: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <rect x="52" y="70" width="14" height="40" rx="7" fill="white" opacity="0.4" />
    <rect x="73" y="45" width="14" height="85" rx="7" fill="white" opacity="0.6" />
    <rect x="94" y="65" width="14" height="50" rx="7" fill="white" opacity="0.4" />
    <circle cx="80" cy="80" r="62" stroke="white" strokeWidth="9" strokeDasharray="320 100" strokeLinecap="round" opacity="0.3" transform="rotate(-35 80 80)" fill="none" />
    <circle cx="138" cy="52" r="12" fill="white" opacity="0.5" />
  </svg>
);

/* ─── Division Options ─── */
const DIVISIONS = [
  'Divisi Manajemen',
  'Divisi Operasi',
  'Divisi Keuangan',
  'Divisi Marketing & Sales',
  'Divisi SDM & Umum',
];

/* ─── A reusable input row component (OUTSIDE LoginScreen to prevent focus loss) ─── */
const InputField: React.FC<{
  id: string;
  icon: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
  isVisible?: boolean;
  focusedField: string | null;
  setFocusedField: (v: string | null) => void;
}> = ({ id, icon, type, value, onChange, placeholder, required = true, showToggle, onToggle, isVisible, focusedField, setFocusedField }) => (
  <div className="relative">
    <div
      className="flex items-center rounded-xl border-2 transition-all duration-300"
      style={{
        borderColor: focusedField === id ? '#00B4AE' : '#E2E8F0',
        boxShadow: focusedField === id ? '0 0 0 4px rgba(0,180,174,0.1)' : 'none',
        background: focusedField === id ? '#F0FDFA' : '#F8FAFC',
      }}
    >
      <span
        className="material-symbols-outlined pl-4 text-lg transition-colors duration-300"
        style={{ color: focusedField === id ? '#00B4AE' : '#94A3B8' }}
      >
        {icon}
      </span>
      <input
        id={id}
        type={showToggle ? (isVisible ? 'text' : 'password') : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocusedField(id)}
        onBlur={() => setFocusedField(null)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-transparent border-none outline-none px-3 py-3.5 text-sm text-slate-800 placeholder-slate-400"
        style={{ boxShadow: 'none' }}
      />
      {showToggle && (
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          className="pr-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">
            {isVisible ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      )}
    </div>
  </div>
);



const LoginScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'verification-sent'>('login');
  
  // URL Parameter Handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifiedStatus = params.get('verified');
    const mode = params.get('mode');
    const token = params.get('token');
    const resetEmail = params.get('email');

    if (verifiedStatus === 'success') {
      setActiveTab('login');
      setSuccessMessage('Email berhasil diverifikasi! Silakan login.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (verifiedStatus === 'error' || verifiedStatus === 'already') {
      const msg = params.get('message') || 'Terjadi kesalahan verifikasi.';
      setActiveTab('login');
      setError(msg);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (mode === 'reset-password' && token && resetEmail) {
      setActiveTab('reset-password');
      setResetToken(token);
      setEmail(resetEmail);
      // Don't clean up token yet, we need it for the form
    }
  }, []);
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [transitionFadeOut, setTransitionFadeOut] = useState(false);
  const { login } = useAuth();

  // Register state
  const [inviteCode, setInviteCode] = useState('');
  const [inviteCodeValid, setInviteCodeValid] = useState<boolean | null>(null);
  const [inviteCodeMessage, setInviteCodeMessage] = useState('');
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false);
  const [inviteCodeRole, setInviteCodeRole] = useState('');
  const [inviteCodeRoleLabel, setInviteCodeRoleLabel] = useState('');
  const [inviteCodeDivision, setInviteCodeDivision] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Forgot/Reset Password state
  const [resetToken, setResetToken] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [notVerifiedEmail, setNotVerifiedEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Show transition animation first
      setLoginSuccess(true);
      // Wait for animation to play, then actually login
      await new Promise(resolve => setTimeout(resolve, 1600));
      setTransitionFadeOut(true);
      await new Promise(resolve => setTimeout(resolve, 400));
      await login(email, password);
    } catch (err: any) {
      setLoginSuccess(false);
      setTransitionFadeOut(false);
      
      if (err?.response?.status === 403 && err?.response?.data?.not_verified) {
        setNotVerifiedEmail(err.response.data.email || email);
        setActiveTab('verification-sent');
        setError('');
      } else {
        setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleValidateInviteCode = async () => {
    if (inviteCode.length !== 8) {
      setInviteCodeMessage('Kode undangan harus 8 karakter.');
      setInviteCodeValid(false);
      return;
    }
    setInviteCodeLoading(true);
    setInviteCodeMessage('');
    try {
      const res = await api.validateInviteCode(inviteCode);
      setInviteCodeValid(res.valid);
      setInviteCodeMessage(res.message);
      // Store role and division metadata from invite code
      if (res.valid) {
        setInviteCodeRole(res.role || 'common');
        setInviteCodeRoleLabel(res.role_label || 'Umum');
        setInviteCodeDivision(res.division || '');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Gagal memvalidasi kode.';
      setInviteCodeValid(false);
      setInviteCodeMessage(msg);
    } finally {
      setInviteCodeLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!inviteCodeValid) {
      setRegError('Silakan validasi kode undangan terlebih dahulu.');
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setRegError('Password dan konfirmasi password tidak cocok.');
      return;
    }
    if (regPassword.length < 5) {
      setRegError('Password minimal 5 karakter.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await api.registerWithInvite({
        invite_code: inviteCode,
        name: regName,
        email: regEmail,
        password: regPassword,
        password_confirmation: regPasswordConfirm,
      });
      setRegSuccess(true);
      if (res.requires_verification) {
        setNotVerifiedEmail(regEmail);
        setActiveTab('verification-sent');
      } else if (res.user && res.token) {
        // Legacy flow if verification is disabled
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      const errData = err?.response?.data;
      if (errData?.errors) {
        const firstError = Object.values(errData.errors).flat()[0] as string;
        setRegError(firstError || 'Registrasi gagal.');
      } else {
        setRegError(errData?.message || err.message || 'Registrasi gagal. Silakan coba lagi.');
      }
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Silakan masukkan email Anda.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.forgotPassword(email);
      setResetSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim email reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regPasswordConfirm) {
      setError('Password konfirmasi tidak cocok.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.resetPassword({
        token: resetToken,
        email: email,
        password: regPassword,
        password_confirmation: regPasswordConfirm,
      });
      setResetSuccess(true);
      setTimeout(() => {
        setActiveTab('login');
        setResetSuccess(false);
        setRegPassword('');
        setRegPasswordConfirm('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      // In a real app we'd need a token or special endpoint for unauthenticated resend
      // but for this demo logic, we assume we use the email
      await api.resendVerification(notVerifiedEmail || email);
      setResendMessage('Email verifikasi telah dikirim ulang! Silakan cek inbox Anda.');
    } catch (err: any) {
      setResendMessage('Gagal mengirim ulang email verifikasi. Silakan coba lagi nanti.');
    } finally {
      setResendLoading(false);
    }
  };



  return (
    <>
    {/* ═══════════ LOGIN SUCCESS TRANSITION OVERLAY ═══════════ */}
    {loginSuccess && (
      <div
        className={`fixed inset-0 z-9999 flex flex-col items-center justify-center ${transitionFadeOut ? 'login-transition-fadeout' : 'login-transition-bg'}`}
        style={{
          background: '#003868',
        }}
      >
        {/* Dynamic Water Ripple Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-60" style={{
            background: 'radial-gradient(circle at 50% 50%, #005596 0%, #001d3d 100%)',
          }} />

          {/* Resonating Ripples */}
          <div className="absolute top-1/2 left-1/2 w-0 h-0">
             <div className="animate-ripple-expand absolute w-[400px] h-[400px] rounded-full border border-white/20" />
             <div className="animate-ripple-expand absolute w-[400px] h-[400px] rounded-full border border-cyan-400/20" style={{ animationDelay: '2s' }} />
             <div className="animate-ripple-expand absolute w-[400px] h-[400px] rounded-full border border-white/10" style={{ animationDelay: '4s' }} />
          </div>

          <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[#00B4AE] blur-[150px] animate-pulse opacity-10"></div>
        </div>

        <div className="login-transition-content flex flex-col items-center relative z-10">
          {/* MARS Logo Area - Seamless */}
          <div className="loading-logo-pulse mb-10 relative flex flex-col items-center justify-center">
             <div className="absolute inset-0 bg-[#00B4AE] blur-[30px] opacity-40 rounded-full scale-[1.5] animate-pulse"></div>
             <MarsIconLogo className="w-28 h-28 relative z-10 drop-shadow-[0_0_20px_rgba(0,180,174,0.6)]" color="white" />
          </div>

          {/* App name */}
          <h2 className="text-3xl font-black text-white tracking-[0.2em] mb-2 uppercase drop-shadow-lg">MARS</h2>
          <p className="text-cyan-400 text-[10px] tracking-[0.45em] font-bold uppercase mb-16 opacity-80">
            Marketing Analysis Report System
          </p>

          {/* Progress Section */}
          <div className="flex flex-col items-center w-64">
            {/* Premium Progress bar */}
            <div className="w-full h-1 rounded-full overflow-hidden mb-4 bg-white/5 backdrop-blur-sm">
              <div
                className="login-transition-progress h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #00B4AE, #a5f3f2, #00B4AE)',
                  boxShadow: '0 0 15px rgba(0, 180, 174, 0.4)'
                }}
              />
            </div>

            {/* Status text */}
            <p className="text-[13px] text-slate-300 font-medium tracking-wide">
              Menyiapkan Dashboard...
            </p>
          </div>
        </div>
      </div>
    )}

    <style>{`
      body {
        height: auto !important;
        min-height: 100vh !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
    `}</style>
    <div className="flex flex-col min-h-screen w-full relative bg-[#003868] overflow-x-hidden overflow-y-auto" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ═══════════ LIGHTWEIGHT STATIC BACKGROUND ═══════════ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{
        background: 'radial-gradient(circle at 30% 40%, #004b87 0%, #001d3d 60%, #000c1a 100%)'
      }}>
        {/* Simple static cosmic dust overlay */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0'
        }}></div>
      </div>



      {/* Large watermark MARS logo */}
      <div className="login-glow fixed inset-0 items-center justify-center pointer-events-none overflow-hidden z-0 mask-image-gradient hidden lg:flex">
        <MarsWatermark style={{ width: '90%', maxWidth: 750, opacity: 0.03, transform: 'rotate(-5deg) translateX(-15%)' }} />
      </div>



      {/* ═══════════ CENTERED PAGE GROUP (header + content stay together on zoom) ═══════════ */}
      <div className="flex flex-col flex-1 w-full relative z-10 items-center min-h-screen px-0 py-8 sm:p-12">
        <div className="w-full max-w-7xl my-auto flex flex-col items-center gap-y-8 lg:gap-y-12">

          {/* ── TOP CORPORATE LOGO BAR ── */}
          <header className="hidden lg:flex w-full items-center justify-between shrink-0">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full scale-[2]"></div>
            <DanantaraLogo className="w-auto relative z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]" style={{ objectFit: 'contain', height: 95, maxWidth: 300, filter: 'brightness(1.1) contrast(1.05)', margin: '-22px 0' }} />
          </div>
          <div className="relative flex items-center justify-center flex-1 px-8 sm:px-16">
            <div className="absolute inset-0 bg-white/10 blur-[30px] rounded-full scale-[2]"></div>
            <IDSurveyLogo className="w-auto relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]" style={{ objectFit: 'contain', height: 44, maxWidth: 200 }} />
          </div>
          <div className="relative flex items-center justify-center ml-auto">
            <div className="absolute inset-0 bg-white/10 blur-[25px] rounded-full scale-[2]"></div>
            <SurveyorIndonesiaLogo className="w-auto relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]" style={{ objectFit: 'contain', height: 68, maxWidth: 220, margin: '-8px 0' }} />
          </div>
        </header>

          {/* ── MAIN CONTENT ── */}
          <div className="flex w-full items-center justify-center px-0 sm:px-4 shrink-0">
        
        {/* ─── LEFT BRAND PANEL (UNIFIED) ─── */}
        <div className="hidden lg:flex w-1/2 flex-col items-center justify-center px-10 xl:px-16 login-fade-in relative z-10 shrink-0">
          {/* MARS Branding Group — locked together */}
          <div className="flex flex-col items-center text-center">
            {/* MARS Logo Icon — Refined as a twinkling star */}
            <div className="loading-logo-pulse loading-breathe animate-star-twinkle mb-6 relative flex items-center justify-center rounded-full">
              <div className="absolute inset-0 bg-[#00B4AE] blur-3xl opacity-30 rounded-full scale-[1.3]"></div>
              <MarsIconLogo className="w-28 h-28 xl:w-36 xl:h-36 relative z-10 drop-shadow-[0_0_25px_rgba(0,180,174,0.7)]" color="white" />
            </div>

            {/* MARS Name */}
            <h1
              className="text-5xl xl:text-7xl font-black text-white tracking-[0.15em] mb-2 relative z-10"
              style={{ textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
            >
              MARS
            </h1>

            {/* Subtitle */}
            <p className="text-cyan-400 text-xs xl:text-sm font-bold tracking-[0.35em] uppercase mb-8 relative z-10 drop-shadow-sm">
              Marketing Analysis Report System
            </p>

            {/* Divider */}
            <div className="w-16 h-[2px] mb-6 relative z-10" style={{ background: 'linear-gradient(90deg, transparent, #00B4AE, transparent)' }} />

            {/* Description */}
            <p className="text-sky-100/90 text-sm xl:text-[15px] leading-relaxed mb-8 max-w-sm font-medium relative z-10 drop-shadow-sm">
              Platform terpadu untuk pengelolaan, analisis, dan pelaporan marketing
              PT Surveyor Indonesia (Persero) Cabang Pekanbaru.
            </p>

            <div className="flex items-center gap-3 relative z-10">
              <span className="inline-block w-10 h-[1.5px]" style={{ background: 'linear-gradient(90deg, #00B4AE, transparent)' }} />
              <p className="text-sky-200/50 text-[9px] xl:text-[10px] font-black tracking-[0.4em] uppercase">
                PT Surveyor Indonesia (Persero)
              </p>
              <span className="inline-block w-10 h-[1.5px]" style={{ background: 'linear-gradient(270deg, #00B4AE, transparent)' }} />
            </div>
          </div>
        </div>

        {/* ─── RIGHT FORM PANEL (GLASS CARD) ─── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center relative px-2 sm:px-6 py-4 shrink-0">
          
          <div className="w-full max-w-[460px] relative z-20 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-white/60 p-6 sm:p-10 login-fade-in">
            {/* Mobile header (Inside Glass Card) */}
            <div className="lg:hidden flex flex-col items-center mb-8 pb-8 border-b border-slate-100">
              <div className="loading-logo-pulse animate-star-twinkle mb-5 relative flex items-center justify-center rounded-full">
                <div className="absolute inset-0 bg-[#00B4AE] blur-[25px] opacity-25 rounded-full scale-150"></div>
                <MarsIconLogo className="w-20 h-20 relative z-10 drop-shadow-lg" color="#003868" />
              </div>
              <h1 className="text-3xl font-black tracking-widest text-[#003868]">MARS</h1>
              <p className="text-[10px] tracking-[0.3em] font-bold text-slate-400 mt-2 uppercase text-center">
                Marketing Analysis Report System
              </p>
            </div>

            {/* ─── Tab Toggle ─── */}
            <div className="login-fade-in flex justify-center mb-8">
              <div className="inline-flex rounded-full p-1" style={{ background: '#F1F5F9' }}>
                <button
                  id="tab-login"
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="px-7 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
                  style={{
                    background: activeTab === 'login'
                      ? 'linear-gradient(135deg, #003868, #00B4AE)'
                      : 'transparent',
                    color: activeTab === 'login' ? 'white' : '#64748B',
                    boxShadow: activeTab === 'login'
                      ? '0 2px 10px rgba(0,56,104,0.25)'
                      : 'none',
                  }}
                >
                  Login
                </button>
                <button
                  id="tab-register"
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="px-7 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
                  style={{
                    background: activeTab === 'register'
                      ? 'linear-gradient(135deg, #003868, #00B4AE)'
                      : 'transparent',
                    color: activeTab === 'register' ? 'white' : '#64748B',
                    boxShadow: activeTab === 'register'
                      ? '0 2px 10px rgba(0,56,104,0.25)'
                      : 'none',
                  }}
                >
                  Registrasi
                </button>
              </div>
            </div>

            {/* ═══════════ LOGIN FORM ═══════════ */}
            {activeTab === 'login' && (
              <div className="login-fade-in-delayed">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">
                    Login Aplikasi
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Masukan email dan password kamu.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {successMessage && (
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
                      style={{
                        background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
                        color: '#16A34A',
                        border: '1px solid #BBF7D0',
                      }}
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {error && (
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm login-shake"
                      style={{
                        background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                      }}
                    >
                      <span className="material-symbols-outlined text-lg">error</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat Email</label>
                    <InputField
                      id="login-email"
                      icon="mail"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="Masukan alamat email"
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                    />
                  </div>

                  <div>
                    <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                    <InputField
                      id="login-password"
                      icon="lock"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="Masukan password"
                      showToggle
                      onToggle={() => setShowPassword(!showPassword)}
                      isVisible={showPassword}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                    />
                  </div>

                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => {
                        setActiveTab('forgot-password');
                        setError('');
                        setResetSuccess(false);
                      }}
                      className="text-sm font-semibold hover:underline" 
                      style={{ color: '#003868' }}
                    >
                      Lupa Password ?
                    </button>
                  </div>

                  <button
                    id="login-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl px-4 py-3.5 font-semibold text-white text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: loading
                        ? '#94A3B8'
                        : 'linear-gradient(135deg, #003868 0%, #005a8c 50%, #00B4AE 100%)',
                      boxShadow: loading
                        ? 'none'
                        : '0 4px 15px rgba(0,56,104,0.35), 0 1px 3px rgba(0,180,174,0.2)',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                        (e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(0,56,104,0.4), 0 2px 6px rgba(0,180,174,0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                      (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0,56,104,0.35), 0 1px 3px rgba(0,180,174,0.2)';
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Memproses...
                      </span>
                    ) : (
                      'Login'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-400">
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="font-semibold hover:underline"
                      style={{ color: '#003868' }}
                    >
                      Daftar Sekarang
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ═══════════ REGISTRATION FORM ═══════════ */}
            {activeTab === 'register' && (
              <div className="login-fade-in-delayed">
                {regSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{
                      background: 'linear-gradient(135deg, #00B4AE, #003868)',
                    }}>
                      <span className="material-symbols-outlined text-3xl text-white">check_circle</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Pendaftaran Berhasil! 🎉</h3>
                    <p className="text-slate-500 text-sm">
                      Akun Anda telah berhasil dibuat. Mengalihkan ke dashboard...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-slate-800">
                        Daftar Sekarang
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">
                        Silakan masukkan kode undangan dan lengkapi form di bawah ini.
                      </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                      {regError && (
                        <div
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm login-shake"
                          style={{
                            background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                          }}
                        >
                          <span className="material-symbols-outlined text-lg">error</span>
                          <span>{regError}</span>
                        </div>
                      )}

                      {/* Invite Code */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kode Undangan</label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <div
                              className="flex items-center rounded-xl border-2 transition-all duration-300"
                              style={{
                                borderColor: inviteCodeValid === true ? '#00B4AE' : inviteCodeValid === false ? '#EF4444' : focusedField === 'invite-code' ? '#00B4AE' : '#E2E8F0',
                                boxShadow: focusedField === 'invite-code' ? '0 0 0 4px rgba(0,180,174,0.1)' : 'none',
                                background: focusedField === 'invite-code' ? '#F0FDFA' : '#F8FAFC',
                              }}
                            >
                              <span
                                className="material-symbols-outlined pl-4 text-lg transition-colors duration-300"
                                style={{ color: inviteCodeValid === true ? '#00B4AE' : inviteCodeValid === false ? '#EF4444' : focusedField === 'invite-code' ? '#00B4AE' : '#94A3B8' }}
                              >
                                key
                              </span>
                              <input
                                id="invite-code"
                                type="text"
                                value={inviteCode}
                                onChange={(e) => {
                                  setInviteCode(e.target.value.toUpperCase().slice(0, 8));
                                  setInviteCodeValid(null);
                                  setInviteCodeMessage('');
                                }}
                                onFocus={() => setFocusedField('invite-code')}
                                onBlur={() => setFocusedField(null)}
                                required
                                placeholder="Masukan kode undangan"
                                maxLength={8}
                                className="w-full bg-transparent border-none outline-none px-3 py-3.5 text-sm text-slate-800 placeholder-slate-400 uppercase tracking-wider font-mono"
                                style={{ boxShadow: 'none', letterSpacing: '0.15em' }}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleValidateInviteCode}
                            disabled={inviteCodeLoading || inviteCode.length < 1}
                            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-50 shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, #003868, #00B4AE)',
                              boxShadow: '0 2px 8px rgba(0,56,104,0.2)',
                            }}
                          >
                            {inviteCodeLoading ? (
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : 'Validasi'}
                          </button>
                        </div>
                        {inviteCodeMessage && (
                          <p className="text-xs mt-1.5 ml-1" style={{ color: inviteCodeValid ? '#00B4AE' : '#EF4444' }}>
                            {inviteCodeValid && <span className="material-symbols-outlined text-xs mr-1 align-middle">check_circle</span>}
                            {inviteCodeValid === false && <span className="material-symbols-outlined text-xs mr-1 align-middle">cancel</span>}
                            {inviteCodeMessage}
                          </p>
                        )}
                      </div>

                      {/* Rest of the form — only shown after invite code is validated */}
                      {inviteCodeValid && (
                        <div className="space-y-4 login-fade-in mt-4 pt-4 border-t border-slate-100 pr-2 pb-2">
                          {/* Auto-assigned Role & Division Badge */}
                          <div
                            className="rounded-xl p-3.5 border-2 transition-all duration-300"
                            style={{
                              background: 'linear-gradient(135deg, #F0FDFA, #F0F9FF)',
                              borderColor: '#00B4AE',
                              borderStyle: 'dashed',
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="material-symbols-outlined text-sm" style={{ color: '#00B4AE' }}>verified</span>
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#00B4AE' }}>Tipe Akses Anda</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {inviteCodeDivision && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: '#003868', color: 'white' }}>
                                  <span className="material-symbols-outlined text-xs">business</span>
                                  {inviteCodeDivision}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold" style={{
                                background: inviteCodeRole === 'marketing' ? '#DC2626' : inviteCodeRole === 'common' ? '#64748B' : '#7C3AED',
                                color: 'white',
                              }}>
                                <span className="material-symbols-outlined text-xs">shield</span>
                                {inviteCodeRoleLabel}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap</label>
                            <InputField
                              id="reg-name"
                              icon="person"
                              type="text"
                              value={regName}
                              onChange={setRegName}
                              placeholder="Masukan nama lengkap"
                              focusedField={focusedField}
                              setFocusedField={setFocusedField}
                            />
                          </div>

                          <div>
                            <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat Email</label>
                            <InputField
                              id="reg-email"
                              icon="mail"
                              type="email"
                              value={regEmail}
                              onChange={setRegEmail}
                              placeholder="Masukan alamat email"
                              focusedField={focusedField}
                              setFocusedField={setFocusedField}
                            />
                          </div>

                          <div>
                            <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                            <InputField
                              id="reg-password"
                              icon="lock"
                              type="password"
                              value={regPassword}
                              onChange={setRegPassword}
                              placeholder="Buat password (min. 5 karakter)"
                              showToggle
                              onToggle={() => setShowRegPassword(!showRegPassword)}
                              isVisible={showRegPassword}
                              focusedField={focusedField}
                              setFocusedField={setFocusedField}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Konfirmasi Password</label>
                            <InputField
                              id="reg-password-confirm"
                              icon="lock"
                              type="password"
                              value={regPasswordConfirm}
                              onChange={setRegPasswordConfirm}
                              placeholder="Ulangi password"
                              showToggle
                              onToggle={() => setShowRegPassword(!showRegPassword)}
                              isVisible={showRegPassword}
                              focusedField={focusedField}
                              setFocusedField={setFocusedField}
                            />
                          </div>

                          <button
                            id="register-submit"
                            type="submit"
                            disabled={regLoading}
                            className="w-full rounded-xl px-4 py-3.5 font-semibold text-white text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: regLoading
                                ? '#94A3B8'
                                : 'linear-gradient(135deg, #003868 0%, #005a8c 50%, #00B4AE 100%)',
                              boxShadow: regLoading
                                ? 'none'
                                : '0 4px 15px rgba(0,56,104,0.35), 0 1px 3px rgba(0,180,174,0.2)',
                            }}
                            onMouseEnter={(e) => {
                              if (!regLoading) {
                                (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                                (e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(0,56,104,0.4), 0 2px 6px rgba(0,180,174,0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                              (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(0,56,104,0.35), 0 1px 3px rgba(0,180,174,0.2)';
                            }}
                          >
                            {regLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Mendaftarkan...
                              </span>
                            ) : (
                              'Daftar Akun'
                            )}
                          </button>
                        </div>
                      )}
                    </form>

                    <div className="mt-6 text-center">
                      <p className="text-sm text-slate-400">
                        Sudah punya akun?{' '}
                        <button
                          type="button"
                          onClick={() => setActiveTab('login')}
                          className="font-semibold hover:underline"
                          style={{ color: '#003868' }}
                        >
                          Login
                        </button>
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ═══════════ FORGOT PASSWORD FORM ═══════════ */}
            {activeTab === 'forgot-password' && (
              <div className="login-fade-in-delayed">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">
                    Lupa Password
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Masukkan email Anda untuk menerima link reset password.
                  </p>
                </div>

                {resetSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-50 text-emerald-500">
                      <span className="material-symbols-outlined text-3xl">mail</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Email Terkirim!</h3>
                    <p className="text-slate-500 text-sm mb-6">
                      Silakan periksa kotak masuk email Anda {email} untuk instruksi selanjutnya.
                    </p>
                    <button
                      onClick={() => setActiveTab('login')}
                      className="text-sm font-bold hover:underline"
                      style={{ color: '#003868' }}
                    >
                      Kembali ke Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm bg-red-50 text-red-600 border border-red-100">
                        <span className="material-symbols-outlined text-lg">error</span>
                        <span>{error}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat Email</label>
                      <InputField
                        id="forgot-email"
                        icon="mail"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        placeholder="Masukan alamat email akun Anda"
                        focusedField={focusedField}
                        setFocusedField={setFocusedField}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl px-4 py-3.5 font-semibold text-white text-sm transition-all duration-300 disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #003868, #00B4AE)',
                        boxShadow: '0 4px 15px rgba(0,56,104,0.2)',
                      }}
                    >
                      {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="w-full text-sm font-semibold text-slate-500 hover:text-slate-800 pt-2 transition-colors"
                    >
                      Batal
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ═══════════ RESET PASSWORD FORM ═══════════ */}
            {activeTab === 'reset-password' && (
              <div className="login-fade-in-delayed">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">
                    Reset Password
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Buat password baru untuk akun {email}.
                  </p>
                </div>

                {resetSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-50 text-emerald-500">
                      <span className="material-symbols-outlined text-3xl">check_circle</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Password Diubah!</h3>
                    <p className="text-slate-500 text-sm">
                      Password Anda telah berhasil diperbarui. Mengalihkan ke login...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm bg-red-50 text-red-600 border border-red-100">
                        <span className="material-symbols-outlined text-lg">error</span>
                        <span>{error}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password Baru</label>
                      <InputField
                        id="reset-password"
                        icon="lock"
                        type="password"
                        value={regPassword}
                        onChange={setRegPassword}
                        placeholder="Minimal 5 karakter"
                        showToggle
                        onToggle={() => setShowRegPassword(!showRegPassword)}
                        isVisible={showRegPassword}
                        focusedField={focusedField}
                        setFocusedField={setFocusedField}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Konfirmasi Password Baru</label>
                      <InputField
                        id="reset-password-confirm"
                        icon="lock"
                        type="password"
                        value={regPasswordConfirm}
                        onChange={setRegPasswordConfirm}
                        placeholder="Ulangi password"
                        showToggle
                        onToggle={() => setShowRegPassword(!showRegPassword)}
                        isVisible={showRegPassword}
                        focusedField={focusedField}
                        setFocusedField={setFocusedField}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl px-4 py-3.5 font-semibold text-white text-sm transition-all duration-300"
                      style={{
                        background: 'linear-gradient(135deg, #003868, #00B4AE)',
                        boxShadow: '0 4px 15px rgba(0,56,104,0.2)',
                      }}
                    >
                      {loading ? 'Memproses...' : 'Simpan Password Baru'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ═══════════ VERIFICATION SENT SCREEN ═══════════ */}
            {activeTab === 'verification-sent' && (
              <div className="login-fade-in-delayed text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-cyan-400 opacity-20 rounded-full animate-ping"></div>
                  <div className="relative z-10 w-full h-full rounded-full flex items-center justify-center bg-white border-2 border-cyan-400">
                    <span className="material-symbols-outlined text-4xl text-cyan-500">mark_email_unread</span>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-3">Verifikasi Email Anda</h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  Kami telah mengirimkan link verifikasi ke <br/>
                  <span className="font-bold text-slate-700">{notVerifiedEmail || email}</span>.<br/>
                  Silakan klik link tersebut untuk mengaktifkan akun Anda.
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                    <p className="text-xs text-slate-400 mb-2">Belum menerima email?</p>
                    <button
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="text-sm font-bold transition-colors disabled:opacity-50"
                      style={{ color: '#00B4AE' }}
                    >
                      {resendLoading ? 'Mengirim Ulang...' : 'Kirim Ulang Link Verifikasi'}
                    </button>
                    {resendMessage && (
                      <p className="text-[11px] mt-2 text-emerald-500 font-medium">{resendMessage}</p>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab('login')}
                    className="w-full text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Kembali ke Login
                  </button>
                </div>
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                © {new Date().getFullYear()} PT Surveyor Indonesia (Persero)
              </p>
              <p className="text-xs text-slate-300 mt-1">
                MARS — Marketing Analysis Report System
              </p>
            </div>
          </div>
        </div>
        </div>

        </div>{/* end grouped wrapper */}
      </div>{/* end flex-1 centering container */}

      {/* ═══════════ DEVELOPER CREDIT ═══════════ */}
      <div className="relative z-10 py-4 text-center shrink-0 mt-auto">
        <p className="dev-credit-sweep text-[10px] tracking-[0.3em] uppercase font-semibold">
          <span className="dev-credit-star">✦</span>
          {' '}Developed by Asyraf Karunia Asroel{' '}
          <span className="dev-credit-star">✦</span>
        </p>
      </div>
    </div>
    </>
  );
};

export default LoginScreen;
