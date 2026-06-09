export type ActivityRecency = 'recent' | 'moderate' | 'inactive' | 'none';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Zwraca etykietę ostatniej aktywności (relatywną lub datę).
 */
export function formatLastActivity(date: string | Date | null | undefined): string {
  if (!date) return 'Brak danych';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return 'Brak danych';

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffMins < 1) return 'Przed chwilą';
  if (diffMins < 60) return `${diffMins} min temu`;
  if (diffHours < 24) return `${diffHours} godz. temu`;
  if (diffDays === 1) return 'Wczoraj';
  if (diffDays < 7) return `${diffDays} dni temu`;

  return d.toLocaleString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Pełna data do tooltip/title.
 */
export function formatLastActivityExact(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pl-PL');
}

/**
 * Klasyfikacja aktywności do kolorów badge.
 */
export function getActivityRecency(date: string | Date | null | undefined): ActivityRecency {
  if (!date) return 'none';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return 'none';

  const diffDays = (Date.now() - d.getTime()) / MS_PER_DAY;
  if (diffDays < 7) return 'recent';
  if (diffDays <= 30) return 'moderate';
  return 'inactive';
}

export const activityRecencyClass: Record<ActivityRecency, string> = {
  recent: 'text-bkpk-success',
  moderate: 'text-bkpk-text-secondary',
  inactive: 'text-bkpk-text-muted',
  none: 'text-bkpk-text-muted italic'
};
