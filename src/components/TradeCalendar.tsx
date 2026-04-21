import React, { useEffect, useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Info, Clock, NotebookPen, Save } from 'lucide-react';
import { getTradingDay } from '../utils/tradingDay';

interface DailyNetPnlEntry {
    date: string;
    pnl: number;
}

interface TradeCalendarProps {
    trades: any[];
    dailyNetPnl?: DailyNetPnlEntry[];
    accountKey?: string;
}

const JOURNAL_STORAGE_KEY = 'tradedash_journal_notes';

const TradeCalendar: React.FC<TradeCalendarProps> = ({ trades, dailyNetPnl, accountKey = 'default' }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [journalNotes, setJournalNotes] = useState<Record<string, string>>({});
    const [journalDraft, setJournalDraft] = useState('');

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem(JOURNAL_STORAGE_KEY);
            setJournalNotes(saved ? JSON.parse(saved) : {});
        } catch {
            setJournalNotes({});
        }
    }, []);

    const selectedJournalKey = useMemo(() => selectedDate ? `${accountKey}:${format(selectedDate, 'yyyy-MM-dd')}` : null, [accountKey, selectedDate]);

    useEffect(() => {
        if (!selectedJournalKey) {
            setJournalDraft('');
            return;
        }
        setJournalDraft(journalNotes[selectedJournalKey] || '');
    }, [journalNotes, selectedJournalKey]);

    const saveJournalNote = () => {
        if (!selectedJournalKey) return;
        const nextNotes = { ...journalNotes, [selectedJournalKey]: journalDraft.trim() };
        if (!journalDraft.trim()) delete nextNotes[selectedJournalKey];
        setJournalNotes(nextNotes);
        localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(nextNotes));
    };

    const brokerDailyMap = useMemo(() => {
        const map = new Map<string, number>();
        (dailyNetPnl || []).forEach((entry) => map.set(entry.date, entry.pnl));
        return map;
    }, [dailyNetPnl]);

    const getDayData = (day: Date) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTrades = trades.filter((t) => getTradingDay(t.soldTimestamp) === dayStr && t.symbol !== 'CASH');
        const tradeDerivedPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
        const pnl = brokerDailyMap.has(dayStr) ? (brokerDailyMap.get(dayStr) || 0) : tradeDerivedPnl;

        const greenTrades = dayTrades.filter(t => t.pnl > 0).length;
        const redTrades = dayTrades.filter(t => t.pnl < 0).length;

        const totalDuration = dayTrades.reduce((sum, t) => sum + (t.durationSeconds || 0), 0);
        const avgDuration = dayTrades.length > 0 ? totalDuration / dayTrades.length : 0;

        return { pnl, count: dayTrades.length, executions: dayTrades, greenTrades, redTrades, avgDuration, hasBrokerPnl: brokerDailyMap.has(dayStr) };
    };

    const selectedDayData = selectedDate ? getDayData(selectedDate) : null;

    const changeMonth = (offset: number) => setCurrentDate(addMonths(currentDate, offset));

    return (
        <div className="glass p-6 md:p-8 xl:p-10">
            <div className="flex flex-col xl:flex-row gap-8 xl:gap-10">
                {/* Left Side: Calendar Control & Grid */}
                <div className="flex-1">
                    <div className="flex flex-col items-center justify-center mb-8 gap-5">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black font-heading uppercase tracking-[0.2em] text-white">Trade Calendar</h2>
                            <Info className="w-4 h-4 opacity-30" />
                        </div>

                        <div className="flex items-center gap-4 bg-slate-800/40 p-2 rounded-xl border border-white/10 shadow-lg scale-90">
                            <button onClick={() => setCurrentDate(subMonths(currentDate, 12))} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-all hover:text-white"><ChevronsLeft className="w-4 h-4" /></button>
                            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-all hover:text-white"><ChevronLeft className="w-4 h-4" /></button>

                            <span className="px-4 text-sm font-black text-white min-w-[140px] text-center uppercase tracking-[0.15em]">
                                {format(currentDate, 'MMMM yyyy')}
                            </span>

                            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-all hover:text-white"><ChevronRight className="w-4 h-4" /></button>
                            <button onClick={() => setCurrentDate(addMonths(currentDate, 12))} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-all hover:text-white"><ChevronsRight className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 border border-white/10 rounded-[1.75rem] overflow-hidden bg-slate-900/45 p-1.5 shadow-xl">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                            <div key={d} className="py-3 text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em] leading-none bg-slate-800/40 border-b border-white/5">
                                {d}
                            </div>
                        ))}
                        {days.map((day, i) => {
                            const { pnl, count, greenTrades, redTrades, avgDuration } = getDayData(day);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const dayJournalKey = `${accountKey}:${format(day, 'yyyy-MM-dd')}`;
                            const hasJournalNote = Boolean(journalNotes[dayJournalKey]);

                            // Faded colored outlines based on day result
                            let borderColor = 'border-white/[0.03]';
                            let bgColor = 'bg-slate-950/40';
                            if (isCurrentMonth && (count > 0 || pnl !== 0)) {
                                if (pnl > 0) {
                                    bgColor = 'bg-emerald-600/10 hover:bg-emerald-600/25';
                                    borderColor = 'border-emerald-500/30';
                                } else if (pnl < 0) {
                                    bgColor = 'bg-red-600/10 hover:bg-red-600/25';
                                    borderColor = 'border-red-500/30';
                                } else {
                                    bgColor = 'bg-slate-800/30 hover:bg-slate-800/50';
                                }
                            }

                            return (
                                <div
                                    key={i}
                                    onClick={() => isCurrentMonth && setSelectedDate(day)}
                                    className={`min-h-[88px] p-2.5 flex flex-col items-center justify-between transition-all cursor-pointer group relative border rounded-[1rem] ${bgColor} ${borderColor} ${!isCurrentMonth ? 'opacity-5 pointer-events-none' : ''
                                        } ${isSelected ? 'ring-[2px] ring-indigo-500/80 ring-inset z-10 bg-indigo-500/10 scale-[0.98]' : ''}`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className={`text-sm font-black leading-none ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>
                                            {format(day, 'd')}
                                        </span>
                                        {hasJournalNote && (
                                            <span className="text-[8px] font-black uppercase tracking-[0.12em] text-cyan-300 bg-cyan-500/15 border border-cyan-500/20 px-1 py-px rounded-md">
                                                Note
                                            </span>
                                        )}
                                    </div>

                                    {isCurrentMonth && (
                                        <div className="flex flex-col items-center gap-0.5 w-full">
                                            {(count > 0 || pnl !== 0) ? (
                                                <>
                                                    <div className={`text-xs font-black tracking-tight leading-none ${pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-red-400' : 'text-slate-400'
                                                        }`}>
                                                        {pnl > 0 ? `+$${pnl.toFixed(0)}` : pnl < 0 ? `-$${Math.abs(pnl).toFixed(0)}` : '$0'}
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-0.5 flex-wrap justify-center">
                                                        <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/20 px-1 py-px rounded border border-emerald-500/20">
                                                            {greenTrades}W
                                                        </span>
                                                        <span className="text-[8px] font-black text-red-400 bg-red-500/20 px-1 py-px rounded border border-red-500/20">
                                                            {redTrades}L
                                                        </span>
                                                        {count === 0 && pnl !== 0 && (
                                                            <span className="text-[8px] font-black text-amber-300 bg-amber-500/15 px-1 py-px rounded border border-amber-500/20">
                                                                Fees only
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-slate-500 mt-1">
                                                        {count > 0
                                                            ? (avgDuration > 60 ? `${(avgDuration / 60).toFixed(1)}m` : `${avgDuration.toFixed(0)}s`)
                                                            : 'No trades'
                                                        } avg
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Detail Pane */}
                <div className="w-full xl:w-[30rem] border-t xl:border-t-0 xl:border-l border-white/10 pt-8 xl:pt-0 xl:pl-8 flex flex-col">
                    <div className="flex flex-col items-center gap-3 mb-10 text-center">
                        <h3 className="text-sm font-black uppercase text-slate-500 tracking-[0.3em] mb-1">Execution Log</h3>
                        <div className="px-6 py-2 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                            <span className="text-xs font-black uppercase tracking-[0.15em] font-heading">
                                {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'Select a date'}
                            </span>
                        </div>
                    </div>

                    {selectedDayData && (selectedDayData.count > 0 || selectedDayData.pnl !== 0) && (
                        <div className="mb-6">
                            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <span className="text-xs font-black uppercase text-slate-300 tracking-[0.2em]">Daily Session Total</span>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-wrap">
                                            <span>{selectedDayData.count} Trades</span>
                                            <span className="text-slate-600">•</span>
                                            <span>
                                                {selectedDayData.avgDuration > 60
                                                    ? `${(selectedDayData.avgDuration / 60).toFixed(1)}m`
                                                    : `${selectedDayData.avgDuration.toFixed(0)}s`} Avg
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`text-4xl md:text-5xl font-black text-right ${selectedDayData.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {selectedDayData.pnl >= 0 ? '+' : ''}${selectedDayData.pnl.toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedDate && (
                        <div className="mb-6 rounded-[2rem] border border-white/10 bg-slate-900/35 p-5 shadow-xl">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2 min-w-0">
                                    <NotebookPen className="w-4 h-4 text-cyan-300" />
                                    <div>
                                        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-black">Journal Note</div>
                                        <div className="text-sm font-bold text-white">{format(selectedDate, 'MMMM dd, yyyy')}</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={saveJournalNote}
                                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200 hover:bg-cyan-500/15"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Save
                                </button>
                            </div>
                            <textarea
                                value={journalDraft}
                                onChange={(event) => setJournalDraft(event.target.value)}
                                placeholder="Add notes for this day: context, mistakes, setup quality, emotional state, what to repeat tomorrow..."
                                className="w-full min-h-[140px] rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500/30 resize-y"
                            />
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto max-h-[520px] pr-6 custom-scrollbar">
                        {selectedDayData && (selectedDayData.count > 0 || selectedDayData.pnl !== 0) ? (
                            <div className="bg-slate-800/30 border border-white/10 rounded-2xl overflow-hidden">
                                {/* Table Header */}
                                <div className="grid grid-cols-7 gap-2 px-4 py-3 bg-slate-900/50 border-b border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="col-span-1">Symbol</div>
                                    <div className="text-center">Qty</div>
                                    <div className="text-center">Entry</div>
                                    <div className="text-center">Exit</div>
                                    <div className="text-center">Duration</div>
                                    <div className="text-right">Comms</div>
                                    <div className="text-right">P&L</div>
                                </div>
                                {/* Table Rows */}
                                {selectedDayData.executions.length > 0 ? selectedDayData.executions.map((trade: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`grid grid-cols-7 gap-2 px-4 py-2.5 border-b border-white/5 text-xs hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-slate-800/20' : ''}`}
                                    >
                                        <div className="font-bold text-white truncate col-span-1">{trade.symbol}</div>
                                        <div className="text-center text-slate-300">{trade.qty}</div>
                                        <div className="text-center font-mono text-emerald-400 text-[11px]">
                                            {format(new Date(trade.boughtTimestamp), 'HH:mm:ss')}
                                        </div>
                                        <div className="text-center font-mono text-red-400 text-[11px]">
                                            {format(new Date(trade.soldTimestamp), 'HH:mm:ss')}
                                        </div>
                                        <div className="text-center text-slate-400">{trade.durationSeconds}s</div>
                                        <div className="text-right text-slate-400 text-[11px]">${trade.commissions?.toFixed(2) || '0.00'}</div>
                                        <div className={`text-right font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="px-4 py-6 text-sm text-slate-400 text-center">
                                        No executions on this day — this P&amp;L came from broker fees or balance-history adjustments.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-28 border-2 border-dashed border-white/10 rounded-[3rem] bg-slate-900/20">
                                <Clock className="w-12 h-12 mb-6 text-slate-500 animate-pulse" />
                                <p className="text-[11px] font-black text-slate-500 uppercase px-16 tracking-[0.25em] leading-relaxed">System waiting for execution input</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TradeCalendar;
