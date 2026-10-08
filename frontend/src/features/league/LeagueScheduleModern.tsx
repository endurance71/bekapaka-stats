import { Fragment, useEffect, useState, useCallback, useMemo } from 'react';
import { fetchJSON } from '../../lib/api';
import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';
import { pluralPl } from '../../shared/lib/plural';

interface Match {
    id: string;
    date: string;
    homeTeam: string;
    guestTeam: string;
    scoreHome: number | null;
    scoreAway: number | null;
    isFinished: boolean;
    /** KALK v2: faza (np. „Sezon zasadniczy”, „Play-off”), kolejka, bilans przed meczem, hala. */
    phaseLabel?: string | null;
    stageId?: number | null;
    roundLabel?: string | null;
    homeRecordBefore?: string | null;
    guestRecordBefore?: string | null;
    venue?: string | null;
}

interface PhaseGroup {
    key: string;
    label: string | null;
    matches: Match[];
}

/** „Kolejka - 3” → „Kolejka 3”. */
export function formatRoundLabel(label: string | null | undefined): string | null {
    if (!label) return null;
    return label.replace(/\s*-\s*/, ' ').trim();
}

/** Nazwa fazy do nagłówka (play-off / play-out wersalikami jak na bekapaka.pl). */
export function formatPhaseLabel(label: string | null | undefined): string | null {
    if (!label) return null;
    const l = label.trim();
    if (/play\s*-?\s*off/i.test(l)) return l.replace(/play\s*-?\s*off/i, 'Play-off');
    if (/play\s*-?\s*out/i.test(l)) return l.replace(/play\s*-?\s*out/i, 'Play-out');
    return l;
}

/**
 * Grupy faz w kolejności terminarza (najnowsza faza u góry). Bez etykiet faz (stare sezony) → jedna grupa bez nagłówka.
 */
export function groupMatchesByPhase(matches: Match[]): PhaseGroup[] {
    const groups: PhaseGroup[] = [];
    const byKey = new Map<string, PhaseGroup>();
    for (const m of matches) {
        const label = formatPhaseLabel(m.phaseLabel);
        const key = m.stageId != null ? `stage-${m.stageId}` : label ? `label-${label.toLowerCase()}` : 'none';
        let g = byKey.get(key);
        if (!g) {
            g = { key, label, matches: [] };
            byKey.set(key, g);
            groups.push(g);
        }
        if (!g.label && label) g.label = label;
        g.matches.push(m);
    }
    return groups;
}

interface LeagueScheduleModernProps {
    seasonId?: string | null;
}

