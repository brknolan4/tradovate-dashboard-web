import { useMemo, useEffect, useRef } from 'react';
import type { AccountRules } from '../context/DataContext';

export interface WarningItem {
    id: string;
    label: string;
    severity: 'ok' | 'caution' | 'critical';
    pct: number; // 0–100 usage of the limit
    currentValue: number;
    limitValue: number;
    message: string;
    invert?: boolean; // true = higher is better (profit target)
}

interface Metrics {
    currentBalance: number;
    peakBalance: number;
    intradayDrawdown: number;
    dailyLossLimit: number;
    qualifyingDays: number;
    minTradingDaysRequired: number;
    totalNetPnL: number;
    consistencyRule: {
        bestDayPnl: number;
        bestDayPct: number;
        minRequiredProfit: number;
        passes: boolean;
        rulePercent: number;
    };
    microScalping?: {
        tradesPct: number;
        profitPct: number;
        tradesPasses: boolean;
        profitPasses: boolean;
        atRiskProfit: number;
        totalTrades: number;
    };
}

interface UsePerformanceWarningsProps {
    metrics: Metrics | null;
    rules: AccountRules | null;
    startingBalance: number;
    effectiveTargetRaw: number;
    consistencyIsBinding: boolean;
}

const NOTIF_SESSION_KEY = 'tradedash_fired_notifs';

