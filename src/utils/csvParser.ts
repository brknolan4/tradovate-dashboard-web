import Papa from 'papaparse';

export interface Trade {
    symbol: string;
    qty: number;
    buyPrice: number;
    sellPrice: number;
    pnl: number; // This will now represent NET PnL (pnl - commissions)
    commissions: number;
    fees: number;
    boughtTimestamp: Date;
    soldTimestamp: Date;
    duration: string;
    durationSeconds: number;
    account?: string;
    buyFillId?: string;
    sellFillId?: string;
}

// Contract specifications for tick value calculations
const CONTRACT_SPECS: Record<string, { tickSize: number; tickValue: number }> = {
    // Micro E-mini NASDAQ-100
    MNQ: { tickSize: 0.25, tickValue: 0.50 },
    // E-mini NASDAQ-100
    NQ:  { tickSize: 0.25, tickValue: 5.00 },
    // Micro E-mini S&P 500
    MES: { tickSize: 0.25, tickValue: 1.25 },
    // E-mini S&P 500
    ES:  { tickSize: 0.25, tickValue: 12.50 },
    // Micro E-mini Dow Jones
    MYM: { tickSize: 1,    tickValue: 0.50 },
    // E-mini Dow Jones
    YM:  { tickSize: 1,    tickValue: 5.00 },
    // Micro E-mini Russell 2000
    M2K: { tickSize: 0.10, tickValue: 0.50 },
    // E-mini Russell 2000
    RTY: { tickSize: 0.10, tickValue: 5.00 },
    // Micro Crude Oil
    MCL: { tickSize: 0.01, tickValue: 1.00 },
    // Crude Oil
    CL:  { tickSize: 0.01, tickValue: 10.00 },
    // Micro Silver
    SIL: { tickSize: 0.005, tickValue: 2.50 },
    // Silver
    SI:  { tickSize: 0.005, tickValue: 25.00 },
    // Micro Gold
    MGC: { tickSize: 0.10, tickValue: 1.00 },
    // Gold
    GC:  { tickSize: 0.10, tickValue: 10.00 },
    // Micro Copper
    MHG: { tickSize: 0.0005, tickValue: 1.25 },
    // Copper
    HG:  { tickSize: 0.0005, tickValue: 12.50 },
    // Natural Gas
    NG:  { tickSize: 0.001, tickValue: 10.00 },
    // Micro Natural Gas
    MNG: { tickSize: 0.001, tickValue: 1.00 },
    // 30-Year Treasury Bond
    ZB:  { tickSize: 0.03125, tickValue: 31.25 },
    // 10-Year Treasury Note
    ZN:  { tickSize: 0.015625, tickValue: 15.625 },
    // 5-Year Treasury Note
    ZF:  { tickSize: 0.0078125, tickValue: 7.8125 },
    // 2-Year Treasury Note
    ZT:  { tickSize: 0.0078125, tickValue: 15.625 },
    // Euro FX
    '6E': { tickSize: 0.00005, tickValue: 6.25 },
    // Japanese Yen
    '6J': { tickSize: 0.0000005, tickValue: 6.25 },
    // British Pound
    '6B': { tickSize: 0.0001, tickValue: 6.25 },
    // Australian Dollar
    '6A': { tickSize: 0.0001, tickValue: 10.00 },
    // Canadian Dollar
    '6C': { tickSize: 0.00005, tickValue: 5.00 },
    // Swiss Franc
    '6S': { tickSize: 0.0001, tickValue: 12.50 },
    // Corn
    ZC:  { tickSize: 0.25, tickValue: 12.50 },
    // Soybeans
    ZS:  { tickSize: 0.25, tickValue: 12.50 },
    // Wheat
    ZW:  { tickSize: 0.25, tickValue: 12.50 },
};

// Helper to get base product from contract symbol (e.g., MNQH6 -> MNQ, "MNQ H25" -> MNQ)
const getBaseProduct = (symbol: string): string => {
    const cleaned = symbol.trim().replace(/\s+/g, '');
    return cleaned.replace(/[A-Z]\d+$/i, '').toUpperCase();
};

// Get tick value for a contract
const getTickValue = (product: string): { tickSize: number; tickValue: number } => {
    const base = getBaseProduct(product);
    return CONTRACT_SPECS[base] || { tickSize: 0.25, tickValue: 5.00 }; // Default to NQ-like
};

export interface FillsResult {
    accountName: string;
    accountAliases?: string[];
    totalCommissions: number;
    fillCount: number;
    trades: Trade[];
    fills: Array<{ id: string; commission: number; qty: number }>;
}

export const normalizeAccountLookupKey = (raw: string) => String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

