import { useState } from 'react';
import { CheckCircle2, Clock3, AlertTriangle, Link2, RefreshCw, WifiOff, ChevronDown } from 'lucide-react';
import { useSync } from '../context/SyncContext';

const statusTone = {
  idle: 'text-slate-400 border-white/10 bg-white/5',
  running: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
  success: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  error: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
} as const;

const iconMap = {
  idle: Clock3,
  running: Link2,
  success: CheckCircle2,
  error: AlertTriangle,
} as const;

const connectionTone = {
  unknown: 'text-slate-400 border-white/10 bg-white/5',
  checking: 'text-amber-300 border-amber-500/20 bg-amber-500/10',
  connected: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  unavailable: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
} as const;

const SyncStatusCard: React.FC = () => {
  const { syncStatus, refreshStatus } = useSync();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const Icon = iconMap[syncStatus.phase];
  const helperState = syncStatus.helper?.connectionState || 'unknown';
  const helperBaseUrl = syncStatus.helper?.baseUrl || 'http://127.0.0.1:43128';

  return (
    <div className="glass p-5 flex flex-col gap-4 min-w-[280px]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">Tradovate Sync</div>
          <div className="text-[10px] text-slate-500 font-medium tracking-wide">Helper status for the one-click Downloads → dashboard import path</div>
        </div>
        <div className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${statusTone[syncStatus.phase]}`}>
          <Icon className="w-3.5 h-3.5" />
          {syncStatus.phase}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-white font-semibold">{syncStatus.message}</div>
        <button
          onClick={() => void refreshStatus()}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-white/10"
          title="Refresh helper status"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-800/30 rounded-xl p-3 border border-white/5">
          <div className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Last Run</div>
          <div className="text-white font-bold">{syncStatus.lastRunAt ? new Date(syncStatus.lastRunAt).toLocaleString() : 'Never'}</div>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-3 border border-white/5">
          <div className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Last Success</div>
          <div className="text-white font-bold">{syncStatus.lastSuccessAt ? new Date(syncStatus.lastSuccessAt).toLocaleString() : 'Not yet'}</div>
        </div>
      </div>

      <div className={`rounded-xl border px-3 py-3 text-xs ${connectionTone[helperState]}`}>
        <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[10px] mb-2">
          {helperState === 'unavailable' ? <WifiOff className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
          Helper Connection: {helperState}
        </div>
        <div className="text-white/90 font-medium">{helperState === 'connected' ? 'Helper is responding and ready for sync.' : helperState === 'checking' ? 'Checking helper availability…' : helperState === 'unavailable' ? 'Helper is offline or unreachable.' : 'Helper status has not been checked yet.'}</div>
        {syncStatus.helper?.lastCheckedAt ? (
          <div className="text-[10px] text-slate-400 mt-2">Last checked {new Date(syncStatus.helper.lastCheckedAt).toLocaleString()}</div>
        ) : null}
      </div>

      <div className="rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails((value) => !value)}
          className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left"
        >
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-black">Technical details</div>
            <div className="text-xs text-slate-300 mt-1">Show helper URL, contract, and sync strategy.</div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} />
        </button>

        {showTechnicalDetails && (
          <div className="px-3 pb-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-t border-white/8">
            <div className="bg-slate-800/30 rounded-xl p-3 border border-white/5 mt-3">
              <div className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Session Strategy</div>
              <div className="text-cyan-400 font-bold">Persistent browser first</div>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-3 border border-white/5 mt-3">
              <div className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Credential Mode</div>
              <div className="text-white font-bold">{syncStatus.credentialMode.replace('-', ' ')}</div>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-3 border border-white/5 md:col-span-2">
              <div className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Helper Base URL</div>
              <div className="text-white/90 font-medium break-all">{helperBaseUrl}</div>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-3 border border-white/5 md:col-span-2">
              <div className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Expected contract</div>
              <div className="text-[11px] text-slate-300">GET /api/tradovate-sync/status, GET /api/tradovate-sync/bundle/latest, POST /api/tradovate-sync/sync</div>
            </div>
          </div>
        )}
      </div>

      {syncStatus.summary?.notes?.length ? (
        <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
          {syncStatus.summary.notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      ) : null}
    </div>
  );
};

export default SyncStatusCard;
