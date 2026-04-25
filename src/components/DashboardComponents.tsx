import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LabelList, ReferenceLine } from 'recharts';
import { Wallet, Activity, Clock, Zap, ArrowUpRight, ArrowDownRight, Gauge, Flame, ShieldCheck, TrendingUp } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string | number;
    info?: string | React.ReactNode;
    sparklineData?: any[];
    streak?: { w: number, l: number, current: string };
    winLoss?: { w: number, l: number, avgW: number, avgL: number, maxW?: number, maxL?: number };
    variant?: 'default' | 'winrate' | 'avgwinloss' | 'profitfactor' | 'duration' | 'fastTrades' | 'microscalping' | 'executions';
    fastTrades?: { fast: number, standard: number };
    avgDuration?: string;
    centered?: boolean;
    progressBar?: { current: number; target: number; label: string; start?: number; maxLossFloor?: number; dailyLoss?: { used: number; limit: number } };
}

interface StoryMeterCardProps {
    eyebrow: string;
    title: string;
    description: string;
    value: string;
    percent: number;
    tone?: 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan';
    segments?: number;
    leftLabel: string;
    rightLabel: string;
    status: string;
    footnote?: string;
    trend?: string;
    icon?: 'payout' | 'consistency' | 'health';
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const toneMap = {
    violet: {
        track: 'from-indigo-500 via-violet-500 to-cyan-400',
        glow: 'shadow-[0_0_32px_rgba(99,102,241,0.32)]',
        text: 'text-violet-300',
        badge: 'border-violet-500/20 bg-violet-500/10 text-violet-200',
        segment: 'bg-violet-400',
        ring: '#8b5cf6',
        soft: 'bg-violet-500/10',
    },
    emerald: {
        track: 'from-emerald-500 via-lime-400 to-cyan-300',
        glow: 'shadow-[0_0_32px_rgba(16,185,129,0.3)]',
        text: 'text-emerald-300',
        badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
        segment: 'bg-emerald-400',
        ring: '#10b981',
        soft: 'bg-emerald-500/10',
    },
    amber: {
        track: 'from-amber-500 via-orange-400 to-yellow-300',
        glow: 'shadow-[0_0_32px_rgba(245,158,11,0.28)]',
        text: 'text-amber-300',
        badge: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
        segment: 'bg-amber-400',
        ring: '#f59e0b',
        soft: 'bg-amber-500/10',
    },
    rose: {
        track: 'from-rose-600 via-rose-500 to-orange-300',
        glow: 'shadow-[0_0_32px_rgba(244,63,94,0.28)]',
        text: 'text-rose-300',
        badge: 'border-rose-500/20 bg-rose-500/10 text-rose-100',
        segment: 'bg-rose-400',
        ring: '#f43f5e',
        soft: 'bg-rose-500/10',
    },
    cyan: {
        track: 'from-cyan-500 via-sky-400 to-indigo-400',
        glow: 'shadow-[0_0_32px_rgba(6,182,212,0.28)]',
        text: 'text-cyan-300',
        badge: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100',
        segment: 'bg-cyan-400',
        ring: '#06b6d4',
        soft: 'bg-cyan-500/10',
    },
} as const;

const MeterIcon: React.FC<{ icon: StoryMeterCardProps['icon']; tone: StoryMeterCardProps['tone'] }> = ({ icon, tone = 'violet' }) => {
    const iconClass = `w-5 h-5 ${toneMap[tone].text}`;

    if (icon === 'health') return <ShieldCheck className={iconClass} />;
    if (icon === 'consistency') return <TrendingUp className={iconClass} />;
    return <Flame className={iconClass} />;
};

export const StoryMeterCard: React.FC<StoryMeterCardProps> = ({
    eyebrow,
    title,
    description,
    value,
    percent,
    tone = 'violet',
    segments = 6,
    leftLabel,
    rightLabel,
    status,
    footnote,
    trend,
    icon = 'payout',
}) => {
    const palette = toneMap[tone];
    const normalized = clamp(percent);
    const filledSegments = Math.round((normalized / 100) * segments);

    return (
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5 md:p-6 relative overflow-hidden">
            <div className={`absolute inset-0 pointer-events-none ${palette.soft}`} style={{ clipPath: 'polygon(0 0, 100% 0, 100% 35%, 0 100%)', opacity: 0.22 }} />
            <div className="relative flex flex-col gap-5 h-full">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-xs md:text-sm uppercase tracking-widest font-black text-slate-500 mb-2">{eyebrow}</div>
                        <div className="text-xl md:text-2xl font-black text-white">{title}</div>
                        <div className="text-sm text-slate-400 mt-1 max-w-xl">{description}</div>
                    </div>
                    <div className={`rounded-2xl border p-3 ${palette.badge}`}>
                        <MeterIcon icon={icon} tone={tone} />
                    </div>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-4 items-center">
                    <div className="space-y-3">
                        <div className="flex items-end justify-between gap-3">
                            <div className="text-3xl md:text-4xl font-black tracking-tight text-white">{value}</div>
                            <div className={`text-sm font-black ${palette.text}`}>{normalized.toFixed(1)}%</div>
                        </div>

                        <div className="relative h-5 rounded-full border border-white/8 bg-slate-950/70 px-1.5 flex items-center gap-1.5 overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05),transparent)]" />
                            {Array.from({ length: segments }).map((_, index) => (
                                <div
                                    key={index}
                                    className={`relative h-2.5 flex-1 rounded-full transition-all duration-700 ${index < filledSegments ? `${palette.segment} ${palette.glow}` : 'bg-white/8'}`}
                                />
                            ))}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 h-8 w-1 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.6)] transition-all duration-700"
                                style={{ left: `calc(${normalized}% - 2px)` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] font-black text-slate-500">
                            <span>{leftLabel}</span>
                            <span>{rightLabel}</span>
                        </div>
                    </div>

                    <FuelGauge percent={normalized} tone={tone} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500 font-black mb-1">Status</div>
                        <div className={`text-sm font-bold ${palette.text}`}>{status}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500 font-black mb-1">Story</div>
                        <div className="text-sm font-bold text-white">{trend || 'Steady build'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500 font-black mb-1">Read</div>
                        <div className="text-sm font-bold text-slate-300">{footnote || 'No extra note'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const FuelGauge: React.FC<{ percent: number; tone?: StoryMeterCardProps['tone']; targetMarker?: number }> = ({ percent, tone = 'violet', targetMarker }) => {
    const normalized = clamp(percent);
    const palette = toneMap[tone];
    const degrees = -110 + (normalized / 100) * 220;

    return (
        <div className="relative h-[112px] w-[112px] shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-[20deg]">
                <path d="M20 88 A40 40 0 0 1 100 88" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
                <text x="15" y="99" fill="rgba(255,255,255,0.4)" fontSize="8" fontWeight="800" fontFamily="system-ui" textAnchor="end" transform="rotate(20 15 99)">0%</text>
                <text x="105" y="99" fill="rgba(255,255,255,0.4)" fontSize="8" fontWeight="800" fontFamily="system-ui" textAnchor="start" transform="rotate(20 105 99)">100%</text>
                {targetMarker !== undefined && (
                    <>
                        <line
                            x1="60" y1="88" x2="60" y2="36"
                            stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4"
                            transform={`rotate(${-110 + (clamp(targetMarker) / 100) * 220} 60 88)`}
                            className="opacity-80"
                        />
                        <text
                            x="60" y="28" fill="#f43f5e" fontSize="9" fontWeight="800" fontFamily="system-ui" textAnchor="middle"
                            transform={`rotate(${-110 + (clamp(targetMarker) / 100) * 220 + 20} 60 88)`}
                        >
                            {targetMarker}%
                        </text>
                    </>
                )}
                <path
                    d="M20 88 A40 40 0 0 1 100 88"
                    fill="none"
                    stroke={palette.ring}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="126"
                    strokeDashoffset={126 - (normalized / 100) * 126}
                    className="transition-all duration-700"
                    style={{ filter: `drop-shadow(0 0 10px ${palette.ring})` }}
                />
                <circle cx="60" cy="88" r="8" fill="#e2e8f0" opacity="0.95" />
                <line
                    x1="60"
                    y1="88"
                    x2="60"
                    y2="52"
                    stroke="#f8fafc"
                    strokeWidth="4"
                    strokeLinecap="round"
                    transform={`rotate(${degrees} 60 88)`}
                    className="transition-all duration-700"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-3 text-center">
                <div className="text-[9px] uppercase tracking-[0.24em] text-slate-500 font-black">Meter</div>
                <div className={`text-lg font-black ${palette.text}`}>{normalized.toFixed(0)}%</div>
            </div>
        </div>
    );
};

export interface MiniDialCardProps {
    label: string;
    value: string | number;
    percent: number;
    targetMarker?: number;
    tone?: 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan';
    subtext?: string;
    valueClassName?: string;
    info?: React.ReactNode;
}

export const MiniDialCard: React.FC<MiniDialCardProps> = ({
    label, value, percent, targetMarker, tone = 'violet', subtext, valueClassName, info
}) => {
    const [showInfo, setShowInfo] = useState(false);
    return (
        <div className="relative">
            {info && (
                <div
                    className="absolute top-3.5 right-3.5 z-20"
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                >
                    <button className="w-4 h-4 rounded-full border border-slate-600/70 bg-slate-900/80 flex items-center justify-center text-[9px] font-black text-slate-500 hover:border-indigo-400/70 hover:text-indigo-300 transition-colors select-none">
                        i
                    </button>
                    {showInfo && (
                        <div className="absolute bottom-full right-0 mb-2 w-72 rounded-2xl border border-white/10 bg-[#0d1117] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.85)] pointer-events-none z-50">
                            <div className="absolute right-2.5 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-white/10" />
                            {info}
                        </div>
                    )}
                </div>
            )}
            <div className="glass rounded-[24px] border border-white/8 p-5 flex items-center justify-between gap-4 relative overflow-hidden transition-all duration-300 hover:border-indigo-400/25">
                <div className="flex flex-col gap-1 z-10 w-full items-center text-center min-w-0">
                    <span className="card-eyebrow w-full">{label}</span>
                    <div className={`text-3xl md:text-4xl leading-none font-black tracking-tight mt-1 ${valueClassName || 'text-white'}`}>{value}</div>
                    {subtext && <div className="card-sub mt-2 leading-tight px-2 w-full">{subtext}</div>}
                </div>
                <div className="shrink-0 origin-right" style={{ transform: 'scale(0.85)', marginRight: '-8px' }}>
                    <FuelGauge percent={percent} tone={tone} targetMarker={targetMarker} />
                </div>
            </div>
        </div>
    );
};

export const MetricCard: React.FC<MetricCardProps> = ({
    label, value, info, sparklineData, streak, winLoss, variant = 'default', fastTrades, avgDuration, centered, progressBar
}) => {
    const valStr = String(value).toLowerCase();
    const numericValue = typeof value === 'number'
        ? value
        : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    const isNegativeStreak = valStr.includes('red') || valStr.includes('losses');
    const isPositive = typeof value === 'number'
        ? value >= 0
        : (isNegativeStreak ? false : (Number.isNaN(numericValue) ? true : numericValue >= 0));

    const totalWinLoss = (winLoss?.w || 0) + (winLoss?.l || 0);
    const winPct = totalWinLoss > 0 ? (winLoss!.w / totalWinLoss) * 100 : 0;
    const lossPct = totalWinLoss > 0 ? (winLoss!.l / totalWinLoss) * 100 : 0;

    const progressStart = progressBar?.start ?? 0;
    const progressSpan = progressBar ? Math.max(progressBar.target - progressStart, 1) : 1;
    const progressCurrent = progressBar ? progressBar.current - progressStart : 0;
    const progressPct = progressBar ? Math.min(100, Math.max(0, (progressCurrent / progressSpan) * 100)) : 0;
    const remainingToTarget = progressBar ? Math.max(progressBar.target - progressBar.current, 0) : 0;

    return (
        <div className={`glass relative overflow-hidden p-6 md:p-7 flex flex-col gap-5 min-w-0 flex-1 border-white/8 transition-all duration-300 hover:border-indigo-400/25 hover:-translate-y-0.5 ${centered ? 'items-center text-center' : ''}`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

            <div className={`flex flex-col gap-1.5 border-b border-white/6 pb-4 items-center w-full text-center`}>
                <span className="card-eyebrow w-full whitespace-normal leading-snug">{label}</span>
                {info && (typeof info === 'string' ? <span className="card-sub max-w-[24rem] whitespace-normal">{info}</span> : info)}
            </div>

            <div className={`flex flex-col gap-3 flex-1 justify-center ${centered ? 'w-full items-center' : ''}`}>
                <div className={`flex items-start justify-between gap-4 ${centered ? 'justify-center w-full' : ''}`}>
                    <div className={`flex flex-col gap-1 ${centered ? 'items-center' : ''}`}>
                        <div className={`text-3xl md:text-4xl leading-none font-black tracking-tight ${typeof value === 'string' && (valStr.includes('days') || valStr.includes('wins') || valStr.includes('losses'))
                            ? (isPositive ? 'text-emerald-300' : 'text-rose-300')
                            : typeof value === 'string' && value.toString().includes('$')
                                ? (isPositive ? 'text-white' : 'text-rose-300')
                                : 'text-white'
                            }`}>
                            {value}
                        </div>
                        {variant === 'duration' && <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.24em]">Average hold</span>}
                        {!centered && !progressBar && typeof value !== 'undefined' && (
                            <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] w-fit ${isPositive ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/15' : 'bg-rose-500/10 text-rose-300 border border-rose-500/15'}`}>
                                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {isPositive ? 'Positive' : 'Negative'}
                            </div>
                        )}
                    </div>

                    {!centered && (variant === 'duration' || variant === 'fastTrades' || variant === 'microscalping' || variant === 'executions' || variant === 'profitfactor') && (
                        <div className={`p-2.5 rounded-2xl border border-white/8 ${(variant === 'duration' || variant === 'executions') ? 'bg-amber-500/10 text-amber-300' : variant === 'profitfactor' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-indigo-500/10 text-indigo-300'}`}>
                            {(variant === 'duration' || variant === 'executions') ? <Clock className="w-5 h-5" /> : variant === 'profitfactor' ? <Gauge className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                        </div>
                    )}

                    {(streak || (variant === 'winrate' && winLoss)) && (
                        <div className="flex flex-col gap-2 ml-auto">
                            <div className="px-3 py-1.5 bg-emerald-500/12 text-emerald-300 border border-emerald-500/15 font-black text-xs rounded-full min-w-[72px] text-center">
                                {winLoss?.w || streak?.w} W
                            </div>
                            <div className="px-3 py-1.5 bg-rose-500/12 text-rose-300 border border-rose-500/15 font-black text-xs rounded-full min-w-[72px] text-center">
                                {winLoss?.l || streak?.l} L
                            </div>
                        </div>
                    )}

                    {!centered && variant === 'avgwinloss' && winLoss && (
                        <div className="flex flex-col gap-2 ml-auto text-right">
                            <div className="flex items-center justify-between gap-3 p-1 rounded-md bg-emerald-500/10 border border-emerald-500/15 min-w-[100px] px-2.5">
                                <span className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold">Max</span>
                                <span className="text-emerald-300 font-black text-[13px] tabular-nums">{winLoss.maxW ? `+$${Math.round(winLoss.maxW).toLocaleString()}` : '0'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 p-1 rounded-md bg-rose-500/10 border border-rose-500/15 min-w-[100px] px-2.5">
                                <span className="text-[9px] uppercase tracking-widest text-rose-500 font-bold">Max</span>
                                <span className="text-rose-300 font-black text-[13px] tabular-nums">{winLoss.maxL ? `-$${Math.abs(Math.round(winLoss.maxL)).toLocaleString()}` : '0'}</span>
                            </div>
                        </div>
                    )}

                    {!centered && (variant === 'fastTrades' || variant === 'microscalping' || variant === 'executions') && fastTrades && (
                        <div className="flex flex-col gap-1.5 ml-auto">
                            <div className="px-3 py-1.5 bg-indigo-500/12 text-indigo-300 border border-indigo-500/15 font-black text-[10px] rounded-full min-w-[68px] text-center" title="Under 10s">
                                {fastTrades.fast} &lt;10s
                            </div>
                            <div className="px-3 py-1.5 bg-slate-700/40 text-slate-300 border border-white/8 font-black text-[10px] rounded-full min-w-[68px] text-center" title="Over 10s">
                                {fastTrades.standard} &gt;10s
                            </div>
                        </div>
                    )}

                    {!centered && variant === 'profitfactor' && winLoss && (
                        <div className="w-18 h-18 ml-auto shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Wins', value: winLoss.w },
                                            { name: 'Losses', value: winLoss.l }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={20}
                                        outerRadius={30}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#f43f5e" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {progressBar && (
                    <div className="w-full mt-1 space-y-3">
                        {progressBar.label && (
                        <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                            <span>{progressBar.label}</span>
                            <span>{progressPct.toFixed(1)}%</span>
                        </div>
                        )}
                        <div className="relative h-3.5 w-full rounded-full overflow-hidden border border-white/8 bg-slate-900/70">
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04),transparent)]" />
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all duration-1000 ease-out"
                                style={{ width: `${progressPct}%` }}
                            />
                            {progressBar.maxLossFloor !== undefined && (() => {
                                const floorPct = Math.min(100, Math.max(0,
                                    (progressBar.maxLossFloor! - progressStart) / progressSpan * 100
                                ));
                                return (
                                    <div
                                        className="absolute top-0 bottom-0 w-[2px] bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]"
                                        style={{ left: `${floorPct}%` }}
                                    />
                                );
                            })()}
                        </div>
                        {progressBar.dailyLoss && (() => {
                            const dlPct = Math.min(100, (progressBar.dailyLoss!.used / progressBar.dailyLoss!.limit) * 100);
                            const dlColor = dlPct >= 80 ? '#f43f5e' : dlPct >= 50 ? '#f59e0b' : '#22c55e';
                            const dlTextColor = dlPct >= 80 ? 'text-rose-400' : dlPct >= 50 ? 'text-amber-400' : 'text-slate-500';
                            return (
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] uppercase tracking-widest text-slate-600 font-black shrink-0 w-[68px]">Daily Loss</span>
                                    <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${dlPct}%`, background: dlColor }} />
                                    </div>
                                    <span className={`text-[9px] font-bold tabular-nums shrink-0 ${dlTextColor}`}>
                                        ${Math.round(progressBar.dailyLoss!.used).toLocaleString()}/${progressBar.dailyLoss!.limit.toLocaleString()}
                                    </span>
                                </div>
                            );
                        })()}
                        <div className={`grid ${progressBar.maxLossFloor !== undefined ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-left`}>
                            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                                <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500 font-black mb-1">Target</div>
                                <div className="text-xs font-bold text-white">${progressBar.target.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            </div>
                            {progressBar.maxLossFloor !== undefined && (() => {
                                const cushion = progressBar.current - progressBar.maxLossFloor!;
                                const cushionOk = cushion > 0;
                                return (
                                    <div className={`rounded-xl border px-3 py-2 ${cushionOk ? 'border-rose-500/25 bg-rose-500/8' : 'border-rose-500/50 bg-rose-500/20'}`}>
                                        <div className="text-[9px] uppercase tracking-[0.22em] text-rose-400/70 font-black mb-1">DD Floor</div>
                                        <div className="text-xs font-bold text-rose-400">${Math.round(progressBar.maxLossFloor!).toLocaleString()}</div>
                                        <div className={`text-[9px] mt-0.5 font-bold ${cushionOk ? 'text-slate-500' : 'text-rose-300'}`}>
                                            {cushionOk ? `$${Math.round(cushion).toLocaleString()} cushion` : 'BLOWN'}
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                                <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500 font-black mb-1">To Goal</div>
                                <div className="text-xs font-bold text-indigo-300">{remainingToTarget > 0 ? `$${remainingToTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'Ready'}</div>
                            </div>
                        </div>
                    </div>
                )}

                {sparklineData && !winLoss && !progressBar && (
                    <div className="h-12 w-full mt-1 rounded-2xl border border-white/6 bg-white/[0.02] p-1.5">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparklineData}>
                                <defs>
                                    <linearGradient id="metricSparkFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#f43f5e'} stopOpacity={0.26} />
                                        <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#f43f5e'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="val"
                                    stroke={isPositive ? '#34d399' : '#fb7185'}
                                    fill="url(#metricSparkFill)"
                                    strokeWidth={2.2}
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {winLoss && !centered && (
                    <div className="space-y-3 mt-1">
                        <div className="h-2 w-full bg-slate-900/70 rounded-full overflow-hidden flex border border-white/6">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                                style={{ width: `${winPct}%` }}
                            />
                            <div
                                className="h-full bg-gradient-to-r from-rose-500 to-rose-400"
                                style={{ width: `${lossPct}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.22em] font-black">
                            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/6 px-3 py-2 text-emerald-300">
                                Win share <span className="block text-sm tracking-normal text-white mt-1">{winPct.toFixed(0)}%</span>
                            </div>
                            <div className="rounded-xl border border-rose-500/10 bg-rose-500/6 px-3 py-2 text-rose-300 text-right">
                                Loss share <span className="block text-sm tracking-normal text-white mt-1">{lossPct.toFixed(0)}%</span>
                            </div>
                        </div>
                        {variant === 'avgwinloss' && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                                    <span className="text-slate-500 uppercase tracking-[0.22em] text-[9px] font-black">Avg Win</span>
                                    <div className="text-emerald-300 text-sm font-black tracking-tight mt-1">${winLoss.avgW.toFixed(0)}</div>
                                </div>
                                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-right">
                                    <span className="text-slate-500 uppercase tracking-[0.22em] text-[9px] font-black">Avg Loss</span>
                                    <div className="text-rose-300 text-sm font-black tracking-tight mt-1">-${Math.abs(winLoss.avgL).toFixed(0)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {variant === 'executions' && avgDuration && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/6 w-full">
                        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                            <span className="text-slate-500 uppercase tracking-[0.22em] text-[9px] font-black">Avg Duration</span>
                            <div className="text-amber-300 text-sm font-black tracking-tight mt-1">{avgDuration}</div>
                        </div>
                        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-right">
                            <span className="text-slate-500 uppercase tracking-[0.22em] text-[9px] font-black">Scalp Rate</span>
                            <div className="text-indigo-300 text-sm font-black tracking-tight mt-1">
                                {((fastTrades?.fast || 0) / (parseFloat(String(value).replace(/[$,]/g, '')) || 1) * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const SymbolPnLChart: React.FC<{ data: any[] }> = ({ data }) => {
    const sortedData = [...data].slice(0, 8);

    return (
        <div className="glass p-6 md:p-7 h-[360px] xl:h-[380px] flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_36%)] pointer-events-none" />
            <div className="relative flex items-start justify-between gap-4 mb-4">
                <div>
                    <div className="card-eyebrow">Instrument Mix</div>
                    <div className="card-title !mb-0"><Activity className="w-4 h-4 opacity-70 text-indigo-400" /> Performance by Symbol</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-right shrink-0">
                    <div className="card-eyebrow !mb-0 !tracking-[0.18em]">Symbols</div>
                    <div className="text-sm font-bold text-white mt-1">{sortedData.length}</div>
                </div>
            </div>
            <div className="relative flex-1 min-h-0 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sortedData} margin={{ top: 24, right: 10, left: 6, bottom: 4 }} barCategoryGap="22%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="symbol"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            tickFormatter={(val) => `$${Math.round(val).toLocaleString()}`}
                            width={70}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', boxShadow: '0 16px 40px rgba(0,0,0,0.35)' }}
                            formatter={(val: any, name?: string) => {
                                if (name === 'pnl') return [`$${parseFloat(val).toLocaleString()}`, 'Net P&L'];
                                if (name === 'tradeCount') return [val, 'Trades'];
                                return [val, name || ''];
                            }}
                        />
                        <ReferenceLine y={0} stroke="rgba(148,163,184,0.4)" strokeDasharray="4 4" />
                        <Bar
                            dataKey="pnl"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={50}
                        >
                            <LabelList
                                dataKey="tradeCount"
                                position="top"
                                formatter={(val: any) => `${val}`}
                                style={{ fill: '#cbd5e1', fontSize: '10px', fontWeight: 'bold' }}
                                offset={8}
                            />
                            {sortedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const WeekdayPnLChart: React.FC<{ data: Array<{ day: string; avgPnl: number; totalPnl: number; tradeDays: number }> }> = ({ data }) => {
    return (
        <div className="glass p-6 md:p-7 h-[360px] xl:h-[380px] flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.08),transparent_34%)] pointer-events-none" />
            <div className="relative flex flex-col items-center text-center mb-4 gap-1">
                <div className="card-eyebrow text-cyan-300/70">Weekday Edge</div>
                <div className="card-title !mb-0 justify-center">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">Avg P&L by Weekday</span>
                </div>
            </div>
            <div className="relative flex-1 min-h-0 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 24, right: 10, left: 6, bottom: 4 }} barCategoryGap="22%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            tickFormatter={(val) => `$${Math.round(val).toLocaleString()}`}
                            width={70}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', boxShadow: '0 16px 40px rgba(0,0,0,0.35)' }}
                            formatter={(val: any, name?: string, item?: any) => {
                                if (name === 'avgPnl') return [`$${parseFloat(val).toLocaleString()}`, 'Avg P&L'];
                                if (name === 'totalPnl') return [`$${parseFloat(val).toLocaleString()}`, 'Total P&L'];
                                if (name === 'tradeDays') return [item?.payload?.tradeDays ?? val, 'Trading days'];
                                return [val, name || ''];
                            }}
                        />
                        <ReferenceLine y={0} stroke="rgba(148,163,184,0.4)" strokeDasharray="4 4" />
                        <Bar dataKey="avgPnl" radius={[8, 8, 0, 0]} maxBarSize={50}>
                            <LabelList
                                dataKey="avgPnl"
                                position="top"
                                formatter={(val: any) => {
                                    const n = parseFloat(val);
                                    if (isNaN(n) || n === 0) return '';
                                    return n >= 0 ? `+$${Math.round(n)}` : `-$${Math.abs(Math.round(n))}`;
                                }}
                                style={{ fill: '#cbd5e1', fontSize: '10px', fontWeight: '800' }}
                                offset={8}
                            />
                            {data.map((entry, index) => (
                                <Cell key={`weekday-cell-${index}`} fill={entry.avgPnl >= 0 ? '#10b981' : '#f43f5e'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const PnLChart: React.FC<{ data: any[] }> = ({ data }) => {
    const minVal = Math.min(...data.map(d => Math.min(d.balance, d.target || d.balance)));
    const maxVal = Math.max(...data.map(d => Math.max(d.balance, d.target || d.balance)));
    const buffer = Math.max((maxVal - minVal) * 0.12, 250);

    return (
        <div className="glass p-6 md:p-7 h-[360px] xl:h-[380px] flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.06),transparent_32%)] pointer-events-none" />
            <div className="relative flex flex-col items-center text-center mb-4 gap-1">
                <div className="card-eyebrow text-indigo-300/70">Equity Path</div>
                <div className="card-title !mb-0 justify-center">
                    <Wallet className="w-4 h-4 text-indigo-400" />
                    <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">EOD Balance &amp; Profit Target</span>
                </div>
            </div>
            <div className="relative flex-1 min-h-0 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                        <defs>
                            <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.28} />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            dy={10}
                        />
                        <YAxis
                            domain={[minVal - buffer, maxVal + buffer]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            tickFormatter={(val) => `$${Math.round(val).toLocaleString()}`}
                            width={72}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', boxShadow: '0 16px 40px rgba(0,0,0,0.35)' }}
                            formatter={(val: any, name: any) => [
                                `$${parseFloat(val).toLocaleString()}`,
                                name === 'balance' ? 'Balance' : (name === 'target' ? 'Profit Target' : (name === 'lossLimit' ? 'Loss Limit' : name))
                            ]}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <ReferenceLine y={data[0]?.balance} stroke="rgba(148,163,184,0.35)" strokeDasharray="4 4" />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#22c55e"
                            fillOpacity={1}
                            fill="url(#colorPnL)"
                            strokeWidth={2.4}
                            name="balance"
                            dot={false}
                            activeDot={{ r: 4, fill: '#34d399', stroke: '#0f172a', strokeWidth: 2 }}
                        />
                        <Area
                            type="stepAfter"
                            dataKey="target"
                            stroke="#f59e0b"
                            fill="none"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="target"
                            dot={false}
                            activeDot={false}
                        />
                        <Area
                            type="stepAfter"
                            dataKey="lossLimit"
                            stroke="#ef4444"
                            fill="none"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="lossLimit"
                            dot={false}
                            activeDot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};