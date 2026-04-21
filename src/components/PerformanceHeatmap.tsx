import { useMemo } from 'react';
import { getTradingDay, getTradingDayDate } from '../utils/tradingDay';

interface Trade {
    soldTimestamp: Date | string;
    pnl: number;
    symbol: string;
}

interface HeatmapCell {
    pnl: number;
    count: number;
}

interface PerformanceHeatmapProps {
    trades: Trade[];
}

// Full trading session hours in EST order: 6 PM → 5 PM (23 hours)
// Hour values are EST 24h clock
const SESSION_HOURS = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

const formatHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
};

// Day index mapping: Mon=0 Tue=1 Wed=2 Thu=3 Fri=4
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Convert a JS Date to US/Eastern hour (0–23)
function toESTHour(date: Date): number {
    const estStr = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: 'America/New_York',
    }).format(date);
    const h = parseInt(estStr, 10);
    return isNaN(h) ? 0 : h % 24;
}

// Get weekday (0=Mon...4=Fri) from a trading-day date string (YYYY-MM-DD)
function tradingDayOfWeek(tradingDayStr: string): number {
    // getTradingDayDate gives us noon on the named trading day
    const d = getTradingDayDate(tradingDayStr);
    const jsDay = d.getDay(); // 0=Sun,1=Mon,...,6=Sat
    return jsDay === 0 ? 0 : jsDay - 1; // Mon=0…Fri=4, Sun maps to Mon col (shouldn't occur)
}

// Linear interpolation between two RGB values
function lerpColor(
    from: [number, number, number],
    to: [number, number, number],
    t: number
): string {
    const r = Math.round(from[0] + (to[0] - from[0]) * t);
    const g = Math.round(from[1] + (to[1] - from[1]) * t);
    const b = Math.round(from[2] + (to[2] - from[2]) * t);
    return `rgb(${r},${g},${b})`;
}

const COLOR_RED: [number, number, number] = [225, 29, 72];    // rose-600
const COLOR_NEUTRAL: [number, number, number] = [30, 41, 59]; // slate-800
const COLOR_GREEN: [number, number, number] = [16, 185, 129]; // emerald-500

function pnlToColor(pnl: number, maxAbs: number): string {
    if (maxAbs === 0 || pnl === 0) return `rgb(${COLOR_NEUTRAL.join(',')})`;
    const t = Math.min(1, Math.abs(pnl) / maxAbs);
    if (pnl > 0) return lerpColor(COLOR_NEUTRAL, COLOR_GREEN, t);
    return lerpColor(COLOR_NEUTRAL, COLOR_RED, t);
}

