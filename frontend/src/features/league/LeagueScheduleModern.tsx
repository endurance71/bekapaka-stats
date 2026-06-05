import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../../lib/api';
import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import { Calendar } from 'lucide-react';
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
                    <div key={i} className="h-24 bg-bkpk-surface-tint-2 animate-pulse rounded-2xl" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {matches.map((match, idx) => {
                const isHomeBkpk = match.homeTeam.toLowerCase().includes('bekapaka');
                const isAwayBkpk = match.guestTeam.toLowerCase().includes('bekapaka');
                const isBkpkInvolved = isHomeBkpk || isAwayBkpk;

                const getHomeScoreClass = () => {
                    if (!match.isFinished) return "";
                    if (isHomeBkpk) {
                        if (match.scoreHome! === match.scoreAway!) return "text-bkpk-text-primary";
                        return match.scoreHome! > match.scoreAway! ? "text-bkpk-success" : "text-bkpk-danger";
                    }
                    if (match.scoreHome! === match.scoreAway!) return "text-bkpk-text-primary";
                    return match.scoreHome! > match.scoreAway! ? "text-bkpk-text-primary" : "text-bkpk-text-muted";
                };

                const getAwayScoreClass = () => {
                    if (!match.isFinished) return "";
                    if (isAwayBkpk) {
                        if (match.scoreAway! === match.scoreHome!) return "text-bkpk-text-primary";
                        return match.scoreAway! > match.scoreHome! ? "text-bkpk-success" : "text-bkpk-danger";
                    }
                    if (match.scoreAway! === match.scoreHome!) return "text-bkpk-text-primary";
                    return match.scoreAway! > match.scoreHome! ? "text-bkpk-text-primary" : "text-bkpk-text-muted";
                };

                return (
                    <motion.div
                        key={match.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                            "group p-4 lg:p-5 bg-bkpk-surface-tint-1 border border-bkpk-border-strong rounded-2xl hover:bg-bkpk-surface-tint-3 transition-all duration-300 min-w-0",
                            isBkpkInvolved && "border-bkpk-primary/20 bg-bkpk-primary/5"
                        )}
                    >
                        {/* Desktop View */}
                        <div className="hidden md:grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 items-center w-full min-w-0">
                            <div className="flex flex-col items-center justify-center p-2.5 bg-bkpk-surface-tint-2 rounded-xl border border-bkpk-border-strong shrink-0">
                                <span className="text-[10px] font-bold text-bkpk-primary uppercase tracking-widest leading-none">
                                    {new Date(match.date).toLocaleDateString(undefined, { month: 'short' })}
                                </span>
                                <span className="text-2xl font-black font-outfit text-bkpk-text-primary leading-none my-1">
                                    {new Date(match.date).getDate()}
                                </span>
                                <span className="text-[10px] font-medium text-bkpk-text-muted leading-none tabular-nums">
                                    {new Date(match.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 lg:gap-3 min-w-0">
                                <div
                                    className={cn(
                                        'text-right font-bold text-sm lg:text-base leading-snug truncate',
                                        isHomeBkpk ? 'text-bkpk-primary' : 'text-bkpk-text-primary'
                                    )}
                                    title={match.homeTeam}
                                >
                                    {match.homeTeam}
                                </div>

                                <div className="flex shrink-0 items-center justify-center px-3 py-1.5 bg-bkpk-surface-tint-2 rounded-full border border-bkpk-border-strong min-w-[4.5rem]">
                                    {match.isFinished ? (
                                        <div className="flex items-center gap-1.5 tabular-nums">
                                            <span className={cn('text-lg lg:text-xl font-black font-outfit', getHomeScoreClass())}>
                                                {match.scoreHome}
                                            </span>
                                            <span className="text-bkpk-text-muted font-bold">:</span>
                                            <span className={cn('text-lg lg:text-xl font-black font-outfit', getAwayScoreClass())}>
                                                {match.scoreAway}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-black font-outfit text-bkpk-text-muted tracking-[0.25em] uppercase">
                                            VS
                                        </span>
                                    )}
                                </div>

                                <div
                                    className={cn(
                                        'text-left font-bold text-sm lg:text-base leading-snug truncate',
                                        isAwayBkpk ? 'text-bkpk-primary' : 'text-bkpk-text-primary'
                                    )}
                                    title={match.guestTeam}
                                >
                                    {match.guestTeam}
                                </div>
                            </div>
                        </div>

                        {/* Mobile View */}
                        <div className="flex md:hidden flex-col gap-4 w-full min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-bkpk-text-muted border-b border-bkpk-border-strong pb-2 font-bold">
                                <Calendar className="w-3.5 h-3.5 text-bkpk-primary shrink-0" />
                                <span className="tabular-nums">
                                    {new Date(match.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    {' · '}
                                    {new Date(match.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Teams & Score Row */}
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <span className={cn(
                                        "font-bold text-base",
                                        isHomeBkpk ? "text-bkpk-primary" : "text-bkpk-text-primary"
                                    )}>
                                        {match.homeTeam}
                                    </span>
                                    {match.isFinished ? (
                                        <span className={cn(
                                            "font-black font-outfit text-lg px-2.5 py-0.5 rounded-lg bg-bkpk-surface-tint-2 border border-bkpk-border-strong min-w-[36px] text-center",
                                            getHomeScoreClass()
                                        )}>
                                            {match.scoreHome}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-black font-outfit text-bkpk-text-muted uppercase tracking-wider px-2 py-0.5 rounded-lg bg-bkpk-surface-tint-2 border border-bkpk-border-strong">
                                            GOSP.
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className={cn(
                                        "font-bold text-base",
                                        isAwayBkpk ? "text-bkpk-primary" : "text-bkpk-text-primary"
                                    )}>
                                        {match.guestTeam}
                                    </span>
                                    {match.isFinished ? (
                                        <span className={cn(
                                            "font-black font-outfit text-lg px-2.5 py-0.5 rounded-lg bg-bkpk-surface-tint-2 border border-bkpk-border-strong min-w-[36px] text-center",
                                            getAwayScoreClass()
                                        )}>
                                            {match.scoreAway}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-black font-outfit text-bkpk-text-muted uppercase tracking-wider px-2 py-0.5 rounded-lg bg-bkpk-surface-tint-2 border border-bkpk-border-strong">
                                            GOŚĆ
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
