
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Trade } from '../utils/csvParser';
import { parsePerformanceCSV, parseFillsCSV, parseCashCSV, parseTopstepCSV, getAccountLookupCandidates, normalizeAccountLookupKey } from '../utils/csvParser';

export interface AccountRules {
    profitTarget: number;
    maxDrawdown: number;
    dailyLossLimit: number;
    minTradingDays: number;
    minProfitPerDay?: number;
    startingBalance: number;
    platformFees: number; // Rithmic, data fees, etc. not in CSV
    // Advanced Rules
    maxContracts?: number;
    scalingThreshold?: number;
    rrRatioLimit?: number;
    safetyNet?: number;
    maeLimitPercent?: number; // e.g. 30 for 30%
    maeRevertPercent?: number; // e.g. 50 for 50%
    minDaysOver50?: number; // e.g. 5 for 5 days > $50
    consistencyRulePercent?: number; // e.g. 30 for 30%
    microScalpingSeconds?: number; // threshold in seconds — trades at or below this are microscalps (e.g. 10 for Tradeify, 5 for Lucid)
}

export const PROP_FIRM_TEMPLATES: Record<string, AccountRules> = {
    'Apex 50k': {
        profitTarget: 3000,
        maxDrawdown: 2500,
        dailyLossLimit: 1100,
        minTradingDays: 7,
        startingBalance: 50000,
        platformFees: 0,
        consistencyRulePercent: 30
    },
    'Apex 100k': {
        profitTarget: 6000,
        maxDrawdown: 3000,
        dailyLossLimit: 2200,
        minTradingDays: 7,
        startingBalance: 100000,
        platformFees: 0,
        consistencyRulePercent: 30
    },
    'Apex 50k PA': {
        profitTarget: 3000,
        maxDrawdown: 2500,
        dailyLossLimit: 1500, // Explicit DL might not apply if MAE is the main rule, but keeping for reference
        minTradingDays: 5,
        minProfitPerDay: 250,
        startingBalance: 50000,
        platformFees: 0,
        maxContracts: 10,
        scalingThreshold: 52600,
        safetyNet: 2600, // As per user text ($2,600 safety net)
        maeLimitPercent: 30, // 30% rule
        rrRatioLimit: 5,
        minDaysOver50: 5,
        consistencyRulePercent: 30
    },
    'TopOne 50k': {
        profitTarget: 3000,
        maxDrawdown: 2000,
        dailyLossLimit: 1000,
        minTradingDays: 5,
        startingBalance: 50000,
        platformFees: 0,
        consistencyRulePercent: 15
    },
    'MyFundedFutures 50k': {
        profitTarget: 3000,
        maxDrawdown: 2000,
        dailyLossLimit: 1100,
        minTradingDays: 1,
        startingBalance: 50000,
        platformFees: 0,
        consistencyRulePercent: 40 // Usually no consistency or higher
    },
    'LucidFlex 50k Eval': {
        profitTarget: 3000,
        maxDrawdown: 2000,
        dailyLossLimit: 0,
        minTradingDays: 2,
        startingBalance: 50000,
        platformFees: 0,
        maxContracts: 4,
        consistencyRulePercent: 50,
        safetyNet: 2100,  // EOD trail locks at $50,100 once balance hits $52,100
        microScalpingSeconds: 5
    },
    'Tradeify Select 25k Eval': {
        profitTarget: 1500,
        maxDrawdown: 1000,
        dailyLossLimit: 0,
        minTradingDays: 3,
        startingBalance: 25000,
        platformFees: 0,
        maxContracts: 1,
        consistencyRulePercent: 40,
        microScalpingSeconds: 10
    },
    'Tradeify Select 50k Eval': {
        profitTarget: 3000,
        maxDrawdown: 2000,
        dailyLossLimit: 0,
        minTradingDays: 3,
        startingBalance: 50000,
        platformFees: 0,
        maxContracts: 4,
        consistencyRulePercent: 40,
        microScalpingSeconds: 10
    },
    'Tradeify Growth 50k Eval': {
        profitTarget: 3000,
        maxDrawdown: 2000,
        dailyLossLimit: 1250,
        minTradingDays: 1,
        startingBalance: 50000,
        platformFees: 0,
        maxContracts: 4,
        consistencyRulePercent: 0,
        microScalpingSeconds: 10
    }
};

