import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Shield, Calendar, TrendingUp, Target, BarChart2, CheckCircle, ChevronRight } from 'lucide-react';

export default function LandingPage() {
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
    <div className="min-h-screen w-screen bg-[#0a0e14] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <LayoutDashboard className="text-white w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.32em] text-slate-500 font-black leading-none">Tradovate</div>
            <div className="text-base font-black tracking-tight leading-tight">TraderDash</div>
          </div>
        </div>
        <button
          onClick={handleGoogleLogin}
          disabled={signingIn}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
        >
          {signingIn ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : null}
          Sign in
          {!signingIn && <ChevronRight className="w-4 h-4" />}
        </button>
      </nav>

      {/* Hero */}
      <section className="relative px-6 md:px-12 pt-20 pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.06),transparent_50%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 text-indigo-300 text-[11px] font-black uppercase tracking-[0.22em] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Built for prop traders
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6">
            Your prop trading<br />
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              command center
            </span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Import your Tradovate data and get instant visibility into your account health, consistency score, qualifying days, and risk metrics — everything your prop firm cares about.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGoogleLogin}
              disabled={signingIn}
              className="flex items-center gap-3 px-7 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-all disabled:opacity-50 shadow-[0_8px_32px_rgba(99,102,241,0.3)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.45)]"
            >
              {signingIn ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {signingIn ? 'Redirecting…' : 'Get started with Google'}
            </button>
            <div className="text-slate-500 text-sm">Free · No credit card required</div>
          </div>
          {error && (
            <div className="mt-5 inline-block rounded-xl border border-rose-500/20 bg-rose-500/8 px-4 py-2.5 text-sm text-rose-300">{error}</div>
          )}
        </div>
      </section>

      {/* Feature previews */}
      <section className="px-6 md:px-12 pb-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Dashboard preview */}
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(15,23,42,0.7))] overflow-hidden">
            <div className="p-6 border-b border-white/6">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-indigo-300/80 font-black mb-2">
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </div>
              <h3 className="text-lg font-black text-white">Performance Overview</h3>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">Real-time P&L, win rate, expectancy, and account health score across your full eval period.</p>
            </div>
            {/* Mini dashboard mockup */}
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Account Balance', value: '$52,840', color: 'text-emerald-400', bar: 56 },
                  { label: 'Net P&L', value: '+$2,840', color: 'text-emerald-400', bar: 28 },
                  { label: 'Win Rate', value: '67%', color: 'text-cyan-400', bar: 67 },
                  { label: "Today's P&L", value: '+$320', color: 'text-emerald-400', bar: 32 },
                ].map(card => (
                  <div key={card.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-black mb-1">{card.label}</div>
                    <div className={`text-base font-black ${card.color}`}>{card.value}</div>
                    <div className="mt-2 h-1 rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-indigo-500/60" style={{ width: `${card.bar}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-black mb-2.5">Equity Path</div>
                <div className="flex items-end gap-0.5 h-10">
                  {[30, 45, 38, 55, 48, 62, 58, 70, 65, 78, 72, 85].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-indigo-600/40 to-cyan-500/40" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Prop Safety preview */}
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(15,23,42,0.7))] overflow-hidden">
            <div className="p-6 border-b border-white/6">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-indigo-300/80 font-black mb-2">
                <Shield className="w-3.5 h-3.5" /> Prop Safety
              </div>
              <h3 className="text-lg font-black text-white">Risk & Rule Checks</h3>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">Configure your firm's exact rules and get live compliance tracking against drawdown, daily loss, and consistency limits.</p>
            </div>
            <div className="p-5 space-y-2.5">
              {[
                { label: 'Daily Loss Limit', status: 'PASS', used: 320, limit: 1100, color: 'emerald' },
                { label: 'Max Drawdown', status: 'PASS', used: 1160, limit: 2500, color: 'emerald' },
                { label: 'Consistency Rule', status: 'PASS', used: 24, limit: 30, color: 'emerald' },
                { label: 'Min Trading Days', status: '8 / 10', used: 80, limit: 100, color: 'amber' },
              ].map(rule => (
                <div key={rule.label} className="rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-slate-300 font-semibold">{rule.label}</span>
                    <span className={`text-[10px] font-black ${rule.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>{rule.status}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5">
                    <div className={`h-full rounded-full ${rule.color === 'emerald' ? 'bg-emerald-500/60' : 'bg-amber-500/60'}`} style={{ width: `${rule.used}%` }} />
                  </div>
                </div>
              ))}
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-3 py-2.5 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-[11px] text-indigo-200 font-semibold">Account Health Score: 84 / 100</span>
              </div>
            </div>
          </div>

          {/* Trade Calendar preview */}
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(15,23,42,0.7))] overflow-hidden">
            <div className="p-6 border-b border-white/6">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-indigo-300/80 font-black mb-2">
                <Calendar className="w-3.5 h-3.5" /> Trade Calendar
              </div>
              <h3 className="text-lg font-black text-white">Day-by-Day History</h3>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">P&L heatmap calendar showing every trading day's result. Spot patterns, streaks, and your best and worst days at a glance.</p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <div key={i} className="text-center text-[9px] text-slate-600 font-black">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[
                  null, null, { v: 420, p: true }, { v: -180, p: false }, { v: 650, p: true }, null, null,
                  { v: 280, p: true }, { v: 510, p: true }, { v: -90, p: false }, { v: 340, p: true }, { v: 720, p: true }, null, null,
                  { v: -320, p: false }, { v: 190, p: true }, { v: 440, p: true }, { v: 580, p: true }, { v: -110, p: false }, null, null,
                  { v: 360, p: true }, { v: 820, p: true }, { v: 210, p: true }, { v: -50, p: false }, { v: 490, p: true }, null, null,
                ].map((day, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[8px] font-bold ${
                      !day ? 'bg-transparent' :
                      day.p
                        ? day.v > 600 ? 'bg-emerald-500/50 text-emerald-200' : day.v > 300 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-500/15 text-emerald-400'
                        : day.v < -200 ? 'bg-rose-500/40 text-rose-200' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {day ? `${day.p ? '+' : ''}${(day.v / 1000).toFixed(1)}k` : ''}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="border-t border-white/5 px-6 md:px-12 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', title: 'Account Health Score', desc: 'A single 0–100 score combining consistency, win rate, qualifying days, profit progress, and expectancy.' },
            { icon: Target, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', title: 'Consistency Tracking', desc: 'Know exactly how much you can make in a day before violating your firm\'s consistency rule.' },
            { icon: BarChart2, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', title: 'Expectancy Metric', desc: 'Track your edge with real expectancy calculation — positive expectancy means your strategy has an edge.' },
            { icon: Shield, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', title: 'Rule Compliance', desc: 'Daily loss, drawdown, min days, scaling, MAE — every rule your firm sets, tracked in real time.' },
          ].map(item => (
            <div key={item.title} className={`rounded-2xl border ${item.bg} p-5`}>
              <div className={`w-9 h-9 rounded-xl ${item.bg} border flex items-center justify-center mb-4`}>
                <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
              </div>
              <h4 className="font-black text-white text-sm mb-2">{item.title}</h4>
              <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 md:px-12 py-20 text-center border-t border-white/5">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Ready to track your eval?</h2>
          <p className="text-slate-400 mb-8">Import your Tradovate CSVs and get your full account picture in under a minute.</p>
          <button
            onClick={handleGoogleLogin}
            disabled={signingIn}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-all disabled:opacity-50 shadow-[0_8px_32px_rgba(99,102,241,0.3)]"
          >
            {signingIn ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <GoogleIcon />}
            {signingIn ? 'Redirecting…' : 'Get started free'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 md:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="text-white w-3 h-3" />
          </div>
          <span className="text-sm font-black text-slate-400">TraderDash</span>
        </div>
        <div className="text-xs text-slate-600">Built for Tradovate prop traders</div>
      </footer>
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
