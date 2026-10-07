import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../../lib/api';
import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';

interface Match {
    id: string;
    date: string;
    homeTeam: string;
    guestTeam: string;
    scoreHome: number | null;
    scoreAway: number | null;
    isFinished: boolean;
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

    return (
        <ol className="grid grid-cols-1" role="list">
            {matches.map((match, idx) => {
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
                };
                const awayRow = {
                    key: 'away',
                    name: match.guestTeam,
                    isBkpk: isAwayBkpk,
                    score: match.scoreAway,
                    scoreClass: getAwayScoreClass(),
                    side: 'GOŚĆ',
                };
                // BeKaPaKa zawsze u góry (Brandbook 2.0); strona gospodarz/gość pozostaje opisana
                const teamRows = isAwayBkpk && !isHomeBkpk ? [awayRow, homeRow] : [homeRow, awayRow];

                return (
                    <motion.li
                        key={match.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
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
                                </div>
                            )}
                        </div>
                    </motion.li>
                );
            })}
        </ol>
    );
}