interface DataContextType {
    accounts: Record<string, Trade[]>;
    accountBalances: Record<string, number>;
    accountRules: Record<string, AccountRules>;
    accountCommissions: Record<string, number>;
    accountMappings: Record<string, string>;
    dailyNetPnl: Record<string, { date: string; pnl: number; balance?: number }[]>;
    selectedAccount: string;
    setSelectedAccount: (name: string) => void;
    updateAccountRules: (accountName: string, rules: AccountRules) => void;
    setAccountMappings: (mappings: Record<string, string>) => void;
    resolveAccountLabel: (detectedAccount?: string, aliases?: string[], fallbackName?: string) => string;
    importData: (csvContent: string, accountName: string, overrideAccountName?: string) => void;
    importFills: (csvContent: string, targetAccount?: string) => { account: string; commissions: number; fills: number; trades: number } | null;
    importCash: (csvContent: string, targetAccount?: string, applyBalanceOverride?: boolean) => { account: string, adjustments: number, totalValue: number, balanceOverride?: number } | null;
    importTradovateBundleData: (bundle: { fillsText: string; performanceText: string; cashText?: string | null; targetAccount?: string }) => { account: string; commissions: number; fills: number; trades: number; adjustments: number; totalValue: number; balanceOverride?: number } | null;
    mergeAccounts: (sourceAccounts: string[], targetAccount: string) => { mergedTrades: number; mergedSources: number };
    clearData: (accountName?: string) => void;
    isLoading: boolean;
    startingBalance: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [accounts, setAccounts] = useState<Record<string, Trade[]>>({});
    const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
    const [accountRules, setAccountRules] = useState<Record<string, AccountRules>>({});
    const [accountCommissions, setAccountCommissions] = useState<Record<string, number>>({});
    const [accountMappingsState, setAccountMappingsState] = useState<Record<string, string>>({});
    const [dailyNetPnl, setDailyNetPnl] = useState<Record<string, { date: string; pnl: number; balance?: number }[]>>({});
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const startingBalance = 50000;

    // Load from localStorage on init
    useEffect(() => {
        const savedAccounts = localStorage.getItem('tradedash_accounts');
        const savedBalances = localStorage.getItem('tradedash_balances');
        const savedRules = localStorage.getItem('tradedash_rules');
        const savedMappings = localStorage.getItem('tradedash_account_mappings');

        if (savedAccounts) {
            try {
                const parsed = JSON.parse(savedAccounts);
                const hydrated: Record<string, Trade[]> = {};
                Object.keys(parsed).forEach(acc => {
                    hydrated[acc] = parsed[acc].map((t: any) => ({
                        ...t,
                        boughtTimestamp: new Date(t.boughtTimestamp),
                        soldTimestamp: new Date(t.soldTimestamp)
                    }));
                });
                setAccounts(hydrated);
                if (Object.keys(hydrated).length > 0) {
                    setSelectedAccount(Object.keys(hydrated)[0]);
                }
            } catch (e) {
                console.error('Failed to parse saved accounts', e);
            }
        }

        if (savedBalances) {
            try {
                setAccountBalances(JSON.parse(savedBalances));
            } catch (e) {
                console.error('Failed to parse saved balances', e);
            }
        }

        if (savedRules) {
            try {
                setAccountRules(JSON.parse(savedRules));
            } catch (e) {
                console.error('Failed to parse saved rules', e);
            }
        }

        if (savedMappings) {
            try {
                setAccountMappingsState(JSON.parse(savedMappings));
            } catch (e) {
                console.error('Failed to parse saved account mappings', e);
            }
        }

        const savedCommissions = localStorage.getItem('tradedash_commissions');
        if (savedCommissions) {
            try {
                setAccountCommissions(JSON.parse(savedCommissions));
            } catch (e) {
                console.error('Failed to parse saved commissions', e);
            }
        }

        const savedDailyPnl = localStorage.getItem('tradedash_daily_pnl');
        if (savedDailyPnl) {
            try {
                setDailyNetPnl(JSON.parse(savedDailyPnl));
            } catch (e) {
                console.error('Failed to parse saved daily P&L', e);
            }
        }

        setIsLoading(false);
    }, []);

