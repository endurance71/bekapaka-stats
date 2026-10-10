import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';
import { isBekapakaName, formatMatchDate, formatMatchTime } from '../../shared/lib/matchUtils';
import { useCachedJSON } from '../../hooks/useCachedJSON';
import { formatRoundLabel } from './LeagueScheduleModern';

interface ScheduleMatch {
    id: string;
    date: string;
    homeTeam: string;
    guestTeam: string;
    isFinished: boolean;
    roundLabel?: string | null;
    venue?: string | null;
}

/** Mecze najbliższej kolejki (z tego samego terminarza co zakładka „Terminarz” — dane z pamięci). */
export function nextRound(matches: ScheduleMatch[], now = Date.now()): { label: string | null; matches: ScheduleMatch[] } {
    const upcoming = matches
        .filter((m) => !m.isFinished && new Date(m.date).getTime() >= now - 3 * 3600_000)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (!upcoming.length) return { label: null, matches: [] };
    const first = upcoming[0];
    const sameRound = first.roundLabel ? upcoming.filter((m) => m.roundLabel === first.roundLabel) : [first];
    return { label: formatRoundLabel(first.roundLabel), matches: sameRound };
}

export type NextRound = ReturnType<typeof nextRound>;

/** Najbliższa kolejka sezonu — `null`, gdy nie ma już meczów do rozegrania. */
export function useNextRound(seasonId: string | null): NextRound | null {
    const { data } = useCachedJSON<ScheduleMatch[]>(seasonId ? `/api/league/schedule?seasonId=${encodeURIComponent(seasonId)}` : null);
    return useMemo(() => {
        const round = nextRound(data ?? []);
        return round.matches.length ? round : null;
    }, [data]);
}

/** Tabela ligi → kolumna boczna: najbliższa kolejka (BeKaPaKa wyróżniona). */
export default function NextRoundCard({ round }: { round: NextRound }) {
    return (
        <BkpkCard variant="flat" title={round.label ? `Najbliższa kolejka · ${round.label.replace(/^kolejka\s*/i, '')}` : 'Najbliższe mecze'} icon={<CalendarDays className="h-5 w-5 text-bkpk-primary" />}>
            <ul className="divide-y divide-bkpk-border-subtle">
                {round.matches.map((m) => {
                    const ours = isBekapakaName(m.homeTeam) || isBekapakaName(m.guestTeam);
                    return (
                        <li key={m.id} className={cn('py-3 first:pt-0 last:pb-0', ours && 'shadow-[inset_3px_0_0_var(--c-red-500)] pl-3')}>
                            <div className="text-[13px] text-bkpk-text-muted tabular-nums">
                                {formatMatchDate(m.date)}, {formatMatchTime(m.date)}
                                {m.venue && <span> · {m.venue}</span>}
                            </div>
                            <div className={cn('mt-1 text-[15px] leading-snug', ours ? 'font-semibold text-bkpk-text-primary' : 'text-bkpk-text-secondary')}>
                                {m.homeTeam} – {m.guestTeam}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </BkpkCard>
    );
}
