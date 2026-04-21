import { useState, useMemo } from 'react';
import {
    AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, Cell
} from 'recharts';
import { getTradingDay, getTradingDayDate } from '../utils/tradingDay';
import { format } from 'date-fns';

interface Trade {
    soldTimestamp: Date | string;
    boughtTimestamp: Date | string;
    pnl: number;
    symbol: string;
    durationSeconds?: number;
    commissions?: number;
}

interface SymbolStats {
    symbol: string;
    totalPnl: number;
    tradeCount: number;
    wins: number;
    losses: number;
    winRate: number;
    avgHoldSecs: number;
    avgWin: number;
    avgLoss: number;
    bestTimeLabel: string;
    sparkline: { v: number }[];
    cumulativePnl: { date: string; pnl: number }[];
    dailyPnl: { date: string; pnl: number }[];
    timeBuckets: { label: string; short: string; pnl: number; count: number }[];
    holdVsPnl: { hold: number; pnl: number }[];
    isConsistencyDriver: boolean;
    pctOfTotalPnl: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toESTHour(date: Date): number {
    const s = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric', hour12: false, timeZone: 'America/New_York'
    }).format(date);
    return parseInt(s, 10) % 24;
}

const TIME_BUCKETS: { label: string; short: string; hours: number[] }[] = [
    { label: 'Overnight', short: '6–9 PM', hours: [18, 19, 20] },
    { label: 'Asian Session', short: '9 PM–3 AM', hours: [21, 22, 23, 0, 1, 2] },
    { label: 'European Open', short: '3–9 AM', hours: [3, 4, 5, 6, 7, 8] },
    { label: 'NY Open', short: '9 AM–12 PM', hours: [9, 10, 11] },
    { label: 'Midday', short: '12–2 PM', hours: [12, 13] },
    { label: 'PM Session', short: '2–5 PM', hours: [14, 15, 16] },
];

function getBucketIdx(estHour: number): number {
    return TIME_BUCKETS.findIndex(b => b.hours.includes(estHour));
}

function fmtDur(secs: number): string {
    if (secs < 60) return `${Math.round(secs)}s`;
    if (secs < 3600) return `${Math.round(secs / 60)}m`;
    return `${(secs / 3600).toFixed(1)}h`;
}