    const setAccountMappings = (mappings: Record<string, string>) => {
        setAccountMappingsState(mappings);
        localStorage.setItem('tradedash_account_mappings', JSON.stringify(mappings));
    };

    const resolveAccountLabel = (detectedAccount?: string, aliases: string[] = [], fallbackName?: string) => {
        const candidates = new Set<string>();

        aliases.forEach(alias => {
            const normalized = normalizeAccountLookupKey(alias);
            if (normalized) candidates.add(normalized);
        });

        getAccountLookupCandidates(detectedAccount || '').forEach(alias => candidates.add(alias));
        getAccountLookupCandidates(fallbackName || '').forEach(alias => candidates.add(alias));

        for (const candidate of candidates) {
            const mapped = accountMappingsState[candidate];
            if (mapped) return mapped;
        }

        return detectedAccount || fallbackName || selectedAccount || 'Apex Trading';
    };

    const importData = (csvContent: string, fallbackName: string, overrideAccountName?: string) => {
        // Try Topstep format first
        const topstepResult = parseTopstepCSV(csvContent);
        if (topstepResult) {
            console.log('[importData] Detected Topstep format');
            const { trades: newTrades, accountName: detectedName } = topstepResult;
            const finalAccountName = overrideAccountName || detectedName || fallbackName;

            if (newTrades.length > 0) {
                const updatedAccounts = { ...accounts, [finalAccountName]: newTrades };
                setAccounts(updatedAccounts);
                localStorage.setItem('tradedash_accounts', JSON.stringify(updatedAccounts));

                // Initialize rules for new TopstepX account (but NOT accountBalances — 
                // setting accountBalances would override the calculated balance and break P&L display)
                if (!accountRules[finalAccountName]) {
                    const defaultStart = 50000;
                    const updatedRules = {
                        ...accountRules,
                        [finalAccountName]: { ...PROP_FIRM_TEMPLATES['Apex 50k'], startingBalance: defaultStart }
                    };
                    setAccountRules(updatedRules);
                    localStorage.setItem('tradedash_rules', JSON.stringify(updatedRules));
                }

                // Store commissions total from trades
                const totalComm = newTrades.reduce((sum, t) => sum + (t.commissions || 0), 0);
                if (totalComm > 0) {
                    const updatedCommissions = { ...accountCommissions, [finalAccountName]: totalComm };
                    setAccountCommissions(updatedCommissions);
                    localStorage.setItem('tradedash_commissions', JSON.stringify(updatedCommissions));
                }

                setSelectedAccount(finalAccountName);
            }
            return;
        }

        const { trades: newTrades, accountName: detectedName, accountAliases, balanceOverride, dailyPnlHistory } = parsePerformanceCSV(csvContent);
        const finalAccountName = overrideAccountName || resolveAccountLabel(detectedName, accountAliases, fallbackName);

        if (newTrades.length > 0) {
            // Check if we already have high-fidelity trades (with commissions) from Fills import
            const existingTrades = accounts[finalAccountName] || [];
            const hasExistingCommissions = existingTrades.some(t => t.commissions > 0);
            const newHasCommissions = newTrades.some(t => t.commissions > 0);

            // Only overwrite if:
            // 1. We don't have existing high-quality data
            // 2. OR the new data also appears to be high-quality (has commissions)
            // 3. OR it's a completely new account
            if (!hasExistingCommissions || newHasCommissions || existingTrades.length === 0) {
                const updatedAccounts = { ...accounts, [finalAccountName]: newTrades };
                setAccounts(updatedAccounts);
                localStorage.setItem('tradedash_accounts', JSON.stringify(updatedAccounts));
            } else {
                console.log('Skipping trade overwrite for ' + finalAccountName + ' - preserving existing trades with commission data.');
            }
        }

        if (balanceOverride !== undefined) {
            const updatedBalances = { ...accountBalances, [finalAccountName]: balanceOverride };
            setAccountBalances(updatedBalances);
            localStorage.setItem('tradedash_balances', JSON.stringify(updatedBalances));
        }

        // Store daily P&L history from balance CSV for net consistency calculations
        if (dailyPnlHistory && dailyPnlHistory.length > 0) {
            const updatedDailyPnl = { ...dailyNetPnl, [finalAccountName]: dailyPnlHistory };
            setDailyNetPnl(updatedDailyPnl);
            localStorage.setItem('tradedash_daily_pnl', JSON.stringify(updatedDailyPnl));
        }

        setSelectedAccount(finalAccountName);
    };

