import React, { useState, useEffect, useMemo } from 'react';
import { useData, PROP_FIRM_TEMPLATES } from '../context/DataContext';
import type { AccountRules } from '../context/DataContext';
import { Shield, Target, TrendingDown, AlertTriangle, Save, Activity, ShieldCheck, ShieldAlert, DollarSign, Calendar, Layers } from 'lucide-react';
import SafetyTracker from './SafetyTracker';
import ConsistencyPlanner from './ConsistencyPlanner';
import { getTradingDay, getCurrentTradingDay } from '../utils/tradingDay';

const SafetySettings: React.FC = () => {
    const { selectedAccount, accountRules, updateAccountRules, accounts, accountBalances, dailyNetPnl } = useData();

    const [tab, setTab] = useState<'rules' | 'compliance'>('rules');
    const [localRules, setLocalRules] = useState<AccountRules>({
        profitTarget: 3000,
        maxDrawdown: 2500,
        dailyLossLimit: 1100,
        minTradingDays: 7,
        startingBalance: 50000,
        platformFees: 0
    });

    useEffect(() => {
        if (selectedAccount && accountRules[selectedAccount]) {
            setLocalRules(accountRules[selectedAccount]);
        }
    }, [selectedAccount, accountRules]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalRules(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleSave = () => {
        if (selectedAccount) updateAccountRules(selectedAccount, localRules);
    };

    const applyTemplate = (tempName: string) => {
        setLocalRules(PROP_FIRM_TEMPLATES[tempName]);
    };

    const currentTrades = (accounts[selectedAccount] || []).filter(t => t.symbol !== 'CASH');
    const currentBalance = accountBalances[selectedAccount] || localRules.startingBalance;

    const safetyMetrics = useMemo(() => {
        if (!selectedAccount) return null;

        const totalPnL = currentTrades.reduce((sum, t) => sum + t.pnl, 0);
        const todayStr = getCurrentTradingDay();
        const todayPnL = currentTrades
            .filter(t => getTradingDay(t.soldTimestamp) === todayStr)
            .reduce((sum, t) => sum + t.pnl, 0);

        const tradesByDay = new Map<string, number>();
        currentTrades.forEach(t => {
            const dayKey = getTradingDay(t.soldTimestamp);
            tradesByDay.set(dayKey, (tradesByDay.get(dayKey) || 0) + t.pnl);
        });

        let running = localRules.startingBalance;
        let peak = running;
        const sortedTrades = [...currentTrades].sort((a, b) =>
            new Date(a.soldTimestamp).getTime() - new Date(b.soldTimestamp).getTime()
        );
        sortedTrades.forEach(t => {
            running += t.pnl;
            if (running > peak) peak = running;
        });

        const netDailyHistory = dailyNetPnl[selectedAccount];
        const useNetData = netDailyHistory && netDailyHistory.length > 0;
        const consistencyPct = localRules.consistencyRulePercent ?? 30;

        const dailyPnls: { date: string; pnl: number }[] = [];
        if (useNetData) {
            netDailyHistory.forEach(d => dailyPnls.push({ date: d.date, pnl: d.pnl }));
        } else {
            tradesByDay.forEach((pnl, dayStr) => dailyPnls.push({ date: dayStr, pnl }));
        }

        const dailyPnlsFiltered = dailyPnls.filter(d => {
            const val = Math.abs(d.pnl);
            const startBal = localRules.startingBalance || 50000;
            if (Math.abs(val - startBal) < 1) return false;
            if (Math.abs(val - 50000) < 1) return false;
            return true;
        });

        const profitableDays = dailyPnlsFiltered.filter(d => d.pnl > 0);
        const totalDailyProfit = profitableDays.reduce((sum, d) => sum + d.pnl, 0);
        const totalNetDailyProfit = dailyPnlsFiltered.reduce((sum, d) => sum + d.pnl, 0);
        const consistencyDenominator = totalNetDailyProfit > 0 ? totalNetDailyProfit : totalDailyProfit;
        const bestDay = profitableDays.length > 0
            ? profitableDays.reduce((best, d) => d.pnl > best.pnl ? d : best, profitableDays[0])
            : null;
        const bestDayPct = consistencyPct > 0 && bestDay && consistencyDenominator > 0
            ? (bestDay.pnl / consistencyDenominator) * 100 : 0;
        const daysOver50 = dailyPnlsFiltered.filter(d => d.pnl >= 50).length;

        const worstTrade = currentTrades.length > 0
            ? currentTrades.reduce((min, t) => t.pnl < min.pnl ? t : min, currentTrades[0])
            : { pnl: 0 };

        const msThreshold = localRules.microScalpingSeconds;
        let microScalping: {
            tradesPct: number; profitPct: number;
            tradesPasses: boolean; profitPasses: boolean;
            atRiskProfit: number;
            shortTradeCount: number; totalTrades: number;
            thresholdSeconds: number;
            under5: { count: number; pnl: number };
            fiveToTen: { count: number; pnl: number };
        } | undefined = undefined;
        if (msThreshold !== undefined) {
            const totalTradeCount = currentTrades.length;
            const longTrades = currentTrades.filter(t => t.durationSeconds > msThreshold);
            const shortTrades = currentTrades.filter(t => t.durationSeconds <= msThreshold);
            const tradesPct = totalTradeCount > 0 ? (longTrades.length / totalTradeCount) * 100 : 100;
            const longGrossProfit = longTrades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
            const totalGrossProfit = currentTrades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
            const profitPct = totalGrossProfit > 0 ? (longGrossProfit / totalGrossProfit) * 100 : 100;
            const atRiskProfit = shortTrades.reduce((s, t) => s + t.pnl, 0);
            const u5 = currentTrades.filter(t => !(t.durationSeconds > 5));
            const f510 = currentTrades.filter(t => t.durationSeconds > 5 && t.durationSeconds <= 10);
            microScalping = {
                tradesPct, profitPct,
                tradesPasses: tradesPct > 50,
                profitPasses: profitPct > 50,
                atRiskProfit,
                shortTradeCount: shortTrades.length,
                totalTrades: totalTradeCount,
                thresholdSeconds: msThreshold,
                under5: { count: u5.length, pnl: u5.reduce((s, t) => s + t.pnl, 0) },
                fiveToTen: { count: f510.length, pnl: f510.reduce((s, t) => s + t.pnl, 0) },
            };
        }

        return {
            totalPnL, todayPnL, currentBalance,
            tradingDays: tradesByDay.size,
            maxPeakBalance: peak,
            dailyPnls: dailyPnlsFiltered,
            consistencyRule: {
                bestDayPnl: bestDay?.pnl || 0,
                bestDayDate: bestDay?.date || null,
                bestDayPct,
                totalDailyProfit,
                passes: consistencyPct <= 0 ? true : bestDayPct <= consistencyPct
            },
            daysOver50,
            worstTradePnL: worstTrade.pnl,
            microScalping
        };
    }, [selectedAccount, currentTrades, currentBalance, localRules.startingBalance, localRules.consistencyRulePercent, localRules.microScalpingSeconds, dailyNetPnl]);

    const isScaledUp = localRules.scalingThreshold ? currentBalance >= localRules.scalingThreshold : true;
    const scalingContracts = isScaledUp
        ? (localRules.maxContracts || 'Full')
        : (localRules.maxContracts ? Math.floor(localRules.maxContracts / 2) : 'Half');

    const dayProfit = Math.max(0, currentBalance - localRules.startingBalance);
    const maeThreshold = localRules.maeLimitPercent ? (dayProfit * (localRules.maeLimitPercent / 100)) : Infinity;
    const maeViolations = currentTrades.filter(t => t.pnl < 0 && Math.abs(t.pnl) > maeThreshold).length;

    const winTrades = currentTrades.filter(t => t.pnl > 0);
    const lossTrades = currentTrades.filter(t => t.pnl < 0);
    const avgWin = winTrades.length > 0 ? winTrades.reduce((s, t) => s + t.pnl, 0) / winTrades.length : 0;
    const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((s, t) => s + t.pnl, 0)) / lossTrades.length : 0;
    const currentRR = avgWin > 0 ? avgLoss / avgWin : 0;
    const rrViolation = localRules.rrRatioLimit ? currentRR > localRules.rrRatioLimit : false;

    let hedgingDetected = false;
    for (let i = 0; i < currentTrades.length && !hedgingDetected; i++) {
        for (let j = i + 1; j < currentTrades.length; j++) {
            const t1 = currentTrades[i]; const t2 = currentTrades[j];
            if ((t1.boughtTimestamp < t2.soldTimestamp && t2.boughtTimestamp < t1.soldTimestamp) &&
                ((t1.pnl > 0 && t2.pnl < 0) || (t1.pnl < 0 && t2.pnl > 0))) {
                hedgingDetected = true; break;
            }
        }
    }

    if (!selectedAccount) {
        return (
            <div className="flex-1 flex items-center justify-center p-10">
                <div className="glass p-12 text-center max-w-md">
                    <Shield className="w-12 h-12 text-slate-700 mx-auto mb-6" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-white mb-2">No Account Selected</h2>
                    <p className="text-slate-500 text-sm">Please select an account from the dashboard or import a new file to configure safety rules.</p>
                </div>
            </div>
        );
    }

    const InputField = ({ name, label, icon: Icon, color, value, hint }: { name: string; label: string; icon: any; color: string; value: number; hint?: string }) => (
        <div className="space-y-2">
            <div className={`flex items-center gap-2 ${color}`}>
                <Icon className="w-4 h-4" />
                <label className="text-[10px] font-black uppercase tracking-widest">{label}</label>
            </div>
            <input
                type="number"
                name={name}
                value={value}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-indigo-500/50 outline-none transition-all"
            />
            {hint && <p className="text-slate-500 text-[9px] italic">{hint}</p>}
        </div>
    );

    const complianceItems = [
        {
            label: 'Scaling',
            pass: isScaledUp,
            detail: `${isScaledUp ? 'Full' : 'Restricted'} — ${scalingContracts} contracts`,
        },
        {
            label: 'MAE Compliance',
            pass: maeViolations === 0,
            detail: maeViolations === 0 ? 'PASS' : `${maeViolations} flag${maeViolations !== 1 ? 's' : ''}`,
        },
        {
            label: 'R:R Ratio',
            pass: !rrViolation,
            detail: `${currentRR.toFixed(1)}:1 — ${rrViolation ? 'VIOLATION' : 'PASS'}`,
        },
        {
            label: 'Hedging Check',
            pass: !hedgingDetected,
            detail: hedgingDetected ? 'DETECTED' : 'CLEAR',
        },
    ];

    return (
        <div className="flex-1 overflow-auto px-4 py-6 md:px-8 md:py-8 xl:px-10 xl:py-10 space-y-8 md:space-y-10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_30%),linear-gradient(180deg,#0c1320_0%,#101620_100%)]">
            {/* Hero Header */}
            <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(15,23,42,0.82))] p-6 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_25%),radial-gradient(circle_at_top_right,rgba(244,63,94,0.08),transparent_35%)] pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-indigo-300/80 font-black mb-3">
                            <Shield className="w-3.5 h-3.5" />
                            Prop Safety
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight font-heading text-white">Prop Safety Rules</h1>
                        <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl mt-3">
                            Configure risk limits, compliance rules, and monitor your prop firm account health in real time.
                        </p>
                        {selectedAccount && (
                            <div className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">{selectedAccount}</div>
                        )}
                    </div>
                    {tab === 'rules' && (
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 shrink-0 self-start"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Save Rules
                        </button>
                    )}
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/[0.04] rounded-2xl w-fit border border-white/6">
                {(['rules', 'compliance'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                            tab === t
                                ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/30'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {t === 'rules' ? 'Rules' : 'Compliance'}
                    </button>
                ))}
            </div>

            {/* ── Rules Tab ───────────────────────────────────── */}
            {tab === 'rules' && (
                <div className="space-y-6">
                    {/* Presets — prominent at top */}
                    <div className="glass p-5">
                        <h3 className="text-white text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            Quick Presets
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(PROP_FIRM_TEMPLATES).map(temp => (
                                <button
                                    key={temp}
                                    onClick={() => applyTemplate(temp)}
                                    className="px-4 py-2 bg-white/5 hover:bg-indigo-500/15 text-slate-300 hover:text-indigo-200 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/8 hover:border-indigo-500/30 transition-all"
                                >
                                    {temp}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Account Fundamentals */}
                    <div className="glass p-6">
                        <h3 className="text-white text-xs font-black uppercase tracking-widest mb-6 pb-3 border-b border-white/5 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            Account Fundamentals
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField name="startingBalance" label="Starting Balance ($)" icon={DollarSign} color="text-emerald-400" value={localRules.startingBalance} />
                            <InputField name="profitTarget" label="Profit Target ($)" icon={Target} color="text-emerald-400" value={localRules.profitTarget} />
                            <InputField name="platformFees" label="Platform Fees ($)" icon={DollarSign} color="text-slate-400" value={localRules.platformFees} hint="Rithmic, data fees, etc." />
                        </div>
                    </div>

                    {/* Risk Limits */}
                    <div className="glass p-6">
                        <h3 className="text-white text-xs font-black uppercase tracking-widest mb-6 pb-3 border-b border-white/5 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            Risk Limits
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField name="maxDrawdown" label="Max Drawdown ($)" icon={TrendingDown} color="text-amber-400" value={localRules.maxDrawdown} />
                            <InputField name="dailyLossLimit" label="Daily Loss Limit ($)" icon={AlertTriangle} color="text-rose-400" value={localRules.dailyLossLimit} />
                            <InputField name="minTradingDays" label="Min Trading Days" icon={Calendar} color="text-indigo-400" value={localRules.minTradingDays} />
                        </div>
                    </div>

                    {/* Advanced Rules */}
                    <div className="glass p-6">
                        <h3 className="text-white text-xs font-black uppercase tracking-widest mb-6 pb-3 border-b border-white/5 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-400" />
                            Advanced Rules
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <InputField name="scalingThreshold" label="Scaling Threshold ($)" icon={Layers} color="text-indigo-400" value={localRules.scalingThreshold || 0} />
                            <InputField name="maxContracts" label="Max Contracts" icon={ShieldAlert} color="text-amber-400" value={localRules.maxContracts || 0} />
                            <InputField name="safetyNet" label="Safety Net Goal ($)" icon={Shield} color="text-emerald-400" value={localRules.safetyNet || 0} hint="Expected payout buffer" />
                            <InputField name="maeLimitPercent" label="MAE Limit (%)" icon={AlertTriangle} color="text-rose-400" value={localRules.maeLimitPercent || 0} />
                            <InputField name="consistencyRulePercent" label="Consistency Rule (%)" icon={Target} color="text-cyan-400" value={localRules.consistencyRulePercent ?? 0} hint="0 = no consistency rule" />
                            <InputField name="rrRatioLimit" label="R:R Ratio Limit (X:1)" icon={ShieldCheck} color="text-indigo-400" value={localRules.rrRatioLimit || 0} />
                            <InputField name="minProfitPerDay" label="Min Profit/Day ($)" icon={DollarSign} color="text-emerald-400" value={localRules.minProfitPerDay || 0} />
                            <InputField name="minDaysOver50" label="Min Days > $50" icon={Calendar} color="text-emerald-400" value={localRules.minDaysOver50 || 0} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Compliance Tab ──────────────────────────────── */}
            {tab === 'compliance' && (
                <div className="space-y-8">
                    {/* Live status cards */}
                    {safetyMetrics && accountRules[selectedAccount] && (
                        <SafetyTracker
                            rules={accountRules[selectedAccount]}
                            metrics={safetyMetrics}
                        />
                    )}

                    {/* Compliance checks */}
                    <div className="glass p-6">
                        <h3 className="text-white text-xs font-black uppercase tracking-widest mb-5 pb-3 border-b border-white/5">
                            Compliance Checks
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                            {complianceItems.map(item => (
                                <div key={item.label} className={`p-4 rounded-xl border ${item.pass ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">{item.label}</div>
                                    <div className={`text-sm font-black ${item.pass ? 'text-emerald-400' : 'text-rose-400'}`}>{item.detail}</div>
                                </div>
                            ))}
                            {safetyMetrics?.microScalping && (() => {
                                const ms = safetyMetrics.microScalping!;
                                const passing = ms.tradesPasses && ms.profitPasses;
                                return (
                                    <div className={`p-4 rounded-xl border sm:col-span-2 ${passing ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Microscalping</span>
                                            <span className={`text-[10px] font-black ${passing ? 'text-emerald-400' : 'text-rose-400'}`}>{passing ? 'PASS' : 'RISK'}</span>
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-bold space-y-0.5">
                                            <div className={ms.tradesPasses ? 'text-emerald-400' : 'text-rose-400'}>
                                                Trades &gt;{ms.thresholdSeconds}s: {ms.tradesPct.toFixed(0)}% {ms.tradesPasses ? '✓' : '✗ need >50%'}
                                            </div>
                                            <div className={ms.profitPasses ? 'text-emerald-400' : 'text-rose-400'}>
                                                Profit &gt;{ms.thresholdSeconds}s: {ms.profitPct.toFixed(0)}% {ms.profitPasses ? '✓' : '✗ need >50%'}
                                            </div>
                                            {ms.under5 && ms.under5.count > 0 && (
                                                <div className={ms.thresholdSeconds <= 5 ? 'text-amber-400' : 'text-slate-400'}>
                                                    ≤5s: {ms.under5.count} trades / {ms.under5.pnl >= 0 ? '+' : ''}${ms.under5.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Consistency Planner */}
                    {safetyMetrics && accountRules[selectedAccount] && (accountRules[selectedAccount].consistencyRulePercent ?? 0) > 0 && (
                        <ConsistencyPlanner
                            rules={accountRules[selectedAccount]}
                            currentProfit={safetyMetrics.currentBalance - accountRules[selectedAccount].startingBalance}
                            tradingDays={safetyMetrics.tradingDays}
                            consistencyRule={safetyMetrics.consistencyRule}
                            dailyPnls={safetyMetrics.dailyPnls}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default SafetySettings;
