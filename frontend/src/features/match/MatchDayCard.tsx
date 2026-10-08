import { useEffect, useState } from 'react';
import BkpkCard from '../../shared/ui/BkpkCard';
import BkpkButton from '../../shared/ui/BkpkButton';
import { fetchJSON } from '../../lib/api';
import { useIsAdmin } from '../../context/AuthContext';

/** `resolveMatchDay` z backendu (backend/lib/matchDay.js). */
export interface MatchDay {
    gatheringTime: string | null;
    /** true = zbiórka wyliczona (start − 45 min), trener jej nie ustawił */
    gatheringEstimated: boolean;
    kit: string | null;
    notes: string | null;
}

const fieldLabel = 'grid gap-1.5 label-caps text-xs text-bkpk-text-secondary';
const fieldControl =
    'w-full min-h-[44px] px-3 bg-bkpk-bg border border-bkpk-border-strong text-bkpk-text-primary font-text normal-case tracking-normal font-normal placeholder:text-bkpk-text-muted hover:border-bkpk-text-secondary transition-colors';

/** Link do pliku .ics z jednym meczem i adres subskrypcji całego terminarza (webcal). */
export function calendarLinks(matchId: string, seasonId?: string | null, host = typeof window !== 'undefined' ? window.location.host : '') {
    const q = new URLSearchParams({ match: matchId });
    if (seasonId) q.set('seasonId', seasonId);
    return {
        single: `/api/calendar.ics?${q.toString()}`,
        subscribe: `webcal://${host}/api/calendar.ics`
    };
}

export function CalendarButtons({ matchId, seasonId }: { matchId: string; seasonId?: string | null }) {
    const links = calendarLinks(matchId, seasonId);
    return (
        <div className="flex flex-wrap gap-x-6 gap-y-1">
            <a href={links.single} download className="inline-flex items-center min-h-[44px] label-caps text-xs text-bkpk-text-primary hover:text-bkpk-primary">
                Dodaj do kalendarza
            </a>
            <a href={links.subscribe} className="inline-flex items-center min-h-[44px] label-caps text-xs text-bkpk-text-secondary hover:text-bkpk-primary">
                Subskrybuj terminarz
            </a>
        </div>
    );
}

function MatchDayEditor({ matchId, seasonId, matchDay, onSaved }: { matchId: string; seasonId: string; matchDay: MatchDay; onSaved: (value: MatchDay) => void }) {
    const [gatheringTime, setGatheringTime] = useState(matchDay.gatheringEstimated ? '' : matchDay.gatheringTime ?? '');
    const [kit, setKit] = useState(matchDay.kit ?? '');
    const [notes, setNotes] = useState(matchDay.notes ?? '');
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    async function save(event: React.FormEvent) {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const result = await fetchJSON<{ matchDay: MatchDay }>(
                `/api/admin/matches/${encodeURIComponent(seasonId)}/${encodeURIComponent(matchId)}/match-day`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ matchDay: { gatheringTime, kit, notes } })
                }
            );
            setMessage('Zapisano.');
            onSaved(result.matchDay);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Błąd zapisu');
        } finally {
            setSaving(false);
        }
    }

    return (
        <details className="bg-bkpk-surface border border-bkpk-border-subtle">
            <summary className="cursor-pointer min-h-[44px] flex items-center px-4 label-caps text-xs text-bkpk-text-primary hover:bg-bkpk-surface-elevated transition-colors">
                Edytuj dzień meczowy
            </summary>
            <form className="grid gap-4 sm:grid-cols-2 p-4 border-t border-bkpk-border-subtle" onSubmit={save}>
                <label className={fieldLabel}>
                    Zbiórka (puste = 45 min przed)
                    <input type="time" className={fieldControl} value={gatheringTime} onChange={(e) => setGatheringTime(e.target.value)} />
                </label>
                <label className={fieldLabel}>
                    Strój
                    <input className={fieldControl} maxLength={60} placeholder="np. czarne koszulki" value={kit} onChange={(e) => setKit(e.target.value)} />
                </label>
                <label className={`${fieldLabel} sm:col-span-2`}>
                    Uwagi dla drużyny
                    <textarea className={`${fieldControl} py-2 min-h-[88px]`} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </label>
                <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
                    <BkpkButton type="submit" variant="primary" size="sm" disabled={saving}>
                        {saving ? 'Zapisywanie…' : 'Zapisz'}
                    </BkpkButton>
                    {message && <span role="status" className="text-sm text-bkpk-text-secondary">{message}</span>}
                </div>
            </form>
        </details>
    );
}

/**
 * Dzień meczowy bez AI: zbiórka, strój, uwagi trenera + kalendarz.
 * Trener (admin) edytuje; zawodnik tylko czyta. Dane: LeagueMatch.matchDay.
 */
export default function MatchDayCard({
    matchId,
    seasonId,
    matchDay,
    variant = 'card'
}: {
    matchId: string;
    seasonId?: string | null;
    matchDay: MatchDay | null | undefined;
    /** `inline` = bez ramki (wewnątrz innej karty) */
    variant?: 'card' | 'inline';
}) {
    const isAdmin = useIsAdmin();
    const [current, setCurrent] = useState<MatchDay | null>(matchDay ?? null);
    useEffect(() => setCurrent(matchDay ?? null), [matchDay]);

    const body = (
        <div className="space-y-3">
            <dl className="grid grid-cols-2 gap-4">
                <div>
                    <dt className="label-caps text-xs text-bkpk-text-secondary">Zbiórka</dt>
                    <dd className="text-sm font-semibold tabular-nums text-bkpk-text-primary">
                        {current?.gatheringTime ?? '—'}
                        {current?.gatheringEstimated && <span className="ml-1 font-normal text-bkpk-text-muted">(orientacyjnie)</span>}
                    </dd>
                </div>
                <div>
                    <dt className="label-caps text-xs text-bkpk-text-secondary">Strój</dt>
                    <dd className="text-sm font-semibold text-bkpk-text-primary">{current?.kit || 'trener poda'}</dd>
                </div>
                {current?.notes && (
                    <div className="col-span-2">
                        <dt className="label-caps text-xs text-bkpk-text-secondary">Od trenera</dt>
                        <dd className="text-sm text-bkpk-text-primary whitespace-pre-line">{current.notes}</dd>
                    </div>
                )}
            </dl>
            <CalendarButtons matchId={matchId} seasonId={seasonId} />
            {isAdmin && seasonId && current && (
                <MatchDayEditor matchId={matchId} seasonId={seasonId} matchDay={current} onSaved={setCurrent} />
            )}
        </div>
    );

    if (variant === 'inline') return body;
    return (
        <BkpkCard variant="glass" className="space-y-3">
            <span className="kicker text-bkpk-text-primary">Dzień meczowy</span>
            {body}
        </BkpkCard>
    );
}