    const updateAccountRules = (accountName: string, rules: AccountRules) => {
        const updated = { ...accountRules, [accountName]: rules };
        setAccountRules(updated);
        localStorage.setItem('tradedash_rules', JSON.stringify(updated));
    };

    const importFills = (csvContent: string, targetAccount?: string) => {
        const result = parseFillsCSV(csvContent);
        if (result) {
            // Use targetAccount if provided, otherwise resolve via saved mapping aliases
            const accountToUse = targetAccount || resolveAccountLabel(result.accountName, result.accountAliases, selectedAccount || 'Apex Trading');

            // Store commissions
            const updatedCommissions = { ...accountCommissions, [accountToUse]: result.totalCommissions };
            setAccountCommissions(updatedCommissions);
            localStorage.setItem('tradedash_commissions', JSON.stringify(updatedCommissions));

            // Update trades from Fills (source of truth for commissions)
            // Preserve CASH entries from existing trades (which come from Performance CSV)
            const existingTrades = accounts[accountToUse] || [];
            const cashTrades = existingTrades.filter(t => t.symbol === 'CASH');

            // Combine new filled trades with existing CASH adjustments
            // We use Fills trades for execution data because they have accurate commission breakdowns
            const mergedTrades = [...result.trades, ...cashTrades].sort((a, b) =>
                new Date(a.soldTimestamp).getTime() - new Date(b.soldTimestamp).getTime()
            );

            const updatedAccounts = { ...accounts, [accountToUse]: mergedTrades };
            setAccounts(updatedAccounts);
            localStorage.setItem('tradedash_accounts', JSON.stringify(updatedAccounts));
            setSelectedAccount(accountToUse);
            console.log('Imported ' + result.trades.length + ' trades with $' + result.totalCommissions.toFixed(2) + ' total commissions for ' + accountToUse);

            return { account: accountToUse, commissions: result.totalCommissions, fills: result.fillCount, trades: result.trades.length };
        }
        return null;
    };

