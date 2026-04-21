import React from 'react';
import TradeCalendar from './TradeCalendar';
import { useData } from '../context/DataContext';
import { Calendar } from 'lucide-react';

interface CalendarPageProps {
    onOpenSyncCenter?: () => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ onOpenSyncCenter }) => {
    const { accounts, dailyNetPnl, selectedAccount, isLoading } = useData();

    const trades = accounts[selectedAccount] || [];

    if (isLoading) {
        return (
            <div className="p-8 text-slate-500 font-black uppercase tracking-[0.3em] text-center mt-20 animate-pulse">
                Loading Calendar...
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto px-4 py-6 md:px-8 md:py-8 xl:px-10 xl:py-10 space-y-8 md:space-y-10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.07),transparent_30%),linear-gradient(180deg,#0c1320_0%,#101620_100%)]">
            <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(15,23,42,0.82))] p-6 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.08),transparent_32%)] pointer-events-none" />
                <div className="relative flex flex-col gap-6">
                    <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-indigo-300/80 font-black mb-3">
                                <Calendar className="w-3.5 h-3.5" />
                                Trade calendar
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight font-heading text-white">Execution timeline</h1>
                            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl mt-3">
                                Review daily P&amp;L and drill into executions.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-full xl:min-w-[320px]">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                                <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500 font-black mb-2">Account</div>
                                <div className="text-lg font-black text-white truncate">{selectedAccount || 'No account selected'}</div>
                                <div className="text-xs text-slate-400 mt-1">Calendar follows the active account.</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                                <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500 font-black mb-2">Trading days</div>
                                <div className="text-lg font-black text-white">{dailyNetPnl[selectedAccount]?.length || 0}</div>
                                <div className="text-xs text-slate-400 mt-1">Net day records available.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {trades.length === 0 ? (
                <div className="glass p-12 md:p-16 flex flex-col items-center justify-center text-center gap-7 border-dashed border-2 border-white/10">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 rotate-3">
                        <Calendar className="w-10 h-10 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black mb-3 uppercase tracking-wider text-white">No trade data yet</h2>
                        <p className="text-slate-400 max-w-md font-medium leading-relaxed">
                            Import an account to populate the calendar with daily P&amp;L and execution detail.
                        </p>
                        <div className="mt-6 flex justify-center">
                            <button
                                type="button"
                                onClick={onOpenSyncCenter}
                                className="inline-flex items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/12 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-500/18"
                            >
                                Open Imports &amp; Sync
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <TradeCalendar trades={trades} dailyNetPnl={dailyNetPnl[selectedAccount]} accountKey={selectedAccount || 'default'} />
            )}
        </div>
    );
};

export default CalendarPage;
