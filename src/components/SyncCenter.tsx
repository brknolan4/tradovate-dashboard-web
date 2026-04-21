import { FolderSync, Link2 } from 'lucide-react';
import DataManager from './DataManager';
import SyncStatusCard from './SyncStatusCard';

const SyncCenter = () => {
  return (
    <div className="flex-1 overflow-auto px-4 py-6 md:px-8 md:py-8 xl:px-10 xl:py-10 space-y-8 md:space-y-10 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.08),transparent_30%),linear-gradient(180deg,#0c1320_0%,#101620_100%)]">
      <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(15,23,42,0.82))] p-6 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_25%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_35%)] pointer-events-none" />
        <div className="relative flex flex-col gap-5">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-cyan-300/80 font-black mb-3">
              <FolderSync className="w-3.5 h-3.5" />
              Imports & sync
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight font-heading text-white">Imports & Sync</h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl mt-3">
              Import Tradovate data, run sync, and manage account mappings.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 max-w-2xl">
            <div className="flex items-center gap-2 text-cyan-300 text-[10px] uppercase tracking-[0.26em] font-black mb-2"><Link2 className="w-3.5 h-3.5" /> Primary action</div>
            <div className="text-white font-semibold">Run one-click sync or import a Tradovate bundle</div>
            <div className="text-sm text-slate-300 mt-1">Use this page first when the dashboard needs fresh data.</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)] gap-6 xl:gap-8 items-start">
        <DataManager />
        <div className="xl:sticky xl:top-8">
          <SyncStatusCard />
        </div>
      </div>
    </div>
  );
};

export default SyncCenter;
