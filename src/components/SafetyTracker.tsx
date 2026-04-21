import React from 'react';
import { Shield, Target, AlertTriangle, Calendar, TrendingDown, PieChart, Timer } from 'lucide-react';
import type { AccountRules } from '../context/DataContext';

interface SafetyTrackerProps {
    rules: AccountRules;
    metrics: {
        totalPnL: number;
        todayPnL: number;
        currentBalance: number;
        tradingDays: number;
        maxPeakBalance: number;
        consistencyRule?: {
            bestDayPnl: number;
            bestDayPct: number;
            totalDailyProfit: number;
            passes: boolean;
        };
        daysOver50?: number;
        worstTradePnL?: number;
        microScalping?: {
            tradesPct: number;
            profitPct: number;
            tradesPasses: boolean;
            profitPasses: boolean;
            atRiskProfit: number;
            shortTradeCount: number;
            totalTrades: number;
            thresholdSeconds: number;
            under5?: { count: number; pnl: number };
            fiveToTen?: { count: number; pnl: number };
        };
    };
}

const SafetyTracker: React.FC<SafetyTrackerProps> = ({ rules, metrics }) => {
    // Profit Progress
    const accountProfit = metrics.currentBalance - rules.startingBalance;
    const profitProgress = Math.min(100, Math.max(0, (accountProfit / rules.profitTarget) * 100));

    // Daily Loss Buffer
    const hasDailyLossLimit = rules.dailyLossLimit > 0;
    const dailyRemaining = hasDailyLossLimit ? (rules.dailyLossLimit + metrics.todayPnL) : Infinity;
    const dailyBuffer = hasDailyLossLimit
        ? Math.min(100, Math.max(0, (dailyRemaining / rules.dailyLossLimit) * 100))
        : 100;

    // Status Helpers
    const daysMet = metrics.tradingDays >= rules.minTradingDays;

    const getStatusColor = (percent: number) => {
        if (percent > 75) return { text: 'text-emerald-400', bar: 'bg-emerald-500', glow: 'shadow-emerald-500/30', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
        if (percent > 35) return { text: 'text-amber-400', bar: 'bg-amber-500', glow: 'shadow-amber-500/30', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
        return { text: 'text-rose-400', bar: 'bg-rose-500', glow: 'shadow-rose-500/30', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
    };

    const profitColors = getStatusColor(profitProgress);
    const dailyColors = getStatusColor(dailyBuffer);

    return (
        <div className="space-y-4">
            {/* Header Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                        <Shield className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-black uppercase tracking-widest text-xs">Prop Firm Safety</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Compliance Status</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${daysMet ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                    <Calendar className="w-3 h-3" />
                    {metrics.tradingDays} / {rules.minTradingDays} Trading Days
                    {daysMet && <span className="text-emerald-400">✓</span>}
                </div>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Profit Target Card */}
                <div className="glass p-5 flex flex-col gap-4 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-400" />
                            <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Profit Target</span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${profitColors.bg} ${profitColors.text} border ${profitColors.border}`}>
                            {profitProgress.toFixed(0)}%
                        </span>
                    </div>

                    <div className="flex items-end justify-between">
                        <div>
                            <div className={`text-2xl font-black tracking-tight ${accountProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ${accountProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div className="text-slate-500 text-[10px] font-bold mt-1">
                                of ${rules.profitTarget.toLocaleString()} target
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-slate-400 text-xs font-bold">
                                ${Math.max(0, rules.profitTarget - accountProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div className="text-slate-600 text-[9px] font-bold uppercase">remaining</div>
                        </div>
                    </div>

                    <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={`h-full ${profitColors.bar} shadow-lg ${profitColors.glow} transition-all duration-1000`}
                            style={{ width: `${profitProgress}%` }}
                        />
                    </div>
                </div>

                {/* Apex Trailing Drawdown Card */}
                {(() => {
                    // Apex PA Logic: 
                    // Threshold starts at (Start - MaxDD).
                    // Trails Peak Balance point-for-point.
                    // Stops at (Start + 100).
                    // Safety Net Cap = Start + 100.

                    const safetyNetCap = rules.startingBalance + 100;
                    const trailingThreshold = metrics.maxPeakBalance - rules.maxDrawdown;
                    const effectiveThreshold = Math.min(trailingThreshold, safetyNetCap);

                    const drawdownRemaining = Math.max(0, metrics.currentBalance - effectiveThreshold);
                    // Visual Buffer: How close are we to the threshold?
                    // We can use remaining / MaxDrawdown as a % of "Health".
                    const drawdownBuffer = Math.min(100, (drawdownRemaining / rules.maxDrawdown) * 100);

                    const isLocked = effectiveThreshold >= safetyNetCap;
                    const ddColors = getStatusColor(drawdownBuffer);

                    return (
                        <div className="glass p-5 flex flex-col gap-4 hover:border-indigo-500/30 transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className={`w-4 h-4 ${ddColors.text}`} />
                                    <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Trailing Drawdown</span>
                                </div>
                                <div className="flex gap-2">
                                    {isLocked && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Locked</span>
                                        </div>
                                    )}
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${ddColors.bg} ${ddColors.text} border ${ddColors.border}`}>
                                        {drawdownBuffer.toFixed(0)}%
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <div className={`text-2xl font-black tracking-tight ${ddColors.text}`}>
                                        ${drawdownRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                    <div className="text-slate-500 text-[10px] font-bold mt-1">
                                        remaining buffer
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-400 text-xs font-bold">
                                        ${effectiveThreshold.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                    <div className="text-slate-600 text-[9px] font-bold uppercase">
                                        {isLocked ? 'Locked Threshold' : 'Trailing Threshold'}
                                    </div>
                                </div>
                            </div>

                            <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className={`h-full ${ddColors.bar} shadow-lg ${ddColors.glow} transition-all duration-1000`}
                                    style={{ width: `${drawdownBuffer}%` }}
                                />
                            </div>
                        </div>
                    );
                })()}

                {/* Safety Net Card */}
                {rules.safetyNet && rules.safetyNet > 0 && (
                    <div className="glass p-5 flex flex-col gap-4 hover:border-emerald-500/30 transition-all group">
                        {(() => {
                            const current = Math.max(0, metrics.currentBalance - rules.startingBalance);
                            const target = rules.safetyNet;
                            const remaining = Math.max(0, target - current);
                            const progress = Math.min(100, (current / target) * 100);
                            const isMet = current >= target;
                            const statusColors = getStatusColor(progress);

                            return (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-emerald-400" />
                                            <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Safety Net Goal</span>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isMet
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : `${statusColors.bg} ${statusColors.text} border ${statusColors.border}`
                                            }`}>
                                            {isMet ? 'SECURED' : `${progress.toFixed(0)}%`}
                                        </span>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className={`text-2xl font-black tracking-tight ${isMet ? 'text-emerald-400' : statusColors.text}`}>
                                                ${current.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </div>
                                            <div className="text-slate-500 text-[10px] font-bold mt-1">
                                                / ${target.toLocaleString()} required
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-400 text-xs font-bold">
                                                ${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </div>
                                            <div className="text-slate-600 text-[9px] font-bold uppercase">remaining</div>
                                        </div>
                                    </div>

                                    <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full ${isMet ? 'bg-emerald-500' : statusColors.bar} shadow-lg ${isMet ? 'shadow-emerald-500/30' : statusColors.glow} transition-all duration-1000`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Daily Loss Limit Card */}
                <div className="glass p-5 flex flex-col gap-4 hover:border-indigo-500/30 transition-all group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className={`w-4 h-4 ${dailyColors.text}`} />
                            <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Daily Loss Limit</span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${dailyColors.bg} ${dailyColors.text} border ${dailyColors.border}`}>
                            {hasDailyLossLimit ? `${dailyBuffer.toFixed(0)}%` : 'NONE'}
                        </span>
                    </div>

                    <div className="flex items-end justify-between">
                        <div>
                            <div className={`text-2xl font-black tracking-tight ${dailyColors.text}`}>
                                {hasDailyLossLimit ? `$${Math.max(0, dailyRemaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'No cap'}
                            </div>
                            <div className="text-slate-500 text-[10px] font-bold mt-1">
                                {hasDailyLossLimit ? `left today of $${rules.dailyLossLimit.toLocaleString()} limit` : 'No daily loss limit on this preset'}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-xs font-bold ${metrics.todayPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {metrics.todayPnL >= 0 ? '+' : ''}${metrics.todayPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div className="text-slate-600 text-[9px] font-bold uppercase">today P&L</div>
                        </div>
                    </div>

                    <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={`h-full ${dailyColors.bar} shadow-lg ${dailyColors.glow} transition-all duration-1000`}
                            style={{ width: `${dailyBuffer}%` }}
                        />
                    </div>
                </div>

                {/* Min Trading Days Card */}
                {rules.minTradingDays > 0 && (
                    <div className="glass p-5 flex flex-col gap-4 hover:border-indigo-500/30 transition-all group">
                        {(() => {
                            const current = metrics.tradingDays || 0;
                            const target = rules.minTradingDays;
                            const remaining = Math.max(0, target - current);
                            const progress = Math.min(100, (current / target) * 100);
                            const isMet = current >= target;
                            const statusColors = getStatusColor(progress);

                            return (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-indigo-400" />
                                            <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Trading Days</span>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isMet
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : `${statusColors.bg} ${statusColors.text} border ${statusColors.border}`
                                            }`}>
                                            {isMet ? 'PASSED' : `${progress.toFixed(0)}%`}
                                        </span>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className={`text-2xl font-black tracking-tight ${isMet ? 'text-emerald-400' : statusColors.text}`}>
                                                {current}
                                            </div>
                                            <div className="text-slate-500 text-[10px] font-bold mt-1">
                                                / {target} minimum days
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-400 text-xs font-bold">
                                                {remaining}
                                            </div>
                                            <div className="text-slate-600 text-[9px] font-bold uppercase">days left</div>
                                        </div>
                                    </div>

                                    <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full ${isMet ? 'bg-emerald-500' : statusColors.bar} shadow-lg ${isMet ? 'shadow-emerald-500/30' : statusColors.glow} transition-all duration-1000`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Dynamic Consistency Card */}
                {(rules.consistencyRulePercent ?? 0) > 0 && (
                <div className="glass p-5 flex flex-col gap-4 hover:border-indigo-500/30 transition-all group">
                    {(() => {
                        const consistencyPct = rules.consistencyRulePercent ?? 30;
                        const consistencyDecimal = consistencyPct / 100;

                        const bestDayPnl = metrics.consistencyRule?.bestDayPnl ?? 0;
                        const requiredTotalProfit = bestDayPnl / consistencyDecimal;
                        const profitShortfall = Math.max(0, requiredTotalProfit - accountProfit);
                        const isPassing = accountProfit >= requiredTotalProfit;

                        // Percentage of "Required Profit" achieved
                        const progressToPayout = requiredTotalProfit > 0 ? (accountProfit / requiredTotalProfit) * 100 : 0;

                        return (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <PieChart className={`w-4 h-4 ${isPassing ? 'text-emerald-400' : 'text-amber-400'}`} />
                                        <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">{consistencyPct}% Rule</span>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${isPassing
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                                        }`}>
                                        {isPassing ? 'PAYOUT READY' : 'BUILDING'}
                                    </span>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className={`text-2xl font-black tracking-tight ${isPassing ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            ${requiredTotalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                        <div className="text-slate-500 text-[10px] font-bold mt-1">
                                            min profit needed
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xs font-bold ${profitShortfall > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {profitShortfall > 0 ? `-$${profitShortfall.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '✓ Met'}
                                        </div>
                                        <div className="text-slate-600 text-[9px] font-bold uppercase">
                                            {profitShortfall > 0 ? 'shortfall' : 'requirement met'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                        <span>Current: ${accountProfit.toLocaleString()}</span>
                                        <span>Best Day: ${bestDayPnl.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5 relative">
                                        <div
                                            className={`h-full transition-all duration-1000 ${isPassing
                                                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                                                : 'bg-amber-500 shadow-lg shadow-amber-500/30'
                                                }`}
                                            style={{ width: `${Math.min(100, Math.max(5, progressToPayout))}%` }}
                                        />
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
                )}

                {/* Days > $50 Profit Rule Card */}
                {rules.minDaysOver50 && (
                    <div className="glass p-5 flex flex-col gap-4 hover:border-emerald-500/30 transition-all group">
                        {(() => {
                            const current = metrics.daysOver50 || 0;
                            const target = rules.minDaysOver50;
                            const remaining = Math.max(0, target - current);
                            const progress = Math.min(100, (current / target) * 100);
                            const isMet = current >= target;
                            const statusColors = getStatusColor(progress);

                            return (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-emerald-400" />
                                            <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Days {'>'} $50</span>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isMet
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : `${statusColors.bg} ${statusColors.text} border ${statusColors.border}`
                                            }`}>
                                            {isMet ? 'PASSED' : `${progress.toFixed(0)}%`}
                                        </span>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className={`text-2xl font-black tracking-tight ${isMet ? 'text-emerald-400' : statusColors.text}`}>
                                                {current}
                                            </div>
                                            <div className="text-slate-500 text-[10px] font-bold mt-1">
                                                / {target} required days
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-400 text-xs font-bold">
                                                {remaining}
                                            </div>
                                            <div className="text-slate-600 text-[9px] font-bold uppercase">days left</div>
                                        </div>
                                    </div>

                                    <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full ${isMet ? 'bg-emerald-500' : statusColors.bar} shadow-lg ${isMet ? 'shadow-emerald-500/30' : statusColors.glow} transition-all duration-1000`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* 30% Negative P&L (MAE) Rule Card */}
                {rules.maeLimitPercent && (
                    <div className="glass p-5 flex flex-col gap-4 hover:border-indigo-500/30 transition-all group">
                        {(() => {
                            // MAE Logic Calculation: "30% of Total Net P&L so far"
                            const profitSoFar = Math.max(0, metrics.currentBalance - rules.startingBalance);
                            const maeLimit = profitSoFar * (rules.maeLimitPercent / 100);

                            // Check Compliance
                            // We check the WORST single trade in history (or today, depending on interpretation)
                            // User said: "max you can loose for one trade".Implies historical check or "next trade".
                            // We will check historical "worstTradePnL" (passed in metrics) against this limit.
                            // If worst trade < -Limit, then FAIL.

                            const worstTrade = metrics.worstTradePnL || 0;
                            const worstLoss = Math.abs(Math.min(0, worstTrade));

                            const violations = worstLoss > maeLimit;
                            const pctUsed = maeLimit > 0 ? Math.min(100, (worstLoss / maeLimit) * 100) : (worstLoss > 0 ? 100 : 0);

                            return (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TrendingDown className="w-4 h-4 text-purple-400" />
                                            <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">MAE Limit ({rules.maeLimitPercent || 30}%)</span>
                                        </div>
                                        <span className={`text-xs font-black px-3 py-1 rounded-full border ${violations ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                            }`}>
                                            Max -${maeLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className={`text-2xl font-black tracking-tight ${violations ? 'text-rose-400' : 'text-indigo-400'}`}>
                                                -${worstLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </div>
                                            <div className="text-slate-500 text-[10px] font-bold mt-1">
                                                worst trade loss
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-400 text-xs font-bold">
                                                ${profitSoFar.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </div>
                                            <div className="text-slate-600 text-[9px] font-bold uppercase">total profit</div>
                                        </div>
                                    </div>

                                    <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full transition-all duration-1000 ${violations ? 'bg-rose-500 shadow-lg shadow-rose-500/30'
                                                : 'bg-purple-500 shadow-lg shadow-purple-500/30'
                                                }`}
                                            style={{ width: `${pctUsed}%` }}
                                        />
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
                {/* Microscalping Rule Card */}
                {metrics.microScalping && rules.microScalpingSeconds !== undefined && (() => {
                    const ms = metrics.microScalping!;
                    const passing = ms.tradesPasses && ms.profitPasses;

                    return (
                        <div className={`glass p-5 flex flex-col gap-4 hover:border-amber-500/30 transition-all group col-span-1 md:col-span-2`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Timer className={`w-4 h-4 ${passing ? 'text-emerald-400' : 'text-rose-400'}`} />
                                    <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Microscalping Rule</span>
                                    <span className="text-slate-600 text-[9px] font-bold uppercase tracking-wider">{'>'}{ms.thresholdSeconds}s hold required</span>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${passing
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                                    }`}>
                                    {passing ? 'PASSING' : 'AT RISK'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Trade Count Rule */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider">Trades {'>'}{ms.thresholdSeconds}s</span>
                                        <span className={`text-[10px] font-bold ${ms.tradesPasses ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {ms.tradesPct.toFixed(0)}% {ms.tradesPasses ? '✓' : '✗'}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5 relative">
                                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 z-10" />
                                        <div
                                            className={`h-full transition-all duration-1000 ${ms.tradesPasses ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'} shadow-lg`}
                                            style={{ width: `${Math.min(100, ms.tradesPct)}%` }}
                                        />
                                    </div>
                                    <div className="text-slate-600 text-[9px] font-bold">
                                        {ms.totalTrades - ms.shortTradeCount} of {ms.totalTrades} trades qualify
                                    </div>
                                </div>

                                {/* Profit Rule */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider">Profit {'>'}{ms.thresholdSeconds}s</span>
                                        <span className={`text-[10px] font-bold ${ms.profitPasses ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {ms.profitPct.toFixed(0)}% {ms.profitPasses ? '✓' : '✗'}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5 relative">
                                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 z-10" />
                                        <div
                                            className={`h-full transition-all duration-1000 ${ms.profitPasses ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'} shadow-lg`}
                                            style={{ width: `${Math.min(100, ms.profitPct)}%` }}
                                        />
                                    </div>
                                    <div className="text-slate-600 text-[9px] font-bold">
                                        need {'>'} 50% — marker at midpoint
                                    </div>
                                </div>
                            </div>

                            {/* Short-trade bucket breakdown — each bucket is mutually exclusive, no double-count */}
                            {(ms.under5 || ms.fiveToTen) && (
                                <div className="grid grid-cols-2 gap-2">
                                    {ms.under5 && (() => {
                                        const b = ms.under5!;
                                        const isRisk = ms.thresholdSeconds <= 5;
                                        return (
                                            <div className={`rounded-xl border px-3 py-2.5 ${isRisk ? 'border-amber-500/30 bg-amber-500/8' : 'border-white/8 bg-white/[0.03]'}`}>
                                                <div className={`text-[9px] font-black uppercase tracking-wider mb-1 ${isRisk ? 'text-amber-400' : 'text-slate-500'}`}>
                                                    ≤5s {isRisk ? '⚑' : ''}
                                                </div>
                                                <div className="text-white font-black">{b.count} <span className="text-slate-500 font-bold text-[10px]">trades</span></div>
                                                <div className={`text-[10px] font-bold mt-0.5 ${b.count === 0 ? 'text-slate-600' : b.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {b.count === 0 ? '—' : `${b.pnl >= 0 ? '+' : ''}$${b.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} net`}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {ms.fiveToTen && (() => {
                                        const b = ms.fiveToTen!;
                                        const isRisk = ms.thresholdSeconds >= 10;
                                        return (
                                            <div className={`rounded-xl border px-3 py-2.5 ${isRisk ? 'border-amber-500/15 bg-amber-500/5' : 'border-white/8 bg-white/[0.03]'}`}>
                                                <div className={`text-[9px] font-black uppercase tracking-wider mb-1 ${isRisk ? 'text-amber-300/70' : 'text-slate-500'}`}>
                                                    6–10s {isRisk ? '⚑' : ''}
                                                </div>
                                                <div className="text-white font-black">{b.count} <span className="text-slate-500 font-bold text-[10px]">trades</span></div>
                                                <div className={`text-[10px] font-bold mt-0.5 ${b.count === 0 ? 'text-slate-600' : b.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {b.count === 0 ? '—' : `${b.pnl >= 0 ? '+' : ''}$${b.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} net`}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {ms.totalTrades === 0 && (
                                <div className="text-slate-600 text-[9px] font-bold text-center py-1">No trades loaded yet</div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div >
    );
};

export default SafetyTracker;