export const getAccountLookupCandidates = (raw: string): string[] => {
    const value = String(raw || '').trim();
    if (!value) return [];

    const candidates = new Set<string>();
    const cleaned = cleanTradovateAccountName(value);

    [value, cleaned].forEach(candidate => {
        const normalized = normalizeAccountLookupKey(candidate);
        if (normalized) candidates.add(normalized);

        const digitGroups = candidate.match(/\d{3,}/g) || [];
        digitGroups.forEach(group => candidates.add(group));
    });

    return Array.from(candidates);
};

export const cleanTradovateAccountName = (raw: string) => {
    const name = String(raw || '').trim();
    if (!name) return '';

    const upper = name.toUpperCase();

    if (upper.startsWith('PAAPEX')) {
        const suffix = name.match(/(\d{3,})$/)?.[1] || name.slice(-4);
        return `PA Apex ${suffix}`;
    }

    if (upper.startsWith('APEX')) {
        const suffix = name.match(/(\d{2,})$/)?.[1];
        return suffix ? `Apex ${suffix}` : name;
    }

    return name;
};

interface Fill {
    id: string;
    timestamp: Date;
    action: 'Buy' | 'Sell';
    qty: number;
    originalQty: number;
    price: number;
    commission: number;
    contract: string;
    product: string;
}

const normalizeCsvRow = (row: Record<string, any>) => {
    const normalizedRow: Record<string, any> = {};
    Object.keys(row || {}).forEach((k) => {
        const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        normalizedRow[normalizedKey] = row[k];
    });
    return normalizedRow;
};

const parseMoney = (value: any) => parseFloat(String(value ?? '').replace(/[$,]/g, '').trim()) || 0;

