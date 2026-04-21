import { RefreshCw } from 'lucide-react';
import { useSync } from '../context/SyncContext';

interface SyncNowButtonProps {
  accountHint?: string;
  source?: 'dashboard' | 'calendar' | 'manual';
  onClick?: () => void;
}

const SyncNowButton: React.FC<SyncNowButtonProps> = ({ accountHint, source = 'manual', onClick }) => {
  const { syncStatus, syncNow } = useSync();
  const isRunning = syncStatus.phase === 'running';
  const helperUnavailable = syncStatus.helper?.connectionState === 'unavailable';

  return (
    <button
      onClick={() => {
        if (onClick) {
          onClick();
          return;
        }
        void syncNow({ accountHint, source });
      }}
      disabled={isRunning}
      className="inline-flex items-center justify-center gap-3 px-5 py-3.5 bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed rounded-2xl transition-all text-sm font-black shadow-[0_18px_45px_rgba(34,211,238,0.28)] border border-cyan-300/60 min-w-[240px]"
      title={helperUnavailable ? 'Local helper is offline. Click for the expected endpoint details in the sync card.' : 'Request a local Tradovate sync'}
    >
      <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
      {isRunning ? 'Sync Requested' : helperUnavailable ? 'Start One-Click Sync (Helper Offline)' : 'Start One-Click Sync'}
    </button>
  );
};

export default SyncNowButton;
