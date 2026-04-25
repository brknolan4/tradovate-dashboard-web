import { useMemo, useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { MetricCard, PnLChart, MiniDialCard, WeekdayPnLChart } from './DashboardComponents';
import { useData } from '../context/DataContext';
import { getTradingDay, getCurrentTradingDay, getTradingDayDate } from '../utils/tradingDay';
import { WarningSystem } from './WarningSystem';
import { PerformanceHeatmap } from './PerformanceHeatmap';
import { usePerformanceWarnings } from '../hooks/usePerformanceWarnings';
import { SymbolDeepDive } from './SymbolDeepDive';

interface DashboardProps {
    onOpenSyncCenter: () => void;
}

const formatCurrency = (value: number, digits = 2) => `${value >= 0 ? '+' : '-'}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

const useCountUp = (target: number, format: (n: number) => string): string => {
    const [display, setDisplay] = useState(() => format(target));
    const prevRef = useRef(target);
    const rafRef = useRef<number>(0);
    const fmtRef = useRef(format);
    fmtRef.current = format;
    useEffect(() => {
        const from = prevRef.current;
        const to = target;
        prevRef.current = to;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (Math.abs(to - from) < 0.001) { setDisplay(fmtRef.current(to)); return; }
        const duration = 650;
        let start: number | null = null;
        const step = (ts: number) => {
            if (!start) start = ts;
            const t = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(fmtRef.current(from + (to - from) * eased));
            if (t < 1) rafRef.current = requestAnimationFrame(step);
            else setDisplay(fmtRef.current(to));
        };
        rafRef.current = requestAnimationFrame(step);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [target]);
    return display;
};


const Dashboard: React.FC<DashboardProps> = ({ onOpenSyncCenter }) => {
    const { accounts, accountBalances, accountRules, dailyNetPnl, selectedAccount, setSelectedAccount, isLoading, startingBalance } = useData();
    const [showStats, setShowStats] = useState(false);

    const trades = useMemo(() => accounts[selectedAccount] || [], [accounts, selectedAccount]);

    const sortedTrades = useMemo(() => {
        return [...trades].sort((a, b) =>
            new Date(a.soldTimestamp).getTime() - new Date(b.soldTimestamp).getTime()
        );
    }, [trades]);

    const metrics = useMemo(() => {
        if (trades.length === 0 && accountBalances[selectedAccount] === undefined) return null;

        const tradingTrades = trades.filter(t => t.symbol !== 'CASH');
        const cashTrades = trades.filter(t => t.symbol === 'CASH');
        const tradingNetPnL = tradingTrades.reduce((sum, t) => sum + t.pnl, 0);
        const tradingCommissions = tradingTrades.reduce((sum, t) => sum + (t.commissions || 0), 0);
        const cashAdjustments = cashTrades.reduce((sum, t) => sum + t.pnl, 0);
        const platformFees = accountRules[selectedAccount]?.platformFees || 0;
        const effectiveStart = accountRules[selectedAccount]?.startingBalance || startingBalance;
        const netDailyHistory = dailyNetPnl[selectedAccount];
        const useNetData = netDailyHistory && netDailyHistory.length > 0;

        let currentBalance = accountBalances[selectedAccount];
        if (currentBalance === undefined) {
            currentBalance = effectiveStart + tradingNetPnL + cashAdjustments - platformFees;
        }

        // Account balance is the highest fidelity source we have.
        // When a broker balance override exists, headline Net P&L should reconcile to it.
        const totalNetPnL = currentBalance - effectiveStart;
        const totalAdjustments = totalNetPnL - tradingNetPnL;
        const grossPnL = tradingNetPnL + tradingCommissions;

        const winTrades = tradingTrades.filter(t => t.pnl > 0);
        const lossTrades = tradingTrades.filter(t => t.pnl < 0);
        const winRate = tradingTrades.length > 0 ? (winTrades.length / tradingTrades.length) * 100 : 0;
        const totalGains = winTrades.reduce((sum, t) => sum + t.pnl, 0);
        const totalLosses = Math.abs(lossTrades.reduce((sum, t) => sum + t.pnl, 0));
        const profitFactor = totalLosses === 0 ? totalGains : totalGains / totalLosses;
        const avgWin = winTrades.length > 0 ? totalGains / winTrades.length : 0;
        const avgLoss = lossTrades.length > 0 ? totalLosses / lossTrades.length : 0;

        const formatDuration = (secs: number) => {
            if (isNaN(secs) || secs <= 0) return '0s';
            if (secs < 60) return `${Math.round(secs)}s`;
            const m = Math.floor(secs / 60);
            const s = Math.round(secs % 60);
            return `${m}m ${s}s`;
        };

        let currentStreakCount = 0;
        const recentTrades = [...sortedTrades].filter(t => t.symbol !== 'CASH').reverse();
        const isLatestWinning = recentTrades[0]?.pnl > 0;
        const streakType = isLatestWinning ? 'Wins' : 'Losses';

        for (const t of recentTrades) {
            if ((t.pnl >= 0) === isLatestWinning) currentStreakCount++;
            else break;
        }

        const tradesByDay = new Map<string, number>();
        tradingTrades.forEach(t => {
            const dateStr = getTradingDay(t.soldTimestamp);
            tradesByDay.set(dateStr, (tradesByDay.get(dateStr) || 0) + t.pnl);
        });

        const baseBalance = accountRules[selectedAccount]?.startingBalance || startingBalance;
        let peakBalance = accountBalances[selectedAccount] || baseBalance;
        let runningBalance = peakBalance;

        sortedTrades.forEach(t => {
            runningBalance += t.pnl;
            if (runningBalance > peakBalance) peakBalance = runningBalance;
        });

        // EOD trailing high-water mark: max of daily cumulative balances (5 PM EST sessions).
        // This is what prop firms use for trailing drawdown floors — not the intraday peak.
        let eodPeakBalance = baseBalance;
        if (netDailyHistory && netDailyHistory.length > 0) {
            let eodRunning = baseBalance;
            for (const day of netDailyHistory) {
                eodRunning += day.pnl;
                if (eodRunning > eodPeakBalance) eodPeakBalance = eodRunning;
            }
        } else {
            // Fall back to intraday peak when no daily history is available
            eodPeakBalance = peakBalance;
        }

        const dailyPnls = (useNetData
            ? netDailyHistory.map(day => ({ date: day.date, pnl: day.pnl }))
            : Array.from(tradesByDay.entries()).map(([date, pnl]) => ({ date, pnl })))
            .sort((a, b) => b.date.localeCompare(a.date));

        let dailyStreakCount = 0;
        let dailyStreak = '0 Days';

        if (dailyPnls.length > 0) {
            const isLatestDayWinning = dailyPnls[0].pnl > 0;
            const dailyStreakType = isLatestDayWinning ? 'Green' : 'Red';

            for (const day of dailyPnls) {
                if (day.pnl === 0) break;
                if ((day.pnl > 0) === isLatestDayWinning) dailyStreakCount++;
                else break;
            }
            dailyStreak = `${dailyStreakCount} ${dailyStreakType} Days`;
        }

        const currentStartBal = accountRules[selectedAccount]?.startingBalance || 50000;

        const profitableDays = (useNetData
            ? netDailyHistory.filter(d => d.pnl > 0)
            : dailyPnls.filter(d => d.pnl > 0))
            .filter(d => {
                if (Math.abs(d.pnl - currentStartBal) < 1) return false;
                if (Math.abs(d.pnl - 50000) < 1) return false;
                return true;
            });

        const minDailyProfit = accountRules[selectedAccount]?.minProfitPerDay || 0;
        const qualifyingDays = dailyPnls.filter(d => d.pnl >= minDailyProfit).length;
        const minTradingDaysRequired = accountRules[selectedAccount]?.minTradingDays || 5;

        const totalDailyProfit = profitableDays.reduce((sum, d) => sum + d.pnl, 0);
        const bestDay = profitableDays.length > 0
            ? profitableDays.reduce((best, d) => d.pnl > best.pnl ? d : best, profitableDays[0])
            : null;

        const worstDay = dailyPnls.length > 0
            ? dailyPnls.reduce((worst, d) => d.pnl < worst.pnl ? d : worst, dailyPnls[0])
            : null;

        // Consistency Rule:
        // bestDay.pnl / totalNetProfit <= consistencyPercent/100
        // i.e. totalNetProfit >= bestDay.pnl / (consistencyPercent/100)
        const allDailyPnls = dailyPnls.map(day => day.pnl);
        const totalNetDailyProfit = allDailyPnls.reduce((sum, pnl) => sum + pnl, 0);

        // Use profitOnly sum as fallback if net is 0 or negative (day 1 scenario)
        const consistencyDenominator = totalNetDailyProfit > 0 ? totalNetDailyProfit : totalDailyProfit;

        const bestDayPct = bestDay && consistencyDenominator > 0
            ? (bestDay.pnl / consistencyDenominator) * 100
            : 0;

        const consistencyPct = accountRules[selectedAccount]?.consistencyRulePercent ?? 30;
        const minRequiredProfit = consistencyPct > 0 && bestDay ? bestDay.pnl / (consistencyPct / 100) : 0;
        const consistencyPasses = consistencyPct <= 0 ? true : bestDayPct <= consistencyPct;

        const todayStr = getCurrentTradingDay();
        const todayTrades = tradingTrades.filter(t => getTradingDay(t.soldTimestamp) === todayStr);
        const todayWins = todayTrades.filter(t => t.pnl > 0).length;
        const todayLosses = todayTrades.filter(t => t.pnl < 0).length;
        const totalDuration = tradingTrades.reduce((sum, t) => sum + t.durationSeconds, 0);
        const avgDurationSecs = tradingTrades.length > 0 ? totalDuration / tradingTrades.length : 0;

        let sodBalance = currentBalance - (tradesByDay.get(todayStr) || 0);
        let todayHighBalance = sodBalance;
        let tempBal = sodBalance;
        const sortedTodayTrades = [...todayTrades].sort((a, b) => new Date(a.soldTimestamp).getTime() - new Date(b.soldTimestamp).getTime());
        for (const t of sortedTodayTrades) {
            tempBal += t.pnl;
            if (tempBal > todayHighBalance) {
                todayHighBalance = tempBal;
            }
        }
        const dailyLossLimit = 1000;
        const intradayDrawdown = Math.max(0, todayHighBalance - currentBalance);

        let maxWin = 0;
        let maxLoss = 0;
        tradingTrades.forEach(t => {
            if (t.pnl > maxWin) maxWin = t.pnl;
            if (t.pnl < maxLoss) maxLoss = t.pnl;
        });

        const winnerDurations = winTrades.map(t => t.durationSeconds).filter(secs => Number.isFinite(secs) && secs > 0);
        const loserDurations = lossTrades.map(t => t.durationSeconds).filter(secs => Number.isFinite(secs) && secs > 0);
        const allDurations = tradingTrades.map(t => t.durationSeconds).filter(secs => Number.isFinite(secs) && secs > 0);
        const avgWinnerHoldSecs = winnerDurations.length > 0 ? winnerDurations.reduce((sum, secs) => sum + secs, 0) / winnerDurations.length : 0;
        const avgLoserHoldSecs = loserDurations.length > 0 ? loserDurations.reduce((sum, secs) => sum + secs, 0) / loserDurations.length : 0;
        const maxHoldSecs = allDurations.length > 0 ? Math.max(...allDurations) : 0;
        const bktPnl = (f: (s: number) => boolean) => tradingTrades.filter(t => f(t.durationSeconds)).reduce((s, t) => s + t.pnl, 0);
        const bktCount = (f: (s: number) => boolean) => tradingTrades.filter(t => f(t.durationSeconds)).length;
        const holdBuckets = {
            under5:         { count: bktCount(s => s <= 5 || isNaN(s)),   pnl: bktPnl(s => s <= 5 || isNaN(s)) },
            fiveToTen:      { count: bktCount(s => s > 5 && s <= 10),     pnl: bktPnl(s => s > 5 && s <= 10) },
            between10And30: { count: bktCount(s => s > 10 && s < 30),     pnl: bktPnl(s => s > 10 && s < 30) },
            between30And60: { count: bktCount(s => s >= 30 && s < 60),    pnl: bktPnl(s => s >= 30 && s < 60) },
            between1And5Min:{ count: bktCount(s => s >= 60 && s <= 300),  pnl: bktPnl(s => s >= 60 && s <= 300) },
            over5Min:       { count: bktCount(s => s > 300),              pnl: bktPnl(s => s > 300) },
        };

        const nonZeroTradingDays = dailyPnls.filter(day => day.pnl !== 0);
        const priorTradingDays = nonZeroTradingDays.slice(1, 11);
        const rollingTradeBaseline = priorTradingDays.length > 0
            ? priorTradingDays.reduce((sum, day) => {
                const tradeCount = tradingTrades.filter(t => getTradingDay(t.soldTimestamp) === day.date).length;
                return sum + tradeCount;
            }, 0) / priorTradingDays.length
            : tradingTrades.length > 0 && tradesByDay.size > 0
                ? tradingTrades.length / tradesByDay.size
                : 0;
        const tradesTodayCount = todayTrades.length;
        const overtradingRatio = rollingTradeBaseline > 0 ? tradesTodayCount / rollingTradeBaseline : (tradesTodayCount > 0 ? 1 : 0);
        const overtradingStatus = overtradingRatio >= 1.75 ? 'High' : overtradingRatio >= 1.25 ? 'Elevated' : 'Normal';

        let revengeOpportunities = 0;
        let revengeSignals = 0;
        for (let index = 2; index < recentTrades.length; index += 1) {
            const newerTrade = recentTrades[index - 2];
            const previousTrade = recentTrades[index - 1];
            const currentTrade = recentTrades[index];
            if (newerTrade.pnl < 0 && previousTrade.pnl < 0) {
                revengeOpportunities += 1;
                const priorAvgSize = (newerTrade.qty + previousTrade.qty) / 2;
                if (currentTrade.qty > priorAvgSize) revengeSignals += 1;
            }
        }
        const revengeSignalPct = revengeOpportunities > 0 ? (revengeSignals / revengeOpportunities) * 100 : 0;
        const revengeStatus = revengeSignalPct >= 60 ? 'High' : revengeSignalPct >= 30 ? 'Watch' : 'Low';

        // Microscalping Rule: >50% trades & >50% gross profit from trades held longer than threshold
        const msThreshold = accountRules[selectedAccount]?.microScalpingSeconds;
        let microScalping: {
            tradesPct: number; profitPct: number;
            tradesPasses: boolean; profitPasses: boolean;
            atRiskProfit: number; totalTrades: number;
            thresholdSeconds: number;
        } | undefined = undefined;
        if (msThreshold !== undefined) {
            const longTrades = tradingTrades.filter(t => t.durationSeconds > msThreshold);
            const shortTrades = tradingTrades.filter(t => t.durationSeconds <= msThreshold);
            const tradesPct = tradingTrades.length > 0 ? (longTrades.length / tradingTrades.length) * 100 : 100;
            const longGrossProfit = longTrades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
            const totalGrossProfit = tradingTrades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
            const profitPct = totalGrossProfit > 0 ? (longGrossProfit / totalGrossProfit) * 100 : 100;
            const atRiskProfit = shortTrades.reduce((s, t) => s + t.pnl, 0);
            microScalping = {
                tradesPct, profitPct,
                tradesPasses: tradesPct > 50,
                profitPasses: profitPct > 50,
                atRiskProfit,
                totalTrades: tradingTrades.length,
                thresholdSeconds: msThreshold,
            };
        }

        return {
            todayHighBalance,
            intradayDrawdown,
            dailyLossLimit,
            totalNetPnL,
            grossPnL,
            commissions: tradingCommissions,
            adjustments: totalAdjustments,
            winRate,
            profitFactor,
            totalTrades: tradingTrades.length,
            winTrades: winTrades.length,
            lossTrades: lossTrades.length,
            avgWin,
            avgLoss,
            maxWin,
            maxLoss,
            currentBalance,
            currentStreak: `${currentStreakCount} ${streakType}`,
            dailyStreak,
            todayWins,
            todayLosses,
            avgDuration: formatDuration(avgDurationSecs),
            avgWinnerHold: formatDuration(avgWinnerHoldSecs),
            avgLoserHold: formatDuration(avgLoserHoldSecs),
            maxHold: formatDuration(maxHoldSecs),
            holdBuckets,
            todayPnL: tradesByDay.get(todayStr) || 0,
            tradesTodayCount,
            rollingTradeBaseline,
            overtradingRatio,
            overtradingStatus,
            revengeSignals,
            revengeOpportunities,
            revengeSignalPct,
            revengeStatus,
            tradingDays: tradesByDay.size,
            qualifyingDays,
            minTradingDaysRequired,
            minDailyProfit,
            peakBalance,
            eodPeakBalance,
            bestDayFull: bestDay ? { pnl: bestDay.pnl, date: bestDay.date } : null,
            worstDay: worstDay ? { pnl: worstDay.pnl, date: worstDay.date } : null,
            consistencyRule: {
                bestDayPnl: bestDay?.pnl || 0,
                bestDayDate: bestDay?.date || null,
                bestDayPct,
                totalDailyProfit: consistencyDenominator,
                minRequiredProfit,
                passes: consistencyPasses,
                rulePercent: consistencyPct
            },
            balanceBreakdown: {
                start: effectiveStart,
                pnl: totalNetPnL,
                fees: platformFees,
                commissions: tradingCommissions,
                reconciliation: 0,
                isOverride: accountBalances[selectedAccount] !== undefined
            },
            microScalping
        };
    }, [trades, sortedTrades, startingBalance, accountBalances, selectedAccount, accountRules, dailyNetPnl]);

    const chartData = useMemo(() => {
        const startBal = accountRules[selectedAccount]?.startingBalance || startingBalance;
        const netHistory = dailyNetPnl[selectedAccount];

        const profitTargetRaw = accountRules[selectedAccount]?.profitTarget || 3000;
        // Consistency-adjusted target: use whichever is higher — hard target or min required by consistency rule
        const consistencyMin = metrics?.consistencyRule?.minRequiredProfit || 0;
        const effectiveTargetRaw = Math.max(profitTargetRaw, consistencyMin);
        const targetBalance = startBal + effectiveTargetRaw;
        const data: { date: string; balance: number; target: number; lossLimit: number }[] = [];

        data.push({ date: 'Start', balance: startBal, target: targetBalance, lossLimit: startBal - 1000 });

        let runningBal = startBal;
        let peakBal = startBal;

        if (netHistory && netHistory.length > 0) {
            const sortedHistory = [...netHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            sortedHistory.forEach(day => {
                // If the CSV gave us the actual account balance for the day, use it directly.
                // Otherwise treat pnl as a daily delta (e.g. from Cash report).
                if (day.balance !== undefined && day.balance > 1000) {
                    runningBal = day.balance;
                } else {
                    runningBal += day.pnl;
                }
                if (runningBal > peakBal) peakBal = runningBal;
                const dateObj = new Date(day.date + 'T12:00:00');
                data.push({
                    date: format(dateObj, 'MMM dd'),
                    balance: runningBal,
                    target: targetBalance,
                    lossLimit: peakBal - 1000
                });
            });
        } else {
            const allSorted = [...trades].sort((a, b) => a.soldTimestamp.getTime() - b.soldTimestamp.getTime());
            const uniqueDates = Array.from(new Set(allSorted.map(t => getTradingDay(t.soldTimestamp))));

            uniqueDates.forEach(dateStr => {
                const daysTrades = allSorted.filter(t => getTradingDay(t.soldTimestamp) === dateStr && t.symbol !== 'CASH');
                const dayPnl = daysTrades.reduce((sum, t) => sum + t.pnl, 0);
                runningBal += dayPnl;
                if (runningBal > peakBal) peakBal = runningBal;

                const dateObj = getTradingDayDate(dateStr);
                data.push({
                    date: format(dateObj, 'MMM dd'),
                    balance: runningBal,
                    target: targetBalance,
                    lossLimit: peakBal - 1000
                });
            });
        }

        return data;
    }, [trades, dailyNetPnl, selectedAccount, startingBalance, accountRules]);


    const pnlSparkline = useMemo(() => {
        let cumulative = 0;
        return trades.slice(-20).map(t => {
            cumulative += t.pnl;
            return { val: cumulative };
        });
    }, [trades]);

    const startBal = accountRules[selectedAccount]?.startingBalance || startingBalance;

    const expectancy = useMemo(() => {
        if (!metrics || metrics.totalTrades === 0) return 0;
        const winRateDecimal = metrics.winRate / 100;
        const lossRateDecimal = 1 - winRateDecimal;
        return (winRateDecimal * metrics.avgWin) - (lossRateDecimal * metrics.avgLoss);
    }, [metrics]);

    const weekdayPnlData = useMemo(() => {
        const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weekdayMap = new Map<string, { totalPnl: number; tradeDays: number }>();

        const sourceDays = (dailyNetPnl[selectedAccount] && dailyNetPnl[selectedAccount].length > 0)
            ? dailyNetPnl[selectedAccount].filter(day => Math.abs(day.pnl - startBal) >= 1 && Math.abs(day.pnl - 50000) >= 1)
            : Array.from(
                trades
                    .filter(t => t.symbol !== 'CASH')
                    .reduce((map, trade) => {
                        const day = getTradingDay(trade.soldTimestamp);
                        map.set(day, (map.get(day) || 0) + trade.pnl);
                        return map;
                    }, new Map<string, number>())
                    .entries()
            ).map(([date, pnl]) => ({ date, pnl }));

        sourceDays.forEach(day => {
            const dayLabel = format(new Date(`${day.date}T12:00:00`), 'EEE');
            const current = weekdayMap.get(dayLabel) || { totalPnl: 0, tradeDays: 0 };
            weekdayMap.set(dayLabel, {
                totalPnl: current.totalPnl + day.pnl,
                tradeDays: current.tradeDays + 1,
            });
        });

        return weekdayOrder
            .filter(day => weekdayMap.has(day))
            .map(day => {
                const stats = weekdayMap.get(day)!;
                return {
                    day,
                    totalPnl: stats.totalPnl,
                    tradeDays: stats.tradeDays,
                    avgPnl: stats.tradeDays > 0 ? stats.totalPnl / stats.tradeDays : 0,
                };
            });
    }, [dailyNetPnl, selectedAccount, trades, startBal]);

    const bestWeekday = useMemo(() => {
        if (weekdayPnlData.length === 0) return null;
        return weekdayPnlData.reduce((best, current) => current.avgPnl > best.avgPnl ? current : best, weekdayPnlData[0]);
    }, [weekdayPnlData]);

    const profitTargetRaw = accountRules[selectedAccount]?.profitTarget || 3000;
    // Consistency-adjusted effective target: takes the higher of the hard target or what consistency requires
    const consistencyMin = metrics?.consistencyRule?.minRequiredProfit || 0;
    const effectiveTargetRaw = Math.max(profitTargetRaw, consistencyMin);
    const consistencyIsBinding = consistencyMin > profitTargetRaw && consistencyMin > 0;
    const profitTarget = startBal + effectiveTargetRaw;

    // EOD trailing drawdown floor — peaks on highest end-of-day balance and never resets down.
    // This is how most prop firms (Apex, Topstep, etc.) calculate the trailing drawdown threshold.
    const maxDrawdownAmount = accountRules[selectedAccount]?.maxDrawdown || 0;
    const drawdownFloor = (maxDrawdownAmount > 0 && metrics)
        ? metrics.eodPeakBalance - maxDrawdownAmount
        : undefined;

    const consistencyRuleScore = useMemo(() => {
        if (!metrics) return 0;
        const { bestDayPct, rulePercent } = metrics.consistencyRule;
        if (rulePercent <= 0) return 100;
        if (bestDayPct <= rulePercent) return 100;
        return Math.round(Math.max(0, 100 - (bestDayPct - rulePercent) * 5));
    }, [metrics]);

    const safeDayLimit = useMemo(() => {
        if (!metrics) return null;
        const { rulePercent, totalDailyProfit } = metrics.consistencyRule;
        if (rulePercent <= 0 || rulePercent >= 100 || totalDailyProfit <= 0) return null;
        return Math.round((rulePercent * totalDailyProfit) / (100 - rulePercent));
    }, [metrics]);

    const healthScore = useMemo(() => {
        if (!metrics) return { score: 0, label: 'N/A', tone: 'rose' as const, breakdown: { consistency: 0, qualDays: 0, winRate: 0, progress: 0, expectancy: 50 } };
        const qualScore = Math.min(100, (metrics.qualifyingDays / Math.max(metrics.minTradingDaysRequired, 1)) * 100);
        const winScore = Math.min(100, metrics.winRate);
        const profitScore = effectiveTargetRaw > 0
            ? Math.min(100, Math.max(0, (metrics.totalNetPnL / effectiveTargetRaw) * 100))
            : 50;
        // 50 at breakeven, scales linearly: +$400 → 100, -$400 → 0
        const expectancyScore = Math.min(100, Math.max(0, 50 + (expectancy / 400) * 50));
        const raw = (consistencyRuleScore + qualScore + winScore + profitScore + expectancyScore) / 5;
        const score = Math.round(Math.max(0, Math.min(100, raw)));
        const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Strong' : score >= 55 ? 'On Track' : score >= 40 ? 'Developing' : 'At Risk';
        const tone: 'emerald' | 'cyan' | 'amber' | 'rose' = score >= 75 ? 'emerald' : score >= 55 ? 'cyan' : score >= 35 ? 'amber' : 'rose';
        return { score, label, tone, breakdown: { consistency: consistencyRuleScore, qualDays: Math.round(qualScore), winRate: Math.round(winScore), progress: Math.round(profitScore), expectancy: Math.round(expectancyScore) } };
    }, [metrics, expectancy, effectiveTargetRaw, consistencyRuleScore]);

    // Performance warnings hook
    const warnings = usePerformanceWarnings({
        metrics,
        rules: accountRules[selectedAccount] || null,
        startingBalance: startBal,
        effectiveTargetRaw,
        consistencyIsBinding,
    });

    // Animated hero values (hooks must be unconditional)
    const animBalance = useCountUp(
        metrics?.currentBalance ?? 0,
        n => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    );
    const animNetPnl = useCountUp(
        metrics?.totalNetPnL ?? 0,
        n => `${n >= 0 ? '+' : '-'}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    );
    const animTodayPnl = useCountUp(metrics?.todayPnL ?? 0, n => formatCurrency(n));
    const animWinRate = useCountUp(metrics?.winRate ?? 0, n => `${n.toFixed(1)}%`);

    if (isLoading) return <div className="p-8 text-slate-500 font-black uppercase tracking-[0.3em] text-center mt-20 animate-pulse">Initializing TradeDash...</div>;

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.06),transparent_30%),linear-gradient(180deg,#0c1320_0%,#101620_100%)]">

            {/* ── Sticky header ──────────────────────────────────────── */}
            <header className="shrink-0 px-5 md:px-9 xl:px-12 py-3 bg-[#0c1320]/92 backdrop-blur-xl border-b border-white/6 z-20">
                <div className="flex items-center justify-between gap-4 min-w-0">
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-xl font-black tracking-tight text-white">Trading Dashboard</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-300/50">Account</span>
                            {selectedAccount && <>
                                <span className="text-indigo-300/25 text-xs">·</span>
                                <span className="text-[11px] font-bold text-slate-300 truncate">{selectedAccount}</span>
                            </>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                        {Object.keys(accounts).length > 0 && Object.keys(accounts).map(acc => {
                            const balance = accountBalances[acc];
                            const accTrades = accounts[acc] || [];
                            const netPnl = accTrades.reduce((s, t) => s + t.pnl, 0);
                            const isActive = acc === selectedAccount;
                            return (
                                <button
                                    key={acc}
                                    onClick={() => setSelectedAccount(acc)}
                                    className={`group relative flex flex-col items-start px-3.5 py-2 rounded-2xl border transition-all duration-200 text-left min-w-0 max-w-[160px] shrink-0 ${
                                        isActive
                                            ? 'bg-indigo-500/20 border-indigo-400/40 shadow-[0_0_18px_rgba(99,102,241,0.25)]'
                                            : 'bg-white/[0.03] border-white/8 hover:bg-white/[0.07] hover:border-white/15'
                                    }`}
                                >
                                    {isActive && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
                                    <span className={`text-[11px] font-bold truncate w-full pr-3 ${isActive ? 'text-indigo-200' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                        {acc}
                                    </span>
                                    <span className={`text-sm font-black font-mono tabular-nums mt-0.5 ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                                        {(() => {
                                            if (balance !== undefined) return `$${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                                            const accStart = accountRules[acc]?.startingBalance || startingBalance;
                                            return `$${(accStart + netPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                                        })()}
                                    </span>
                                </button>
                            );
                        })}
                        <button
                            onClick={onOpenSyncCenter}
                            className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 hover:text-white transition-all shrink-0"
                        >
                            <span className="text-[11px]">⇄</span> Import
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Scrollable body ─────────────────────────────────────── */}
            <div className="flex-1 overflow-auto px-5 py-6 md:px-9 md:py-8 xl:px-12 xl:py-10 space-y-5">

            {trades.length === 0 ? (
                <div className="glass p-8 md:p-10 border-white/10 rounded-[28px]">
                    <div className="max-w-2xl">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-3">Ready for live metrics</div>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">No trading performance loaded yet.</h2>
                        <p className="text-slate-400 text-sm md:text-base leading-relaxed">Import fills and performance data to populate the dashboard.</p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={onOpenSyncCenter}
                                className="inline-flex items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/12 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-500/18"
                            >
                                Open Imports & Sync
                            </button>
                        </div>
                    </div>
                </div>
            ) : metrics && (
                <>
                    {/* ── Warnings ───────────────────────────────────────────── */}
                    {warnings.some(w => w.severity !== 'ok') && (
                        <WarningSystem warnings={warnings} />
                    )}

                    {/* ── Hero 4-card row ────────────────────────────────────── */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
                        <MetricCard
                            label="Account Balance"
                            value={animBalance}
                            info={
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>{selectedAccount || 'No account'}</span>
                                </div>
                            }
                            centered={true}
                            progressBar={{
                                current: metrics.currentBalance,
                                target: profitTarget,
                                start: startBal,
                                label: '',
                                maxLossFloor: drawdownFloor,
                                dailyLoss: { used: metrics.intradayDrawdown, limit: metrics.dailyLossLimit }
                            }}
                        />
                        <MetricCard
                            label="Net P&L"
                            value={animNetPnl}
                            info={
                                <div className="flex flex-col gap-1.5 w-full mt-2 border-t border-white/6 pt-3 text-left">
                                    <div className="flex justify-between text-xs w-full">
                                        <span className="text-slate-500 font-bold uppercase tracking-[0.22em]">Start</span>
                                        <span className="text-white font-mono">${metrics.balanceBreakdown.start.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs w-full">
                                        <span className="text-slate-500 font-bold uppercase tracking-[0.22em]">Gross P&L</span>
                                        <span className="text-emerald-400 font-mono">{metrics.grossPnL >= 0 ? '+' : ''}${metrics.grossPnL.toLocaleString()}</span>
                                    </div>
                                    {metrics.commissions > 0 && (
                                        <div className="flex justify-between text-xs w-full">
                                            <span className="text-slate-500 font-bold uppercase tracking-[0.22em]">Commissions</span>
                                            <span className="text-rose-400 font-mono">-${metrics.commissions.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {Math.abs(metrics.adjustments) >= 0.5 && (
                                        <div className="flex justify-between text-xs w-full">
                                            <span className="text-slate-500 font-bold uppercase tracking-[0.22em]">Fees / Adj</span>
                                            <span className={`${metrics.adjustments >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono`}>
                                                {metrics.adjustments >= 0 ? '+' : '-'}${Math.abs(metrics.adjustments).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            }
                            centered={true}
                            sparklineData={pnlSparkline}
                        />
                        {/* Today's P&L */}
                        <div className="glass relative overflow-hidden p-6 md:p-7 flex flex-col gap-3 items-center text-center border-white/8 transition-all duration-300 hover:border-indigo-400/25 hover:-translate-y-0.5">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                            <span className="card-eyebrow">Today's P&amp;L</span>
                            <span className={`text-3xl md:text-4xl font-black tracking-tight ${metrics.todayPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {animTodayPnl}
                            </span>
                            <div className="flex items-center gap-3 card-sub">
                                <span>{metrics.tradesTodayCount} trade{metrics.tradesTodayCount !== 1 ? 's' : ''}</span>
                                <span>·</span>
                                <span className={metrics.currentStreak.toLowerCase().includes('loss') ? 'text-rose-400' : 'text-emerald-400'}>{metrics.currentStreak}</span>
                            </div>
                            <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-white/6">
                                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/8 px-3 py-2 text-left">
                                    <div className="text-[9px] uppercase tracking-[0.2em] text-emerald-300/70 font-black mb-1">Best Day</div>
                                    {metrics.bestDayFull ? (<>
                                        <div className="text-sm font-black text-emerald-400">+${Math.round(metrics.bestDayFull.pnl).toLocaleString()}</div>
                                        <div className="text-[9px] text-slate-500 mt-0.5">{format(new Date(metrics.bestDayFull.date + 'T12:00:00'), 'MMM dd')}</div>
                                    </>) : <div className="text-xs text-slate-600">—</div>}
                                </div>
                                <div className="rounded-xl border border-rose-500/15 bg-rose-500/8 px-3 py-2 text-left">
                                    <div className="text-[9px] uppercase tracking-[0.2em] text-rose-300/70 font-black mb-1">Worst Day</div>
                                    {metrics.worstDay ? (<>
                                        <div className={`text-sm font-black ${metrics.worstDay.pnl < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                                            {metrics.worstDay.pnl >= 0 ? '+' : '-'}${Math.abs(Math.round(metrics.worstDay.pnl)).toLocaleString()}
                                        </div>
                                        <div className="text-[9px] text-slate-500 mt-0.5">{format(new Date(metrics.worstDay.date + 'T12:00:00'), 'MMM dd')}</div>
                                    </>) : <div className="text-xs text-slate-600">—</div>}
                                </div>
                            </div>
                        </div>
                        {/* Win Rate */}
                        <MiniDialCard
                            label="Win Rate"
                            value={animWinRate}
                            valueClassName={metrics.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}
                            percent={metrics.winRate}
                            tone={metrics.winRate >= 50 ? 'emerald' : 'rose'}
                            subtext={`${metrics.winTrades}W · ${metrics.lossTrades}L · ${metrics.totalTrades} total`}
                            info={
                                <div>
                                    <div className="text-[9px] uppercase tracking-[0.24em] text-emerald-300/70 font-black mb-2">Win Rate</div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">Percentage of closed trades that end in profit.</p>
                                    <div className="border border-white/8 rounded-xl bg-white/[0.03] px-3 py-2 mb-2.5">
                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Formula</div>
                                        <div className="text-[10px] text-white font-mono">Winning Trades ÷ Total Trades × 100</div>
                                    </div>
                                    <div className="flex flex-col gap-1 border-t border-white/8 pt-2.5">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">Avg win</span>
                                            <span className="text-emerald-400 font-bold">${metrics.avgWin.toFixed(0)}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">Avg loss</span>
                                            <span className="text-rose-400 font-bold">-${metrics.avgLoss.toFixed(0)}</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-600 mt-2">Win rate alone is misleading — combine with expectancy for the real picture.</p>
                                </div>
                            }
                        />
                    </section>

                    {/* ── Health dials — always visible ──────────────────────── */}
                    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                        <MiniDialCard
                            label="Consistency Rule"
                            value={`${metrics.consistencyRule.bestDayPct.toFixed(1)}%`}
                            valueClassName={metrics.consistencyRule.passes ? 'text-emerald-400' : 'text-rose-400'}
                            percent={metrics.consistencyRule.bestDayPct}
                            targetMarker={metrics.consistencyRule.rulePercent}
                            tone={metrics.consistencyRule.passes ? 'emerald' : 'rose'}
                            subtext={
                                metrics.consistencyRule.bestDayPnl > 0
                                    ? `Best $${Math.round(metrics.consistencyRule.bestDayPnl).toLocaleString()}${metrics.consistencyRule.bestDayDate ? ` (${format(metrics.consistencyRule.bestDayDate, 'MMM d')})` : ''} · Cap $${(safeDayLimit ?? 0).toLocaleString()}/day`
                                    : 'No profitable days yet'
                            }
                            info={
                                <div>
                                    <div className="text-[9px] uppercase tracking-[0.24em] text-emerald-300/70 font-black mb-2">Consistency Rule</div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed mb-3">Best single day must not exceed <span className="text-white font-bold">{metrics.consistencyRule.rulePercent}%</span> of total net profit. Score is 100 when compliant, dropping 5 pts per % over.</p>
                                    <div className="flex flex-col gap-1.5 border-t border-white/8 pt-2.5">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">Your best day</span>
                                            <span className="text-white font-bold">{metrics.consistencyRule.bestDayPct.toFixed(1)}% of profit</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">Rule limit</span>
                                            <span className="text-white font-bold">{metrics.consistencyRule.rulePercent}%</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">Safe day cap</span>
                                            <span className="text-amber-300 font-bold">{safeDayLimit ? `$${safeDayLimit.toLocaleString()}` : '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">Compliance score</span>
                                            <span className={`font-bold ${consistencyRuleScore === 100 ? 'text-emerald-400' : consistencyRuleScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>{consistencyRuleScore} / 100</span>
                                        </div>
                                    </div>
                                </div>
                            }
                        />
                        <MiniDialCard
                            label="Account Health"
                            value={healthScore.score}
                            valueClassName={healthScore.tone === 'emerald' ? 'text-emerald-400' : healthScore.tone === 'cyan' ? 'text-cyan-400' : healthScore.tone === 'amber' ? 'text-amber-400' : 'text-rose-400'}
                            percent={healthScore.score}
                            tone={healthScore.tone}
                            subtext={`${healthScore.label} · C:${healthScore.breakdown.consistency} WR:${healthScore.breakdown.winRate} P:${healthScore.breakdown.progress} E:${healthScore.breakdown.expectancy}`}
                            info={
                                <div>
                                    <div className="text-[9px] uppercase tracking-[0.24em] text-cyan-300/70 font-black mb-2">Account Health Score</div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed mb-3">Equal-weighted composite across five pillars of prop-firm fitness.</p>
                                    <div className="flex flex-col gap-1.5 border-t border-white/8 pt-2.5">
                                        {[
                                            { label: 'Consistency Rule', val: healthScore.breakdown.consistency },
                                            { label: 'Qualifying Days', val: healthScore.breakdown.qualDays },
                                            { label: 'Win Rate', val: healthScore.breakdown.winRate },
                                            { label: 'Profit Progress', val: healthScore.breakdown.progress },
                                            { label: 'Expectancy', val: healthScore.breakdown.expectancy },
                                        ].map(({ label: l, val }) => (
                                            <div key={l} className="flex items-center gap-2 text-[10px]">
                                                <span className="text-slate-500 flex-1">{l}</span>
                                                <span className="text-slate-600">20%</span>
                                                <div className="w-12 h-1 rounded-full bg-white/8 overflow-hidden mx-1">
                                                    <div className="h-full rounded-full bg-indigo-400/60" style={{ width: `${val}%` }} />
                                                </div>
                                                <span className="text-white font-bold w-5 text-right">{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            }
                        />
                        <MiniDialCard
                            label="Qualifying Days"
                            value={`${metrics.qualifyingDays} / ${metrics.minTradingDaysRequired}`}
                            percent={Math.min(100, (metrics.qualifyingDays / metrics.minTradingDaysRequired) * 100)}
                            tone={metrics.qualifyingDays >= metrics.minTradingDaysRequired ? 'emerald' : 'cyan'}
                            subtext={metrics.qualifyingDays >= metrics.minTradingDaysRequired ? '✓ Requirement met' : `${metrics.minTradingDaysRequired - metrics.qualifyingDays} more day${metrics.minTradingDaysRequired - metrics.qualifyingDays !== 1 ? 's' : ''} needed`}
                        />
                        <MiniDialCard
                            label="Expectancy"
                            value={`${expectancy >= 0 ? '+' : '-'}$${Math.abs(expectancy).toFixed(0)}`}
                            valueClassName={expectancy > 50 ? 'text-emerald-400' : expectancy > 0 ? 'text-cyan-400' : 'text-rose-400'}
                            percent={Math.min(100, Math.max(0, ((expectancy + 500) / 1000) * 100))}
                            tone={expectancy > 50 ? 'emerald' : expectancy > 0 ? 'cyan' : 'rose'}
                            subtext={`per trade · ${metrics.totalTrades} total trades`}
                            info={
                                <div>
                                    <div className="text-[9px] uppercase tracking-[0.24em] text-emerald-300/70 font-black mb-2">Expectancy / Trade</div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">What each trade is worth on average. The most overlooked metric in trading.</p>
                                    <div className="border border-white/8 rounded-xl bg-white/[0.03] px-3 py-2 mb-2.5">
                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Formula</div>
                                        <div className="text-[10px] text-white font-mono">(Win% × Avg Win) – (Loss% × Avg Loss)</div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">Positive = edge. A 40% win rate with strong avg wins can beat 70% with small wins. Your strategy must have positive expectancy to be profitable long-term.</p>
                                </div>
                            }
                        />
                    </section>

                    {/* ── Performance details (collapsible) ─────────────────── */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowStats(s => !s)}
                            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 hover:text-slate-300 transition-colors px-1 py-2"
                        >
                            <span className={`transition-transform duration-200 ${showStats ? 'rotate-90' : ''}`}>▶</span>
                            Performance Details
                            <span className="text-slate-600 font-normal normal-case tracking-normal">— Win %, Profit Factor, Avg Win/Loss, Trade Behavior</span>
                        </button>

                        {showStats && (
                            <div className="flex flex-col gap-5 mt-2">
                                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                    <MetricCard
                                        label="Trade Win %"
                                        value={`${metrics.winRate.toFixed(1)}%`}
                                        variant="winrate"
                                        winLoss={{ w: metrics.winTrades, l: metrics.lossTrades, avgW: metrics.avgWin, avgL: metrics.avgLoss, maxW: metrics.maxWin, maxL: metrics.maxLoss }}
                                    />
                                    <MetricCard
                                        label="Profit Factor"
                                        value={metrics.profitFactor.toFixed(2)}
                                        variant="profitfactor"
                                        info="Gross profit ÷ gross loss"
                                        winLoss={{ w: metrics.winTrades, l: metrics.lossTrades, avgW: metrics.avgWin, avgL: metrics.avgLoss, maxW: metrics.maxWin, maxL: metrics.maxLoss }}
                                    />
                                    <MetricCard
                                        label="Avg Win / Loss"
                                        value={formatCurrency(metrics.avgWin)}
                                        variant="avgwinloss"
                                        info="Average winner vs average loser"
                                        winLoss={{ w: metrics.winTrades, l: metrics.lossTrades, avgW: metrics.avgWin, avgL: metrics.avgLoss, maxW: metrics.maxWin, maxL: metrics.maxLoss }}
                                    />
                                    <MetricCard
                                        label="Expectancy / Trade"
                                        value={`${expectancy >= 0 ? '+' : '-'}$${Math.abs(expectancy).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        info={bestWeekday ? `Best day: ${bestWeekday.day} avg ${formatCurrency(bestWeekday.avgPnl)}` : 'Average expected value per trade'}
                                        centered={true}
                                    />
                                </section>
                                <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <MetricCard
                                        label="Overtrading Flag"
                                        value={metrics.overtradingStatus}
                                        info={`Today: ${metrics.tradesTodayCount} trades vs ${metrics.rollingTradeBaseline.toFixed(1)} baseline (${metrics.overtradingRatio.toFixed(2)}x)`}
                                        centered={true}
                                    />
                                    <MetricCard
                                        label="Revenge-Trading Signal"
                                        value={metrics.revengeStatus}
                                        info={metrics.revengeOpportunities > 0
                                            ? `${metrics.revengeSignals} of ${metrics.revengeOpportunities} post-loss setups increased size (${metrics.revengeSignalPct.toFixed(0)}%)`
                                            : 'No two-loss setup detected yet'}
                                        centered={true}
                                    />
                                </section>
                            </div>
                        )}
                    </div>

                    {/* ── Charts ─────────────────────────────────────────────── */}
                    <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        <PnLChart data={chartData} />
                        <WeekdayPnLChart data={weekdayPnlData} />
                    </section>

                    {/* ── Hold Time Profile ──────────────────────────────────── */}
                    <section>
                        <div className="glass relative overflow-hidden p-6 md:p-7 flex flex-col gap-5 min-w-0 flex-1 border-white/8 transition-all duration-300 hover:border-indigo-400/25 hover:-translate-y-0.5">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                        <div className="flex flex-col gap-1.5 border-b border-white/6 pb-4 w-full">
                            <span className="card-eyebrow">Hold Time Profile</span>
                            <span className="card-sub">Winner vs loser hold time · duration buckets · max hold</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/8 px-4 py-3">
                                <div className="text-[9px] uppercase tracking-[0.2em] text-emerald-300/80 font-black mb-1">Avg Winning Trade</div>
                                <div className="text-lg font-black text-white">{metrics.avgWinnerHold}</div>
                            </div>
                            <div className="rounded-2xl border border-rose-500/15 bg-rose-500/8 px-4 py-3">
                                <div className="text-[9px] uppercase tracking-[0.2em] text-rose-300/80 font-black mb-1">Avg Losing Trade</div>
                                <div className="text-lg font-black text-white">{metrics.avgLoserHold}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-[11px]">
                            {(() => { const b = metrics.holdBuckets.under5; return (
                                <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2">
                                    <span className="text-amber-400 block mb-1 font-black text-[10px] uppercase tracking-wide">≤5s</span>
                                    <span className="text-white font-black">{b.count}</span>
                                    <span className={`block text-[10px] font-bold mt-0.5 ${b.count === 0 ? 'text-slate-600' : b.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{b.count === 0 ? '—' : `${b.pnl >= 0 ? '+' : ''}$${b.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</span>
                                </div>
                            ); })()}
                            {(() => { const b = metrics.holdBuckets.fiveToTen; return (
                                <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 px-3 py-2">
                                    <span className="text-amber-300/70 block mb-1 font-black text-[10px] uppercase tracking-wide">6–10s</span>
                                    <span className="text-white font-black">{b.count}</span>
                                    <span className={`block text-[10px] font-bold mt-0.5 ${b.count === 0 ? 'text-slate-600' : b.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{b.count === 0 ? '—' : `${b.pnl >= 0 ? '+' : ''}$${b.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</span>
                                </div>
                            ); })()}
                            {([
                                { label: '10–30s', bucket: metrics.holdBuckets.between10And30 },
                                { label: '30–60s', bucket: metrics.holdBuckets.between30And60 },
                                { label: '1–5m',   bucket: metrics.holdBuckets.between1And5Min },
                                { label: '>5m',    bucket: metrics.holdBuckets.over5Min },
                            ] as const).map(({ label, bucket }) => (
                                <div key={label} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                                    <span className="text-slate-500 block mb-1">{label}</span>
                                    <span className="text-white font-black">{bucket.count}</span>
                                    <span className={`block text-[10px] font-bold mt-0.5 ${bucket.count === 0 ? 'text-slate-600' : bucket.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{bucket.count === 0 ? '—' : `${bucket.pnl >= 0 ? '+' : ''}$${bucket.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</span>
                                </div>
                            ))}
                            <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/8 px-3 py-2"><span className="text-cyan-300/80 block mb-1">Max Hold</span><span className="text-white font-black">{metrics.maxHold}</span></div>
                        </div>
                        {/* Bucket total reconciliation */}
                        {(() => {
                            const hb = metrics.holdBuckets;
                            const bucketTotal = hb.under5.pnl + hb.fiveToTen.pnl + hb.between10And30.pnl + hb.between30And60.pnl + hb.between1And5Min.pnl + hb.over5Min.pnl;
                            const adj = metrics.adjustments;
                            const hasAdj = Math.abs(adj) >= 0.5;
                            const fmt = (v: number) => `${v >= 0 ? '+' : '-'}$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                            return (
                                <div className="border-t border-white/8 pt-2 mt-1 flex flex-col gap-0.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 text-[10px] uppercase tracking-widest">Trading P&L</span>
                                        <span className={`text-[11px] font-bold ${bucketTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(bucketTotal)}</span>
                                    </div>
                                    {hasAdj && (<div className="flex items-center justify-between"><span className="text-slate-500 text-[10px] uppercase tracking-widest">Fees / Adj</span><span className={`text-[11px] font-bold ${adj >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(adj)}</span></div>)}
                                    {hasAdj && (<div className="flex items-center justify-between border-t border-white/6 pt-0.5"><span className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">Net P&L</span><span className={`text-[11px] font-bold ${metrics.totalNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(metrics.totalNetPnL)}</span></div>)}
                                </div>
                            );
                        })()}
                        </div>
                    </section>

                    <PerformanceHeatmap trades={sortedTrades} />

                    <SymbolDeepDive
                        trades={sortedTrades}
                        bestDayTradingDayStr={metrics.consistencyRule.bestDayDate || ''}
                    />

                </>
            )}
            </div>
        </div>
    );
};

export default Dashboard;