function getFiredNotifs(): Set<string> {
    try {
        const raw = sessionStorage.getItem(NOTIF_SESSION_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
}

function markNotifFired(id: string) {
    const set = getFiredNotifs();
    set.add(id);
    sessionStorage.setItem(NOTIF_SESSION_KEY, JSON.stringify([...set]));
}

function fireNotification(id: string, title: string, body: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (getFiredNotifs().has(id)) return;
    markNotifFired(id);
    new Notification(title, { body, icon: '/tradedash.svg', tag: id });
}

export function usePerformanceWarnings({ metrics, rules, startingBalance, effectiveTargetRaw, consistencyIsBinding }: UsePerformanceWarningsProps) {
    const hasRequestedPermission = useRef(false);

    // Request notification permission once
    useEffect(() => {
        if (hasRequestedPermission.current) return;
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
        hasRequestedPermission.current = true;
    }, []);

    const warnings = useMemo((): WarningItem[] => {
        if (!metrics) return [];

        const items: WarningItem[] = [];

        // ── 1. Daily Loss ──────────────────────────────────────────────────
        const dailyLimit = rules?.dailyLossLimit || 1000;
        const dailyUsed = Math.max(0, metrics.intradayDrawdown);
        const dailyPct = Math.min(100, (dailyUsed / dailyLimit) * 100);
        const dailySeverity: WarningItem['severity'] =
            dailyPct >= 80 ? 'critical' : dailyPct >= 50 ? 'caution' : 'ok';

        items.push({
            id: 'daily-loss',
            label: 'Daily Loss Limit',
            severity: dailySeverity,
            pct: dailyPct,
            currentValue: dailyUsed,
            limitValue: dailyLimit,
            message: dailySeverity === 'ok'
                ? `$${(dailyLimit - dailyUsed).toFixed(0)} remaining today`
                : dailySeverity === 'caution'
                    ? `⚠️ $${(dailyLimit - dailyUsed).toFixed(0)} left — slow down`
                    : `🚨 Only $${(dailyLimit - dailyUsed).toFixed(0)} before breach!`
        });

        if (dailySeverity === 'critical') {
            fireNotification('daily-loss-critical', '🚨 Daily Loss Limit Critical', `You've used $${dailyUsed.toFixed(0)} of your $${dailyLimit} daily limit. Stop trading!`);
        } else if (dailySeverity === 'caution') {
            fireNotification('daily-loss-caution', '⚠️ Daily Loss Limit Warning', `You've used $${dailyUsed.toFixed(0)} of your $${dailyLimit} daily limit.`);
        }

        // ── 2. Trailing Drawdown ───────────────────────────────────────────
        const maxDD = rules?.maxDrawdown || 2500;
        const fromPeak = Math.max(0, metrics.peakBalance - metrics.currentBalance);
        const ddPct = Math.min(100, (fromPeak / maxDD) * 100);
        const ddSeverity: WarningItem['severity'] =
            ddPct >= 90 ? 'critical' : ddPct >= 70 ? 'caution' : 'ok';

        items.push({
            id: 'trailing-dd',
            label: 'Trailing Drawdown',
            severity: ddSeverity,
            pct: ddPct,
            currentValue: fromPeak,
            limitValue: maxDD,
            message: ddSeverity === 'ok'
                ? `$${(maxDD - fromPeak).toFixed(0)} of headroom remain`
                : ddSeverity === 'caution'
                    ? `⚠️ Down $${fromPeak.toFixed(0)} from peak — be careful`
                    : `🚨 $${(maxDD - fromPeak).toFixed(0)} from account blow!`
        });

        if (ddSeverity === 'critical') {
            fireNotification('dd-critical', '🚨 Drawdown Critical', `You're $${fromPeak.toFixed(0)} from peak — only $${(maxDD - fromPeak).toFixed(0)} to max drawdown.`);
        } else if (ddSeverity === 'caution') {
            fireNotification('dd-caution', '⚠️ Drawdown Warning', `Down $${fromPeak.toFixed(0)} from peak. Max allowed: $${maxDD}.`);
        }

        // ── 3. Consistency Rule ────────────────────────────────────────────
        if (rules?.consistencyRulePercent) {
            const cap = rules.consistencyRulePercent;
            const bestDayPct = metrics.consistencyRule.bestDayPct;
            const consistencyUsePct = Math.min(100, (bestDayPct / cap) * 100);
            const consistencySeverity: WarningItem['severity'] =
                bestDayPct >= cap ? 'critical'
                    : bestDayPct >= cap * 0.90 ? 'caution'
                        : 'ok';

            items.push({
                id: 'consistency',
                label: 'Consistency Rule',
                severity: consistencySeverity,
                pct: consistencyUsePct,
                currentValue: bestDayPct,
                limitValue: cap,
                message: consistencySeverity === 'ok'
                    ? `Best day ${bestDayPct.toFixed(1)}% of total — within ${cap}% cap`
                    : consistencySeverity === 'caution'
                        ? `⚠️ Best day ${bestDayPct.toFixed(1)}% — approaching ${cap}% cap`
                        : `🚨 Best day ${bestDayPct.toFixed(1)}% exceeds ${cap}% — failing!`
            });

            if (consistencySeverity === 'critical') {
                fireNotification('consistency-critical', '🚨 Consistency Rule Breach', `Best day is ${bestDayPct.toFixed(1)}% of total profit — exceeds ${cap}% cap.`);
            }
        }

        // ── 4. Qualifying Days ─────────────────────────────────────────────
        if (metrics.minTradingDaysRequired > 1) {
            const daysLeft = Math.max(0, metrics.minTradingDaysRequired - metrics.qualifyingDays);
            const daysPct = Math.min(100, (metrics.qualifyingDays / metrics.minTradingDaysRequired) * 100);
            const daysSeverity: WarningItem['severity'] = daysPct >= 100 ? 'ok' : 'caution';

            items.push({
                id: 'qualifying-days',
                label: 'Qualifying Days',
                severity: daysSeverity,
                pct: daysPct,
                currentValue: metrics.qualifyingDays,
                limitValue: metrics.minTradingDaysRequired,
                invert: true,
                message: daysLeft === 0
                    ? `✅ All ${metrics.minTradingDaysRequired} qualifying days complete!`
                    : `${daysLeft} more qualifying day${daysLeft > 1 ? 's' : ''} needed`
            });
        }

        // ── 5. Microscalping Rule ──────────────────────────────────────────
        if (rules?.microScalpingSeconds !== undefined && metrics.microScalping && metrics.microScalping.totalTrades > 0) {
            const ms = metrics.microScalping;
            const passing = ms.tradesPasses && ms.profitPasses;
            const worstPct = Math.min(ms.tradesPct, ms.profitPct);
            const msSeverity: WarningItem['severity'] = passing ? 'ok' : worstPct < 35 ? 'critical' : 'caution';

            items.push({
                id: 'microscalping',
                label: 'Microscalping Rule',
                severity: msSeverity,
                pct: worstPct,
                currentValue: worstPct,
                limitValue: 50,
                message: passing
                    ? `✅ Trades ${ms.tradesPct.toFixed(0)}% / Profit ${ms.profitPct.toFixed(0)}% — both above 50%`
                    : msSeverity === 'critical'
                        ? `🚨 Microscalping risk — ${ms.atRiskProfit > 0 ? `$${ms.atRiskProfit.toFixed(0)} at risk` : 'below 50% threshold'}`
                        : `⚠️ Trades ${ms.tradesPct.toFixed(0)}% / Profit ${ms.profitPct.toFixed(0)}% — need both >50%`
            });

            if (msSeverity === 'critical') {
                fireNotification('microscalping-critical', '🚨 Microscalping Rule Breach', `Trades >10s: ${ms.tradesPct.toFixed(0)}%, Profit >10s: ${ms.profitPct.toFixed(0)}%. $${ms.atRiskProfit.toFixed(0)} at risk.`);
            } else if (msSeverity === 'caution') {
                fireNotification('microscalping-caution', '⚠️ Microscalping Rule Warning', `Trades >10s: ${ms.tradesPct.toFixed(0)}%, Profit >10s: ${ms.profitPct.toFixed(0)}%.`);
            }
        }

        // ── 6. Profit Target Progress ──────────────────────────────────────
        const netPnL = Math.max(0, metrics.totalNetPnL);
        const targetProgress = Math.min(100, (netPnL / effectiveTargetRaw) * 100);
        items.push({
            id: 'profit-target',
            label: consistencyIsBinding ? 'Consistency Min Target' : 'Profit Target',
            severity: targetProgress >= 100 ? 'ok' : 'caution',
            pct: targetProgress,
            currentValue: netPnL,
            limitValue: effectiveTargetRaw,
            invert: true,
            message: targetProgress >= 100
                ? `✅ Profit target reached! Ready for payout review`
                : `$${(effectiveTargetRaw - netPnL).toFixed(0)} more needed${consistencyIsBinding ? ' (consistency-adjusted)' : ''}`
        });

        return items;
    }, [metrics, rules, startingBalance, effectiveTargetRaw, consistencyIsBinding]);

    return warnings;
}
