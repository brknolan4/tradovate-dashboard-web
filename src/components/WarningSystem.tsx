import type { WarningItem } from '../hooks/usePerformanceWarnings';

interface WarningSystemProps {
    warnings: WarningItem[];
}

export const WarningSystem: React.FC<WarningSystemProps> = ({ warnings }) => {
    const active = warnings.filter(w => w.severity !== 'ok');
    if (active.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {active.map(w => {
                const isCritical = w.severity === 'critical';
                const valueStr = w.invert
                    ? `${w.currentValue.toFixed(0)} / ${w.limitValue.toFixed(0)}`
                    : `$${w.currentValue.toFixed(0)} / $${w.limitValue.toFixed(0)}`;
                return (
                    <div
                        key={w.id}
                        title={w.message}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all cursor-default ${
                            isCritical
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse'
                                : 'bg-amber-500/8 border-amber-500/20 text-amber-300'
                        }`}
                    >
                        <span className="text-[11px] leading-none">{isCritical ? '🚨' : '⚠'}</span>
                        <span className="uppercase tracking-[0.18em] font-black text-[9px]">{w.label}</span>
                        <span className="opacity-70 font-mono">{valueStr}</span>
                    </div>
                );
            })}
        </div>
    );
};
