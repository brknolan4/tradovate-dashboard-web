import { TrendingUp, Shield, Target, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

// Standard marketing container: generous horizontal padding + constrained width
const WRAP = 'max-w-6xl mx-auto px-6 sm:px-10 lg:px-20';

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen w-full bg-[#060a10] text-white overflow-x-hidden">

      {/* ── Sticky Nav ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#060a10]/90 backdrop-blur-xl">
        <div className={`${WRAP} flex items-center justify-between h-16`}>
          <Logo />
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl transition-all"
          >
            Sign in <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-10%,rgba(99,102,241,0.18),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_50%_100%,rgba(34,197,94,0.04),transparent)] pointer-events-none" />

        <div className={`${WRAP} relative`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/[0.1] text-indigo-300 text-[11px] font-black uppercase tracking-[0.22em] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Built for prop firm traders
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.9] mb-7 mx-auto max-w-4xl">
            Stop guessing.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
              Start passing.
            </span>
          </h1>

          {/* Sub */}
          <p className="text-slate-400 text-xl leading-relaxed max-w-xl mx-auto mb-10">
            TraderDash shows you exactly where you stand on every prop firm rule — consistency, drawdown, qualifying days, and more — the moment you import your trades.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base transition-all duration-200 shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_16px_64px_rgba(99,102,241,0.45)] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.7),0_16px_80px_rgba(99,102,241,0.6)] hover:-translate-y-0.5"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-slate-600 text-sm">Free forever · Sign in with Google · No credit card</p>
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { val: '100%', label: 'Privacy — your data never leaves your account' },
              { val: '<1 min', label: 'Time to your first dashboard' },
              { val: '10+', label: 'Prop firm rule sets supported' },
            ].map(t => (
              <div key={t.label} className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="font-black text-white">{t.val}</span>
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Screenshot ─────────────────────────────────── */}
      <section className="py-6 md:py-8">
        <div className={WRAP}>
          <BrowserFrame>
            <DashboardMockup />
          </BrowserFrame>
        </div>
      </section>

      {/* ── Social Proof / Stats Strip ───────────────────────────── */}
      <section className="py-16 md:py-20 border-y border-white/[0.05] bg-white/[0.015]">
        <div className={`${WRAP} grid grid-cols-2 md:grid-cols-4 gap-8 text-center`}>
          {[
            { num: 'Account Health', sub: 'Single score — 0 to 100', color: 'text-emerald-400' },
            { num: 'Consistency Rule', sub: 'Know your daily ceiling', color: 'text-indigo-400' },
            { num: 'Qualifying Days', sub: 'Track the ones that count', color: 'text-cyan-400' },
            { num: 'Expectancy', sub: 'See your statistical edge', color: 'text-violet-400' },
          ].map(s => (
            <div key={s.num}>
              <div className={`text-lg font-black mb-1 ${s.color}`}>{s.num}</div>
              <div className="text-slate-500 text-sm">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className={WRAP}>
          <div className="text-center mb-16">
            <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.3em] mb-4">What's inside</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 leading-tight">
              Everything your prop firm<br className="hidden md:block" /> is watching. All in one place.
            </h2>
            <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
              Import your Tradovate CSV and get an instant read on your account — no setup required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: TrendingUp, accent: 'emerald', title: 'Account Health Score',  desc: 'A single 0–100 score rolling up consistency, win rate, qualifying days, profit progress, and statistical edge.' },
              { icon: Target,     accent: 'indigo',  title: 'Consistency Tracking',   desc: "Know exactly how much P&L you can make today before triggering your firm's best-day consistency rule." },
              { icon: Shield,     accent: 'cyan',    title: 'Risk Rule Compliance',   desc: 'Daily loss limits, max trailing drawdown, and minimum trading days — tracked in real time against your limits.' },
              { icon: BarChart3,  accent: 'violet',  title: 'True Expectancy',        desc: 'Your average edge per trade, calculated from real closed data. Positive expectancy means your strategy works.' },
            ].map(f => {
              const p: Record<string, { icon: string; border: string; bg: string; glow: string }> = {
                emerald: { icon: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/[0.07]', glow: 'shadow-emerald-500/5' },
                indigo:  { icon: 'text-indigo-400',  border: 'border-indigo-500/20',  bg: 'bg-indigo-500/[0.07]',  glow: 'shadow-indigo-500/5'  },
                cyan:    { icon: 'text-cyan-400',    border: 'border-cyan-500/20',    bg: 'bg-cyan-500/[0.07]',    glow: 'shadow-cyan-500/5'    },
                violet:  { icon: 'text-violet-400',  border: 'border-violet-500/20',  bg: 'bg-violet-500/[0.07]',  glow: 'shadow-violet-500/5'  },
              };
              const s = p[f.accent] ?? p['indigo'];
              return (
                <div key={f.title} className={`rounded-2xl border ${s.border} ${s.bg} p-6 shadow-xl ${s.glow} hover:brightness-110 transition-all`}>
                  <div className={`w-10 h-10 rounded-xl border ${s.border} bg-black/20 flex items-center justify-center mb-5`}>
                    <f.icon className={`w-5 h-5 ${s.icon}`} />
                  </div>
                  <h3 className="font-black text-white text-sm mb-2.5 leading-snug">{f.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Calendar Section ─────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-[#07090f] border-y border-white/[0.04]">
        <div className={WRAP}>
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-violet-400 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Trade Calendar</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 leading-tight">
              Your full trading history,<br className="hidden md:block" /> in one view.
            </h2>
            <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
              Color-coded by daily P&L, with win/loss counts per day and a journal for every session.
            </p>
          </div>

          {/* Bullets */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-12">
            {[
              'Green/red intensity by P&L size',
              'Win & Loss count per trading day',
              'Click any day for the full trade log',
              'Per-day journal notes built in',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5 text-slate-300 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <BrowserFrame>
            <CalendarMockup />
          </BrowserFrame>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="py-28 md:py-36 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(99,102,241,0.12),transparent)] pointer-events-none" />
        <div className={`${WRAP} relative`}>
          <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.3em] mb-6">Ready to track your eval?</p>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-[0.9] mb-6">
            Your funded account<br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">starts with clarity.</span>
          </h2>
          <p className="text-slate-400 text-xl leading-relaxed mb-12 max-w-md mx-auto">
            Stop flying blind. Import your trades and know exactly where you stand in under a minute.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2.5 px-12 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg transition-all duration-200 shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_16px_80px_rgba(99,102,241,0.5)] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.7),0_20px_100px_rgba(99,102,241,0.65)] hover:-translate-y-1"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-slate-600 text-sm">Free forever · No credit card required</p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-8">
        <div className={`${WRAP} flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <Logo />
          <p className="text-slate-700 text-sm">© 2026 TraderDash · Built for prop traders · All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Shared components ──────────────────────────────────────── */

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
        <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>
      <span className="text-base font-black tracking-tight">TraderDash</span>
    </div>
  );
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-white/[0.09] overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.025),0_40px_120px_rgba(0,0,0,0.7),0_0_80px_rgba(99,102,241,0.07)]">
      <div className="flex items-center gap-2 px-5 py-3.5 bg-[#0b1020] border-b border-white/[0.06]">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]/80" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]/80" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]/80" />
        <div className="flex-1 flex justify-center">
          <div className="w-44 h-5 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <span className="text-[10px] text-slate-500 font-medium">traderdash.app</span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Dashboard Mockup ───────────────────────────────────────── */
function DashboardMockup() {
  const eq = [48200, 48900, 49300, 48700, 49600, 50200, 49900, 50700, 51300, 51000, 51900, 52500, 52200, 52840];
  const min = Math.min(...eq); const max = Math.max(...eq);
  const W = 500; const H = 68;
  const pts = eq.map((v, i) => `${(i / (eq.length - 1)) * W},${H - ((v - min) / (max - min)) * (H - 6) - 3}`).join(' ');
  const area = `M0,${H} L${pts.split(' ').join(' L')} L${W},${H} Z`;

  return (
    <div className="bg-[#0c1220] flex" style={{ minHeight: 440 }}>
      {/* Mini sidebar */}
      <div className="w-16 bg-[#08091a] border-r border-white/[0.04] flex flex-col items-center py-5 gap-3 shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-emerald-500/20">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        {[
          { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', active: true },
          { d: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18', active: false },
          { d: 'M3 4h18M3 8h18M3 12h12', active: false },
          { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', active: false },
        ].map((item, i) => (
          <div key={i} className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.active ? 'bg-indigo-500/20 border border-indigo-500/25' : 'opacity-20'}`}>
            <svg className={`w-4 h-4 ${item.active ? 'text-indigo-300' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.d} />
            </svg>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-5 flex flex-col gap-4 min-w-0">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-black text-sm">Trading Dashboard</div>
            <div className="text-slate-500 text-[10px] mt-0.5">Apex 50k Evaluation</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">● Live</div>
            <div className="text-[9px] font-bold text-slate-500 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-lg">Apr 2026</div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Account Balance', val: '$52,840', sub: '+$2,840 profit', color: 'text-white',        pct: 56, bar: '#6366f1' },
            { label: 'Net P&L',         val: '+$2,840', sub: '↑ 5.7% return',  color: 'text-emerald-400', pct: 28, bar: '#22c55e' },
            { label: "Today's P&L",     val: '+$420',   sub: 'Best day $820',  color: 'text-emerald-400', pct: 42, bar: '#22c55e' },
            { label: 'Win Rate',        val: '67%',     sub: '18W · 9L',       color: 'text-cyan-400',    pct: 67, bar: '#06b6d4' },
          ].map(c => (
            <div key={c.label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
              <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-1.5">{c.label}</div>
              <div className={`text-[15px] font-black leading-none ${c.color}`}>{c.val}</div>
              <div className="text-[8px] text-slate-600 mt-1 mb-2.5">{c.sub}</div>
              <div className="h-[3px] rounded-full bg-white/[0.05]">
                <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.bar, opacity: 0.75 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Dial / metric row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Consistency',    val: '24.1%',  sub: 'Under 30% ✓', ring: '#22c55e', text: 'text-emerald-400', pct: 24 },
            { label: 'Health Score',   val: '84/100', sub: 'Strong',       ring: '#22c55e', text: 'text-emerald-400', pct: 84 },
            { label: 'Qual. Days',     val: '8 / 10', sub: '2 days left',  ring: '#f59e0b', text: 'text-amber-400',   pct: 80 },
            { label: 'Expectancy',     val: '+$62',   sub: 'Per trade',    ring: '#06b6d4', text: 'text-cyan-400',    pct: 62 },
          ].map(d => {
            const r = 14; const circ = 2 * Math.PI * r;
            return (
              <div key={d.label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 flex items-center gap-3">
                <div className="relative shrink-0">
                  <svg width="36" height="36" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle cx="18" cy="18" r={r} fill="none" stroke={d.ring} strokeWidth="3"
                      strokeDasharray={circ} strokeDashoffset={circ - (d.pct / 100) * circ}
                      strokeLinecap="round" transform="rotate(-90 18 18)" opacity="0.85" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-[7px] font-black ${d.text}`}>{d.pct}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[7px] text-slate-500 uppercase tracking-wider font-black mb-0.5">{d.label}</div>
                  <div className={`text-[11px] font-black ${d.text}`}>{d.val}</div>
                  <div className="text-[7px] text-slate-600">{d.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Equity chart */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Equity Curve</div>
            <div className="text-[8px] text-emerald-400 font-black">+$2,840 ↑</div>
          </div>
          <svg width="100%" height="68" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#eqg)" />
            <polyline points={pts} fill="none" stroke="#818cf8" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Calendar Mockup ─────────────────────────────────────────── */
function CalendarMockup() {
  type Day = { date: number; pnl: number; w: number; l: number } | null;

  // April 2026 — starts Wednesday (index 3 in Sun-indexed 7-col grid)
  const grid: Day[][] = [
    [null, null, null,
      { date: 1,  pnl:  420, w: 3, l: 1 },
      { date: 2,  pnl: -180, w: 1, l: 2 },
      { date: 3,  pnl:  650, w: 5, l: 1 },
      null,
    ],
    [null,
      { date: 6,  pnl:  510, w: 4, l: 2 },
      { date: 7,  pnl: -320, w: 1, l: 3 },
      { date: 8,  pnl:  180, w: 2, l: 1 },
      { date: 9,  pnl:  740, w: 6, l: 1 },
      { date: 10, pnl:  -90, w: 1, l: 2 },
      null,
    ],
    [null,
      { date: 13, pnl:  380, w: 3, l: 1 },
      { date: 14, pnl:  820, w: 7, l: 1 },
      { date: 15, pnl:  210, w: 2, l: 1 },
      { date: 16, pnl:  -50, w: 1, l: 1 },
      { date: 17, pnl:  490, w: 4, l: 1 },
      null,
    ],
    [null,
      { date: 20, pnl: -240, w: 1, l: 2 },
      { date: 21, pnl:  360, w: 3, l: 1 },
      { date: 22, pnl:  615, w: 5, l: 1 },
      { date: 23, pnl:  420, w: 4, l: 1 },
      { date: 24, pnl: -120, w: 1, l: 2 },
      null,
    ],
    [null,
      { date: 27, pnl:  290, w: 2, l: 1 },
      { date: 28, pnl:  540, w: 4, l: 1 },
      { date: 29, pnl:  -80, w: 1, l: 1 },
      { date: 30, pnl:  310, w: 3, l: 1 },
      null, null,
    ],
  ];

  const style = (pnl: number) => {
    if (pnl >= 600)  return { border: 'border-emerald-500/40', bg: 'bg-emerald-600/[0.22]', val: 'text-emerald-300', badge: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/25' };
    if (pnl >= 200)  return { border: 'border-emerald-500/25', bg: 'bg-emerald-600/[0.12]', val: 'text-emerald-400', badge: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/25' };
    if (pnl > 0)     return { border: 'border-emerald-500/15', bg: 'bg-emerald-600/[0.06]', val: 'text-emerald-400', badge: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/25' };
    if (pnl > -200)  return { border: 'border-red-500/20',     bg: 'bg-red-600/[0.07]',     val: 'text-red-400',    badge: 'text-red-400 bg-red-500/20 border-red-500/25'             };
    return               { border: 'border-red-500/35',     bg: 'bg-red-600/[0.18]',     val: 'text-red-300',    badge: 'text-red-400 bg-red-500/20 border-red-500/25'             };
  };

  const tradingDays = grid.flat().filter(Boolean) as { date: number; pnl: number; w: number; l: number }[];
  const totalPnl = tradingDays.reduce((s, d) => s + d.pnl, 0);
  const winDays  = tradingDays.filter(d => d.pnl > 0).length;

  return (
    <div className="bg-[#0c1220] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.28em] font-black mb-1">Trade Calendar</div>
          <div className="text-white font-black text-lg">April 2026</div>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Net P&L',  val: `+$${totalPnl.toLocaleString()}`, color: 'text-emerald-400' },
            { label: 'Win Days', val: `${winDays} / ${tradingDays.length}`,    color: 'text-cyan-400' },
            { label: 'Best Day', val: '+$820',                           color: 'text-violet-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-center min-w-[80px]">
              <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-1">{s.label}</div>
              <div className={`text-sm font-black ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[8px] text-slate-600 font-black uppercase tracking-widest py-2 bg-slate-800/50 rounded-lg">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-2">
        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-2">
            {week.map((day, di) => {
              if (!day) return (
                <div key={di} className="h-[78px] rounded-2xl border border-white/[0.025] bg-slate-950/50 opacity-25" />
              );
              const s = style(day.pnl);
              return (
                <div key={di} className={`h-[78px] rounded-2xl border ${s.border} ${s.bg} p-2.5 flex flex-col justify-between cursor-pointer hover:brightness-110 transition-all`}>
                  <span className="text-[10px] font-black text-slate-400">{day.date}</span>
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-[11px] font-black ${s.val}`}>
                      {day.pnl >= 0 ? '+' : ''}{day.pnl < 0 ? '-' : ''}${Math.abs(day.pnl)}
                    </span>
                    <div className="flex gap-1">
                      <span className={`text-[7px] font-black px-1 py-px rounded border ${s.badge}`}>{day.w}W</span>
                      <span className="text-[7px] font-black text-red-400 bg-red-500/20 px-1 py-px rounded border border-red-500/25">{day.l}L</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-5">
        <span className="text-[8px] text-slate-600 font-semibold tracking-wider">Loss</span>
        <div className="w-5 h-2.5 rounded bg-red-600/40" />
        <div className="w-5 h-2.5 rounded bg-red-600/15" />
        <div className="w-5 h-2.5 rounded bg-emerald-600/[0.06]" />
        <div className="w-5 h-2.5 rounded bg-emerald-600/[0.12]" />
        <div className="w-5 h-2.5 rounded bg-emerald-600/[0.22]" />
        <span className="text-[8px] text-slate-600 font-semibold tracking-wider">Win</span>
      </div>
    </div>
  );
}
