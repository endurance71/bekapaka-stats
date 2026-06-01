import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../../lib/api';
import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import { Calendar, MapPin, Clock } from 'lucide-react';
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

                return (
                    <motion.div
                        key={match.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                            "group p-6 bg-bkpk-surface-tint-1 border border-bkpk-border-strong rounded-2xl hover:bg-bkpk-surface-tint-3 transition-all duration-300",
                            isBkpkInvolved && "border-bkpk-primary/20 bg-bkpk-primary/5"
                        )}
                    >
                        {/* Desktop View */}
                        <div className="hidden md:flex flex-row items-center gap-6 w-full">
                            {/* Date Badge */}
                            <div className="flex flex-col items-center justify-center p-3 bg-bkpk-surface-tint-2 rounded-xl border border-bkpk-border-strong min-w-[100px]">
                                <span className="text-xs font-bold text-bkpk-primary uppercase tracking-widest">
                                    {new Date(match.date).toLocaleDateString(undefined, { month: 'short' })}
                                </span>
                                <span className="text-2xl font-black font-outfit text-bkpk-text-primary">
                                    {new Date(match.date).getDate()}
                                </span>
                                <span className="text-xs font-medium text-bkpk-text-muted">
                                    {new Date(match.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Match Details */}
                            <div className="flex-1 flex items-center justify-between gap-8">
                                <div className={cn(
                                    "flex-1 text-right font-bold text-lg",
                                    isHomeBkpk ? "text-bkpk-primary" : "text-bkpk-text-primary"
                                )}>
                                    {match.homeTeam}
                                </div>

                                <div className="flex flex-col items-center gap-1 px-4 py-2 bg-bkpk-surface-tint-2 rounded-full border border-bkpk-border-strong">
                                    {match.isFinished ? (
                                        <div className="flex items-center gap-3">
                                            <span className={cn("text-2xl font-black font-outfit", match.scoreHome! > match.scoreAway! ? "text-bkpk-text-primary" : "text-bkpk-text-muted")}>{match.scoreHome}</span>
                                            <span className="text-bkpk-text-muted font-bold">:</span>
                                            <span className={cn("text-2xl font-black font-outfit", match.scoreAway! > match.scoreHome! ? "text-bkpk-text-primary" : "text-bkpk-text-muted")}>{match.scoreAway}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-black font-outfit text-bkpk-text-muted tracking-[0.3em] uppercase">VS</span>
                                    )}
                                </div>

                                <div className={cn(
                                    "flex-1 text-left font-bold text-lg",
                                    isAwayBkpk ? "text-bkpk-primary" : "text-bkpk-text-primary"
                                )}>
                                    {match.guestTeam}
                                </div>
                            </div>

                            {/* Venue / Meta */}
                            <div className="flex items-center gap-6 text-xs font-bold text-bkpk-text-muted uppercase tracking-widest">
                                <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                    <MapPin className="w-3.5 h-3.5 text-bkpk-primary" />
                                    <span>KOSiR Koszalin</span>
                                </div>
                                <div className="hidden sm:flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>KALK</span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile View */}
                        <div className="flex md:hidden flex-col gap-4 w-full">
                            {/* Top Info Row */}
                            <div className="flex justify-between items-center text-xs text-bkpk-text-muted border-b border-bkpk-border-strong pb-2">
                                <div className="flex items-center gap-1.5 font-bold">
                                    <Calendar className="w-3.5 h-3.5 text-bkpk-primary" />
                                    <span>
                                        {new Date(match.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        {' · '}
                                        {new Date(match.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 font-bold">
                                    <MapPin className="w-3.5 h-3.5 text-bkpk-primary" />
                                    <span>KOSiR Koszalin</span>
                                </div>
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
                                            match.scoreHome! > match.scoreAway! ? "text-bkpk-text-primary" : "text-bkpk-text-muted"
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
                                            match.scoreAway! > match.scoreHome! ? "text-bkpk-text-primary" : "text-bkpk-text-muted"
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
