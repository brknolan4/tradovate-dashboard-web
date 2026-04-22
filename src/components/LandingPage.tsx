import { TrendingUp, Shield, Target, BarChart3, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen w-screen bg-[#070b10] text-white overflow-x-hidden font-sans">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-8 md:px-12 py-6">
        <Logo />
        <button
          onClick={onGetStarted}
          className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Sign in
        </button>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative px-8 md:px-12 pt-20 pb-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(99,102,241,0.14),transparent)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/8 text-indigo-300 text-[11px] font-black uppercase tracking-[0.24em] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Built for prop traders
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.92] mb-7">
            Know your numbers.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
              Pass your eval.
            </span>
          </h1>

          <p className="text-slate-400 text-xl leading-relaxed max-w-xl mx-auto mb-12">
            Import your Tradovate data and get instant clarity on account health, consistency rules, qualifying days, and every metric your prop firm is watching.
          </p>

          <button
            onClick={onGetStarted}
            className="inline-flex items-center px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base tracking-wide transition-all duration-200 shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_8px_48px_rgba(99,102,241,0.45)] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.6),0_8px_64px_rgba(99,102,241,0.6)] hover:-translate-y-0.5"
          >
            Get Started Free
          </button>
          <p className="text-slate-600 text-xs mt-4 tracking-wide">Free to use · Sign in with Google</p>
        </div>
      </section>

      {/* ── Dashboard Mockup ────────────────────────────────── */}
      <section className="px-8 md:px-16 lg:px-24 pb-28">
        <div className="max-w-6xl mx-auto">
          <BrowserFrame>
            <DashboardMockup />
          </BrowserFrame>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] px-8 md:px-12 py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.28em] mb-4">What you get</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">Everything your eval requires</h2>
            <p className="text-slate-400 text-lg max-w-lg mx-auto">One dashboard. Every metric your prop firm is watching — all in one place.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: TrendingUp,
                accent: 'emerald',
                title: 'Account Health Score',
                desc: 'A single 0–100 score combining consistency, win rate, qualifying days, profit progress, and expectancy.',
              },
              {
                icon: Target,
                accent: 'indigo',
                title: 'Consistency Tracking',
                desc: 'Know exactly how much you can make today before violating your firm\'s consistency rule.',
              },
              {
                icon: Shield,
                accent: 'cyan',
                title: 'Risk Compliance',
                desc: 'Daily loss, max drawdown, min trading days — every rule tracked live against your limits.',
              },
              {
                icon: BarChart3,
                accent: 'violet',
                title: 'Expectancy Metric',
                desc: 'Track your real edge — positive expectancy means your strategy has a statistical advantage.',
              },
            ].map(f => {
              const styles: Record<string, { icon: string; border: string; bg: string }> = {
                emerald: { icon: 'text-emerald-400', border: 'border-emerald-500/15', bg: 'bg-emerald-500/8' },
                indigo: { icon: 'text-indigo-400', border: 'border-indigo-500/15', bg: 'bg-indigo-500/8' },
                cyan: { icon: 'text-cyan-400', border: 'border-cyan-500/15', bg: 'bg-cyan-500/8' },
                violet: { icon: 'text-violet-400', border: 'border-violet-500/15', bg: 'bg-violet-500/8' },
              };
              const s = styles[f.accent];
              return (
                <div key={f.title} className={`rounded-2xl border ${s.border} ${s.bg} p-6`}>
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

      {/* ── Calendar Mockup ─────────────────────────────────── */}
      <section className="border-t border-white/[0.06] px-8 md:px-16 lg:px-24 py-28">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
            <div>
              <p className="text-violet-400 text-[11px] font-black uppercase tracking-[0.28em] mb-4">Trade Calendar</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-5">Your history,<br />at a glance.</h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">A P&L heatmap that shows every trading day in context. Spot your best weeks, worst streaks, and the patterns that define your edge.</p>
              <ul className="space-y-3">
                {[
                  'Color-coded intensity by P&L size',
                  'Click any day to see individual trades',
                  'Qualifying day tracking built in',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <BrowserFrame>
                <CalendarMockup />
              </BrowserFrame>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] px-8 md:px-12 py-32 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.28em] mb-6">Ready to track your eval?</p>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-[0.93] mb-7">
            Your next funded<br />account starts here.
          </h2>
          <p className="text-slate-400 text-xl leading-relaxed mb-12 max-w-lg mx-auto">Import your Tradovate CSVs and get a complete picture of your account in under a minute.</p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center px-12 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg tracking-wide transition-all duration-200 shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_8px_48px_rgba(99,102,241,0.45)] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.6),0_8px_64px_rgba(99,102,241,0.6)] hover:-translate-y-0.5"
          >
            Get Started Free
          </button>
          <p className="text-slate-600 text-xs mt-5 tracking-wide">No credit card required</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-8 md:px-12 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo />
          <p className="text-slate-700 text-xs">© 2026 TraderDash. Built for prop traders.</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Shared Components ────────────────────────────────────── */

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>
      <span className="text-[15px] font-black tracking-tight">TraderDash</span>
    </div>
  );
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-white/10 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)] bg-[#0d1320]">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8 bg-[#0a0f1a]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <div className="flex-1 mx-6">
          <div className="mx-auto w-48 h-5 rounded-md bg-white/[0.04] border border-white/5 flex items-center justify-center">
            <span className="text-[10px] text-slate-600 font-medium">traderdash.app</span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Dashboard Mockup ─────────────────────────────────────── */
function DashboardMockup() {
  const equityPoints = [48200, 48800, 49100, 48600, 49400, 50100, 49800, 50600, 51200, 50900, 51800, 52400, 52100, 52840];
  const min = Math.min(...equityPoints);
  const max = Math.max(...equityPoints);
  const w = 320; const h = 60;
  const pts = equityPoints.map((v, i) => {
    const x = (i / (equityPoints.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');
  const areaPath = `M0,${h} L${pts.split(' ').map(p => p).join(' L')} L${w},${h} Z`;

  return (
    <div className="bg-[#0d1320] flex" style={{ minHeight: 420 }}>
      {/* Sidebar */}
      <div className="w-14 bg-[#090d14] border-r border-white/[0.05] flex flex-col items-center py-4 gap-4 shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center mb-2">
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        {[
          <path key="d" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
          <><circle key="c1" cx="12" cy="12" r="3" /><path key="c2" d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path key="c3" d="M4.93 4.93a10 10 0 0 0 0 14.14" /></>,
          <><rect key="s1" x="3" y="4" width="18" height="18" rx="2" ry="2" /><line key="s2" x1="16" y1="2" x2="16" y2="6" /><line key="s3" x1="8" y1="2" x2="8" y2="6" /><line key="s4" x1="3" y1="10" x2="21" y2="10" /></>,
        ].map((icon, i) => (
          <div key={i} className={`w-8 h-8 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-indigo-500/20 border border-indigo-500/30' : 'opacity-30'}`}>
            <svg className={`w-3.5 h-3.5 ${i === 0 ? 'text-indigo-300' : 'text-slate-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-white font-black text-sm">Trading Dashboard</div>
            <div className="text-slate-500 text-[10px] mt-0.5">Account · Apex 50k PA</div>
          </div>
          <div className="text-[10px] font-bold text-slate-500 bg-white/[0.04] border border-white/8 px-2.5 py-1 rounded-lg">Apr 2026</div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { label: 'Account Balance', val: '$52,840', sub: '+$2,840 net', color: 'text-white', bar: 56, barColor: 'bg-indigo-500' },
            { label: 'Net P&L', val: '+$2,840', sub: '↑ 5.7%', color: 'text-emerald-400', bar: 28, barColor: 'bg-emerald-500' },
            { label: "Today's P&L", val: '+$420', sub: 'Best $820 · Apr 12', color: 'text-emerald-400', bar: 42, barColor: 'bg-emerald-500' },
            { label: 'Win Rate', val: '67%', sub: '18W / 9L', color: 'text-cyan-400', bar: 67, barColor: 'bg-cyan-500' },
          ].map(card => (
            <div key={card.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5">
              <div className="text-[8px] text-slate-500 uppercase tracking-wider font-black mb-1">{card.label}</div>
              <div className={`text-sm font-black ${card.color} mb-0.5`}>{card.val}</div>
              <div className="text-[8px] text-slate-600">{card.sub}</div>
              <div className="mt-1.5 h-0.5 rounded-full bg-white/5">
                <div className={`h-full rounded-full ${card.barColor}`} style={{ width: `${card.bar}%`, opacity: 0.6 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Dials row */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { label: 'Consistency Rule', val: '24.1%', sub: 'Under 30% ✓', tone: 'emerald', pct: 24 },
            { label: 'Account Health', val: '84', sub: 'Strong', tone: 'emerald', pct: 84 },
            { label: 'Qualifying Days', val: '8 / 10', sub: '2 days left', tone: 'amber', pct: 80 },
            { label: 'Expectancy', val: '+$62', sub: 'Per trade', tone: 'cyan', pct: 62 },
          ].map(d => {
            const colors: Record<string, { ring: string; text: string; bg: string }> = {
              emerald: { ring: '#22c55e', text: 'text-emerald-400', bg: 'rgba(34,197,94,0.1)' },
              amber: { ring: '#f59e0b', text: 'text-amber-400', bg: 'rgba(245,158,11,0.1)' },
              cyan: { ring: '#06b6d4', text: 'text-cyan-400', bg: 'rgba(6,182,212,0.1)' },
            };
            const c = colors[d.tone];
            const r = 14; const circ = 2 * Math.PI * r;
            const offset = circ - (d.pct / 100) * circ;
            return (
              <div key={d.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5 flex items-center gap-2">
                <div className="shrink-0 relative">
                  <svg width="36" height="36" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="18" cy="18" r={r} fill="none" stroke={c.ring} strokeWidth="3"
                      strokeDasharray={circ} strokeDashoffset={offset}
                      strokeLinecap="round" transform="rotate(-90 18 18)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-[8px] font-black ${c.text}`}>{d.pct}</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[7px] text-slate-500 uppercase tracking-wider font-black leading-tight">{d.label}</div>
                  <div className={`text-xs font-black ${c.text}`}>{d.val}</div>
                  <div className="text-[8px] text-slate-600">{d.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Equity chart */}
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <div className="text-[8px] text-slate-500 uppercase tracking-wider font-black mb-2">Equity Path</div>
          <svg width="100%" height="60" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#eq)" />
            <polyline points={pts} fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Calendar Mockup ──────────────────────────────────────── */
function CalendarMockup() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const weeks = [
    [null, { pnl: 420, trades: 4 }, { pnl: -180, trades: 3 }, { pnl: 650, trades: 5 }, { pnl: 290, trades: 3 }],
    [{ pnl: 510, trades: 6 }, { pnl: -320, trades: 4 }, { pnl: 180, trades: 2 }, { pnl: 740, trades: 7 }, { pnl: -90, trades: 3 }],
    [{ pnl: 380, trades: 4 }, { pnl: 820, trades: 8 }, { pnl: 210, trades: 3 }, { pnl: -50, trades: 2 }, { pnl: 490, trades: 5 }],
    [{ pnl: -240, trades: 3 }, { pnl: 360, trades: 4 }, { pnl: 615, trades: 6 }, { pnl: 420, trades: 5 }, null],
  ];

  const getColor = (pnl: number) => {
    if (pnl >= 600) return { bg: 'bg-emerald-500/70', text: 'text-emerald-100' };
    if (pnl >= 300) return { bg: 'bg-emerald-500/45', text: 'text-emerald-200' };
    if (pnl > 0) return { bg: 'bg-emerald-500/22', text: 'text-emerald-300' };
    if (pnl > -200) return { bg: 'bg-rose-500/25', text: 'text-rose-300' };
    return { bg: 'bg-rose-500/50', text: 'text-rose-200' };
  };

  const totalPnl = weeks.flat().filter(Boolean).reduce((s, d) => s! + (d?.pnl ?? 0), 0) ?? 0;
  const winDays = weeks.flat().filter(d => d && d.pnl > 0).length;
  const totalDays = weeks.flat().filter(Boolean).length;

  return (
    <div className="bg-[#0d1320] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.28em] font-black mb-0.5">Trade Calendar</div>
          <div className="text-white font-black text-sm">April 2026</div>
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Net P&L', val: `+$${(totalPnl / 1000).toFixed(1)}k`, color: 'text-emerald-400' },
            { label: 'Win Days', val: `${winDays}/${totalDays}`, color: 'text-cyan-400' },
          ].map(stat => (
            <div key={stat.label} className="text-right bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2">
              <div className="text-[8px] text-slate-500 uppercase tracking-wider font-black">{stat.label}</div>
              <div className={`text-sm font-black ${stat.color}`}>{stat.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-5 gap-2 mb-2">
        {days.map(d => (
          <div key={d} className="text-center text-[9px] text-slate-600 font-black uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-5 gap-2">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="rounded-xl h-16 bg-white/[0.01] border border-white/[0.03]" />;
              const c = getColor(day.pnl);
              return (
                <div key={di} className={`rounded-xl h-16 border border-white/[0.06] ${c.bg} p-2 flex flex-col justify-between cursor-pointer hover:scale-[1.03] transition-transform`}>
                  <div className={`text-[9px] font-black ${c.text}`}>
                    {day.pnl >= 0 ? '+' : ''}${Math.abs(day.pnl) >= 1000 ? `${(day.pnl / 1000).toFixed(1)}k` : day.pnl}
                  </div>
                  <div className="text-[8px] text-white/30">{day.trades} trades</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-5">
        <span className="text-[8px] text-slate-600 font-semibold">Loss</span>
        {['bg-rose-500/50', 'bg-rose-500/25', 'bg-emerald-500/22', 'bg-emerald-500/45', 'bg-emerald-500/70'].map(c => (
          <div key={c} className={`w-5 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[8px] text-slate-600 font-semibold">Win</span>
      </div>
    </div>
  );
}
