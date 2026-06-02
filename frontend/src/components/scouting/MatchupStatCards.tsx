import { cn } from '../../shared/lib/utils';

interface TeamStats {
  name: string;
  ppg: number;
  oppg: number;
  winPct: number;
  pace: number;
  threePtPct: number;
}

interface MatchupStatCardsProps {
  opponent: TeamStats;
  bekapaka: TeamStats;
  /** Zwarty układ na mobile i w siatce pod radar. */
  compact?: boolean;
}

const METRICS = [
  { key: 'ppg', label: 'PPG', format: (v: number) => v.toFixed(1) },
  { key: 'oppg', label: 'Stracone', format: (v: number) => v.toFixed(1), invertBetter: true },
  { key: 'winPct', label: 'Wygrane %', format: (v: number) => `${v}%` },
  { key: 'pace', label: 'Tempo', format: (v: number) => (v > 0 ? v.toFixed(1) : '—') },
  { key: 'threePtPct', label: '3PT %', format: (v: number) => (v > 0 ? `${v.toFixed(1)}%` : '—') }
] as const;

export function MatchupStatCards({ opponent, bekapaka, compact = false }: MatchupStatCardsProps) {
  return (
    <div
      className={cn(
        compact ? 'grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-2 sm:space-y-2.5'
      )}
    >
      {METRICS.map((metric) => {
        const oppVal = opponent[metric.key];
        const bkVal = bekapaka[metric.key];
        const oppBetter = metric.invertBetter ? oppVal < bkVal : oppVal > bkVal;
        const bkBetter = metric.invertBetter ? bkVal < oppVal : bkVal > oppVal;

        return (
          <div
            key={metric.key}
            className={cn(
              'rounded-xl border border-bkpk-border-strong bg-bkpk-surface-tint-2',
              compact ? 'p-2' : 'p-2.5 sm:p-3'
            )}
          >
            <div
              className={cn(
                'text-center font-bold uppercase tracking-widest text-bkpk-text-muted',
                compact ? 'mb-1 text-[9px]' : 'mb-1.5 text-[10px]'
              )}
            >
              {metric.label}
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div
                className={cn(
                  'rounded-lg border text-center',
                  compact ? 'px-1.5 py-1' : 'px-2 py-1.5',
                  bkBetter
                    ? 'border-bkpk-primary/40 bg-bkpk-primary/10'
                    : 'border-bkpk-border-strong bg-bkpk-surface-tint-3'
                )}
              >
                <div className="truncate text-[9px] font-bold text-bkpk-text-muted sm:text-[10px]">
                  {bekapaka.name}
                </div>
                <div
                  className={cn(
                    'font-black tabular-nums text-bkpk-primary',
                    compact ? 'text-base leading-tight' : 'text-lg'
                  )}
                >
                  {metric.format(bkVal)}
                </div>
              </div>
              <div
                className={cn(
                  'rounded-lg border text-center',
                  compact ? 'px-1.5 py-1' : 'px-2 py-1.5',
                  oppBetter
                    ? 'border-bkpk-danger/40 bg-bkpk-danger/10'
                    : 'border-bkpk-border-strong bg-bkpk-surface-tint-3'
                )}
              >
                <div className="truncate text-[9px] font-bold text-bkpk-text-muted sm:text-[10px]">
                  {opponent.name}
                </div>
                <div
                  className={cn(
                    'font-black tabular-nums text-bkpk-text-primary',
                    compact ? 'text-base leading-tight' : 'text-lg'
                  )}
                >
                  {metric.format(oppVal)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
