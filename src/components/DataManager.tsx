import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Users, GitMerge, ChevronDown, CheckCircle2, XCircle, Trash2, FileDown } from 'lucide-react';
import SyncNowButton from './SyncNowButton';
import { useData } from '../context/DataContext';
import { useSync } from '../context/SyncContext';
import { fetchLatestSyncBundle } from '../services/syncService';
import { parsePerformanceCSV, parseFillsCSV, parseCashCSV, cleanTradovateAccountName, getAccountLookupCandidates } from '../utils/csvParser';

type TradovateBundleClassification = {
  fillsFiles: File[];
  performanceFiles: File[];
  cashFiles: File[];
  unknownFiles: File[];
};

type TradovateBundleInput = {
  bundleLabel?: string;
  fillsName: string;
  fillsText: string;
  performanceText: string;
  cashText?: string | null;
  unknownNames?: string[];
};

type ImportResult = {
  ok: boolean;
  lines: string[];
};

const DataManager = () => {
  const { importTradovateBundleData, importCash, mergeAccounts, clearData, accounts, accountCommissions, accountMappings, setAccountMappings, resolveAccountLabel, selectedAccount, setSelectedAccount } = useData();
  const { syncNow, refreshStatus } = useSync();
  const [isDragging, setIsDragging] = useState(false);
  const [mappingDraft, setMappingDraft] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');
  const [mergeSources, setMergeSources] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Account naming modal state
  const [accountModal, setAccountModal] = useState<{
    open: boolean;
    suggestedName: string;
    resolve: ((name: string | null) => void) | null;
  }>({ open: false, suggestedName: '', resolve: null });
  const [accountNameInput, setAccountNameInput] = useState('');

  const tradovatePairInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const lines = Object.entries(accountMappings)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([alias, label]) => `${alias}=${label}`);
    setMappingDraft(lines.join('\n'));
  }, [accountMappings]);

  const readFileText = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') resolve(text);
      else reject(new Error('Failed to read file as text'));
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsText(file);
  });

  const getExistingAccountCaseInsensitive = (name: string) => {
    const cleaned = cleanTradovateAccountName(name || '');
    if (!cleaned) return null;
    return Object.keys(accounts).find(acc => acc.toLowerCase() === cleaned.toLowerCase()) || null;
  };

  // Opens a modal to ask the user for an account name; resolves with the entered name or null
  const promptAccountName = (suggestedName: string): Promise<string | null> => {
    setAccountNameInput(suggestedName);
    return new Promise((resolve) => {
      setAccountModal({ open: true, suggestedName, resolve });
    });
  };

  const confirmAccountName = (name: string | null) => {
    accountModal.resolve?.(name?.trim() || null);
    setAccountModal({ open: false, suggestedName: '', resolve: null });
  };

  const chooseTargetAccount = async (defaultName: string, aliases: string[] = []): Promise<string | null> => {
    const cleanedDefault = cleanTradovateAccountName(defaultName || selectedAccount || 'New Account');
    const mappedDefault = resolveAccountLabel(cleanedDefault, aliases, cleanedDefault);
    const exactExisting = getExistingAccountCaseInsensitive(mappedDefault);
    if (exactExisting) return exactExisting;

    const cleanedSelected = cleanTradovateAccountName(selectedAccount || '');
    if (cleanedSelected && cleanedSelected.toLowerCase() === mappedDefault.toLowerCase()) {
      return selectedAccount;
    }

    const hasSavedAliasMapping = aliases.some(alias => {
      const key = String(alias || '').trim().toUpperCase();
      return key && accountMappings[key] === mappedDefault;
    });

    if (hasSavedAliasMapping || !cleanedSelected || Object.keys(accounts).length === 0) {
      return mappedDefault || 'New Account';
    }

    // Unknown account — ask user via modal
    return promptAccountName(mappedDefault);
  };

  const saveAccountMapping = (aliases: string[], label: string) => {
    const cleanedLabel = String(label || '').trim();
    if (!cleanedLabel) return;
    const nextMappings = { ...accountMappings };
    aliases.forEach(alias => {
      const key = String(alias || '').trim().toUpperCase();
      if (key) nextMappings[key] = cleanedLabel;
    });
    setAccountMappings(nextMappings);
  };

  const handleSaveMappingConfig = () => {
    try {
      const nextMappings: Record<string, string> = {};
      mappingDraft.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) throw new Error(`Missing '=' in line: ${trimmed}`);
        const alias = trimmed.slice(0, separatorIndex).trim().toUpperCase();
        const label = trimmed.slice(separatorIndex + 1).trim();
        if (!alias || !label) throw new Error(`Invalid mapping line: ${trimmed}`);
        nextMappings[alias] = label;
      });
      setAccountMappings(nextMappings);
      setImportResult({ ok: true, lines: [`Saved ${Object.keys(nextMappings).length} account mapping(s).`] });
    } catch (error) {
      setImportResult({ ok: false, lines: [error instanceof Error ? error.message : 'Failed to save account mappings.'] });
    }
  };

  const classifyTradovateBundle = (files: FileList | File[]): TradovateBundleClassification => {
    const fileArray = Array.from(files);
    const classification: TradovateBundleClassification = { fillsFiles: [], performanceFiles: [], cashFiles: [], unknownFiles: [] };
    fileArray.forEach((file) => {
      const lower = file.name.toLowerCase();
      if (lower.includes('fills')) classification.fillsFiles.push(file);
      else if (lower.includes('performance')) classification.performanceFiles.push(file);
      else if (lower.includes('cash')) classification.cashFiles.push(file);
      else classification.unknownFiles.push(file);
    });
    return classification;
  };

  const importTradovateBundle = async ({ bundleLabel, fillsName, fillsText, performanceText, cashText, unknownNames = [] }: TradovateBundleInput): Promise<boolean> => {
    const fillsPreview = parseFillsCSV(fillsText);
    const performancePreview = parsePerformanceCSV(performanceText);
    const cashPreview = cashText ? parseCashCSV(cashText) : null;

    if (!fillsPreview) {
      setImportResult({ ok: false, lines: [`Could not parse ${fillsName} as a Tradovate Fills export.`] });
      return false;
    }

    const fillsDetected = cleanTradovateAccountName(fillsPreview.accountName || '');
    const perfDetected = cleanTradovateAccountName(performancePreview.accountName || '');
    const cashDetected = cleanTradovateAccountName(cashPreview?.accountName || '');
    const aliasCandidates = Array.from(new Set([
      ...getAccountLookupCandidates(fillsPreview.accountName || ''),
      ...(fillsPreview.accountAliases || []),
      ...getAccountLookupCandidates(performancePreview.accountName || ''),
      ...(performancePreview.accountAliases || []),
      ...getAccountLookupCandidates(cashPreview?.accountName || ''),
      ...(cashPreview?.accountAliases || []),
    ]));

    const detectedAccounts = [fillsDetected, perfDetected, cashDetected].filter(Boolean);
    const uniqueDetectedAccounts = Array.from(new Set(detectedAccounts.map(name => name.toLowerCase())));
    const primaryDetectedAccount = fillsDetected || perfDetected || cashDetected || selectedAccount || 'New Account';

    if (uniqueDetectedAccounts.length > 1) {
      setImportResult({
        ok: false,
        lines: [
          'Files appear to belong to different accounts — import stopped.',
          `Fills: ${fillsDetected || 'not detected'}`,
          `Performance: ${perfDetected || 'not detected'}`,
          ...(cashText ? [`Cash: ${cashDetected || 'not detected'}`] : []),
        ],
      });
      return false;
    }

    const targetAccount = await chooseTargetAccount(primaryDetectedAccount, aliasCandidates);
    if (!targetAccount) return false;

    saveAccountMapping(aliasCandidates, targetAccount);

    const bundleResult = importTradovateBundleData({ fillsText, performanceText, cashText, targetAccount });

    const lines = [
      `Import complete for "${targetAccount}"${bundleLabel ? ` [${bundleLabel}]` : ''}.`,
      `Matched trades: ${bundleResult?.trades || 0}`,
      `Fills processed: ${bundleResult?.fills || 0}`,
      `Commissions: $${bundleResult ? bundleResult.commissions.toFixed(2) : '0.00'}`,
      ...(bundleResult?.balanceOverride !== undefined ? [`Balance: $${bundleResult.balanceOverride.toLocaleString()}`] : []),
      ...(unknownNames.length > 0 ? [`Ignored: ${unknownNames.join(', ')}`] : []),
    ];
    setImportResult({ ok: true, lines });
    return true;
  };

  const processTradovatePair = async (files: FileList | File[]) => {
    const { fillsFiles, performanceFiles, cashFiles, unknownFiles } = classifyTradovateBundle(files);

    // Cash-only drop: enrich an existing account without re-importing trades
    if (fillsFiles.length === 0 && performanceFiles.length === 0 && cashFiles.length > 0) {
      try {
        const fileEntries = await Promise.all(cashFiles.map(async (file) => ({ file, text: await readFileText(file) })));
        for (const { file, text } of fileEntries) {
          const result = importCash(text, selectedAccount || undefined);
          if (!result) {
            setImportResult({ ok: false, lines: [`Could not parse ${file.name} as a Tradovate Cash export.`] });
            return;
          }
          setImportResult({
            ok: true,
            lines: [
              `Cash import complete for "${result.account}".`,
              `Cash adjustments: $${result.adjustments.toFixed(2)}`,
              ...(result.balanceOverride !== undefined ? [`Balance set to: $${result.balanceOverride.toLocaleString()}`] : []),
            ],
          });
        }
      } catch (error) {
        setImportResult({ ok: false, lines: ['Cash import failed. Check the browser console for details.'] });
      }
      return;
    }

    if (fillsFiles.length === 0 || performanceFiles.length === 0) {
      setImportResult({
        ok: false,
        lines: ['Please include both Fills.csv and Performance.csv.', 'Tip: name your files so they contain "fills" and "performance".'],
      });
      return;
    }

    try {
      const fileEntries = await Promise.all(Array.from(files).map(async (file) => ({ file, text: await readFileText(file) })));
      const entryMap = new Map(fileEntries.map(entry => [entry.file, entry.text]));
      const performancePool = [...performanceFiles];
      const cashPool = [...cashFiles];
      const bundleCount = fillsFiles.length;

      for (let index = 0; index < fillsFiles.length; index += 1) {
        const fillsFile = fillsFiles[index];
        const fillsText = entryMap.get(fillsFile) || '';
        const fillsPreview = parseFillsCSV(fillsText);
        if (!fillsPreview) {
          setImportResult({ ok: false, lines: [`Could not parse ${fillsFile.name} as a Tradovate Fills export.`] });
          return;
        }

        const fillsAliases = new Set([
          ...getAccountLookupCandidates(fillsPreview.accountName || ''),
          ...(fillsPreview.accountAliases || []),
        ]);

        const performanceIndex = performancePool.findIndex((file) => {
          const preview = parsePerformanceCSV(entryMap.get(file) || '');
          const perfAliases = new Set([
            ...getAccountLookupCandidates(preview.accountName || ''),
            ...(preview.accountAliases || []),
          ]);
          return Array.from(fillsAliases).some(alias => perfAliases.has(alias));
        });

        const matchedPerformance = performanceIndex >= 0
          ? performancePool.splice(performanceIndex, 1)[0]
          : (performancePool.length === 1 ? performancePool.shift()! : null);

        if (!matchedPerformance) {
          setImportResult({ ok: false, lines: [`Could not find a matching Performance.csv for ${fillsFile.name}.`] });
          return;
        }

        const cashIndex = cashPool.findIndex((file) => {
          const preview = parseCashCSV(entryMap.get(file) || '');
          const cashAliases = new Set([
            ...getAccountLookupCandidates(preview.accountName || ''),
            ...(preview.accountAliases || []),
          ]);
          return Array.from(fillsAliases).some(alias => cashAliases.has(alias));
        });
        const matchedCash = cashIndex >= 0 ? cashPool.splice(cashIndex, 1)[0] : null;

        await importTradovateBundle({
          bundleLabel: bundleCount > 1 ? `bundle ${index + 1} of ${bundleCount}` : undefined,
          fillsName: fillsFile.name,
          fillsText,
          performanceText: entryMap.get(matchedPerformance) || '',
          cashText: matchedCash ? entryMap.get(matchedCash) || null : null,
          unknownNames: index === 0 ? unknownFiles.map(f => f.name) : [],
        });
      }
    } catch (error) {
      console.error('Failed to import Tradovate pair', error);
      setImportResult({ ok: false, lines: ['Import failed. Check the browser console for details.'] });
    }
  };

  const handleSyncImport = async () => {
    const result = await syncNow({ accountHint: selectedAccount || undefined, source: 'manual' });
    if (!result.accepted) return;
    try {
      const bundle = await fetchLatestSyncBundle();
      if (!bundle || bundle.length === 0) {
        await refreshStatus();
        setImportResult({ ok: false, lines: ['Sync ran, but no staged bundle was available yet.'] });
        return;
      }
      const fillsEntry = bundle.find(file => file.kind === 'fills' || file.name.toLowerCase().includes('fills'));
      const performanceEntry = bundle.find(file => file.kind === 'performance' || file.name.toLowerCase().includes('performance'));
      const cashEntry = bundle.find(file => file.kind === 'cash' || file.name.toLowerCase().includes('cash'));
      const unknownNames = bundle.filter(file => !['fills', 'performance', 'cash'].includes(file.kind)).map(file => file.name);
      if (!fillsEntry || !performanceEntry) {
        await refreshStatus();
        setImportResult({ ok: false, lines: ['Staged bundle is missing Fills.csv or Performance.csv.'] });
        return;
      }
      await importTradovateBundle({
        fillsName: fillsEntry.name,
        fillsText: fillsEntry.content,
        performanceText: performanceEntry.content,
        cashText: cashEntry?.content,
        unknownNames,
      });
      await refreshStatus();
    } catch (error) {
      console.error('Failed to consume staged sync bundle', error);
      setImportResult({ ok: false, lines: ['Sync succeeded but import failed. Check the browser console.'] });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    void processTradovatePair(files);
  };

  const handleClearAll = (accountName?: string) => {
    const target = accountName || selectedAccount;
    if (!target) return;
    if (confirm(`Delete all data for "${target}"?\n\nThis clears all trades, commissions, and balance data so you can re-import fresh.`)) {
      clearData(target);
      setImportResult(null);
    }
  };

  const accountList = Object.keys(accounts);

  useEffect(() => {
    if (!mergeTarget && accountList.length > 0) setMergeTarget(selectedAccount || accountList[0]);
  }, [accountList, mergeTarget, selectedAccount]);

  useEffect(() => {
    setMergeSources(prev => prev.filter(source => source !== mergeTarget));
  }, [mergeTarget]);

  const mergeCandidates = useMemo(() => accountList.filter(account => account !== mergeTarget), [accountList, mergeTarget]);

  const toggleMergeSource = (account: string) => {
    setMergeSources(prev => prev.includes(account) ? prev.filter(item => item !== account) : [...prev, account]);
  };

  const handleMergeAccounts = () => {
    if (!mergeTarget || mergeSources.length === 0) {
      setImportResult({ ok: false, lines: ['Choose a target account and at least one source account to merge.'] });
      return;
    }
    if (!confirm(`Merge ${mergeSources.join(', ')} into ${mergeTarget}?\n\nThis keeps the target and removes the source buckets.`)) return;
    const result = mergeAccounts(mergeSources, mergeTarget);
    setMergeSources([]);
    setImportResult({
      ok: true,
      lines: [`Merged ${result.mergedSources} bucket(s) into "${mergeTarget}". Total trades: ${result.mergedTrades}`],
    });
  };

  return (
    <>
      {/* Account naming modal */}
      {accountModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-[#0f1923] p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="text-white font-bold text-lg mb-1">Name this account</div>
            <div className="text-sm text-slate-400 mb-4">
              New prop account detected. Give it a label to track it on your dashboard.
            </div>
            <input
              autoFocus
              value={accountNameInput}
              onChange={(e) => setAccountNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmAccountName(accountNameInput);
                if (e.key === 'Escape') confirmAccountName(null);
              }}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl text-sm text-white px-3 py-2.5 mb-3 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="e.g. Apex 50k PA"
            />
            {accountList.length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] text-slate-500 mb-1.5">Or merge into an existing account</div>
                <select
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) setAccountNameInput(e.target.value); }}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl text-sm text-white px-3 py-2 cursor-pointer"
                >
                  <option value="">— select existing account —</option>
                  {accountList.map(acc => (
                    <option key={acc} value={acc} className="bg-[#0f1923]">{acc}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => confirmAccountName(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-slate-400 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmAccountName(accountNameInput)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-all"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`rounded-[28px] border transition-all ${isDragging ? 'border-cyan-500/40 bg-cyan-500/5 shadow-2xl shadow-cyan-500/10 scale-[1.01]' : 'border-white/10 bg-white/[0.03]'} p-5 md:p-6`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col gap-5 md:gap-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-white text-base font-black">Import & Sync</h2>
              <p className="text-slate-500 text-[11px] mt-0.5">Drop your Tradovate CSV exports to load your trading data.</p>
            </div>
            <div className="flex items-center gap-2">
              {accountList.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-white border-none focus:ring-0 cursor-pointer"
                  >
                    {accountList.map(acc => (
                      <option key={acc} value={acc} className="bg-[#1b2432]">{acc}</option>
                    ))}
                  </select>
                </div>
              )}
              <SyncNowButton accountHint={selectedAccount || undefined} source="manual" onClick={() => { void handleSyncImport(); }} />
            </div>
          </div>

          {/* How to export from Tradovate */}
          <details className="group rounded-2xl border border-white/10 bg-slate-950/35 overflow-hidden">
            <summary className="list-none cursor-pointer px-4 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <FileDown className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">How to export from Tradovate</div>
                  <div className="text-[11px] text-slate-400">Step-by-step guide to download your CSV files</div>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180 shrink-0" />
            </summary>

            <div className="px-5 pb-5 pt-4 border-t border-white/6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Export 2–3 files from Tradovate and drop them below. Use the <span className="text-white font-semibold">same date range</span> across all files — set it to your full evaluation period start date through today.
              </p>

              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-black mt-0.5">1</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm mb-0.5">Log in to Tradovate</div>
                  <p className="text-slate-400 text-xs leading-relaxed">Go to <span className="text-slate-300">app.tradovate.com</span> and sign in. If you have multiple accounts, confirm you're viewing the correct one before exporting.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-black mt-0.5">2</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-semibold text-sm">Download Performance.csv</span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/25">Required</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Click <span className="text-slate-300">Account → Performance</span> in the top navigation. Set the <span className="text-slate-300">From</span> date to your eval start date and <span className="text-slate-300">To</span> to today. Click <span className="text-slate-300">Export CSV</span>. The file will be named like <span className="text-slate-200 font-mono">Performance-2025-01-15.csv</span>. This file contains daily P&amp;L, win rate, and qualifying day data.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-black mt-0.5">3</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-semibold text-sm">Download Fills.csv</span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/25">Required</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Click <span className="text-slate-300">Account → Fills</span>. Set the <span className="text-slate-300">same date range</span>. Click <span className="text-slate-300">Export CSV</span>. The file will be named like <span className="text-slate-200 font-mono">Fills-2025-01-15.csv</span>. This file contains every individual trade execution, including entry/exit prices, size, duration, and commission.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black mt-0.5">4</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-semibold text-sm">Download Cash.csv</span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/25">Optional</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Click <span className="text-slate-300">Account → Cash</span>. Same date range. Export CSV. This file captures balance adjustments, platform fees, and payouts — it gives the dashboard a more accurate real-time account balance. Skip this if you don't need precise balance tracking.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-black mt-0.5">5</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm mb-0.5">Drop all files below</div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Drag your exported files onto the drop zone or click to select them. You can drop all 2–3 files at once — the dashboard automatically matches them by account name. If you have files for multiple accounts, drop each set separately.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/8 p-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-1">Tip</div>
                <p className="text-slate-400 text-xs leading-relaxed">File names must contain <span className="text-slate-300">"fills"</span>, <span className="text-slate-300">"performance"</span>, or <span className="text-slate-300">"cash"</span> for auto-detection. Tradovate's default export names already match this pattern — don't rename the files unless needed.</p>
              </div>
            </div>
          </details>

          {/* Step 1: Drop zone */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-black flex items-center justify-center">1</span>
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Drop or select files</span>
            </div>
            <button
              onClick={() => tradovatePairInputRef.current?.click()}
              className="group relative w-full rounded-2xl border-2 border-dashed border-cyan-500/25 bg-cyan-500/4 hover:bg-cyan-500/8 hover:border-cyan-500/45 transition-all px-6 py-7 flex flex-col items-center gap-2.5 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/18 border border-cyan-500/20 flex items-center justify-center transition-all">
                <Upload className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-center">
                <div className="text-white font-bold">Select Tradovate CSV files</div>
                <div className="text-sm text-slate-400 mt-0.5">
                  <span className="text-white font-semibold">Fills.csv</span> + <span className="text-white font-semibold">Performance.csv</span>
                  <span className="text-slate-500"> · Cash.csv optional</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">or drag & drop anywhere on this panel</div>
            </button>
          </div>

          {/* Step 2: Confirm account — shown after import result */}
          {importResult && (
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-2">Result</div>

                <div className={`rounded-2xl border px-4 py-3.5 flex items-start gap-3 ${importResult.ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  {importResult.ok
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    {importResult.lines.map((line, i) => (
                      <div key={i} className={`text-sm ${i === 0 ? (importResult.ok ? 'text-emerald-300 font-semibold' : 'text-red-300 font-semibold') : 'text-slate-400'}`}>{line}</div>
                    ))}
                  </div>
                  <button onClick={() => setImportResult(null)} className="text-slate-500 hover:text-slate-300 text-xs shrink-0">✕</button>
                </div>
              </div>
            </div>
          )}

          {/* Loaded Accounts Panel */}
          {accountList.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Loaded Data — click trash to delete &amp; reimport
              </div>
              <div className="flex flex-col gap-2">
                {accountList.map(acc => {
                  const accTrades = accounts[acc] || [];
                  const tradingCount = accTrades.filter(t => t.symbol !== 'CASH').length;
                  const comm = accountCommissions[acc] || 0;
                  const netPnl = accTrades.filter(t => t.symbol !== 'CASH').reduce((s, t) => s + t.pnl, 0)
                    + accTrades.filter(t => t.symbol === 'CASH').reduce((s, t) => s + t.pnl, 0);
                  const isSelected = acc === selectedAccount;
                  return (
                    <div
                      key={acc}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all ${
                        isSelected ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-white/8 bg-white/[0.02]'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{acc}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                          <span>{tradingCount} trades</span>
                          {comm > 0 && <span className="text-amber-400/80">${comm.toFixed(0)} comms</span>}
                          <span className={netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {netPnl >= 0 ? '+' : ''}${netPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} net
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleClearAll(acc)}
                        title={`Delete ${acc} data`}
                        className="p-2 rounded-lg border border-red-500/20 bg-red-500/8 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Advanced settings */}
          <details className="group rounded-2xl border border-white/10 bg-slate-950/35 overflow-hidden">
            <summary className="list-none cursor-pointer px-4 py-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-white font-semibold">Advanced Settings</div>
                <div className="text-sm text-slate-400">Account alias mappings &amp; merges.</div>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>

            <div className="px-4 pb-4 grid grid-cols-1 xl:grid-cols-2 gap-4 border-t border-white/6">
              {/* Mapping config */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="text-sm font-bold text-white">Account Mapping Config</div>
                    <div className="text-[11px] text-slate-400">Format: <code>ALIAS=Dashboard Label</code></div>
                  </div>
                  <button onClick={handleSaveMappingConfig} className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg transition-all text-xs font-bold border border-indigo-600/20">
                    Save Mappings
                  </button>
                </div>
                <textarea
                  value={mappingDraft}
                  onChange={(e) => setMappingDraft(e.target.value)}
                  spellCheck={false}
                  className="w-full min-h-[120px] rounded-xl bg-slate-950/70 border border-white/10 text-xs text-slate-200 p-3 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder={["PAAPEX1234=Main PA", "1234=Main PA", "APEX5678=Eval 1"].join('\n')}
                />
              </div>

              {/* Merge accounts */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="text-sm font-bold text-white">Merge Duplicate Accounts</div>
                    <div className="text-[11px] text-slate-400">Consolidate split account buckets into one label.</div>
                  </div>
                  <button onClick={handleMergeAccounts} className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-lg transition-all text-xs font-bold border border-emerald-600/20">
                    <span className="inline-flex items-center gap-1"><GitMerge className="w-3.5 h-3.5" /> Merge Selected</span>
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wide text-slate-500 mb-1">Keep this target account</label>
                    <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} className="w-full bg-slate-950/70 border border-white/10 rounded-xl text-sm text-white px-3 py-2">
                      {accountList.map(acc => (
                        <option key={acc} value={acc} className="bg-[#1b2432]">{acc}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Merge these into target</div>
                    <div className="max-h-36 overflow-auto rounded-xl border border-white/10 bg-slate-950/50 p-2 space-y-2">
                      {mergeCandidates.length === 0 ? (
                        <div className="text-xs text-slate-500">No other accounts available to merge.</div>
                      ) : mergeCandidates.map(acc => (
                        <label key={acc} className="flex items-center gap-2 text-sm text-slate-200 rounded-lg px-2 py-1 hover:bg-white/[0.03] cursor-pointer">
                          <input type="checkbox" checked={mergeSources.includes(acc)} onChange={() => toggleMergeSource(acc)} />
                          <span>{acc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Hidden file input — accepts Fills + Performance + optional Cash */}
        <input
          type="file"
          ref={tradovatePairInputRef}
          onChange={(e) => { const files = e.target.files; if (files && files.length > 0) void processTradovatePair(files); e.target.value = ''; }}
          accept=".csv"
          multiple
          className="hidden"
        />
      </div>
    </>
  );
};

export default DataManager;