const parseFillsTimestamp = (normalizedRow: Record<string, any>) => {
    const candidates = [
        normalizedRow.timestamp,
        normalizedRow._timestamp,
        normalizedRow.tradetimestamp,
        normalizedRow.filledat,
        normalizedRow.time,
        normalizedRow.created,
        normalizedRow.date,
        normalizedRow.tradedate,
    ].filter(Boolean);

    for (const candidate of candidates) {
        const parsed = new Date(candidate);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    return null;
};

const parseFillsAction = (normalizedRow: Record<string, any>): 'Buy' | 'Sell' | null => {
    const rawAction = String(normalizedRow.bs ?? normalizedRow.action ?? normalizedRow.side ?? normalizedRow._action ?? '').trim().toLowerCase();

    if (["sell", "s", "1", "-1", "ask"].includes(rawAction) || rawAction.includes('sell')) return 'Sell';
    if (["buy", "b", "0", "bid"].includes(rawAction) || rawAction.includes('buy')) return 'Buy';

    return null;
};

/**
 * Parses a Tradovate Fills CSV, matches buys/sells into trades, and calculates P&L with commissions.
 */
export const parseFillsCSV = (fileContent: string): FillsResult | null => {
    console.log('[parseFillsCSV] Starting parse...');

    const results = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
    });

    console.log('[parseFillsCSV] Parsed rows:', results.data.length);

    if (results.data.length === 0) {
        console.log('[parseFillsCSV] No data rows found');
        return null;
    }

    const firstRow = results.data[0] as Record<string, any>;
    const firstRowKeys = Object.keys(firstRow);
    console.log('[parseFillsCSV] First row keys:', firstRowKeys);

    const normalizedHeaderKeys = firstRowKeys.map(key => key.toLowerCase().replace(/[^a-z0-9]/g, ''));
    console.log('[parseFillsCSV] Normalized header keys:', normalizedHeaderKeys);
    const looksLikeFillsExport = [
        // _Id -> 'id', FillId -> 'fillid'  (underscore stripped by normalizer)
        normalizedHeaderKeys.includes('fillid') || normalizedHeaderKeys.includes('id'),
        normalizedHeaderKeys.includes('contract') || normalizedHeaderKeys.includes('product'),
        // B/S -> 'bs' after stripping '/'
        normalizedHeaderKeys.includes('bs') || normalizedHeaderKeys.includes('action') || normalizedHeaderKeys.includes('action'),
        normalizedHeaderKeys.includes('quantity') || normalizedHeaderKeys.includes('qty'),
        normalizedHeaderKeys.includes('price'),
    ].filter(Boolean).length >= 4;

    if (!looksLikeFillsExport) {
        console.log('[parseFillsCSV] Header did not match expected Tradovate fills shape');
        return null;
    }

    let rawAccountName = '';
    const accountAliases = new Set<string>();
    let totalCommissions = 0;

    const fills: Fill[] = [];

    for (const row of results.data as Record<string, any>[]) {
        const normalizedRow = normalizeCsvRow(row);
        const qty = parseInt(String(normalizedRow.quantity ?? normalizedRow.qty ?? normalizedRow._qty ?? normalizedRow.amount ?? '0').trim(), 10);
        const price = parseFloat(String(normalizedRow.price ?? normalizedRow.avgprice ?? normalizedRow._price ?? '0').replace(/[$,]/g, '').trim());
        const action = parseFillsAction(normalizedRow);
        const timestamp = parseFillsTimestamp(normalizedRow);
        const contract = String(normalizedRow.contract ?? normalizedRow.symbol ?? normalizedRow.productdescription ?? '').trim();
        const product = String(normalizedRow.product ?? getBaseProduct(contract)).trim();

        const commission = parseMoney(normalizedRow.commission ?? normalizedRow.commissions ?? normalizedRow.comm ?? normalizedRow.fee ?? '0');

        const accountRaw = normalizedRow.account ?? normalizedRow.accountname ?? normalizedRow.accountid ?? normalizedRow._accountid ?? '';
        getAccountLookupCandidates(accountRaw).forEach(alias => accountAliases.add(alias));
        if (!rawAccountName && accountRaw) {
            rawAccountName = cleanTradovateAccountName(String(accountRaw).trim());
        }

        if (!action || !timestamp || Number.isNaN(qty) || qty <= 0 || Number.isNaN(price) || !contract) {
            continue;
        }

        totalCommissions += commission;
        fills.push({
            id: String(normalizedRow.fillid ?? normalizedRow.id ?? normalizedRow._id ?? normalizedRow.orderid ?? normalizedRow._orderid ?? `${timestamp.toISOString()}-${contract}-${qty}-${price}`),
            timestamp,
            action,
            qty,
            originalQty: qty,
            price,
            commission,
            contract,
            product,
        });
    }

    if (fills.length === 0) {
        console.log('[parseFillsCSV] No valid fill rows survived parsing');
        return null;
    }

    fills.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Group fills by contract for matching
    const fillsByContract = new Map<string, Fill[]>();
    fills.forEach(f => {
        const key = f.contract || f.product;
        if (!fillsByContract.has(key)) fillsByContract.set(key, []);
        fillsByContract.get(key)!.push(f);
    });

    // Match fills into trades using FIFO
    const trades: Trade[] = [];

    fillsByContract.forEach((contractFills, contract) => {
        const buyQueue: Fill[] = [];
        const sellQueue: Fill[] = [];

        const product = contractFills[0]?.product || getBaseProduct(contract);
        const { tickSize, tickValue } = getTickValue(product);
        const priceMultiplier = tickValue / tickSize;

        contractFills.forEach(fill => {
            if (fill.action === 'Buy') {
                // Try to match with pending sells (short cover)
                while (fill.qty > 0 && sellQueue.length > 0) {
                    const sellFill = sellQueue[0];
                    const matchQty = Math.min(fill.qty, sellFill.qty);

                    // Short trade: Sold first (sellFill = entry), bought later (fill = cover/exit)
                    const priceDiff = sellFill.price - fill.price; // Positive = profit for short
                    const grossPnl = priceDiff * priceMultiplier * matchQty;
                    const tradeCom = (fill.commission / fill.originalQty) * matchQty + (sellFill.commission / sellFill.originalQty) * matchQty;
                    const netPnl = grossPnl - tradeCom;

                    trades.push({
                        symbol: contract,
                        qty: matchQty,
                        buyPrice: fill.price,
                        sellPrice: sellFill.price,
                        pnl: netPnl,
                        commissions: tradeCom,
                        fees: 0,
                        boughtTimestamp: sellFill.timestamp, // short entry (position opened)
                        soldTimestamp: fill.timestamp,       // cover buy (position closed, P&L realized)
                        duration: '0s',
                        durationSeconds: Math.abs(fill.timestamp.getTime() - sellFill.timestamp.getTime()) / 1000,
                        account: rawAccountName,
                    });

                    fill.qty -= matchQty;
                    sellFill.qty -= matchQty;
                    if (sellFill.qty === 0) sellQueue.shift();
                }

                // Remaining qty goes to buy queue
                if (fill.qty > 0) buyQueue.push({ ...fill });

            } else {
                // Sell - try to match with pending buys (close long)
                while (fill.qty > 0 && buyQueue.length > 0) {
                    const buyFill = buyQueue[0];
                    const matchQty = Math.min(fill.qty, buyFill.qty);

                    // Long trade: Bought first, sold later
                    const priceDiff = fill.price - buyFill.price; // Positive = profit for long
                    const grossPnl = priceDiff * priceMultiplier * matchQty;
                    const tradeCom = (buyFill.commission / buyFill.originalQty) * matchQty + (fill.commission / fill.originalQty) * matchQty;
                    const netPnl = grossPnl - tradeCom;

                    trades.push({
                        symbol: contract,
                        qty: matchQty,
                        buyPrice: buyFill.price,
                        sellPrice: fill.price,
                        pnl: netPnl,
                        commissions: tradeCom,
                        fees: 0,
                        boughtTimestamp: buyFill.timestamp,
                        soldTimestamp: fill.timestamp,
                        duration: '0s',
                        durationSeconds: (fill.timestamp.getTime() - buyFill.timestamp.getTime()) / 1000,
                        account: rawAccountName,
                    });

                    fill.qty -= matchQty;
                    buyFill.qty -= matchQty;
                    if (buyFill.qty === 0) buyQueue.shift();
                }

                // Remaining qty goes to sell queue (short position)
                if (fill.qty > 0) sellQueue.push({ ...fill });
            }
        });
    });

    // Sort trades by exit timestamp
    trades.sort((a, b) => a.soldTimestamp.getTime() - b.soldTimestamp.getTime());

    console.log('[parseFillsCSV] Matched trades:', trades.length);
    console.log('[parseFillsCSV] Total commissions:', totalCommissions);
    console.log('[parseFillsCSV] Sample trade:', trades[0]);

    return {
        accountName: rawAccountName,
        accountAliases: Array.from(accountAliases),
        totalCommissions,
        fillCount: fills.length,
        trades,
        fills: fills.map(f => ({ id: f.id, commission: f.commission, qty: f.originalQty })),
    };
};


