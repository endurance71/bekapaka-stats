import { cn } from '../../shared/lib/utils';

export type CompareRow = {
    label: string;
    /** Wartości do wyświetlenia (np. „38/66”, „57,6%”). */
    left: string;
    right: string;
    /** Liczby do proporcji paska i wyboru lepszej strony. */
    leftValue: number;
    rightValue: number;
    /** Dla strat i fauli lepsza jest niższa wartość. */
    lowerIsBetter?: boolean;
};

/**
 * Porównanie dwóch drużyn paskami (jak CompareBars na bekapaka.pl): lewa strona = BeKaPaKa,
 * lepsza wartość podkreślona czerwienią marki (informacja nie tylko kolorem).
 */
export default function CompareBars({ leftLabel, rightLabel, rows, className }: {
    leftLabel: string;
    rightLabel: string;
    rows: CompareRow[];
    className?: string;
}) {
    if (!rows.length) return null;
    return (
        <div className={cn('grid gap-4', className)}>
            <div className="flex justify-between gap-4 pb-2 border-b-2 border-bkpk-text-primary font-display font-extrabold uppercase text-lg sm:text-xl leading-none" aria-hidden="true">
                <span className="truncate text-bkpk-text-primary">{leftLabel}</span>
                <span className="truncate text-right text-bkpk-text-secondary">{rightLabel}</span>
            </div>
            <div className="grid gap-4">
                {rows.map((row) => {
                    const total = row.leftValue + row.rightValue;
                    const leftPct = total > 0 ? (row.leftValue / total) * 100 : 50;
                    const better = row.leftValue === row.rightValue
                        ? null
                        : (row.leftValue > row.rightValue) !== Boolean(row.lowerIsBetter) ? 'left' : 'right';
                    const valueCls = 'font-display font-extrabold text-xl sm:text-2xl leading-none tabular-nums';
                    const betterCls = 'text-bkpk-text-primary underline decoration-bkpk-primary decoration-[3px] underline-offset-[0.18em]';
                    return (
                        <div key={row.label} className="grid gap-2">
                            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_4.5rem] items-baseline gap-3">
                                <span className={cn(valueCls, better === 'left' ? betterCls : 'text-bkpk-text-secondary')}>{row.left}</span>
                                <span className="text-center text-[13px] text-bkpk-text-secondary">{row.label}</span>
                                <span className={cn(valueCls, 'text-right', better === 'right' ? betterCls : 'text-bkpk-text-secondary')}>{row.right}</span>
                            </div>
                            <div className="flex gap-0.5 h-2" aria-hidden="true">
                                <div className="bg-bkpk-primary" style={{ width: `${leftPct}%` }} />
                                <div className="bg-bkpk-border-strong" style={{ width: `${100 - leftPct}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
