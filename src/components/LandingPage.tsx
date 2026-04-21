import { TrendingUp, Shield, Calendar, Target } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen w-screen bg-[#080c12] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5">
        <Logo />
        <button
          onClick={onGetStarted}
          className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <section className="relative px-6 md:px-16 pt-16 pb-12 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(99,102,241,0.13),transparent)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/8 text-indigo-300 text-[11px] font-black uppercase tracking-[0.22em] mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Built for prop traders
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black tracking-tight leading-[0.93] mb-6">
            Know your numbers.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
              Pass your eval.
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl mx-auto mb-10">
            Import your Tradovate data and instantly see your account health score, consistency rule status, qualifying days, and every risk metric your prop firm tracks.
          </p>

          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-3 px-9 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base tracking-wide transition-all shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.55)] hover:-translate-y-0.5"
          >
            Get Started Free
          </button>
          <div className="text-slate-600 text-xs mt-4">No credit card · Sign in with Google</div>
        </div>
      </section>

      {/* Dashboard screenshot */}
      <section className="px-4 md:px-12 lg:px-20 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[24px] border border-white/10 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)]">
            {/* Browser chrome bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#0f1520] border-b border-white/8">
              <div className="w-3 h-3 rounded-full bg-rose-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <div className="flex-1 mx-4 h-5 rounded-md bg-white/5 flex items-center justify-center">
                <span className="text-[10px] text-slate-600">traderdash.app</span>
              </div>
            </div>
            <img
              src="/screenshot-dashboard.png"
              alt="TraderDash dashboard"
              className="w-full block"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = 'none';
                const placeholder = el.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
            {/* Placeholder shown until screenshot is added */}
            <div className="hidden items-center justify-center bg-[#0d1320] py-28 text-slate-600 text-sm font-semibold">
              Add screenshot → public/screenshot-dashboard.png
            </div>
          </div>
        </div>
      </section>

      {/* Features row */}
      <section className="px-6 md:px-16 py-16 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Everything your eval requires</h2>
            <p className="text-slate-400 max-w-xl mx-auto">One dashboard. Every metric your prop firm is watching.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: TrendingUp,
                color: 'text-emerald-400',
                border: 'border-emerald-500/15',
                bg: 'bg-emerald-500/8',
                title: 'Account Health Score',
                desc: 'A single 0–100 score combining consistency, win rate, qualifying days, profit progress, and expectancy.',
              },
              {
                icon: Target,
                color: 'text-indigo-400',
                border: 'border-indigo-500/15',
                bg: 'bg-indigo-500/8',
                title: 'Consistency Tracking',
                desc: 'Know exactly how much you can make today before violating your consistency rule.',
              },
              {
                icon: Shield,
                color: 'text-cyan-400',
                border: 'border-cyan-500/15',
                bg: 'bg-cyan-500/8',
                title: 'Risk Compliance',
                desc: 'Daily loss, max drawdown, min trading days — every rule tracked live against your firm\'s limits.',
              },
              {
                icon: Calendar,
                color: 'text-violet-400',
                border: 'border-violet-500/15',
                bg: 'bg-violet-500/8',
                title: 'Trade Calendar',
                desc: 'P&L heatmap showing every trading day. Spot patterns, streaks, and your best performing days.',
              },
            ].map(f => (
              <div key={f.title} className={`rounded-2xl border ${f.border} ${f.bg} p-5`}>
                <div className={`w-9 h-9 rounded-xl border ${f.border} bg-black/20 flex items-center justify-center mb-4`}>
                  <f.icon className={`w-4.5 h-4.5 ${f.color}`} />
                </div>
                <h3 className="font-black text-white text-sm mb-2">{f.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar screenshot */}
      <section className="px-4 md:px-12 lg:px-20 py-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Your trading history, at a glance</h2>
            <p className="text-slate-400 text-sm">Color-coded P&L heatmap — every day, every dollar.</p>
          </div>
          <div className="relative rounded-[24px] border border-white/10 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#0f1520] border-b border-white/8">
              <div className="w-3 h-3 rounded-full bg-rose-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <div className="flex-1 mx-4 h-5 rounded-md bg-white/5 flex items-center justify-center">
                <span className="text-[10px] text-slate-600">traderdash.app</span>
              </div>
            </div>
            <img
              src="/screenshot-calendar.png"
              alt="Trade calendar"
              className="w-full block"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = 'none';
                const placeholder = el.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
            <div className="hidden items-center justify-center bg-[#0d1320] py-20 text-slate-600 text-sm font-semibold">
              Add screenshot → public/screenshot-calendar.png
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/5 px-6 md:px-16 py-24 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 leading-tight">
            Start tracking<br />your eval today.
          </h2>
          <p className="text-slate-400 mb-10 text-lg">Import your Tradovate CSVs and get your full account picture in under a minute.</p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base tracking-wide transition-all shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.55)] hover:-translate-y-0.5"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 md:px-16 py-6 flex items-center justify-between">
        <Logo />
        <div className="text-xs text-slate-600">© 2026 TraderDash</div>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>
      <span className="text-base font-black tracking-tight">TraderDash</span>
    </div>
  );
}