    const importCash = (csvContent: string, targetAccount?: string, applyBalanceOverride = true) => {
        const result = parseCashCSV(csvContent);
        if (result && (result.trades.length > 0 || result.balanceOverride || result.dailyPnlHistory?.length)) {
            const accountToUse = targetAccount || resolveAccountLabel(result.accountName, result.accountAliases, selectedAccount || 'Apex Trading');

            // 1. Update Trades (merge pseudo-trades like Fundings)
            const existingTrades = accounts[accountToUse] || [];
            // Filter out old CASH trades to avoid duplicates
            const regularTrades = existingTrades.filter(t => t.symbol !== 'CASH');

            const mergedTrades = [...regularTrades, ...result.trades].sort((a, b) =>
                new Date(a.soldTimestamp).getTime() - new Date(b.soldTimestamp).getTime()
            );

            const updatedAccounts = { ...accounts, [accountToUse]: mergedTrades };
            setAccounts(updatedAccounts);
            localStorage.setItem('tradedash_accounts', JSON.stringify(updatedAccounts));

            // 2. Override Balance if found
            if (applyBalanceOverride && result.balanceOverride !== undefined) {
                const updatedBalances = { ...accountBalances, [accountToUse]: result.balanceOverride };
                setAccountBalances(updatedBalances);
                localStorage.setItem('tradedash_balances', JSON.stringify(updatedBalances));
            }

            // 3. Store broker-accurate daily P&L history (includes all fees, not just commissions)
            if (result.dailyPnlHistory && result.dailyPnlHistory.length > 0) {
                const updatedDailyPnl = { ...dailyNetPnl, [accountToUse]: result.dailyPnlHistory };
                setDailyNetPnl(updatedDailyPnl);
                localStorage.setItem('tradedash_daily_pnl', JSON.stringify(updatedDailyPnl));
                console.log(`[importCash] Stored ${result.dailyPnlHistory.length} broker daily P&L entries for ${accountToUse}`);
            }

            setSelectedAccount(accountToUse);

            return {
                account: accountToUse,
                adjustments: result.trades.length,
                totalValue: result.trades.reduce((sum, t) => sum + t.pnl, 0),
                balanceOverride: result.balanceOverride,
                dailyPnlDays: result.dailyPnlHistory?.length || 0
            };
        }
        return null;
    };



