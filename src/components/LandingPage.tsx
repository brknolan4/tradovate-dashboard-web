import { CheckCircle, Rocket, ShieldCheck, TrendingUp, BarChart3, Target } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const container: React.CSSProperties = {
  maxWidth: '1040px',
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

/* ── Fuel Gauge — matches real app FuelGauge component ──────── */
function FuelGauge({ percent, color, size = 100 }: { percent: number; color: string; size?: number }) {
  const arc = 125;
  const filled = (Math.min(100, Math.max(0, percent)) / 100) * arc;
  const degrees = -110 + (percent / 100) * 220;
  return (
    <svg viewBox="0 0 120 108" width={size} height={size * 0.9} style={{ overflow: 'visible' }}>
      <path d="M20 88 A40 40 0 0 1 100 88" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" strokeLinecap="round" />
      <path d="M20 88 A40 40 0 0 1 100 88" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={arc} strokeDashoffset={arc - filled}
        style={{ filter: `drop-shadow(0 0 10px ${color})`, transition: 'stroke-dashoffset 0.8s ease' }} />
      <circle cx="60" cy="88" r="8" fill="#e2e8f0" opacity="0.95" />
      <line x1="60" y1="88" x2="60" y2="52" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round"
        transform={`rotate(${degrees} 60 88)`} style={{ transition: 'transform 0.8s ease' }} />
      <text x="16" y="107" fill="rgba(255,255,255,0.35)" fontSize="9" fontWeight="700" textAnchor="middle">0</text>
      <text x="104" y="107" fill="rgba(255,255,255,0.35)" fontSize="9" fontWeight="700" textAnchor="middle">100</text>
    </svg>
  );
}

/* ── Segment Bar ─────────────────────────────────────────────── */
function SegBar({ percent, color }: { percent: number; color: string }) {
  const filled = Math.round((percent / 100) * 8);
  return (
    <div style={{ height: '20px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(2,6,23,0.8)', padding: '3px 6px', display: 'flex', gap: '4px', position: 'relative', overflow: 'hidden' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: '100%', borderRadius: '99px', background: i < filled ? color : 'rgba(255,255,255,0.07)', boxShadow: i < filled ? `0 0 8px ${color}` : 'none', transition: 'background 0.3s' }} />
      ))}
      <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: `calc(${percent}% - 2px)`, width: '3px', height: '30px', borderRadius: '99px', background: '#fff', boxShadow: '0 0 14px rgba(255,255,255,0.8)', pointerEvents: 'none' }} />
    </div>
  );
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div style={{ background: '#060a10', minHeight: '100vh', color: '#fff', fontFamily: 'inherit' }}>

      {/* ── Nav ────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,10,16,0.92)', backdropFilter: 'blur(20px)' }}>
        <div style={{ ...container, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '68px' }}>
          <Logo />
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: 'clamp(90px,10vw,140px) 0 clamp(64px,8vw,96px)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.18, pointerEvents: 'none' }} />

        <div style={{ ...narrow, position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 20px', borderRadius: '999px', border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: '32px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
            Built for prop firm traders
          </div>

          <h1 style={{ fontSize: 'clamp(48px,7vw,84px)', fontWeight: 900, lineHeight: 1.0, marginBottom: '28px', letterSpacing: '-0.025em', color: '#f8fafc' }}>
            Stop guessing.<br />
            <span style={{ background: 'linear-gradient(135deg,#818cf8,#c4b5fd,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Start passing.
            </span>
          </h1>

          <p style={{ color: '#cbd5e1', fontSize: 'clamp(18px,2.2vw,22px)', lineHeight: 1.7, marginBottom: '44px' }}>
            Import your Tradovate trades and instantly see every metric your prop firm is watching — consistency, drawdown, qualifying days, and your real account health.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', marginBottom: '56px' }}>
            <CtaButton onClick={onGetStarted} size="lg" />
            <p style={{ color: '#475569', fontSize: '14px' }}>Sign in with Google · No credit card required</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 36px' }}>
            {[{ val: '< 1 min', rest: 'to your first dashboard' }, { val: '100%', rest: 'private — your data only' }, { val: '10+', rest: 'prop firm rule sets' }].map(t => (
              <div key={t.val} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', color: '#475569' }}>
                <span style={{ color: '#e2e8f0', fontWeight: 800 }}>{t.val}</span> {t.rest}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Mockup ───────────────────────────────── */}
      <section style={{ paddingBottom: 'clamp(72px,8vw,120px)' }}>
        <div style={container}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-30px', borderRadius: '40px', background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.14), transparent)', filter: 'blur(20px)', pointerEvents: 'none' }} />
            <BrowserFrame><DashboardMockup /></BrowserFrame>
          </div>
        </div>
      </section>

      {/* ── Features + Gauges ──────────────────────────────── */}
      <section style={{ padding: 'clamp(80px,9vw,128px) 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={container}>
          <div style={{ ...narrow, marginBottom: '72px' }}>
            <p style={{ color: '#818cf8', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.28em', marginBottom: '18px' }}>What's inside</p>
            <h2 style={{ fontSize: 'clamp(36px,4.5vw,58px)', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.05, marginBottom: '20px', color: '#f1f5f9' }}>
              Every metric your eval requires.
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '20px', lineHeight: 1.65 }}>
              Import your CSV. See everything. Pass your evaluation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px' }}>
            {[
              {
                icon: ShieldCheck, color: '#34d399', border: 'rgba(52,211,153,0.25)', bg: 'linear-gradient(160deg,rgba(16,185,129,0.1),rgba(6,10,16,0.8))',
                ring: '#10b981', percent: 84,
                title: 'Account Health Score',
                value: '84 / 100', status: 'Strong — on track to pass',
                desc: 'A single 0–100 score combining consistency, win rate, qualifying days, profit progress, and edge. Know at a glance if you\'re on track to pass.',
              },
              {
                icon: TrendingUp, color: '#818cf8', border: 'rgba(129,140,248,0.25)', bg: 'linear-gradient(160deg,rgba(99,102,241,0.1),rgba(6,10,16,0.8))',
                ring: '#8b5cf6', percent: 24,
                title: 'Consistency Rule',
                value: '24.1%', status: 'Under 30% limit ✓',
                desc: "See how much of your best day's P&L you've used today. Never accidentally cross your firm's consistency ceiling again.",
              },
              {
                icon: Target, color: '#67e8f9', border: 'rgba(103,232,249,0.25)', bg: 'linear-gradient(160deg,rgba(6,182,212,0.1),rgba(6,10,16,0.8))',
                ring: '#06b6d4', percent: 68,
                title: 'Risk Rule Compliance',
                value: '8 / 10 days', status: 'Qualifying days met',
                desc: 'Daily loss limit, max trailing drawdown, minimum trading days — every prop firm rule tracked live against your actual account data.',
              },
              {
                icon: BarChart3, color: '#c4b5fd', border: 'rgba(196,181,253,0.25)', bg: 'linear-gradient(160deg,rgba(167,139,250,0.1),rgba(6,10,16,0.8))',
                ring: '#a78bfa', percent: 72,
                title: 'Statistical Expectancy',
                value: '+$62 / trade', status: 'Positive edge confirmed',
                desc: 'Your average real edge per trade, from actual closed data. Positive expectancy proves your strategy has a mathematical advantage.',
              },
            ].map(f => (
              <div key={f.title} style={{ borderRadius: '24px', border: `1px solid ${f.border}`, background: f.bg, padding: '32px 32px 28px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', border: `1px solid ${f.border}`, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <f.icon style={{ width: '20px', height: '20px', color: f.color }} />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#f1f5f9' }}>{f.title}</div>
                </div>

                {/* Gauge centered */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '20px 28px 8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <FuelGauge percent={f.percent} color={f.ring} size={150} />
                    <div style={{ marginTop: '-4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', fontWeight: 900, color: f.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{f.value}</div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '5px', fontWeight: 600 }}>{f.status}</div>
                    </div>
                  </div>
                </div>

                {/* Segment bar */}
                <div style={{ marginBottom: '20px' }}>
                  <SegBar percent={f.percent} color={f.ring} />
                </div>

                <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Calendar Section ───────────────────────────────── */}
      <section style={{ padding: 'clamp(80px,9vw,128px) 0', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#07090f' }}>
        <div style={container}>
          <div style={{ ...narrow, marginBottom: '52px' }}>
            <p style={{ color: '#c4b5fd', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.28em', marginBottom: '18px' }}>Trade Calendar</p>
            <h2 style={{ fontSize: 'clamp(36px,4.5vw,58px)', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.05, marginBottom: '20px', color: '#f1f5f9' }}>
              Your history, at a glance.
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '20px', lineHeight: 1.65 }}>
              A P&L heatmap across every trading day — spot best weeks, worst streaks, and the patterns behind your edge.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 32px', marginBottom: '44px' }}>
            {['Green/red intensity by P&L size', 'Win & Loss count per day', 'Click any day for full trade log', 'Per-session journal notes'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '9px', color: '#cbd5e1', fontSize: '16px' }}>
                <CheckCircle style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>

          <BrowserFrame><CalendarMockup /></BrowserFrame>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section style={{ padding: 'clamp(90px,10vw,150px) 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,0.16), transparent)', pointerEvents: 'none' }} />
        <div style={{ ...narrow, position: 'relative' }}>
          <p style={{ color: '#818cf8', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.28em', marginBottom: '22px' }}>Ready to pass?</p>
          <h2 style={{ fontSize: 'clamp(40px,5.5vw,70px)', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.0, marginBottom: '22px', color: '#f1f5f9' }}>
            Your funded account<br />
            <span style={{ background: 'linear-gradient(135deg,#818cf8,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              starts with clarity.
            </span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '20px', lineHeight: 1.65, marginBottom: '52px' }}>
            Stop flying blind. Know exactly where you stand in under a minute.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <CtaButton onClick={onGetStarted} size="xl" />
            <p style={{ color: '#334155', fontSize: '14px' }}>No credit card required</p>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '30px 0' }}>
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
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: size === 'xl' ? '20px 60px' : '16px 48px', fontSize: size === 'xl' ? '20px' : '17px', fontWeight: 900, borderRadius: '16px', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 16px 64px rgba(99,102,241,0.45)', transition: 'all 0.2s', letterSpacing: '-0.01em' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 1px rgba(99,102,241,0.7), 0 20px 80px rgba(99,102,241,0.6)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 1px rgba(99,102,241,0.5), 0 16px 64px rgba(99,102,241,0.45)'; }}
    >
      <Rocket style={{ width: size === 'xl' ? '22px' : '18px', height: size === 'xl' ? '22px' : '18px' }} />
      Get Started
    </button>
  );
}

/* ── Logo ───────────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg,#34d399,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(52,211,153,0.3)' }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>
      <span style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '-0.01em' }}>TraderDash</span>
    </div>
  );
}

/* ── Browser Frame ──────────────────────────────────────────── */
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 0 0 1px rgba(255,255,255,0.025), 0 40px 120px rgba(0,0,0,0.75)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 20px', background: '#0b1020', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,95,87,0.8)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(254,188,46,0.8)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(40,200,64,0.8)' }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '160px', height: '20px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#475569', fontWeight: 500 }}>traderdash.app</div>
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
    <div style={{ background: '#0c1220', display: 'flex', minHeight: '480px' }}>
      {/* Sidebar */}
      <div style={{ width: '68px', background: '#08091a', borderRight: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '10px', flexShrink: 0 }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#34d399,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', boxShadow: '0 4px 14px rgba(52,211,153,0.25)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        {[{ d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', on: true }, { d: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18', on: false }, { d: 'M3 4h18M3 8h18M3 12h12', on: false }, { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', on: false }].map((item, i) => (
          <div key={i} style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.on ? 'rgba(99,102,241,0.2)' : 'transparent', border: item.on ? '1px solid rgba(99,102,241,0.3)' : 'none', opacity: item.on ? 1 : 0.22 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={item.on ? '#a5b4fc' : '#94a3b8'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={item.d} /></svg>
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '14px' }}>Trading Dashboard</div>
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
            { label: 'Account Balance', val: '$52,840', sub: '+$2,840 profit', color: '#f1f5f9', pct: 56, bar: '#6366f1' },
            { label: 'Net P&L',         val: '+$2,840', sub: '↑ 5.7% return',  color: '#34d399', pct: 28, bar: '#22c55e' },
            { label: "Today's P&L",     val: '+$420',   sub: 'Best day $820',  color: '#34d399', pct: 42, bar: '#22c55e' },
            { label: 'Win Rate',        val: '67%',     sub: '18W · 9L',       color: '#67e8f9', pct: 67, bar: '#06b6d4' },
          ].map(c => (
            <div key={c.label} style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)', padding: '12px' }}>
              <div style={{ fontSize: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, marginBottom: '6px' }}>{c.label}</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.val}</div>
              <div style={{ fontSize: '8px', color: '#334155', marginTop: '4px', marginBottom: '10px' }}>{c.sub}</div>
              <div style={{ height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ height: '100%', borderRadius: '99px', width: `${c.pct}%`, background: c.bar, opacity: 0.8 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Mini dial cards with FuelGauge */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
          {[
            { label: 'Account Health',  val: '84',      sub: 'Strong',        ring: '#10b981', pct: 84 },
            { label: 'Consistency',     val: '24.1%',   sub: 'Under 30% ✓',  ring: '#8b5cf6', pct: 24 },
            { label: 'Qual. Days',      val: '8 / 10',  sub: '2 remaining',  ring: '#f59e0b', pct: 80 },
            { label: 'Expectancy',      val: '+$62',    sub: 'Per trade',     ring: '#06b6d4', pct: 62 },
          ].map(d => (
            <div key={d.label} style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', overflow: 'hidden' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '7px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 900, marginBottom: '4px' }}>{d.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: d.ring, lineHeight: 1 }}>{d.val}</div>
                <div style={{ fontSize: '7px', color: '#475569', marginTop: '3px', fontWeight: 600 }}>{d.sub}</div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <FuelGauge percent={d.pct} color={d.ring} size={80} />
              </div>
            </div>
          ))}
        </div>

        {/* Equity curve */}
        <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: '14px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>Equity Curve</span>
            <span style={{ fontSize: '8px', color: '#34d399', fontWeight: 800 }}>+$2,840 ↑</span>
          </div>
          <svg width="100%" height="62" viewBox={`0 0 ${PW} ${PH}`} preserveAspectRatio="none">
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
  const days = grid.flat().filter(Boolean) as { date: number; pnl: number; w: number; l: number }[];
  const totalPnl = days.reduce((s, d) => s + d.pnl, 0);
  const winDays  = days.filter(d => d.pnl > 0).length;

  return (
    <div style={{ background: '#0c1220', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.28em', fontWeight: 900, marginBottom: '4px' }}>Trade Calendar</div>
          <div style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '18px' }}>April 2026</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[{ label: 'Net P&L', val: `+$${totalPnl.toLocaleString()}`, color: '#34d399' }, { label: 'Win Days', val: `${winDays} / ${days.length}`, color: '#67e8f9' }, { label: 'Best Day', val: '+$820', color: '#c4b5fd' }].map(s => (
            <div key={s.label} style={{ borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)', padding: '8px 16px', textAlign: 'center', minWidth: '76px' }}>
              <div style={{ fontSize: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px', marginBottom: '6px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '8px', color: '#334155', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '6px 0', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {grid.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px' }}>
            {week.map((day, di) => {
              if (!day) return <div key={di} style={{ height: '80px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.025)', background: 'rgba(15,20,30,0.6)', opacity: 0.3 }} />;
              const s = cs(day.pnl);
              return (
                <div key={di} style={{ height: '80px', borderRadius: '14px', border: `1px solid ${s.border}`, background: s.bg, padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>{day.date}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: s.val }}>{day.pnl >= 0 ? '+' : '-'}${Math.abs(day.pnl)}</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <span style={{ fontSize: '7px', fontWeight: 800, color: '#4ade80', background: 'rgba(74,222,128,0.15)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(74,222,128,0.25)' }}>{day.w}W</span>
                      <span style={{ fontSize: '7px', fontWeight: 800, color: '#f87171', background: 'rgba(248,113,113,0.15)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(248,113,113,0.25)' }}>{day.l}L</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '22px' }}>
        <span style={{ fontSize: '8px', color: '#334155', fontWeight: 600 }}>Loss</span>
        {['rgba(220,38,38,0.5)', 'rgba(220,38,38,0.18)', 'rgba(22,163,74,0.06)', 'rgba(22,163,74,0.12)', 'rgba(22,163,74,0.22)'].map((bg, i) => (
          <div key={i} style={{ width: '22px', height: '11px', borderRadius: '4px', background: bg }} />
        ))}
        <span style={{ fontSize: '8px', color: '#334155', fontWeight: 600 }}>Win</span>
      </div>
    </div>
  );
}
