import { TrendingUp, Shield, Target, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

// max-w-[960px] on 1440px screen = 240px auto-margins each side. Very breathable.
const W = 'max-w-[960px] mx-auto w-full px-6 sm:px-10';

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen w-full bg-[#060a10] text-white overflow-x-hidden">

      {/* ── Nav ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#060a10]/90 backdrop-blur-xl">
        <div className={`${W} flex items-center justify-between h-16`}>
          <Logo />
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl transition-all"
          >
            Sign in <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-5%,rgba(99,102,241,0.2),transparent)] pointer-events-none" />
        <div className={`${W} relative`}>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/[0.1] text-indigo-300 text-[11px] font-black uppercase tracking-[0.22em] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Built for prop firm traders
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.88] mb-7">
            Stop guessing.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
              Start passing.
            </span>
          </h1>

          <p className="text-slate-400 text-xl leading-relaxed max-w-lg mx-auto mb-10">
            Import your Tradovate trades and instantly see every metric your prop firm is watching — consistency, drawdown, qualifying days, and your account health score.
          </p>

          <div className="flex flex-col items-center gap-3 mb-16">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base transition-all duration-200 shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_16px_64px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.7),0_20px_80px_rgba(99,102,241,0.6)]"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-slate-600 text-sm">Free forever · Sign in with Google · No credit card</p>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {[
              { val: '< 1 min', label: 'to your first dashboard' },
              { val: '100%',    label: 'private — your data, your account' },
              { val: '10+',     label: 'prop firm rule sets' },
            ].map(t => (
              <div key={t.label} className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="font-black text-slate-200">{t.val}</span> {t.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Mockup ─────────────────────────── */}
      <section className="pb-24 md:pb-32">
        <div className={W}>
          <BrowserFrame>
            <DashboardMockup />
          </BrowserFrame>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────── */}
      <section className="py-14 border-y border-white/[0.05] bg-white/[0.015]">
        <div className={`${W} grid grid-cols-2 md:grid-cols-4 gap-10 text-center`}>
          {[
            { label: 'Account Health Score', sub: 'One number, total clarity',     color: 'text-emerald-400' },
            { label: 'Consistency Rule',      sub: 'Know your daily ceiling',       color: 'text-indigo-400' },
            { label: 'Qualifying Days',        sub: 'Track the days that count',    color: 'text-cyan-400'   },
            { label: 'True Expectancy',        sub: 'See your statistical edge',    color: 'text-violet-400' },
          ].map(s => (
            <div key={s.label}>
              <div className={`text-base font-black mb-1 ${s.color}`}>{s.label}</div>
              <div className="text-slate-500 text-sm">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="py-28 md:py-36">
        <div className={W}>
          <div className="text-center mb-16">
            <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.3em] mb-4">What's inside</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-5">
              Every metric your eval requires.
            </h2>
            <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
              One dashboard. Import your CSV. Know exactly where you stand.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: TrendingUp, accent: 'emerald', title: 'Account Health Score',
                desc: 'A single 0–100 score rolling up consistency, win rate, qualifying days, profit progress, and expectancy. Know at a glance if you\'re on track.' },
              { icon: Target,     accent: 'indigo',  title: 'Consistency Rule Tracker',
                desc: "See exactly how much P&L you can add today before hitting your firm's best-day rule. Never accidentally violate consistency again." },
              { icon: Shield,     accent: 'cyan',    title: 'Risk Rule Compliance',
                desc: 'Daily loss limit, max trailing drawdown, minimum trading days — every prop firm rule tracked live against your actual account data.' },
              { icon: BarChart3,  accent: 'violet',  title: 'Statistical Expectancy',
                desc: 'Your real edge per trade, calculated from closed data. Positive expectancy means your strategy has a proven statistical advantage.' },
            ].map(f => {
              const palette: Record<string, { icon: string; border: string; bg: string }> = {
                emerald: { icon: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/[0.07]' },
                indigo:  { icon: 'text-indigo-400',  border: 'border-indigo-500/20',  bg: 'bg-indigo-500/[0.07]'  },
                cyan:    { icon: 'text-cyan-400',    border: 'border-cyan-500/20',    bg: 'bg-cyan-500/[0.07]'    },
                violet:  { icon: 'text-violet-400',  border: 'border-violet-500/20',  bg: 'bg-violet-500/[0.07]'  },
              };
              const s = palette[f.accent] ?? palette['indigo'];
              return (
                <div key={f.title} className={`rounded-2xl border ${s.border} ${s.bg} p-7 hover:brightness-110 transition-all`}>
                  <div className={`w-11 h-11 rounded-xl border ${s.border} bg-black/20 flex items-center justify-center mb-5`}>
                    <f.icon className={`w-5 h-5 ${s.icon}`} />
                  </div>
                  <h3 className="font-black text-white text-base mb-3 leading-snug">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Calendar Section ─────────────────────────── */}
      <section className="py-28 md:py-36 bg-[#07090f] border-y border-white/[0.04]">
        <div className={W}>
          <div className="text-center mb-12">
            <p className="text-violet-400 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Trade Calendar</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-5">
              Your history, at a glance.
            </h2>
            <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
              A P&L heatmap across every trading day. Spot best weeks, worst streaks, and the patterns behind your edge.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-12">
            {[
              'Green/red intensity by daily P&L',
              'Win & Loss count on every day',
              'Click any day for the full trade log',
              'Per-session journal notes',
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

      {/* ── Final CTA ────────────────────────────────── */}
      <section className="py-32 md:py-40 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,rgba(99,102,241,0.14),transparent)] pointer-events-none" />
        <div className={`${W} relative`}>
          <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.3em] mb-6">Ready to pass?</p>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-[0.9] mb-6">
            Your funded account<br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              starts with clarity.
            </span>
          </h2>
          <p className="text-slate-400 text-xl leading-relaxed mb-12 max-w-sm mx-auto">
            Stop flying blind. Know exactly where you stand in under a minute.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg transition-all duration-200 shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_16px_80px_rgba(99,102,241,0.5)] hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.7),0_24px_100px_rgba(99,102,241,0.65)]"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-slate-600 text-sm">No credit card required</p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-8">
        <div className={`${W} flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <Logo />
          <p className="text-slate-700 text-sm">© 2026 TraderDash · Built for prop traders.</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Shared ─────────────────────────────────────────────────── */

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="rounded-2xl border border-white/[0.09] overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.025),0_40px_120px_rgba(0,0,0,0.75),0_0_60px_rgba(99,102,241,0.06)]">
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
  const lo = Math.min(...eq); const hi = Math.max(...eq);
  const PW = 500; const PH = 68;
  const pts = eq.map((v, i) => `${(i / (eq.length - 1)) * PW},${PH - ((v - lo) / (hi - lo)) * (PH - 6) - 3}`).join(' ');
  const area = `M0,${PH} L${pts.split(' ').join(' L')} L${PW},${PH} Z`;

  return (
    <div className="bg-[#0c1220] flex" style={{ minHeight: 420 }}>
      {/* Mini sidebar */}
      <div className="w-16 bg-[#08091a] border-r border-white/[0.04] flex flex-col items-center py-5 gap-3 shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-emerald-500/20">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        {[
          'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
          'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18',
          'M3 4h18M3 8h18M3 12h12',
          'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
        ].map((d, i) => (
          <div key={i} className={`w-9 h-9 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-indigo-500/20 border border-indigo-500/25' : 'opacity-20'}`}>
            <svg className={`w-4 h-4 ${i === 0 ? 'text-indigo-300' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d={d} />
            </svg>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-5 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-black text-sm">Trading Dashboard</div>
            <div className="text-slate-500 text-[10px] mt-0.5">Apex 50k Evaluation</div>
          </div>
          <div className="flex gap-2">
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

        {/* Dial row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Consistency',   val: '24.1%',  sub: 'Under 30% ✓', ring: '#22c55e', text: 'text-emerald-400', pct: 24 },
            { label: 'Health Score',  val: '84/100', sub: 'Strong',       ring: '#22c55e', text: 'text-emerald-400', pct: 84 },
            { label: 'Qual. Days',    val: '8 / 10', sub: '2 days left',  ring: '#f59e0b', text: 'text-amber-400',   pct: 80 },
            { label: 'Expectancy',    val: '+$62',   sub: 'Per trade',    ring: '#06b6d4', text: 'text-cyan-400',    pct: 62 },
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
          <svg width="100%" height="66" viewBox={`0 0 ${PW} ${PH}`} preserveAspectRatio="none">
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

  const grid: Day[][] = [
    [null, null, null, { date: 1, pnl: 420, w: 3, l: 1 }, { date: 2, pnl: -180, w: 1, l: 2 }, { date: 3, pnl: 650, w: 5, l: 1 }, null],
    [null, { date: 6, pnl: 510, w: 4, l: 2 }, { date: 7, pnl: -320, w: 1, l: 3 }, { date: 8, pnl: 180, w: 2, l: 1 }, { date: 9, pnl: 740, w: 6, l: 1 }, { date: 10, pnl: -90, w: 1, l: 2 }, null],
    [null, { date: 13, pnl: 380, w: 3, l: 1 }, { date: 14, pnl: 820, w: 7, l: 1 }, { date: 15, pnl: 210, w: 2, l: 1 }, { date: 16, pnl: -50, w: 1, l: 1 }, { date: 17, pnl: 490, w: 4, l: 1 }, null],
    [null, { date: 20, pnl: -240, w: 1, l: 2 }, { date: 21, pnl: 360, w: 3, l: 1 }, { date: 22, pnl: 615, w: 5, l: 1 }, { date: 23, pnl: 420, w: 4, l: 1 }, { date: 24, pnl: -120, w: 1, l: 2 }, null],
    [null, { date: 27, pnl: 290, w: 2, l: 1 }, { date: 28, pnl: 540, w: 4, l: 1 }, { date: 29, pnl: -80, w: 1, l: 1 }, { date: 30, pnl: 310, w: 3, l: 1 }, null, null],
  ];

  const cs = (pnl: number) => {
    if (pnl >= 600) return { border: 'border-emerald-500/40', bg: 'bg-emerald-600/[0.22]', val: 'text-emerald-300' };
    if (pnl >= 200) return { border: 'border-emerald-500/25', bg: 'bg-emerald-600/[0.12]', val: 'text-emerald-400' };
    if (pnl > 0)    return { border: 'border-emerald-500/15', bg: 'bg-emerald-600/[0.06]', val: 'text-emerald-400' };
    if (pnl > -200) return { border: 'border-red-500/20',     bg: 'bg-red-600/[0.07]',     val: 'text-red-400'    };
    return              { border: 'border-red-500/35',     bg: 'bg-red-600/[0.18]',     val: 'text-red-300'    };
  };

  const days = grid.flat().filter(Boolean) as { date: number; pnl: number; w: number; l: number }[];
  const totalPnl = days.reduce((s, d) => s + d.pnl, 0);
  const winDays  = days.filter(d => d.pnl > 0).length;

  return (
    <div className="bg-[#0c1220] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.28em] font-black mb-1">Trade Calendar</div>
          <div className="text-white font-black text-lg">April 2026</div>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Net P&L',  val: `+$${totalPnl.toLocaleString()}`, color: 'text-emerald-400' },
            { label: 'Win Days', val: `${winDays} / ${days.length}`,     color: 'text-cyan-400'   },
            { label: 'Best Day', val: '+$820',                           color: 'text-violet-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-center min-w-[76px]">
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

      {/* Grid */}
      <div className="space-y-2">
        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-2">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="h-[76px] rounded-2xl border border-white/[0.025] bg-slate-950/50 opacity-20" />;
              const s = cs(day.pnl);
              return (
                <div key={di} className={`h-[76px] rounded-2xl border ${s.border} ${s.bg} p-2.5 flex flex-col justify-between cursor-pointer hover:brightness-110 transition-all`}>
                  <span className="text-[10px] font-black text-slate-400">{day.date}</span>
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-[11px] font-black ${s.val}`}>
                      {day.pnl >= 0 ? '+' : '-'}${Math.abs(day.pnl)}
                    </span>
                    <div className="flex gap-1">
                      <span className="text-[7px] font-black text-emerald-400 bg-emerald-500/20 px-1 py-px rounded border border-emerald-500/25">{day.w}W</span>
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
        <span className="text-[8px] text-slate-600 font-semibold">Loss</span>
        <div className="w-5 h-2.5 rounded bg-red-600/40" />
        <div className="w-5 h-2.5 rounded bg-red-600/15" />
        <div className="w-5 h-2.5 rounded bg-emerald-600/[0.06]" />
        <div className="w-5 h-2.5 rounded bg-emerald-600/[0.12]" />
        <div className="w-5 h-2.5 rounded bg-emerald-600/[0.22]" />
        <span className="text-[8px] text-slate-600 font-semibold">Win</span>
      </div>
    </div>
  );
}