export const parsePerformanceCSV = (fileContent: string): { trades: Trade[], accountName?: string, accountAliases?: string[], balanceOverride?: number, dailyPnlHistory?: { date: string; pnl: number }[] } => {
    // Check if this is an "Account Balance History" file
    if (fileContent.includes('Account Name') && fileContent.includes('Total Amount')) {
        const balanceResults = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
        if (balanceResults.data.length > 0) {
            // Get the LAST row for the most recent balance
            const row: any = balanceResults.data[balanceResults.data.length - 1];
            const name = cleanTradovateAccountName(row['Account Name']);
            const accountAliases = new Set<string>();
            for (const r of balanceResults.data as any[]) {
                getAccountLookupCandidates(r['Account Name']).forEach(alias => accountAliases.add(alias));
            }
            const amount = parseFloat(String(row['Total Amount']).replace(/[$,]/g, ''));

            // Extract daily P&L and Balance from all rows (Total Realized PNL column)
            const dailyPnlHistory: { date: string; pnl: number; balance?: number }[] = [];
            for (const r of balanceResults.data as any[]) {
                const rawDate = r['Trade Date'];
                const pnl = parseFloat(String(r['Total Realized PNL'] || '0').replace(/[$,]/g, ''));
                const balance = parseFloat(String(r['Total Amount'] || '0').replace(/[$,]/g, ''));

                if (rawDate && !isNaN(pnl)) {
                    // Normalize MM/DD/YYYY or other formats to YYYY-MM-DD
                    const d = new Date(rawDate);
                    const dateStr = !isNaN(d.getTime()) 
                        ? `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
                        : rawDate;
                    
                    dailyPnlHistory.push({ date: dateStr, pnl, balance: !isNaN(balance) ? balance : undefined });
                }
            }

            console.log(`[parsePerformanceCSV] Balance History detected - Latest balance: $${amount} for ${name}, ${dailyPnlHistory.length} daily records`);
            return { trades: [], accountName: name, accountAliases: Array.from(accountAliases), balanceOverride: amount, dailyPnlHistory };
        }
    }

    const results = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
    });

    let detectedAccountName: string | undefined;
    const accountAliases = new Set<string>();

    const cleanAccountName = (raw: string) => cleanTradovateAccountName(raw);

    const cleanAmount = (amt: any) => {
        if (typeof amt !== 'string') return typeof amt === 'number' ? amt : 0;
        let val = amt.replace(/[$,]/g, '');
        if (val.startsWith('(') && val.endsWith(')')) {
            val = '-' + val.substring(1, val.length - 1);
        }
        return parseFloat(val) || 0;
    };

    const trades = results.data.map((row: any) => {
        // Normalize keys for easier access (case-insensitive, remove all non-alphanumeric)
        const normalizedRow: any = {};
        Object.keys(row).forEach(k => {
            const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            normalizedRow[normalizedKey] = row[k];
        });

        const accountRaw = normalizedRow.account || normalizedRow.accountname || normalizedRow.accountid;
        getAccountLookupCandidates(accountRaw).forEach(alias => accountAliases.add(alias));
        if (accountRaw && !detectedAccountName) {
            detectedAccountName = cleanAccountName(String(accountRaw));
        }

        const netPlRaw = normalizedRow.netpl || normalizedRow.netpnl || normalizedRow.netprofitloss || normalizedRow.net;
        const grossPlRaw = normalizedRow.grosspl || normalizedRow.grosspnl || normalizedRow.grossprofitloss || normalizedRow.pnl || normalizedRow.profitloss || normalizedRow.pl;
        const commsRaw = normalizedRow.commission || normalizedRow.commissions || normalizedRow.comm || normalizedRow.comms || '0';
        const feesRaw = normalizedRow.fees || normalizedRow.fee || normalizedRow.otherfees || normalizedRow.regulatoryfees || '0';

        const commissions = cleanAmount(commsRaw);
        const fees = cleanAmount(feesRaw);

        let netPnl = 0;
        if (netPlRaw !== undefined && netPlRaw !== '') {
            netPnl = cleanAmount(netPlRaw);
        } else {
            netPnl = cleanAmount(grossPlRaw) - commissions - fees;
        }

        // More robust timestamp detection
        const rawEntry = normalizedRow.boughttimestamp || normalizedRow.tradeentrytime || normalizedRow.entrytime || normalizedRow.timestamp || normalizedRow.date;
        const rawExit = normalizedRow.soldtimestamp || normalizedRow.tradeexittime || normalizedRow.exittime || normalizedRow.timestamp || normalizedRow.date;

        const boughtDate = new Date(rawEntry || Date.now());
        const soldDate = new Date(rawExit || Date.now());

        const parseDuration = (dur: any, bought: Date, sold: Date) => {
            if (typeof dur === 'number') return dur;
            if (!dur || dur === '0' || dur === '0s') {
                // Calculation fallback
                const diff = sold.getTime() - bought.getTime();
                return diff > 0 ? Math.floor(diff / 1000) : 0;
            }

            let totalSeconds = 0;
            const durStr = String(dur).toLowerCase();

            // Handle HH:MM:SS format
            if (durStr.includes(':')) {
                const parts = durStr.split(':').map(p => parseInt(p) || 0);
                if (parts.length === 3) { // HH:MM:SS
                    return parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else if (parts.length === 2) { // MM:SS
                    return parts[0] * 60 + parts[1];
                }
            }

            // Handle string format like "1min 7sec" or "25s"
            const mins = durStr.match(/(\d+)\s*m/i);
            const secs = durStr.match(/(\d+)\s*s/i);
            const hrs = durStr.match(/(\d+)\s*h/i);

            if (hrs) totalSeconds += parseInt(hrs[1]) * 3600;
            if (mins) totalSeconds += parseInt(mins[1]) * 60;
            if (secs) totalSeconds += parseInt(secs[1]);

            if (totalSeconds > 0) return totalSeconds;
            if (/^\d+$/.test(durStr)) return parseInt(durStr);

            // Final calculation fallback
            const diff = sold.getTime() - bought.getTime();
            return diff > 0 ? Math.floor(diff / 1000) : 0;
        };

        const symbol = normalizedRow.symbol || normalizedRow.contract || normalizedRow.product;
        const note = (normalizedRow.comment || normalizedRow.description || normalizedRow.type || '').toLowerCase();

        // If no symbol, check if it's a cash transaction/adjustment
        if (!symbol) {
            const isSummary = note.includes('total') || note.includes('summary') || note.includes('average') || note.includes('all trades');

            if (!isSummary && (note.includes('fee') || note.includes('adjustment') || note.includes('cash') || note.includes('credit') || note.includes('rebate') || note.includes('interest') || (netPnl !== 0 && note.length > 3))) {
                // Treat as a "CASH" transaction
                return {
                    symbol: 'CASH',
                    qty: 0,
                    buyPrice: 0,
                    sellPrice: 0,
                    pnl: netPnl,
                    commissions: commissions,
                    fees: fees,
                    boughtTimestamp: boughtDate,
                    soldTimestamp: soldDate,
                    duration: '0s',
                    durationSeconds: 0,
                    account: detectedAccountName
                };
            }
            return null;
        }

        const durRaw = normalizedRow.duration || normalizedRow.dur || normalizedRow.tradeduration || normalizedRow.execduration || normalizedRow.timeinmarket || '0';

        const buyFillId = String(normalizedRow.buyfillid || normalizedRow.buyfillids || '').trim() || undefined;
        const sellFillId = String(normalizedRow.sellfillid || normalizedRow.sellfillids || '').trim() || undefined;

        return {
            symbol: String(symbol),
            qty: parseInt(normalizedRow.qty || normalizedRow.quantity || '0'),
            buyPrice: cleanAmount(normalizedRow.buyprice || normalizedRow.price || '0'),
            sellPrice: cleanAmount(normalizedRow.sellprice || normalizedRow.price || '0'),
            pnl: netPnl,
            commissions: commissions,
            fees: fees,
            boughtTimestamp: boughtDate,
            soldTimestamp: soldDate,
            duration: String(durRaw),
            durationSeconds: parseDuration(durRaw, boughtDate, soldDate),
            account: detectedAccountName,
            buyFillId,
            sellFillId,
        };
    }).filter((t: any) => t !== null && t.symbol !== 'Unknown');

    return { trades: trades as Trade[], accountName: detectedAccountName, accountAliases: Array.from(accountAliases) };
};

export const parseCashCSV = (fileContent: string): { trades: Trade[], accountName?: string, accountAliases?: string[], balanceOverride?: number, dailyPnlHistory?: { date: string; pnl: number }[] } => {
    console.log('[parseCashCSV] Starting parse...');
    const results = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

    if (results.data.length === 0) return { trades: [] };

    let detectedAccountName = '';
    const accountAliases = new Set<string>();
    // Collect (timestamp ms, balance) pairs so we can pick the most-recent one regardless of CSV sort order
    const balanceReadings: { ts: number; balance: number }[] = [];

    // Build daily P&L from all trading-related deltas grouped by the broker's Date column.
    // The broker's Date column already maps to the correct trading session (e.g. Sunday 7 PM → Monday).
    const dailyPnlMap = new Map<string, number>();

    const trades: Trade[] = results.data.map((row: any) => {
        // Normalize
        const normalized: any = {};
        Object.keys(row).forEach(k => normalized[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = row[k]);

        // Detect Account
        const accountRaw = normalized.account || normalized.accountname || '';
        getAccountLookupCandidates(accountRaw).forEach(alias => accountAliases.add(alias));
        if (!detectedAccountName) {
            detectedAccountName = cleanTradovateAccountName(accountRaw);
        }

        const time = normalized.timestamp || normalized.date || normalized.time;
        const type = String(normalized.cashchangetype || normalized.type || normalized.description || 'Cash Adjustment');
        const lowerType = type.toLowerCase();

        // "Delta" is the change amount. "Amount" is the running balance.
        let delta = 0;
        if (normalized.delta !== undefined) {
            delta = parseFloat(String(normalized.delta).replace(/[^0-9.-]/g, '')) || 0;
        } else {
            delta = parseFloat(String(normalized.amount || '0').replace(/[^0-9.-]/g, '')) || 0;
        }

        // Track running balance with timestamp so we can pick the most-recent row regardless of CSV sort order
        if (normalized.amount && normalized.delta) {
            const balance = parseFloat(String(normalized.amount).replace(/[^0-9.-]/g, '')) || 0;
            const ts = time ? new Date(time).getTime() : 0;
            if (balance > 0) balanceReadings.push({ ts, balance });
        }

        // Build daily P&L: include all trading-related rows (trades + all fees)
        // Exclude Fund Transaction (initial deposit) and Withdrawal types
        const isFundingRow = lowerType.includes('fund transaction') || lowerType.includes('withdrawal') || lowerType.includes('deposit');
        if (!isFundingRow && delta !== 0) {
            // Broker's Date column is already session-aware (e.g. 7 PM trades → next calendar day)
            const brokerDate = normalized.date || '';
            const cleanDate = brokerDate.trim();
            if (cleanDate) {
                dailyPnlMap.set(cleanDate, (dailyPnlMap.get(cleanDate) || 0) + delta);
            }
        }

        const fee = parseFloat(String(normalized.fee || '0').replace(/[^0-9.-]/g, '')) || 0;

        // Only keep genuinely unexpected adjustments (rebates, interest, etc.)
        // Filter out: trade-related fees, and funding/deposit/withdrawal rows which would
        // double-count the starting balance that is already captured in effectiveStart.
        const isTradeRelated = lowerType.includes('trade paired') || lowerType.includes('commission') ||
            lowerType.includes('exchange fee') || lowerType.includes('clearing fee') || lowerType.includes('nfa fee');
        const isFundingEntry = lowerType.includes('fund transaction') || lowerType.includes('withdrawal') ||
            lowerType.includes('deposit') || lowerType.includes('funding');

        if (isTradeRelated || isFundingEntry) return null;

        return {
            symbol: 'CASH',
            qty: 0,
            buyPrice: 0,
            sellPrice: 0,
            pnl: delta,
            commissions: 0,
            fees: fee,
            boughtTimestamp: new Date(time || Date.now()),
            soldTimestamp: new Date(time || Date.now()),
            duration: '0s',
            durationSeconds: 0,
            account: detectedAccountName
        };
    }).filter((t: any) => t !== null) as Trade[];

    // Convert daily pnl map to sorted array
    const dailyPnlHistory = Array.from(dailyPnlMap.entries())
        .map(([date, pnl]) => ({ date, pnl }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Pick the most-recent balance reading (handles both ascending and descending CSV sort orders)
    let balanceOverride: number | undefined;
    if (balanceReadings.length > 0) {
        balanceReadings.sort((a, b) => b.ts - a.ts);
        balanceOverride = balanceReadings[0].balance;
    }

    console.log(`[parseCashCSV] Found ${trades.length} cash adjustments. Balance override: ${balanceOverride}. Daily P&L days: ${dailyPnlHistory.length}`);
    return { trades, accountName: detectedAccountName, accountAliases: Array.from(accountAliases), balanceOverride, dailyPnlHistory };
};

export const calculateMetrics = (trades: Trade[]) => {
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalCommissions = trades.reduce((sum, t) => sum + t.commissions, 0);
    const winTrades = trades.filter(t => t.pnl > 0);
    const winRate = trades.length > 0 ? (winTrades.length / trades.length) * 100 : 0;

    const totalGains = winTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = totalLosses === 0 ? totalGains : totalGains / totalLosses;

    const totalDuration = trades.reduce((sum, t) => sum + t.durationSeconds, 0);
    const avgDuration = trades.length > 0 ? totalDuration / trades.length : 0;
    const fastTrades = trades.filter(t => t.durationSeconds < 10).length;
    const standardTrades = trades.length - fastTrades;

    return {
        totalPnL,
        totalCommissions,
        winRate,
        profitFactor,
        totalTrades: trades.length,
        winTrades: winTrades.length,
        lossTrades: trades.length - winTrades.length,
        avgDuration,
        fastTrades,
        standardTrades
    };
};

/**
 * Parses TopstepX "Trades Export" CSV format.
 * Header: Id,ContractName,EnteredAt,ExitedAt,EntryPrice,ExitPrice,Fees,PnL,Size,Type,TradeDay,TradeDuration,Commissions
 */
const parseTopstepTradesCSV = (fileContent: string): { trades: Trade[], accountName: string } | null => {
    console.log('[parseTopstepTradesCSV] Detecting TopstepX Trades Export format...');
    const results = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
    });

    if (results.data.length === 0) return null;

    // Default name since file doesn't have it
    const detectedAccountName = 'TopstepX Account';

    const trades: Trade[] = results.data.map((row: any) => {
        const symbol = row['ContractName'];
        const boughtDate = new Date(row['EnteredAt']);
        const soldDate = new Date(row['ExitedAt']);

        const grossPnl = parseFloat(String(row['PnL']).replace(/[$,]/g, '')) || 0;
        const fees = parseFloat(String(row['Fees']).replace(/[$,]/g, '')) || 0;
        const comms = parseFloat(String(row['Commissions']).replace(/[$,]/g, '')) || 0;

        const netPnl = grossPnl - fees - comms;

        const entryPrice = parseFloat(String(row['EntryPrice']).replace(/[$,]/g, '')) || 0;
        const exitPrice = parseFloat(String(row['ExitPrice']).replace(/[$,]/g, '')) || 0;
        const qty = parseInt(row['Size'] || '0');
        const type = String(row['Type']).toLowerCase();

        let buyPrice = entryPrice;
        let sellPrice = exitPrice;

        if (type !== 'long') { // Short
            buyPrice = exitPrice;
            sellPrice = entryPrice;
        }

        const durationStr = row['TradeDuration'] || '0s';
        const durationSeconds = (soldDate.getTime() - boughtDate.getTime()) / 1000;

        return {
            symbol,
            qty,
            buyPrice,
            sellPrice,
            pnl: netPnl,
            commissions: fees + comms,
            fees: 0,
            boughtTimestamp: boughtDate,
            soldTimestamp: soldDate,
            duration: durationStr,
            durationSeconds,
            account: detectedAccountName
        };
    }).filter((t: any) => t.symbol);

    trades.sort((a, b) => a.soldTimestamp.getTime() - b.soldTimestamp.getTime());

    console.log(`[parseTopstepTradesCSV] Parsed ${trades.length} trades`);
    return { trades, accountName: detectedAccountName };
};
/**
 * Parses TopstepX CSV format.
 * Can handle both "Orders Export" (Fills) and "Trades Export" (Completed Trades).
 */
export const parseTopstepCSV = (fileContent: string): { trades: Trade[], accountName: string } | null => {
    // Detect Format
    if (fileContent.includes('EnteredAt') && fileContent.includes('ExitedAt') && fileContent.includes('PnL')) {
        return parseTopstepTradesCSV(fileContent);
    } else if (fileContent.includes('AccountName') && fileContent.includes('ContractName') && fileContent.includes('ExecutePrice')) {
        return parseTopstepOrdersCSV(fileContent);
    }
    return null;
};

const parseTopstepOrdersCSV = (fileContent: string): { trades: Trade[], accountName: string } | null => {
    if (!fileContent.includes('AccountName') || !fileContent.includes('ContractName') || !fileContent.includes('ExecutePrice')) {
        return null;
    }

    console.log('[parseTopstepOrdersCSV] Detecting TopstepX Orders Export format...');

    const results = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
    });

    if (results.data.length === 0) return null;

    let detectedAccountName = '';
    const fills: Fill[] = [];

    results.data.forEach((row: any) => {
        if (row['Status'] !== 'Filled') return;

        const account = row['AccountName'];
        if (!detectedAccountName && account) detectedAccountName = account;

        const contract = row['ContractName'];
        const side = row['Side'];
        const type = String(side || '').trim().toLowerCase();
        const action: 'Buy' | 'Sell' = type === 'bid' ? 'Buy' : 'Sell';

        const qty = parseInt(row['Size'] || '0');
        const price = parseFloat(row['ExecutePrice'] || '0');
        const timestamp = new Date(row['FilledAt'] || row['CreatedAt']);
        const id = row['Id'];

        fills.push({
            id,
            timestamp,
            action,
            qty,
            originalQty: qty,
            price,
            commission: 0,
            contract,
            product: getBaseProduct(contract)
        });
    });

    fills.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const trades: Trade[] = [];
    const fillsByContract = new Map<string, Fill[]>();

    fills.forEach(f => {
        const key = f.contract;
        if (!fillsByContract.has(key)) fillsByContract.set(key, []);
        fillsByContract.get(key)!.push(f);
    });

    fillsByContract.forEach((contractFills, contract) => {
        const buyQueue: Fill[] = [];
        const sellQueue: Fill[] = [];

        const product = contractFills[0]?.product;
        const { tickSize, tickValue } = getTickValue(product);
        const priceMultiplier = tickValue / tickSize;

        contractFills.forEach(fill => {
            const isMicro = ['MNQ', 'MES', 'M2K', 'MCL', 'MGC', 'SIL', 'MH'].includes(product);
            const estCommPerSide = isMicro ? 0.37 : 2.00;

            if (fill.action === 'Buy') {
                while (fill.qty > 0 && sellQueue.length > 0) {
                    const sellFill = sellQueue[0];
                    const matchQty = Math.min(fill.qty, sellFill.qty);
                    const priceDiff = sellFill.price - fill.price;
                    const grossPnl = priceDiff * priceMultiplier * matchQty;
                    const tradeCom = estCommPerSide * matchQty * 2;
                    const netPnl = grossPnl - tradeCom;

                    trades.push({
                        symbol: contract, qty: matchQty, buyPrice: fill.price, sellPrice: sellFill.price,
                        pnl: netPnl, commissions: tradeCom, fees: 0,
                        boughtTimestamp: fill.timestamp, soldTimestamp: sellFill.timestamp,
                        duration: '0s', durationSeconds: (fill.timestamp.getTime() - sellFill.timestamp.getTime()) / 1000,
                        account: detectedAccountName,
                    });
                    fill.qty -= matchQty;
                    sellFill.qty -= matchQty;
                    if (sellFill.qty === 0) sellQueue.shift();
                }
                if (fill.qty > 0) buyQueue.push({ ...fill });
            } else {
                while (fill.qty > 0 && buyQueue.length > 0) {
                    const buyFill = buyQueue[0];
                    const matchQty = Math.min(fill.qty, buyFill.qty);
                    const priceDiff = fill.price - buyFill.price;
                    const grossPnl = priceDiff * priceMultiplier * matchQty;
                    const tradeCom = estCommPerSide * matchQty * 2;
                    const netPnl = grossPnl - tradeCom;

                    trades.push({
                        symbol: contract, qty: matchQty, buyPrice: buyFill.price, sellPrice: fill.price,
                        pnl: netPnl, commissions: tradeCom, fees: 0,
                        boughtTimestamp: buyFill.timestamp, soldTimestamp: fill.timestamp,
                        duration: '0s', durationSeconds: (fill.timestamp.getTime() - buyFill.timestamp.getTime()) / 1000,
                        account: detectedAccountName,
                    });
                    fill.qty -= matchQty;
                    buyFill.qty -= matchQty;
                    if (buyFill.qty === 0) buyQueue.shift();
                }
                if (fill.qty > 0) sellQueue.push({ ...fill });
            }
        });
    });

    trades.sort((a, b) => a.soldTimestamp.getTime() - b.soldTimestamp.getTime());
    console.log(`[parseTopstepOrdersCSV] Parsed ${trades.length} trades for ${detectedAccountName}`);

    return { trades, accountName: detectedAccountName };
};
