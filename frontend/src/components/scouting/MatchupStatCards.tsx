import { cn } from '../../shared/lib/utils';
import { formatStatFixed } from '../../shared/lib/formatStat';

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
  { key: 'ppg', label: 'Pkt/m', format: (v: number) => formatStatFixed(v) },
  { key: 'oppg', label: 'Stracone', format: (v: number) => formatStatFixed(v), invertBetter: true },
  { key: 'winPct', label: 'Wygrane %', format: (v: number) => `${v ?? 0}%` },
  { key: 'pace', label: 'Tempo', format: (v: number) => (v > 0 ? formatStatFixed(v) : '—') },
  { key: 'threePtPct', label: 'Za 3 %', format: (v: number) => (v > 0 ? `${formatStatFixed(v)}%` : '—') }
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
        const invertBetter = 'invertBetter' in metric && metric.invertBetter;
        const oppBetter = invertBetter ? oppVal < bkVal : oppVal > bkVal;
        const bkBetter = invertBetter ? bkVal < oppVal : bkVal > oppVal;

        return (
          <div
            key={metric.key}
            className={cn(
              'border border-bkpk-border-subtle bg-bkpk-bg',
              compact ? 'p-2.5' : 'p-3 sm:p-3.5'
            )}
          >
            <div
              className={cn(
                'label-caps text-center text-[11px] text-bkpk-text-muted',
                compact ? 'mb-1.5' : 'mb-2'
              )}
            >
              {metric.label}
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {/* BeKaPaKa zawsze po lewej; przewaga: linia 2 px u dołu */}
              <div
                className={cn(
                  'border text-center',
                  compact ? 'px-1.5 py-1.5' : 'px-2 py-2',
                  bkBetter
                    ? 'border-bkpk-primary border-b-2 bg-[var(--table-own-bg)]'
                    : 'border-bkpk-border-subtle bg-bkpk-surface'
                )}
              >
                <div className="truncate text-[11px] font-semibold text-bkpk-text-muted">
                  {bekapaka.name}
                </div>
                <div
                  className={cn(
                    'font-display tabular-nums text-bkpk-text-primary mt-0.5',
                    compact ? 'text-xl leading-none' : 'text-2xl leading-none'
                  )}
                >
                  {metric.format(bkVal)}
                </div>
              </div>
              <div
                className={cn(
                  'border text-center',
                  compact ? 'px-1.5 py-1.5' : 'px-2 py-2',
                  oppBetter
                    ? 'border-bkpk-text-secondary border-b-2 bg-bkpk-surface-elevated'
                    : 'border-bkpk-border-subtle bg-bkpk-surface'
                )}
              >
                <div className="truncate text-[11px] font-semibold text-bkpk-text-muted">
                  {opponent.name}
                </div>
                <div
                  className={cn(
                    'font-display tabular-nums text-bkpk-text-secondary mt-0.5',
                    compact ? 'text-xl leading-none' : 'text-2xl leading-none'
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
