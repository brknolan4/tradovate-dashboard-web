import { TrendingUp, Shield, Target, BarChart3, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const C = 'max-w-5xl mx-auto w-full px-8 md:px-12';

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen w-screen bg-[#070b10] text-white overflow-x-hidden">

      {/* Nav */}
      <div className={C}>
        <nav className="flex items-center justify-between py-5 border-b border-white/[0.05]">
          <Logo />
          <button onClick={onGetStarted} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Sign in
          </button>
        </nav>
      </div>

      {/* Hero */}
      <section className="relative py-20 md:py-28 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.13),transparent)] pointer-events-none" />
        <div className={`${C} relative`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/[0.08] text-indigo-300 text-[11px] font-black uppercase tracking-[0.24em] mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Built for prop traders
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-[4rem] font-black tracking-tight leading-[0.93] mb-6">
            Know your numbers.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
              Pass your eval.
            </span>
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed max-w-lg mx-auto mb-10">
            Import your Tradovate data and instantly see your account health, consistency score, qualifying days, and every metric your prop firm is watching.
          </p>

          <div className="flex flex-col items-center gap-2.5">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base tracking-wide transition-all duration-200 shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_8px_48px_rgba(99,102,241,0.4)] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.6),0_8px_64px_rgba(99,102,241,0.55)] hover:-translate-y-0.5"
            >
              Get Started Free
            </button>
            <p className="text-slate-600 text-xs tracking-wide">Free · Sign in with Google · No credit card</p>
          </div>
        </div>
      </section>

      {/* Dashboard Mockup */}
      <section className="pb-20 md:pb-28">
        <div className={C}>
          <BrowserFrame>
            <DashboardMockup />
          </BrowserFrame>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-24 border-t border-white/[0.05]">
        <div className={C}>
          <div className="text-center mb-12">
            <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.3em] mb-3">What you get</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Everything your eval requires</h2>
            <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
              One dashboard. Every metric your prop firm is watching.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, accent: 'emerald', title: 'Account Health Score',  desc: 'A single 0–100 score combining consistency, win rate, qualifying days, profit progress, and expectancy.' },
              { icon: Target,     accent: 'indigo',  title: 'Consistency Tracking',   desc: "Know exactly how much you can make today before violating your firm's consistency rule." },
              { icon: Shield,     accent: 'cyan',    title: 'Risk Compliance',         desc: 'Daily loss, max drawdown, min trading days — every rule tracked live against your limits.' },
              { icon: BarChart3,  accent: 'violet',  title: 'Expectancy Metric',       desc: 'Track your real edge — positive expectancy means your strategy has a statistical advantage.' },
            ].map(f => {
              const palette: Record<string, { icon: string; border: string; bg: string }> = {
                emerald: { icon: 'text-emerald-400', border: 'border-emerald-500/15', bg: 'bg-emerald-500/[0.07]' },
                indigo:  { icon: 'text-indigo-400',  border: 'border-indigo-500/15',  bg: 'bg-indigo-500/[0.07]'  },
                cyan:    { icon: 'text-cyan-400',    border: 'border-cyan-500/15',    bg: 'bg-cyan-500/[0.07]'    },
                violet:  { icon: 'text-violet-400',  border: 'border-violet-500/15',  bg: 'bg-violet-500/[0.07]'  },
              };
              const s = palette[f.accent] ?? palette['indigo'];
              return (
                <div key={f.title} className={`rounded-2xl border ${s.border} ${s.bg} p-5`}>
                  <div className={`w-9 h-9 rounded-xl border ${s.border} bg-black/20 flex items-center justify-center mb-4`}>
                    <f.icon className={`w-4 h-4 ${s.icon}`} />
                  </div>
                  <h3 className="font-black text-white text-sm mb-2 leading-snug">{f.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="py-20 md:py-24 border-t border-white/[0.05]">
        <div className={C}>
          <div className="text-center mb-8">
            <p className="text-violet-400 text-[11px] font-black uppercase tracking-[0.3em] mb-3">Trade Calendar</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Your history, at a glance.</h2>
            <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
              A P&L heatmap across every trading day. Spot your best weeks, worst streaks, and the patterns behind your edge.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-5 mb-8">
            {[
              'Color-coded by P&L intensity',
              'Win/Loss counts per day',
              'Click any day for trade log',
              'Built-in journal notes',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-slate-300 text-sm">
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

      {/* Bottom CTA */}
      <section className="py-20 md:py-24 border-t border-white/[0.05] text-center">
        <div className={C}>
          <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.3em] mb-5">Ready to track your eval?</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[0.93] mb-5">
            Your next funded<br />account starts here.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-sm mx-auto">
            Import your Tradovate CSVs and get a complete picture of your account in under a minute.
          </p>
          <div className="flex flex-col items-center gap-2.5">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center px-12 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base tracking-wide transition-all duration-200 shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_8px_48px_rgba(99,102,241,0.4)] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.6),0_8px_64px_rgba(99,102,241,0.55)] hover:-translate-y-0.5"
            >
              Get Started Free
            </button>
            <p className="text-slate-600 text-xs tracking-wide">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-7">
        <div className={`${C} flex items-center justify-between`}>
          <Logo />
          <p className="text-slate-700 text-xs">© 2026 TraderDash. Built for prop traders.</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Shared ─────────────────────────────────────────────────── */

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>
      <span className="text-[15px] font-black tracking-tight">TraderDash</span>
    </div>
  );
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-white/[0.08] overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_32px_80px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#0a0f1a] border-b border-white/[0.06]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/80" />
        <div className="flex-1 flex justify-center">
          <div className="w-40 h-5 rounded-md bg-white/[0.04] border border-white/[0.05] flex items-center justify-center">
            <span className="text-[10px] text-slate-600 font-medium">traderdash.app</span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Dashboard Mockup ───────────────────────────────────────── */
function DashboardMockup() {
  const equityPoints = [48200, 48900, 49300, 48700, 49600, 50200, 49900, 50700, 51300, 51000, 51900, 52500, 52200, 52840];
  const min = Math.min(...equityPoints);
  const max = Math.max(...equityPoints);
  const W = 500; const H = 64;
  const pts = equityPoints.map((v, i) => {
    const x = (i / (equityPoints.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `M0,${H} L${pts.split(' ').join(' L')} L${W},${H} Z`;

  return (
    <div className="bg-[#0c1220] flex" style={{ minHeight: 420 }}>
      {/* Sidebar */}
      <div className="w-14 bg-[#080c15] border-r border-white/[0.04] flex flex-col items-center py-4 gap-2.5 shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-emerald-500/20">
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        {(['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18', 'M3 4h18M3 8h18M3 12h12'] as string[]).map((d, i) => (
          <div key={i} className={`w-8 h-8 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-indigo-500/20 border border-indigo-500/25' : 'opacity-25'}`}>
            <svg className={`w-3.5 h-3.5 ${i === 0 ? 'text-indigo-300' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d={d} />
            </svg>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 p-5 flex flex-col gap-3.5 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-sm tracking-tight">Trading Dashboard</h2>
            <p className="text-slate-500 text-[10px] mt-0.5">Apex 50k Evaluation</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">● Live</div>
            <div className="text-[9px] font-bold text-slate-500 bg-white/[0.04] border border-white/8 px-2.5 py-1 rounded-lg">Apr 2026</div>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { label: 'Account Balance', val: '$52,840', sub: '+$2,840',       color: 'text-white',        pct: 56, barC: '#6366f1' },
            { label: 'Net P&L',         val: '+$2,840', sub: '↑ 5.7%',        color: 'text-emerald-400', pct: 28, barC: '#22c55e' },
            { label: "Today's P&L",     val: '+$420',   sub: 'Best $820',     color: 'text-emerald-400', pct: 42, barC: '#22c55e' },
            { label: 'Win Rate',        val: '67%',     sub: '18W · 9L',      color: 'text-cyan-400',    pct: 67, barC: '#06b6d4' },
          ].map(c => (
            <div key={c.label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
              <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-1">{c.label}</div>
              <div className={`text-sm font-black ${c.color}`}>{c.val}</div>
              <div className="text-[8px] text-slate-600 mt-0.5 mb-2">{c.sub}</div>
              <div className="h-[3px] rounded-full bg-white/[0.05]">
                <div className="h-full rounded-full opacity-70" style={{ width: `${c.pct}%`, background: c.barC }} />
              </div>
            </div>
          ))}
        </div>

        {/* Dial row */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { label: 'Consistency',    val: '24.1%',   sub: 'Under 30% ✓', tone: 'emerald', pct: 24 },
            { label: 'Account Health', val: '84',       sub: 'Strong',       tone: 'emerald', pct: 84 },
            { label: 'Qual. Days',     val: '8 / 10',  sub: '2 days left',  tone: 'amber',   pct: 80 },
            { label: 'Expectancy',     val: '+$62',    sub: 'Per trade',    tone: 'cyan',    pct: 62 },
          ].map(d => {
            const tc: Record<string, { ring: string; text: string }> = {
              emerald: { ring: '#22c55e', text: 'text-emerald-400' },
              amber:   { ring: '#f59e0b', text: 'text-amber-400'   },
              cyan:    { ring: '#06b6d4', text: 'text-cyan-400'    },
            };
            const c = tc[d.tone];
            const r = 14; const circ = 2 * Math.PI * r;
            const offset = circ - (d.pct / 100) * circ;
            return (
              <div key={d.label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 flex items-center gap-3">
                <div className="relative shrink-0">
                  <svg width="36" height="36" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle cx="18" cy="18" r={r} fill="none" stroke={c.ring} strokeWidth="3"
                      strokeDasharray={circ} strokeDashoffset={offset}
                      strokeLinecap="round" transform="rotate(-90 18 18)" opacity="0.85" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-[7px] font-black ${c.text}`}>{d.pct}</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[7px] text-slate-500 uppercase tracking-wider font-black leading-tight mb-0.5">{d.label}</div>
                  <div className={`text-[11px] font-black ${c.text}`}>{d.val}</div>
                  <div className="text-[7px] text-slate-600">{d.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Equity chart */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 flex-1">
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Equity Path</div>
            <div className="text-[8px] text-emerald-400 font-black">+$2,840 ↑</div>
          </div>
          <svg width="100%" height="62" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
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
  // April 2026: starts Tuesday (index 2). 30 days.
  // 7-col grid matching the real app (Sun Mon Tue Wed Thu Fri Sat)
  type Day = { date: number; pnl: number; w: number; l: number } | null;

  const grid: Day[][] = [
    // week 1: Apr starts on Wednesday in 2026
    [null, null, null,
      { date: 1,  pnl:  420, w: 3, l: 1 },
      { date: 2,  pnl: -180, w: 1, l: 2 },
      { date: 3,  pnl:  650, w: 5, l: 1 },
      null, // Sat
    ],
    [
      null, // Sun
      { date: 6,  pnl:  510, w: 4, l: 2 },
      { date: 7,  pnl: -320, w: 1, l: 3 },
      { date: 8,  pnl:  180, w: 2, l: 1 },
      { date: 9,  pnl:  740, w: 6, l: 1 },
      { date: 10, pnl:  -90, w: 1, l: 2 },
      null,
    ],
    [
      null,
      { date: 13, pnl:  380, w: 3, l: 1 },
      { date: 14, pnl:  820, w: 7, l: 1 },
      { date: 15, pnl:  210, w: 2, l: 1 },
      { date: 16, pnl:  -50, w: 1, l: 1 },
      { date: 17, pnl:  490, w: 4, l: 1 },
      null,
    ],
    [
      null,
      { date: 20, pnl: -240, w: 1, l: 2 },
      { date: 21, pnl:  360, w: 3, l: 1 },
      { date: 22, pnl:  615, w: 5, l: 1 },
      { date: 23, pnl:  420, w: 4, l: 1 },
      { date: 24, pnl: -120, w: 1, l: 2 },
      null,
    ],
    [
      null,
      { date: 27, pnl:  290, w: 2, l: 1 },
      { date: 28, pnl:  540, w: 4, l: 1 },
      { date: 29, pnl: -80,  w: 1, l: 1 },
      { date: 30, pnl:  310, w: 3, l: 1 },
      null, null,
    ],
  ];

  const getBg = (pnl: number): { border: string; bg: string; txt: string; sub: string } => {
    if (pnl >= 600)  return { border: 'border-emerald-500/40', bg: 'bg-emerald-600/20', txt: 'text-emerald-300', sub: 'text-emerald-500/80' };
    if (pnl >= 200)  return { border: 'border-emerald-500/25', bg: 'bg-emerald-600/10', txt: 'text-emerald-400', sub: 'text-emerald-600/80' };
    if (pnl > 0)     return { border: 'border-emerald-500/15', bg: 'bg-emerald-600/[0.07]', txt: 'text-emerald-400', sub: 'text-emerald-700' };
    if (pnl > -200)  return { border: 'border-red-500/20',     bg: 'bg-red-600/[0.08]',     txt: 'text-red-400',    sub: 'text-red-700'     };
    return               { border: 'border-red-500/35',     bg: 'bg-red-600/15',         txt: 'text-red-300',    sub: 'text-red-500/80'  };
  };

  const allTradingDays = grid.flat().filter(Boolean) as { date: number; pnl: number; w: number; l: number }[];
  const totalPnl = allTradingDays.reduce((s, d) => s + d.pnl, 0);
  const winDays  = allTradingDays.filter(d => d.pnl > 0).length;

  return (
    <div className="bg-[#0c1220] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mb-0.5">Trade Calendar</div>
          <div className="text-white font-black text-base">April 2026</div>
        </div>
        <div className="flex gap-2.5">
          {[
            { label: 'Net P&L',   val: `+$${totalPnl.toLocaleString()}`, color: 'text-emerald-400' },
            { label: 'Win Days',  val: `${winDays} / ${allTradingDays.length}`, color: 'text-cyan-400' },
            { label: 'Best Day',  val: '+$820',                          color: 'text-violet-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2 text-center">
              <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-0.5">{s.label}</div>
              <div className={`text-sm font-black ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[8px] text-slate-600 font-black uppercase tracking-widest py-1.5 bg-slate-800/40 rounded-lg border-b border-white/5">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-1.5">
        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((day, di) => {
              if (!day) {
                return <div key={di} className="h-[72px] rounded-2xl border border-white/[0.03] bg-slate-950/40 opacity-30" />;
              }
              const c = getBg(day.pnl);
              return (
                <div
                  key={di}
                  className={`h-[72px] rounded-2xl border ${c.border} ${c.bg} p-2 flex flex-col justify-between cursor-pointer hover:brightness-110 transition-all`}
                >
                  <span className="text-[10px] font-black text-slate-400">{day.date}</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`text-[10px] font-black ${c.txt}`}>
                      {day.pnl >= 0 ? '+' : ''}${Math.abs(day.pnl)}
                    </span>
                    <div className="flex gap-1">
                      <span className="text-[7px] font-black text-emerald-400 bg-emerald-500/20 px-1 py-px rounded border border-emerald-500/20">{day.w}W</span>
                      <span className="text-[7px] font-black text-red-400 bg-red-500/20 px-1 py-px rounded border border-red-500/20">{day.l}L</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-[8px] text-slate-600 font-semibold">Loss</span>
        {['bg-red-600/40', 'bg-red-600/15', 'bg-emerald-600/[0.07]', 'bg-emerald-600/10', 'bg-emerald-600/20'].map((bg, i) => (
          <div key={i} className={`w-5 h-2.5 rounded ${bg}`} />
        ))}
        <span className="text-[8px] text-slate-600 font-semibold">Win</span>
      </div>
    </div>
  );
}
