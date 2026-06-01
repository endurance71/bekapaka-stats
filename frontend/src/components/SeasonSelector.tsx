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
}

export default function SeasonSelector({
  seasons,
  seasonId,
  onChange,
  loading = false,
  className,
  compact = false
}: SeasonSelectorProps) {
  if (loading || seasons.length === 0) return null;

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 text-sm text-bkpk-text-secondary',
        compact ? 'flex-col items-stretch sm:flex-row sm:items-center' : '',
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5 font-medium shrink-0">
        <Calendar className="w-4 h-4 text-bkpk-primary" aria-hidden />
        Sezon
      </span>
      <select
        value={seasonId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'rounded-lg border border-bkpk-border bg-bkpk-surface px-3 py-2 text-bkpk-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-bkpk-primary/40 min-w-[10rem]'
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