export default function LeagueScheduleModern({ seasonId }: LeagueScheduleModernProps) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSchedule = useCallback(async () => {
        if (!seasonId) return;
        setLoading(true);
        try {
            const data = await fetchJSON<Match[]>(`/api/league/schedule?seasonId=${encodeURIComponent(seasonId)}`);
            setMatches(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [seasonId]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const groups = useMemo(() => groupMatchesByPhase(matches), [matches]);
    const showPhaseHeadings = groups.some((g) => g.label);

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-bkpk-surface-tint-2 animate-pulse" />
                ))}
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="p-8">
                <KalkEmptyState
                    title="Terminarz jest pusty"
                    message="Nie znaleziono żadnych zaplanowanych meczów w bazie danych. Uruchom scraper, aby je pobrać."
                />
            </div>
        );
    }

    let rowIndex = -1;
    return (
        <div className="grid grid-cols-1">
            {groups.map((group) => (
                <Fragment key={group.key}>
                    {showPhaseHeadings && (
                        <h3 className="flex items-center justify-between gap-3 min-h-[48px] px-3 sm:px-5 py-2 bg-[var(--table-head-bg)] text-[var(--table-head-text)] font-display font-extrabold uppercase text-xl leading-none">
                            <span>{group.label ?? 'Mecze'}</span>
                            <span className="label-caps font-text text-[11px] font-semibold tabular-nums opacity-85">{group.matches.length} {pluralPl(group.matches.length, 'mecz', 'mecze', 'meczów')}</span>
                        </h3>
                    )}
                    <ol className="grid grid-cols-1" role="list">
                        {group.matches.map((match) => {
                            rowIndex += 1;
                            const idx = rowIndex;
                            const isHomeBkpk = match.homeTeam.toLowerCase().includes('bekapaka');
                            const isAwayBkpk = match.guestTeam.toLowerCase().includes('bekapaka');
                            const isBkpkInvolved = isHomeBkpk || isAwayBkpk;

                            // Przegrany wynik konturem (Score na bekapaka.pl) — kształt, nie tylko kolor
                            const getHomeScoreClass = () => {
                                if (!match.isFinished) return "";
                                if (match.scoreHome! === match.scoreAway!) return "text-bkpk-text-primary";
                                return match.scoreHome! > match.scoreAway! ? "text-bkpk-text-primary" : "text-bkpk-text-secondary outline-text";
                            };

                            const getAwayScoreClass = () => {
                                if (!match.isFinished) return "";
                                if (match.scoreAway! === match.scoreHome!) return "text-bkpk-text-primary";
                                return match.scoreAway! > match.scoreHome! ? "text-bkpk-text-primary" : "text-bkpk-text-secondary outline-text";
                            };

                            const date = new Date(match.date);
                            const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                            const homeRow = {
                                key: 'home',
                                name: match.homeTeam,
                                isBkpk: isHomeBkpk,
                                score: match.scoreHome,
                                scoreClass: getHomeScoreClass(),
                                side: 'GOSP.',
                                record: match.homeRecordBefore ?? null,
                            };
                            const awayRow = {
                                key: 'away',
                                name: match.guestTeam,
                                isBkpk: isAwayBkpk,
                                score: match.scoreAway,
                                scoreClass: getAwayScoreClass(),
                                side: 'GOŚĆ',
                                record: match.guestRecordBefore ?? null,
                            };
                            const roundLabel = formatRoundLabel(match.roundLabel);
                            // BeKaPaKa zawsze u góry (Brandbook 2.0); strona gospodarz/gość pozostaje opisana
                            const teamRows = isAwayBkpk && !isHomeBkpk ? [awayRow, homeRow] : [homeRow, awayRow];

                            return (
                                <motion.li
                                    key={match.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(idx, 20) * 0.05 }}
                                    className={cn(
                                        "grid grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:grid-cols-[3.75rem_minmax(0,1fr)_auto] gap-3 sm:gap-5 items-center px-3 sm:px-5 py-4 sm:py-5 border-b border-bkpk-border-subtle min-w-0 transition-colors",
                                        isBkpkInvolved
                                            ? "bg-[var(--table-own-bg)] shadow-[inset_4px_0_0_var(--c-red-500)]"
                                            : idx % 2 === 1
                                                ? "bg-ink-800 hover:bg-ink-700"
                                                : "hover:bg-ink-800"
                                    )}
                                >
                                    {/* Data — dzień Condensed, miesiąc wersalikami */}
                                    <div className="flex flex-col gap-1 self-start">
                                        <span className="font-display text-[36px] sm:text-[44px] leading-[0.85] text-bkpk-text-primary tabular-nums">
                                            {date.getDate()}
                                        </span>
                                        <span className="label-caps text-[11px] text-bkpk-text-secondary leading-tight">
                                            {date.toLocaleDateString(undefined, { month: 'short' })}
                                        </span>
                                        {roundLabel && (
                                            <span className="label-caps text-[10px] text-bkpk-text-muted leading-tight tabular-nums mt-1" title={match.roundLabel ?? undefined}>
                                                {roundLabel.replace(/^kolejka\s*/i, 'Kol. ')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Para drużyn */}
                                    <div className="grid gap-2 min-w-0">
                                        {teamRows.map((row, rowIdx) => (
                                            <div key={row.key} className="flex items-center justify-between gap-3 min-w-0">
                                                <span className="flex items-baseline gap-2 min-w-0">
                                                    <span
                                                        className={cn(
                                                            'font-display text-lg sm:text-xl leading-tight uppercase truncate',
                                                            row.isBkpk
                                                                ? 'text-bkpk-text-primary'
                                                                : rowIdx === 0 ? 'text-bkpk-text-primary' : 'text-bkpk-text-secondary'
                                                        )}
                                                        title={row.name}
                                                    >
                                                        {row.name}
                                                    </span>
                                                    <span className="label-caps text-[11px] text-bkpk-text-muted shrink-0">
                                                        {row.side}
                                                    </span>
                                                    {row.record && (
                                                        <span className="text-[11px] text-bkpk-text-muted tabular-nums shrink-0" title="Bilans przed meczem (zwycięstwa–porażki)">
                                                            ({row.record})
                                                        </span>
                                                    )}
                                                </span>
                                                {match.isFinished && (
                                                    <span className={cn('font-display text-2xl sm:text-[28px] leading-none tabular-nums shrink-0 min-w-[2.5ch] text-right', row.scoreClass)}>
                                                        {row.score}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Godzina (mecz nierozegrany) */}
                                    <div className="justify-self-end text-right">
                                        {match.isFinished ? (
                                            <span className="label-caps text-[11px] text-bkpk-text-muted tabular-nums">
                                                {time}
                                            </span>
                                        ) : (
                                            <div className="flex flex-col items-end gap-1">
                                                <time dateTime={match.date} className="font-display text-[28px] sm:text-[36px] leading-none text-bkpk-text-primary tabular-nums">
                                                    {time}
                                                </time>
                                                <span className="label-caps text-[11px] text-bkpk-text-muted">
                                                    VS
                                                </span>
                                                {match.venue && (
                                                    <span className="text-[11px] text-bkpk-text-muted max-w-[9rem] truncate" title={match.venue}>
                                                        {match.venue}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.li>
                            );
                        })}
                    </ol>
                </Fragment>
            ))}
        </div>
    );
}
