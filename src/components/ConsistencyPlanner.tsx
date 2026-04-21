import React from 'react';
import { TrendingUp, CalendarDays, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import type { AccountRules } from '../context/DataContext';
import { getTradingDayDate } from '../utils/tradingDay';

interface DailyPnlEntry {
    date: string;
    pnl: number;
}

interface ConsistencyPlannerProps {
    rules: AccountRules;
    currentProfit: number;
    tradingDays: number;
    consistencyRule?: {
        bestDayPnl: number;
        bestDayPct: number;
        totalDailyProfit: number;
        passes: boolean;
    };
    dailyPnls?: DailyPnlEntry[];
}

const ConsistencyPlanner: React.FC<ConsistencyPlannerProps> = ({
    rules,
    currentProfit,
    tradingDays,
    consistencyRule,
    dailyPnls = [],
}) => {
    const remaining = Math.max(0, rules.profitTarget - currentProfit);
    const targetReached = remaining <= 0;

    // Consistency rule % from settings (default to 30 if missing)
    const consistencyPct = rules.consistencyRulePercent ?? 30;
    const consistencyDecimal = consistencyPct / 100;

    // Rule: no single day can be > X% of total profit
    const maxDailyAllowed = rules.profitTarget * consistencyDecimal;

    // Minimum days needed to reach remaining while respecting rule
    const minDaysNeeded = Math.max(
        Math.ceil(remaining / maxDailyAllowed),
        Math.max(0, rules.minTradingDays - tradingDays)
    );

    // Recommended daily target (spread evenly)
    const recommendedDaily = minDaysNeeded > 0 ? remaining / minDaysNeeded : 0;

    // Build sorted actual day data
    const sortedActualDays = [...dailyPnls].sort((a, b) => a.date.localeCompare(b.date));

    // Projected total = current profit + remaining needed
    const projectedTotal = rules.profitTarget;

    // Generate projected future days
    const futureDays = [];
    let cumulative = currentProfit;
    for (let i = 1; i <= minDaysNeeded; i++) {
        cumulative += recommendedDaily;
        futureDays.push({
            day: tradingDays + i,
            dailyTarget: recommendedDaily,
            cumulative,
            pctOfProjectedTotal: (recommendedDaily / projectedTotal) * 100,
        });
    }

    // Status assessment
    const isOnTrack = currentProfit >= 0 && (consistencyRule?.passes ?? true);
    const statusLabel = targetReached ? 'TARGET REACHED' : isOnTrack ? 'ON TRACK' : 'NEEDS ADJUSTMENT';
    const statusColor = targetReached
        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        : isOnTrack
            ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
            : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

    return (
        <div className="glass p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-black uppercase tracking-widest text-xs">Consistency Planner</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{consistencyPct}% Rule Daily Roadmap</p>
                    </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusColor}`}>
                    {statusLabel}
                </span>
            </div>

            {/* Summary Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                    <div className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Remaining</div>
                    <div className="text-xl font-black text-white">${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                    <div className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Max Daily ({consistencyPct}%)</div>
                    <div className="text-xl font-black text-amber-400">${maxDailyAllowed.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                    <div className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Days Needed</div>
                    <div className="text-xl font-black text-indigo-400">{minDaysNeeded}</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl p-4 border border-indigo-500/20">
                    <div className="text-slate-400 text-[9px] font-black uppercase tracking-wider mb-1">Daily Target</div>
                    <div className="text-xl font-black text-white">${recommendedDaily.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
            </div>

            {/* Combined Day-by-Day Plan: Actual + Projected */}
            <div className="space-y-2">
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Trading Day Log & Projection</div>
                <div className="bg-slate-800/30 border border-white/5 rounded-xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-6 gap-2 px-4 py-2.5 bg-slate-900/50 border-b border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <div>Day</div>
                        <div className="text-center">Daily P&L</div>
                        <div className="text-center">% of Curr Total</div>
                        <div className="text-center">Required Total</div>
                        <div className="text-right col-span-2">Status / Action</div>
                    </div>

                    {/* Actual Completed Days */}
                    {sortedActualDays.map((day, idx) => {
                        const isProfitable = day.pnl > 0;
                        const pctOfCurrent = (currentProfit > 0 && isProfitable) ? (day.pnl / currentProfit) * 100 : 0;
                        const requiredTotal = isProfitable ? day.pnl / consistencyDecimal : 0;
                        const shortfall = Math.max(0, requiredTotal - currentProfit);
                        const isWindfall = shortfall > 0;

                        // Format date nicely
                        let displayDate: string;
                        try {
                            const dateObj = getTradingDayDate(day.date);
                            displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        } catch {
                            displayDate = day.date;
                        }

                        return (
                            <div
                                key={`actual-${idx}`}
                                className={`grid grid-cols-6 gap-2 px-4 py-2.5 border-b border-white/5 text-xs hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-slate-800/20' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="w-3 h-3 text-emerald-500" />
                                    <span className="font-bold text-white">Day {idx + 1}</span>
                                    <span className="text-slate-500 text-[9px]">{displayDate}</span>
                                </div>
                                <div className={`text-center font-bold ${day.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {day.pnl >= 0 ? '+' : ''}${day.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                                <div className={`text-center font-bold ${isWindfall ? 'text-amber-400' : 'text-slate-400'}`}>
                                    {isProfitable ? `${pctOfCurrent.toFixed(1)}%` : '—'}
                                </div>
                                <div className="text-center text-slate-300 font-mono">
                                    {isProfitable ? `$${requiredTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                                </div>
                                <div className="col-span-2 text-right">
                                    {isProfitable ? (
                                        isWindfall ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-amber-400 text-[10px] font-bold">Need +${shortfall.toLocaleString(undefined, { maximumFractionDigits: 0 })} Profit</span>
                                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-emerald-400 text-[10px] font-bold">Passed</span>
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            </div>
                                        )
                                    ) : (
                                        <span className="text-slate-600 text-[9px] uppercase">N/A</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Divider between actual and projected */}
                    {sortedActualDays.length > 0 && futureDays.length > 0 && (
                        <div className="px-4 py-2 bg-indigo-500/5 border-y border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest text-center">
                            ── Projected Days Below ──
                        </div>
                    )}

                    {/* Projected Future Days */}
                    {!targetReached && futureDays.map((day, idx) => (
                        <div
                            key={`future-${idx}`}
                            className={`grid grid-cols-6 gap-2 px-4 py-2.5 border-b border-white/5 text-xs hover:bg-white/5 transition-colors opacity-60 ${idx % 2 === 0 ? 'bg-slate-800/10' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                <CalendarDays className="w-3 h-3 text-slate-500" />
                                <span className="font-bold text-slate-400">Day {day.day}</span>
                            </div>
                            <div className="text-center text-indigo-400 font-bold">
                                +${day.dailyTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div className="text-center text-slate-400 font-mono">
                                ${day.cumulative.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div className={`text-center font-bold ${day.pctOfProjectedTotal <= consistencyPct ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {day.pctOfProjectedTotal.toFixed(1)}%
                            </div>
                            <div className="text-center">
                                {day.pctOfProjectedTotal <= consistencyPct ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400/50 mx-auto" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-rose-400 mx-auto" />
                                )}
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">
                                    Projected
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Target Reached Banner */}
            {targetReached && (
                <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 p-6 rounded-xl border border-emerald-500/20 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="text-emerald-400 text-sm font-black uppercase tracking-widest">
                        Profit Target Achieved!
                    </div>
                    <div className="text-slate-400 text-xs mt-1">
                        Current profit: ${currentProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} of ${rules.profitTarget.toLocaleString()} target
                    </div>
                </div>
            )}

            {/* Tip */}
            <div className="flex items-start gap-3 px-4 py-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-slate-400 text-[11px] leading-relaxed">
                    <span className="text-indigo-400 font-bold">Consistency Tip:</span> Keep each day's profit under{' '}
                    <span className="text-white font-bold">${maxDailyAllowed.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>{' '}
                    ({consistencyPct}% of ${rules.profitTarget.toLocaleString()} target). Spreading gains evenly across{' '}
                    <span className="text-white font-bold">{Math.max(minDaysNeeded, rules.minTradingDays)} days</span>{' '}
                    is the safest path to passing.
                </p>
            </div>
        </div>
    );
};

export default ConsistencyPlanner;