function fmtCurrency(v: number): string {
    return `${v >= 0 ? '+' : '-'}$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── Data computation ──────────────────────────────────────────────────────────

function computeSymbolStats(trades: Trade[], bestDayTradingDayStr: string): SymbolStats[] {
    const tradingTrades = trades.filter(t => t.symbol !== 'CASH');
    const totalNetPnl = tradingTrades.reduce((s, t) => s + t.pnl, 0);

    // Group by symbol
    const bySymbol = new Map<string, Trade[]>();
    tradingTrades.forEach(t => {
        if (!bySymbol.has(t.symbol)) bySymbol.set(t.symbol, []);
        bySymbol.get(t.symbol)!.push(t);
    });

    return Array.from(bySymbol.entries()).map(([symbol, symTrades]) => {
        const sorted = [...symTrades].sort((a, b) =>
            new Date(a.soldTimestamp).getTime() - new Date(b.soldTimestamp).getTime()
        );

        const wins = sorted.filter(t => t.pnl > 0);
        const losses = sorted.filter(t => t.pnl < 0);
        const totalPnl = sorted.reduce((s, t) => s + t.pnl, 0);
        const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
        const avgHoldSecs = sorted.length > 0
            ? sorted.reduce((s, t) => s + (t.durationSeconds || 0), 0) / sorted.length
            : 0;

        // Sparkline (last 15 trades, cumulative)
        let cum = 0;
        const sparkline = sorted.slice(-15).map(t => { cum += t.pnl; return { v: cum }; });

        // Cumulative P&L over time (by trading day)
        const dailyMap = new Map<string, number>();
        sorted.forEach(t => {
            const ts = t.soldTimestamp instanceof Date ? t.soldTimestamp : new Date(t.soldTimestamp);
            const day = getTradingDay(ts);
            dailyMap.set(day, (dailyMap.get(day) || 0) + t.pnl);
        });
        let cumPnl = 0;
        const cumulativePnl = Array.from(dailyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, pnl]) => {
                cumPnl += pnl;
                const d = getTradingDayDate(day);
                return { date: format(d, 'MMM dd'), pnl: cumPnl };
            });

        const dailyPnl = Array.from(dailyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, pnl]) => {
                const d = getTradingDayDate(day);
                return { date: format(d, 'MMM dd'), pnl };
            });

        // Time-of-day buckets
        const buckets: { pnl: number; count: number }[] = TIME_BUCKETS.map(() => ({ pnl: 0, count: 0 }));
        sorted.forEach(t => {
            const ts = t.soldTimestamp instanceof Date ? t.soldTimestamp : new Date(t.soldTimestamp);
            const h = toESTHour(ts);
            const bi = getBucketIdx(h);
            if (bi >= 0) { buckets[bi].pnl += t.pnl; buckets[bi].count += 1; }
        });
        const timeBuckets = TIME_BUCKETS.map((b, i) => ({ label: b.label, short: b.short, ...buckets[i] }));

        // Best time label
        const bestBucket = timeBuckets.reduce((best, b) => b.pnl > best.pnl ? b : best, timeBuckets[0]);
        const bestTimeLabel = bestBucket.count > 0 ? bestBucket.short : '—';

        // Hold time vs P&L (for scatter)
        const holdVsPnl = sorted.map(t => ({
            hold: Math.round((t.durationSeconds || 0) / 60), // minutes
            pnl: t.pnl
        }));

        // Consistency driver: does this symbol dominate the best trading day P&L?
        const bestDaySymPnl = sorted
            .filter(t => {
                const ts = t.soldTimestamp instanceof Date ? t.soldTimestamp : new Date(t.soldTimestamp);
                return getTradingDay(ts) === bestDayTradingDayStr;
            })
            .reduce((s, t) => s + t.pnl, 0);

        const bestDayTotal = tradingTrades
            .filter(t => {
                const ts = t.soldTimestamp instanceof Date ? t.soldTimestamp : new Date(t.soldTimestamp);
                return getTradingDay(ts) === bestDayTradingDayStr;
            })
            .reduce((s, t) => s + t.pnl, 0);

        const isConsistencyDriver = bestDayTotal > 0 && (bestDaySymPnl / bestDayTotal) > 0.5;

        return {
            symbol,
            totalPnl,
            tradeCount: sorted.length,
            wins: wins.length,
            losses: losses.length,
            winRate: sorted.length > 0 ? (wins.length / sorted.length) * 100 : 0,
            avgHoldSecs,
            avgWin,
            avgLoss,
            bestTimeLabel,
            sparkline,
            cumulativePnl,
            dailyPnl,
            timeBuckets,
            holdVsPnl,
            isConsistencyDriver,
            pctOfTotalPnl: totalNetPnl !== 0 ? (totalPnl / Math.abs(totalNetPnl)) * 100 : 0,
        };
    }).sort((a, b) => Math.abs(b.totalPnl) - Math.abs(a.totalPnl));
}

// ── Sub-components ────────────────────────────────────────────────────────────

const Sparkline: React.FC<{ data: { v: number }[]; positive: boolean }> = ({ data, positive }) => (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
                <linearGradient id={`spk-${positive}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={positive ? '#10b981' : '#f43f5e'} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={positive ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={positive ? '#34d399' : '#fb7185'}
                fill={`url(#spk-${positive})`} strokeWidth={1.5} dot={false} />
        </AreaChart>
    </ResponsiveContainer>
);

const SymbolCard: React.FC<{
    stats: SymbolStats;
    isExpanded: boolean;
    onClick: () => void;
}> = ({ stats, isExpanded, onClick }) => {
    const pos = stats.totalPnl >= 0;

    return (
        <button
            onClick={onClick}
            className={`w-full text-left rounded-2xl border transition-all duration-200 p-4 group ${isExpanded
                ? 'bg-indigo-500/10 border-indigo-400/35 shadow-[0_0_24px_rgba(99,102,241,0.15)]'
                : 'bg-white/[0.03] border-white/8 hover:bg-white/[0.05] hover:border-white/15'
                }`}
            id={`symbol-card-${stats.symbol}`}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border ${pos
                        ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
                        : 'bg-rose-500/15 border-rose-500/25 text-rose-300'
                        }`}>
                        {stats.symbol.replace(/[^A-Z]/g, '').slice(0, 2)}
                    </div>
                    <div>
                        <div className="text-sm font-black text-white">{stats.symbol}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{stats.tradeCount} trades</div>
                    </div>
                </div>

                <div className="text-right">
                    <div className={`text-base font-black font-mono ${pos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fmtCurrency(stats.totalPnl)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        {stats.pctOfTotalPnl >= 0 ? '+' : ''}{stats.pctOfTotalPnl.toFixed(0)}% of total
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-xl bg-white/[0.03] border border-white/6 px-2.5 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">Win Rate</div>
                    <div className={`text-sm font-black mt-0.5 ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stats.winRate.toFixed(0)}%
                    </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/6 px-2.5 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">Avg Hold</div>
                    <div className="text-sm font-black text-white mt-0.5">{fmtDur(stats.avgHoldSecs)}</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/6 px-2.5 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">Best Time</div>
                    <div className="text-[11px] font-black text-indigo-300 mt-0.5 truncate">{stats.bestTimeLabel}</div>
                </div>
            </div>

            {/* Win/loss bar */}
            <div className="h-1.5 w-full rounded-full overflow-hidden bg-white/5 mb-3 flex">
                <div className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                    style={{ width: `${stats.winRate}%` }} />
                <div className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
                    style={{ width: `${100 - stats.winRate}%` }} />
            </div>

            {/* Sparkline */}
            <div className="h-10 w-full">
                <Sparkline data={stats.sparkline} positive={pos} />
            </div>

            {/* Consistency driver badge */}
            {stats.isConsistencyDriver && (
                <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        ⚠ Consistency day driver
                    </span>
                </div>
            )}

            {/* Expand indicator */}
            <div className={`mt-2 text-[9px] text-center font-black uppercase tracking-[0.2em] transition-colors ${isExpanded ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-500'}`}>
                {isExpanded ? '▲ Collapse' : '▼ Deep Dive'}
            </div>
        </button>
    );
};

const SymbolDrawer: React.FC<{ stats: SymbolStats }> = ({ stats }) => {
    const tooltipStyle = {
        backgroundColor: '#111827',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
        fontSize: '11px'
    };

    return (
        <div className="col-span-full rounded-2xl border border-indigo-400/20 bg-indigo-950/20 p-5 md:p-6 space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-300/70 font-black mb-1">Deep Dive</div>
                    <h3 className="text-xl font-black text-white">{stats.symbol}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {stats.wins}W / {stats.losses}L &nbsp;·&nbsp;
                        Avg win {fmtCurrency(stats.avgWin)} &nbsp;·&nbsp;
                        Avg loss {fmtCurrency(stats.avgLoss)} &nbsp;·&nbsp;
                        Avg hold {fmtDur(stats.avgHoldSecs)}
                    </p>
                </div>
                <div className={`text-2xl font-black font-mono ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {fmtCurrency(stats.totalPnl)}
                </div>
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* 1. Cumulative P&L */}
                <div className="rounded-xl bg-white/[0.025] border border-white/6 p-4">
                    <div className="text-[9px] uppercase tracking-[0.24em] text-slate-500 font-black mb-3">
                        Cumulative P&L Over Time
                    </div>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.cumulativePnl} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={stats.totalPnl >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.3} />
                                        <stop offset="100%" stopColor={stats.totalPnl >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 9 }} interval="preserveStartEnd" />
                                <YAxis axisLine={false} tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 9 }}
                                    tickFormatter={v => `$${Math.round(v)}`} width={52} />
                                <Tooltip contentStyle={tooltipStyle}
                                    formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Cumulative P&L']} />
                                <ReferenceLine y={0} stroke="rgba(148,163,184,0.25)" strokeDasharray="4 4" />
                                <Area type="monotone" dataKey="pnl"
                                    stroke={stats.totalPnl >= 0 ? '#10b981' : '#f43f5e'}
                                    fill="url(#cumFill)" strokeWidth={2} dot={false}
                                    activeDot={{ r: 3, fill: stats.totalPnl >= 0 ? '#34d399' : '#fb7185' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Daily P&L */}
                <div className="rounded-xl bg-white/[0.025] border border-white/6 p-4">
                    <div className="text-[9px] uppercase tracking-[0.24em] text-slate-500 font-black mb-3">
                        Daily P&L Contribution
                    </div>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dailyPnl} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 9 }} interval="preserveStartEnd" />
                                <YAxis axisLine={false} tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 9 }}
                                    tickFormatter={v => `$${Math.round(v)}`} width={52} />
                                <Tooltip contentStyle={tooltipStyle}
                                    formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Day P&L']} />
                                <ReferenceLine y={0} stroke="rgba(148,163,184,0.25)" strokeDasharray="4 4" />
                                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={28}>
                                    {stats.dailyPnl.map((d, i) => (
                                        <Cell key={i} fill={d.pnl >= 0 ? '#10b981' : '#f43f5e'} fillOpacity={0.85} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Time-of-Day Buckets */}
                <div className="rounded-xl bg-white/[0.025] border border-white/6 p-4">
                    <div className="text-[9px] uppercase tracking-[0.24em] text-slate-500 font-black mb-4">
                        P&L by Session
                    </div>
                    <div className="space-y-2.5">
                        {stats.timeBuckets.map(b => {
                            const maxAbs = Math.max(...stats.timeBuckets.map(x => Math.abs(x.pnl)), 1);
                            const pct = Math.abs(b.pnl) / maxAbs * 100;
                            const pos = b.pnl >= 0;
                            return (
                                <div key={b.label} className="flex items-center gap-2.5">
                                    <div className="w-20 text-[9px] text-slate-500 font-bold text-right shrink-0">{b.short}</div>
                                    <div className="flex-1 h-5 bg-white/[0.03] rounded-md overflow-hidden flex items-center">
                                        <div
                                            className={`h-full rounded-md transition-all duration-500 ${pos ? 'bg-emerald-500/70' : 'bg-rose-500/70'}`}
                                            style={{ width: b.count > 0 ? `${Math.max(pct, 4)}%` : '0%' }}
                                        />
                                    </div>
                                    <div className={`text-[10px] font-black font-mono w-16 text-right shrink-0 ${pos ? 'text-emerald-400' : b.count === 0 ? 'text-slate-600' : 'text-rose-400'}`}>
                                        {b.count > 0 ? fmtCurrency(b.pnl) : '—'}
                                    </div>
                                    <div className="text-[9px] text-slate-600 w-8 shrink-0">
                                        {b.count > 0 ? `${b.count}t` : ''}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Hold Time vs P&L scatter */}
                <div className="rounded-xl bg-white/[0.025] border border-white/6 p-4">
                    <div className="text-[9px] uppercase tracking-[0.24em] text-slate-500 font-black mb-1">
                        Hold Time vs P&L
                    </div>
                    <div className="text-[9px] text-slate-600 mb-3">Each dot = one trade. Longer hold → right</div>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis
                                    type="number" dataKey="hold" name="Hold (min)"
                                    axisLine={false} tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 9 }}
                                    tickFormatter={v => `${v}m`}
                                    label={{ value: 'Hold (min)', position: 'insideBottomRight', fill: '#475569', fontSize: 9, offset: -4 }}
                                />
                                <YAxis
                                    type="number" dataKey="pnl" name="P&L"
                                    axisLine={false} tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 9 }}
                                    tickFormatter={v => `$${Math.round(v)}`} width={48}
                                />
                                <ReferenceLine y={0} stroke="rgba(148,163,184,0.25)" strokeDasharray="4 4" />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
                                    formatter={(v: any, name: any) =>
                                        name === 'Hold (min)' ? [`${v}m`, 'Hold Time'] : [`$${Number(v).toFixed(2)}`, 'P&L']
                                    }
                                />
                                <Scatter data={stats.holdVsPnl} shape={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    return (
                                        <circle
                                            cx={cx} cy={cy} r={4}
                                            fill={payload.pnl >= 0 ? '#10b981' : '#f43f5e'}
                                            fillOpacity={0.75}
                                            stroke={payload.pnl >= 0 ? '#34d399' : '#fb7185'}
                                            strokeWidth={0.5}
                                        />
                                    );
                                }} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────

interface SymbolDeepDiveProps {
    trades: Trade[];
    bestDayTradingDayStr?: string;
}

export const SymbolDeepDive: React.FC<SymbolDeepDiveProps> = ({ trades, bestDayTradingDayStr = '' }) => {
    const [expanded, setExpanded] = useState<string | null>(null);

    const symbolStats = useMemo(
        () => computeSymbolStats(trades, bestDayTradingDayStr),
        [trades, bestDayTradingDayStr]
    );

    if (symbolStats.length === 0) {
        return (
            <section className="glass rounded-[24px] p-6 border-white/10">
                <div className="text-[10px] uppercase tracking-[0.32em] text-indigo-300/80 font-black mb-1">Symbol Deep Dive</div>
                <p className="text-slate-500 text-sm">Import trade data to see per-symbol performance analysis.</p>
            </section>
        );
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.32em] text-indigo-300/80 font-black mb-1">Symbol Deep Dive</div>
                    <h2 className="text-lg font-black text-white tracking-tight">Performance by Instrument</h2>
                </div>
                <span className="text-[10px] text-slate-500 font-bold">{symbolStats.length} symbol{symbolStats.length > 1 ? 's' : ''} · click any card to expand</span>
            </div>

            {/* Cards grid + inline drawers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
                {symbolStats.map(stats => (
                    <>
                        <SymbolCard
                            key={stats.symbol}
                            stats={stats}
                            isExpanded={expanded === stats.symbol}
                            onClick={() => setExpanded(expanded === stats.symbol ? null : stats.symbol)}
                        />
                        {expanded === stats.symbol && (
                            <SymbolDrawer key={`drawer-${stats.symbol}`} stats={stats} />
                        )}
                    </>
                ))}
            </div>
        </section>
    );
};
