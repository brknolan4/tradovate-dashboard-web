import { TrendingUp, Shield, Target, BarChart3, CheckCircle, Rocket } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

// Guaranteed centering via inline styles — bypasses any global CSS reset
const container: React.CSSProperties = {
  maxWidth: '960px',
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingLeft: 'clamp(32px, 6vw, 80px)',
  paddingRight: 'clamp(32px, 6vw, 80px)',
};

const narrow: React.CSSProperties = {
  maxWidth: '680px',
  marginLeft: 'auto',
  marginRight: 'auto',
  textAlign: 'center',
};

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div style={{ background: '#060a10', minHeight: '100vh', color: '#fff', fontFamily: 'inherit' }}>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(6,10,16,0.92)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ ...container, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64px' }}>
          <Logo />
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: 'clamp(80px,10vw,128px) 0 clamp(64px,8vw,96px)', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.22), transparent)',
        }} />
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.18,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        <div style={{ ...narrow, position: 'relative' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '999px',
            border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)',
            color: '#a5b4fc', fontSize: '11px', fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: '28px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Built for prop firm traders
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(42px,6vw,72px)', fontWeight: 900, lineHeight: 0.9, marginBottom: '28px', letterSpacing: '-0.02em' }}>
            Stop guessing.<br />
            <span style={{ background: 'linear-gradient(135deg,#818cf8,#c4b5fd,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Start passing.
            </span>
          </h1>

          {/* Sub */}
          <p style={{ color: '#94a3b8', fontSize: 'clamp(17px,2vw,20px)', lineHeight: 1.65, marginBottom: '40px' }}>
            Import your Tradovate trades and instantly see every metric your prop firm is watching — consistency, drawdown, qualifying days, and your real account health score.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '56px' }}>
            <CtaButton onClick={onGetStarted} size="lg" />
            <p style={{ color: '#475569', fontSize: '13px' }}>Sign in with Google · No credit card required</p>
          </div>

          {/* Trust pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 28px' }}>
            {[
              { val: '< 1 min', rest: 'to your first dashboard' },
              { val: '100%',    rest: 'private — your data only' },
              { val: '10+',     rest: 'prop firm rule sets' },
            ].map(t => (
              <div key={t.val} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 800 }}>{t.val}</span> {t.rest}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Screenshot ──────────────────────────────────── */}
      <section style={{ paddingBottom: 'clamp(64px,8vw,112px)' }}>
        <div style={container}>
          {/* Glow behind frame */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: '-20px', borderRadius: '32px', pointerEvents: 'none',
              background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.12), transparent)',
              filter: 'blur(24px)',
            }} />
            <BrowserFrame><DashboardMockup /></BrowserFrame>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────── */}
      <section style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.015)',
        padding: '48px 0',
      }}>
        <div style={{ ...container, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '32px', textAlign: 'center' }}>
          {[
            { label: 'Account Health Score', sub: 'One number, total clarity',  color: '#34d399' },
            { label: 'Consistency Rule',      sub: 'Know your daily ceiling',    color: '#818cf8' },
            { label: 'Qualifying Days',        sub: 'Track days that count',     color: '#67e8f9' },
            { label: 'True Expectancy',        sub: 'See your statistical edge', color: '#c4b5fd' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ color: s.color, fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(72px,9vw,120px) 0' }}>
        <div style={container}>
          <div style={{ ...narrow, marginBottom: '56px' }}>
            <p style={{ color: '#818cf8', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.28em', marginBottom: '16px' }}>What's inside</p>
            <h2 style={{ fontSize: 'clamp(30px,4vw,48px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: '16px' }}>
              Every metric your eval requires.
            </h2>
            <p style={{ color: '#64748b', fontSize: '17px', lineHeight: 1.6 }}>
              Import your CSV. One dashboard. Know exactly where you stand.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px' }}>
            {[
              { icon: TrendingUp, color: '#34d399', border: 'rgba(52,211,153,0.2)', bg: 'rgba(52,211,153,0.05)', title: 'Account Health Score',
                desc: 'A single 0–100 score combining consistency, win rate, qualifying days, profit progress, and edge. Know at a glance if you\'re on track.' },
              { icon: Target,     color: '#818cf8', border: 'rgba(129,140,248,0.2)', bg: 'rgba(129,140,248,0.05)', title: 'Consistency Rule Tracker',
                desc: "Know exactly how much P&L you can make today before hitting your firm's best-day rule. Never accidentally violate consistency again." },
              { icon: Shield,     color: '#67e8f9', border: 'rgba(103,232,249,0.2)', bg: 'rgba(103,232,249,0.05)', title: 'Risk Rule Compliance',
                desc: 'Daily loss limit, max trailing drawdown, minimum trading days — every prop firm rule tracked live against your actual account data.' },
              { icon: BarChart3,  color: '#c4b5fd', border: 'rgba(196,181,253,0.2)', bg: 'rgba(196,181,253,0.05)', title: 'Statistical Expectancy',
                desc: 'Your average real edge per trade, from actual closed data. Positive expectancy proves your strategy has a mathematical advantage.' },
            ].map(f => (
              <div key={f.title} style={{
                borderRadius: '20px', border: `1px solid ${f.border}`, background: f.bg,
                padding: '32px', transition: 'opacity 0.2s',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  border: `1px solid ${f.border}`, background: 'rgba(0,0,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
                }}>
                  <f.icon style={{ width: '20px', height: '20px', color: f.color }} />
                </div>
                <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 800, marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Calendar Section ─────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(72px,9vw,120px) 0',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: '#07090f',
      }}>
        <div style={container}>
          <div style={{ ...narrow, marginBottom: '48px' }}>
            <p style={{ color: '#c4b5fd', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.28em', marginBottom: '16px' }}>Trade Calendar</p>
            <h2 style={{ fontSize: 'clamp(30px,4vw,48px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: '16px' }}>
              Your history, at a glance.
            </h2>
            <p style={{ color: '#64748b', fontSize: '17px', lineHeight: 1.6 }}>
              A P&L heatmap across every trading day — spot best weeks, worst streaks, and the patterns behind your edge.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 28px', marginBottom: '40px' }}>
            {['Green/red intensity by P&L size', 'Win & Loss count per day', 'Click any day for full trade log', 'Per-session journal notes'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '14px' }}>
                <CheckCircle style={{ width: '15px', height: '15px', color: '#34d399', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>

          <BrowserFrame><CalendarMockup /></BrowserFrame>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(80px,10vw,140px) 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,0.15), transparent)',
        }} />
        <div style={{ ...narrow, position: 'relative' }}>
          <p style={{ color: '#818cf8', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.28em', marginBottom: '20px' }}>Ready to pass?</p>
          <h2 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 0.92, marginBottom: '20px' }}>
            Your funded account<br />
            <span style={{ background: 'linear-gradient(135deg,#818cf8,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              starts with clarity.
            </span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '18px', lineHeight: 1.6, marginBottom: '48px' }}>
            Stop flying blind. Know exactly where you stand in under a minute.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CtaButton onClick={onGetStarted} size="xl" />
            <p style={{ color: '#334155', fontSize: '13px' }}>No credit card required</p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px 0' }}>
        <div style={{ ...container, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <p style={{ color: '#1e293b', fontSize: '13px' }}>© 2026 TraderDash · Built for prop traders.</p>
        </div>
      </footer>
    </div>
  );
}

/* ── CTA Button ─────────────────────────────────────────────── */
function CtaButton({ onClick, size = 'lg' }: { onClick: () => void; size?: 'lg' | 'xl' }) {
  const pad = size === 'xl' ? '18px 52px' : '14px 40px';
  const fs  = size === 'xl' ? '18px' : '15px';
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: pad, fontSize: fs, fontWeight: 900, borderRadius: '16px',
        background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
        color: '#fff', border: 'none', cursor: 'pointer',
        boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 16px 64px rgba(99,102,241,0.45)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 1px rgba(99,102,241,0.7), 0 20px 80px rgba(99,102,241,0.6)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 1px rgba(99,102,241,0.5), 0 16px 64px rgba(99,102,241,0.45)'; }}
    >
      <Rocket style={{ width: size === 'xl' ? '20px' : '16px', height: size === 'xl' ? '20px' : '16px' }} />
      Get Started
    </button>
  );
}

/* ── Logo ───────────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: 'linear-gradient(135deg,#34d399,#06b6d4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(52,211,153,0.3)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>
      <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.01em' }}>TraderDash</span>
    </div>
  );
}

/* ── Browser Frame ──────────────────────────────────────────── */
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: '16px', overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.025), 0 40px 120px rgba(0,0,0,0.75)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
        background: '#0b1020', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,95,87,0.8)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(254,188,46,0.8)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(40,200,64,0.8)' }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '160px', height: '20px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', color: '#475569', fontWeight: 500,
          }}>traderdash.app</div>
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
    <div style={{ background: '#0c1220', display: 'flex', minHeight: '420px' }}>
      {/* Sidebar */}
      <div style={{ width: '64px', background: '#08091a', borderRight: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '12px', flexShrink: 0 }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#34d399,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', boxShadow: '0 4px 16px rgba(52,211,153,0.25)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        {[
          { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', active: true },
          { d: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18', active: false },
          { d: 'M3 4h18M3 8h18M3 12h12', active: false },
          { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', active: false },
        ].map((item, i) => (
          <div key={i} style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.active ? 'rgba(99,102,241,0.2)' : 'transparent', border: item.active ? '1px solid rgba(99,102,241,0.3)' : 'none', opacity: item.active ? 1 : 0.22 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.active ? '#a5b4fc' : '#94a3b8'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={item.d} /></svg>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '13px' }}>Trading Dashboard</div>
            <div style={{ color: '#475569', fontSize: '10px', marginTop: '2px' }}>Apex 50k Evaluation</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', padding: '4px 10px', borderRadius: '8px' }}>● Live</span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#475569', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '8px' }}>Apr 2026</span>
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
          {[
            { label: 'Account Balance', val: '$52,840', sub: '+$2,840 profit', color: '#fff',     pct: 56, bar: '#6366f1' },
            { label: 'Net P&L',         val: '+$2,840', sub: '↑ 5.7% return',  color: '#34d399', pct: 28, bar: '#22c55e' },
            { label: "Today's P&L",     val: '+$420',   sub: 'Best $820',      color: '#34d399', pct: 42, bar: '#22c55e' },
            { label: 'Win Rate',        val: '67%',     sub: '18W · 9L',       color: '#67e8f9', pct: 67, bar: '#06b6d4' },
          ].map(c => (
            <div key={c.label} style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)', padding: '12px' }}>
              <div style={{ fontSize: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, marginBottom: '6px' }}>{c.label}</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.val}</div>
              <div style={{ fontSize: '8px', color: '#334155', marginTop: '4px', marginBottom: '10px' }}>{c.sub}</div>
              <div style={{ height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ height: '100%', borderRadius: '99px', width: `${c.pct}%`, background: c.bar, opacity: 0.8 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Dial row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
          {[
            { label: 'Consistency',  val: '24.1%',  sub: 'Under 30% ✓', ring: '#22c55e', tc: '#34d399', pct: 24 },
            { label: 'Health Score', val: '84/100', sub: 'Strong',       ring: '#22c55e', tc: '#34d399', pct: 84 },
            { label: 'Qual. Days',   val: '8 / 10', sub: '2 days left',  ring: '#f59e0b', tc: '#fbbf24', pct: 80 },
            { label: 'Expectancy',   val: '+$62',   sub: 'Per trade',    ring: '#06b6d4', tc: '#67e8f9', pct: 62 },
          ].map(d => {
            const r = 14; const circ = 2 * Math.PI * r;
            return (
              <div key={d.label} style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <svg width="36" height="36" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="18" cy="18" r={r} fill="none" stroke={d.ring} strokeWidth="3" strokeDasharray={circ} strokeDashoffset={circ - (d.pct / 100) * circ} strokeLinecap="round" transform="rotate(-90 18 18)" opacity="0.9" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 900, color: d.tc }}>{d.pct}</div>
                </div>
                <div>
                  <div style={{ fontSize: '7px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: '2px' }}>{d.label}</div>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: d.tc }}>{d.val}</div>
                  <div style={{ fontSize: '7px', color: '#334155' }}>{d.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Equity curve */}
        <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: '14px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>Equity Curve</span>
            <span style={{ fontSize: '8px', color: '#34d399', fontWeight: 800 }}>+$2,840 ↑</span>
          </div>
          <svg width="100%" height="64" viewBox={`0 0 ${PW} ${PH}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
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
    if (pnl >= 600) return { border: 'rgba(52,211,153,0.4)',  bg: 'rgba(22,163,74,0.22)',  val: '#86efac' };
    if (pnl >= 200) return { border: 'rgba(52,211,153,0.25)', bg: 'rgba(22,163,74,0.12)',  val: '#4ade80' };
    if (pnl > 0)    return { border: 'rgba(52,211,153,0.15)', bg: 'rgba(22,163,74,0.06)',  val: '#4ade80' };
    if (pnl > -200) return { border: 'rgba(239,68,68,0.2)',   bg: 'rgba(220,38,38,0.07)',  val: '#f87171' };
    return              { border: 'rgba(239,68,68,0.35)',  bg: 'rgba(220,38,38,0.18)',  val: '#fca5a5' };
  };

  const tradingDays = grid.flat().filter(Boolean) as { date: number; pnl: number; w: number; l: number }[];
  const totalPnl = tradingDays.reduce((s, d) => s + d.pnl, 0);
  const winDays  = tradingDays.filter(d => d.pnl > 0).length;

  return (
    <div style={{ background: '#0c1220', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.28em', fontWeight: 900, marginBottom: '4px' }}>Trade Calendar</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: '17px' }}>April 2026</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { label: 'Net P&L',  val: `+$${totalPnl.toLocaleString()}`, color: '#34d399' },
            { label: 'Win Days', val: `${winDays} / ${tradingDays.length}`, color: '#67e8f9' },
            { label: 'Best Day', val: '+$820',                            color: '#c4b5fd' },
          ].map(s => (
            <div key={s.label} style={{ borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)', padding: '8px 14px', textAlign: 'center', minWidth: '72px' }}>
              <div style={{ fontSize: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px', marginBottom: '6px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '8px', color: '#334155', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '6px 0', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {grid.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px' }}>
            {week.map((day, di) => {
              if (!day) return <div key={di} style={{ height: '76px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.025)', background: 'rgba(15,20,30,0.6)', opacity: 0.3 }} />;
              const s = cs(day.pnl);
              return (
                <div key={di} style={{ height: '76px', borderRadius: '14px', border: `1px solid ${s.border}`, background: s.bg, padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>{day.date}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: s.val }}>{day.pnl >= 0 ? '+' : '-'}${Math.abs(day.pnl)}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ fontSize: '7px', fontWeight: 800, color: '#4ade80', background: 'rgba(74,222,128,0.15)', padding: '1px 4px', borderRadius: '4px', border: '1px solid rgba(74,222,128,0.25)' }}>{day.w}W</span>
                      <span style={{ fontSize: '7px', fontWeight: 800, color: '#f87171', background: 'rgba(248,113,113,0.15)', padding: '1px 4px', borderRadius: '4px', border: '1px solid rgba(248,113,113,0.25)' }}>{day.l}L</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
        <span style={{ fontSize: '8px', color: '#334155', fontWeight: 600 }}>Loss</span>
        {['rgba(220,38,38,0.5)', 'rgba(220,38,38,0.18)', 'rgba(22,163,74,0.06)', 'rgba(22,163,74,0.12)', 'rgba(22,163,74,0.22)'].map((bg, i) => (
          <div key={i} style={{ width: '20px', height: '10px', borderRadius: '4px', background: bg }} />
        ))}
        <span style={{ fontSize: '8px', color: '#334155', fontWeight: 600 }}>Win</span>
      </div>
    </div>
  );
}
