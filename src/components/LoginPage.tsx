import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onBack: () => void;
}

export default function LoginPage({ onBack }: LoginPageProps) {
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_50%),linear-gradient(180deg,#0c1320_0%,#0a0e14_100%)] flex flex-col">
      {/* Back nav */}
      <div className="px-6 py-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <div className="text-2xl font-black tracking-tight text-white">TraderDash</div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.90))] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
            <h1 className="text-xl font-black text-white mb-1.5">Sign in</h1>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">Your trading data is saved to your account and accessible anywhere.</p>

            <button
              onClick={handleGoogleLogin}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.09] text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingIn ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {signingIn ? 'Redirecting…' : 'Continue with Google'}
            </button>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}
          </div>

          <p className="text-center text-slate-600 text-[11px] mt-5">
            Your trade data is private and only visible to you.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