    const importTradovateBundleData = ({ fillsText, performanceText, cashText, targetAccount }: { fillsText: string; performanceText: string; cashText?: string | null; targetAccount?: string }) => {
        const fillsResult = parseFillsCSV(fillsText);
        if (!fillsResult) return null;

        const performanceResult = parsePerformanceCSV(performanceText);
        const cashResult = cashText ? parseCashCSV(cashText) : null;
        const accountToUse = targetAccount || resolveAccountLabel(fillsResult.accountName, fillsResult.accountAliases, selectedAccount || 'Apex Trading');

        // Prefer Performance CSV trades — Tradovate pre-calculates gross P&L there.
        // Fall back to fills FIFO only if Performance returned no trades.
        const tradeSrc = performanceResult.trades.length > 0
            ? performanceResult.trades
            : fillsResult.trades;

        // Build fill commission lookup: fillId → { commission, qty }
        const fillCommMap = new Map<string, { commission: number; qty: number }>();
        for (const fill of fillsResult.fills) {
            fillCommMap.set(fill.id, { commission: fill.commission, qty: fill.qty });
        }

        // Enrich Performance trades with prorated commissions from Fills CSV
        const enrichedTradeSrc = performanceResult.trades.length > 0
            ? tradeSrc.map(trade => {
                const buyFill = trade.buyFillId ? fillCommMap.get(trade.buyFillId) : undefined;
                const sellFill = trade.sellFillId ? fillCommMap.get(trade.sellFillId) : undefined;
                const buyComm = buyFill ? buyFill.commission * (trade.qty / buyFill.qty) : 0;
                const sellComm = sellFill ? sellFill.commission * (trade.qty / sellFill.qty) : 0;
                const totalComm = Math.round((buyComm + sellComm) * 100) / 100;
                if (totalComm === 0) return trade;
                return {
                    ...trade,
                    commissions: totalComm,
                    pnl: Math.round((trade.pnl - totalComm) * 100) / 100,
                };
            })
            : tradeSrc;

        const mergedTrades = [
            ...enrichedTradeSrc,
            ...(cashResult?.trades || [])
        ].sort((a, b) => new Date(a.soldTimestamp).getTime() - new Date(b.soldTimestamp).getTime());

        const updatedAccounts = { ...accounts, [accountToUse]: mergedTrades };
        setAccounts(updatedAccounts);
        localStorage.setItem('tradedash_accounts', JSON.stringify(updatedAccounts));

        const updatedCommissions = { ...accountCommissions, [accountToUse]: fillsResult.totalCommissions };
        setAccountCommissions(updatedCommissions);
        localStorage.setItem('tradedash_commissions', JSON.stringify(updatedCommissions));

        const nextBalance = cashResult?.balanceOverride ?? performanceResult.balanceOverride;
        if (nextBalance !== undefined) {
            const updatedBalances = { ...accountBalances, [accountToUse]: nextBalance };
            setAccountBalances(updatedBalances);
            localStorage.setItem('tradedash_balances', JSON.stringify(updatedBalances));
        }

        // Build a broker-truth daily P&L series whenever possible.
        // Priority:
        // 1. Cash.csv daily rows (includes commissions/fees and matches broker balance deltas)
        // 2. Balance-history style Performance export
        // If both exist, use Cash P&L and merge in broker balance snapshots from Performance.
        const performanceDaily = (performanceResult.dailyPnlHistory || []) as { date: string; pnl: number; balance?: number }[];
        const cashDaily = (cashResult?.dailyPnlHistory || []) as { date: string; pnl: number; balance?: number }[];
        const freshDailyPnl = (() => {
            if (cashDaily.length > 0) {
                const perfBalanceByDate = new Map(
                    performanceDaily.map((entry) => [entry.date, entry.balance])
                );
                return cashDaily.map((entry) => ({
                    ...entry,
                    balance: perfBalanceByDate.get(entry.date),
                }));
            }
            if (performanceDaily.length > 0) {
                return performanceDaily;
            }
            return [] as { date: string; pnl: number; balance?: number }[];
        })();
        const updatedDailyPnl = { ...dailyNetPnl, [accountToUse]: freshDailyPnl };
        setDailyNetPnl(updatedDailyPnl);
        localStorage.setItem('tradedash_daily_pnl', JSON.stringify(updatedDailyPnl));

        setSelectedAccount(accountToUse);

        return {
            account: accountToUse,
            commissions: fillsResult.totalCommissions,
            fills: fillsResult.fillCount,
            trades: enrichedTradeSrc.length,
            adjustments: cashResult?.trades.length || 0,
            totalValue: (cashResult?.trades || []).reduce((sum, t) => sum + t.pnl, 0),
            balanceOverride: nextBalance,
        };
    };

