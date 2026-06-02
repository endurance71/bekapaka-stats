import { Calendar } from 'lucide-react';
import type { KalkSeasonOption } from '../hooks/useSeasonPreference';
import { cn } from '../shared/lib/utils';

interface SeasonSelectorProps {
  seasons: KalkSeasonOption[];
  seasonId: string | null;
  onChange: (seasonId: string) => void;
  loading?: boolean;
  className?: string;
  compact?: boolean;
  /** Pełna szerokość — menu hamburger / sidebar */
  variant?: 'inline' | 'block';
}

export default function SeasonSelector({
  seasons,
  seasonId,
  onChange,
  loading = false,
  className,
  compact = false,
  variant = 'inline'
}: SeasonSelectorProps) {
  if (loading || seasons.length === 0) return null;

  const isBlock = variant === 'block';

  return (
    <label
      className={cn(
        'text-sm text-bkpk-text-secondary',
        isBlock
          ? 'flex flex-col gap-2 w-full'
          : cn(
              'inline-flex items-center gap-2',
              compact ? 'flex-col items-stretch sm:flex-row sm:items-center' : ''
            ),
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest text-bkpk-text-muted shrink-0">
        <Calendar className="w-4 h-4 text-bkpk-primary" aria-hidden />
        Sezon
      </span>
      <select
        value={seasonId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'rounded-xl border border-bkpk-border-strong bg-bkpk-surface px-3 py-2.5 text-bkpk-text-primary font-medium',
          'focus:outline-none focus:ring-2 focus:ring-bkpk-primary/40',
          isBlock ? 'w-full min-h-[44px]' : 'min-w-[10rem]'
        )}
        aria-label="Wybierz sezon"
      >
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
            {!s.isActive ? ' (archiwum)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