export const PerformanceHeatmap: React.FC<PerformanceHeatmapProps> = ({ trades }) => {
    const { grid, maxAbs, bestCell, worstCell, totalCells } = useMemo(() => {
        // grid[dayIndex 0-4][hourIndex position in SESSION_HOURS]
        const grid: HeatmapCell[][] = Array.from({ length: 5 }, () =>
            Array.from({ length: SESSION_HOURS.length }, () => ({ pnl: 0, count: 0 }))
        );

        const tradingTrades = trades.filter(t => t.symbol !== 'CASH');

        for (const trade of tradingTrades) {
            const ts = trade.soldTimestamp instanceof Date
                ? trade.soldTimestamp
                : new Date(trade.soldTimestamp);

            if (isNaN(ts.getTime())) continue;

            const tradingDayStr = getTradingDay(ts);
            const dayCol = tradingDayOfWeek(tradingDayStr);
            if (dayCol < 0 || dayCol > 4) continue; // skip weekend edge cases

            const estHour = toESTHour(ts);
            const hourRow = SESSION_HOURS.indexOf(estHour);
            if (hourRow === -1) continue; // outside our session window

            grid[dayCol][hourRow].pnl += trade.pnl;
            grid[dayCol][hourRow].count += 1;
        }

        let maxAbs = 0;
        let bestCell = { day: -1, hour: -1, pnl: -Infinity };
        let worstCell = { day: -1, hour: -1, pnl: Infinity };
        let totalCells = 0;

        for (let d = 0; d < 5; d++) {
            for (let h = 0; h < SESSION_HOURS.length; h++) {
                const { pnl, count } = grid[d][h];
                if (count === 0) continue;
                totalCells++;
                if (Math.abs(pnl) > maxAbs) maxAbs = Math.abs(pnl);
                if (pnl > bestCell.pnl) bestCell = { day: d, hour: h, pnl };
                if (pnl < worstCell.pnl) worstCell = { day: d, hour: h, pnl };
            }
        }

        return { grid, maxAbs, bestCell, worstCell, totalCells };
    }, [trades]);

    if (totalCells === 0) {
        return (
            <section className="glass rounded-[24px] p-6 border-white/10">
                <div className="text-[10px] uppercase tracking-[0.32em] text-indigo-300/80 font-black mb-2">
                    Performance Heatmap
                </div>
                <p className="text-slate-500 text-sm">Import trade data to see your performance by time of day.</p>
            </section>
        );
    }

    return (
        <section className="glass rounded-[24px] p-5 md:p-6 border-white/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.32em] text-indigo-300/80 font-black mb-1">
                        Performance Heatmap
                    </div>
                    <h2 className="text-lg font-black text-white tracking-tight">
                        P&L by Time of Day × Day of Week
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Full 23-hour session · 6 PM EST open → 5 PM EST close
                    </p>
                </div>

                {/* Best / Worst callouts */}
                <div className="flex gap-3">
                    {bestCell.day >= 0 && (
                        <div className="text-right">
                            <div className="text-[9px] uppercase tracking-[0.22em] text-emerald-400/70 font-black mb-0.5">Best Slot</div>
                            <div className="text-sm font-black text-emerald-400">
                                {DAY_FULL[bestCell.day]} {formatHour(SESSION_HOURS[bestCell.hour])}
                            </div>
                            <div className="text-xs font-mono text-emerald-300">+${bestCell.pnl.toFixed(0)}</div>
                        </div>
                    )}
                    {worstCell.day >= 0 && worstCell.pnl < 0 && (
                        <div className="text-right">
                            <div className="text-[9px] uppercase tracking-[0.22em] text-rose-400/70 font-black mb-0.5">Worst Slot</div>
                            <div className="text-sm font-black text-rose-400">
                                {DAY_FULL[worstCell.day]} {formatHour(SESSION_HOURS[worstCell.hour])}
                            </div>
                            <div className="text-xs font-mono text-rose-300">${worstCell.pnl.toFixed(0)}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
                <div className="min-w-[520px]">
                    {/* Day column headers */}
                    <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '52px repeat(5, 1fr)' }}>
                        <div /> {/* empty corner */}
                        {DAYS.map(d => (
                            <div key={d} className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Hour rows */}
                    <div className="flex flex-col gap-0.5">
                        {SESSION_HOURS.map((hour, rowIdx) => (
                            <div
                                key={hour}
                                className="grid gap-0.5 items-center"
                                style={{ gridTemplateColumns: '52px repeat(5, 1fr)' }}
                            >
                                {/* Hour label */}
                                <div className="text-[9px] text-slate-500 text-right pr-2 font-mono leading-none py-0.5">
                                    {formatHour(hour)}
                                </div>

                                {/* Day cells */}
                                {DAYS.map((_, dayIdx) => {
                                    const cell = grid[dayIdx][rowIdx];
                                    const hasData = cell.count > 0;
                                    const bg = pnlToColor(cell.pnl, maxAbs);
                                    const isBest = bestCell.day === dayIdx && bestCell.hour === rowIdx;
                                    const isWorst = worstCell.day === dayIdx && worstCell.hour === rowIdx;

                                    return (
                                        <div
                                            key={dayIdx}
                                            className={`group relative rounded-md h-6 flex items-center justify-center cursor-default transition-transform hover:scale-110 hover:z-10 ${
                                                isBest ? 'ring-1 ring-emerald-400/60' : isWorst ? 'ring-1 ring-rose-400/60' : ''
                                            }`}
                                            style={{
                                                backgroundColor: hasData ? bg : 'rgba(255,255,255,0.02)',
                                                border: hasData ? 'none' : '1px solid rgba(255,255,255,0.04)'
                                            }}
                                            title={hasData
                                                ? `${DAY_FULL[dayIdx]} ${formatHour(hour)}: ${cell.pnl >= 0 ? '+' : ''}$${cell.pnl.toFixed(0)} (${cell.count} trade${cell.count > 1 ? 's' : ''})`
                                                : 'No trades'
                                            }
                                        >
                                            {/* Tooltip */}
                                            {hasData && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                    <div className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 shadow-xl text-center whitespace-nowrap">
                                                        <div className="text-[10px] text-slate-400 font-bold">{DAY_FULL[dayIdx]} · {formatHour(hour)}</div>
                                                        <div className={`text-sm font-black font-mono ${cell.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {cell.pnl >= 0 ? '+' : ''}${cell.pnl.toFixed(2)}
                                                        </div>
                                                        <div className="text-[9px] text-slate-500">{cell.count} trade{cell.count > 1 ? 's' : ''}</div>
                                                    </div>
                                                    {/* Arrow */}
                                                    <div className="w-2 h-2 bg-slate-900 border-b border-r border-white/10 rotate-45 mx-auto -mt-1" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Color legend */}
                    <div className="mt-4 flex items-center gap-3">
                        <span className="text-[9px] text-slate-500 font-bold">Loss</span>
                        <div className="flex-1 h-2 rounded-full" style={{
                            background: `linear-gradient(to right, rgb(${COLOR_RED.join(',')}), rgb(${COLOR_NEUTRAL.join(',')}), rgb(${COLOR_GREEN.join(',')}))`
                        }} />
                        <span className="text-[9px] text-slate-500 font-bold">Gain</span>
                        <span className="text-[9px] text-slate-600 ml-2">
                            Max: ${maxAbs.toFixed(0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Market phase markers */}
            <div className="mt-3 flex flex-wrap gap-3">
                {[
                    { label: 'Overnight', range: '6 PM – 8 PM', color: 'text-indigo-400/70' },
                    { label: 'Asian Session', range: '8 PM – 2 AM', color: 'text-purple-400/70' },
                    { label: 'European Open', range: '3 AM – 8 AM', color: 'text-blue-400/70' },
                    { label: 'NY Open', range: '9 AM – 11 AM', color: 'text-amber-400/70' },
                    { label: 'Midday', range: '11 AM – 2 PM', color: 'text-slate-500' },
                    { label: 'PM Session', range: '2 PM – 5 PM', color: 'text-orange-400/70' },
                ].map(m => (
                    <span key={m.label} className={`text-[9px] font-bold ${m.color}`}>
                        {m.label} <span className="opacity-60">{m.range}</span>
                    </span>
                ))}
            </div>
        </section>
    );
};