    const mergeAccounts = (sourceAccounts: string[], targetAccount: string) => {
        const uniqueSources = Array.from(new Set(sourceAccounts.filter(name => name && name !== targetAccount)));
        if (!targetAccount || uniqueSources.length === 0) {
            return { mergedTrades: 0, mergedSources: 0 };
        }

        const combinedTrades = [
            ...(accounts[targetAccount] || []),
            ...uniqueSources.flatMap(source => accounts[source] || [])
        ].sort((a, b) => new Date(a.soldTimestamp).getTime() - new Date(b.soldTimestamp).getTime());

        const nextAccounts = { ...accounts, [targetAccount]: combinedTrades };
        uniqueSources.forEach(source => { delete nextAccounts[source]; });
        setAccounts(nextAccounts);
        localStorage.setItem('tradedash_accounts', JSON.stringify(nextAccounts));

        const nextBalances = { ...accountBalances };
        const sourceBalances = uniqueSources
            .map(source => accountBalances[source])
            .filter((value): value is number => value !== undefined);
        if (sourceBalances.length > 0 && nextBalances[targetAccount] === undefined) {
            nextBalances[targetAccount] = sourceBalances[sourceBalances.length - 1];
        }
        uniqueSources.forEach(source => { delete nextBalances[source]; });
        setAccountBalances(nextBalances);
        localStorage.setItem('tradedash_balances', JSON.stringify(nextBalances));

        const nextRules = { ...accountRules };
        uniqueSources.forEach(source => {
            if (!nextRules[targetAccount] && nextRules[source]) {
                nextRules[targetAccount] = nextRules[source];
            }
            delete nextRules[source];
        });
        setAccountRules(nextRules);
        localStorage.setItem('tradedash_rules', JSON.stringify(nextRules));

        const nextCommissions = { ...accountCommissions };
        const totalCommission = (nextCommissions[targetAccount] || 0) + uniqueSources.reduce((sum, source) => sum + (nextCommissions[source] || 0), 0);
        if (totalCommission > 0) nextCommissions[targetAccount] = totalCommission;
        uniqueSources.forEach(source => { delete nextCommissions[source]; });
        setAccountCommissions(nextCommissions);
        localStorage.setItem('tradedash_commissions', JSON.stringify(nextCommissions));

        const nextDailyPnl = { ...dailyNetPnl };
        const combinedDailyPnl = [
            ...(nextDailyPnl[targetAccount] || []),
            ...uniqueSources.flatMap(source => nextDailyPnl[source] || [])
        ];
        if (combinedDailyPnl.length > 0) {
            const deduped = new Map<string, { date: string; pnl: number; balance?: number }>();
            combinedDailyPnl.forEach(entry => deduped.set(entry.date, entry));
            nextDailyPnl[targetAccount] = Array.from(deduped.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
        uniqueSources.forEach(source => { delete nextDailyPnl[source]; });
        setDailyNetPnl(nextDailyPnl);
        localStorage.setItem('tradedash_daily_pnl', JSON.stringify(nextDailyPnl));

        const nextMappings = { ...accountMappingsState };
        Object.keys(nextMappings).forEach(alias => {
            if (uniqueSources.includes(nextMappings[alias])) {
                nextMappings[alias] = targetAccount;
            }
        });
        setAccountMappings(nextMappings);

        setSelectedAccount(targetAccount);
        return { mergedTrades: combinedTrades.length, mergedSources: uniqueSources.length };
    };

    const clearData = (accountName?: string) => {
        if (accountName) {
            const { [accountName]: _, ...rest } = accounts;
            const { [accountName]: b, ...restB } = accountBalances;
            const { [accountName]: r, ...restR } = accountRules;

            setAccounts(rest);
            setAccountBalances(restB);
            setAccountRules(restR);

            if (selectedAccount === accountName) setSelectedAccount(Object.keys(rest)[0] || '');

            localStorage.setItem('tradedash_accounts', JSON.stringify(rest));
            localStorage.setItem('tradedash_balances', JSON.stringify(restB));
            localStorage.setItem('tradedash_rules', JSON.stringify(restR));
            const { [accountName]: c, ...restC } = accountCommissions;
            setAccountCommissions(restC);
            localStorage.setItem('tradedash_commissions', JSON.stringify(restC));
        } else {
            setAccounts({});
            setAccountBalances({});
            setAccountRules({});
            setAccountCommissions({});
            setSelectedAccount('');
            localStorage.removeItem('tradedash_accounts');
            localStorage.removeItem('tradedash_balances');
            localStorage.removeItem('tradedash_rules');
            localStorage.removeItem('tradedash_commissions');
        }
    };

    return (
        <DataContext.Provider value={{
            accounts,
            accountBalances,
            accountRules,
            accountCommissions,
            accountMappings: accountMappingsState,
            dailyNetPnl,
            selectedAccount,
            setSelectedAccount,
            updateAccountRules,
            setAccountMappings,
            resolveAccountLabel,
            importData,
            importFills,
            importCash,
            importTradovateBundleData,
            mergeAccounts,
            clearData,
            isLoading,
            startingBalance
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within DataProvider');
    return context;
};
