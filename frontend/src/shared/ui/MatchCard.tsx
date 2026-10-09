import { cn } from '../lib/utils';
import BkpkCard from './BkpkCard';
import { ArrowRight } from 'lucide-react';
import { VenueIcon as MapPin, TrophyIcon as Trophy } from './BrandIcon';

export interface MatchCardProps {
    id: string;
    opponent: string;
    date: string;
    result?: 'W' | 'L' | null;
    scoreUs?: number | null;
    scoreThem?: number | null;
    homeAway?: string;
    mvp?: string | null;
    league?: string;
    /** Kolejka z KALK, np. „Kolejka 3” */
    roundLabel?: string | null;
    /** Hala z terminarza KALK (brak → wiersz ukryty) */
    venue?: string | null;
    onClick?: (id: string) => void;
}

/** Wiersz meczu wg FixtureRow z bekapaka.pl: data · para · wynik. BeKaPaKa zawsze po lewej (Brandbook 2.0). */
export default function MatchCard({
    id,
    opponent,
    date,
    result,
    scoreUs,
    scoreThem,
    mvp,
    league,
    roundLabel,
    venue,
    onClick
}: MatchCardProps) {
    const isPlayed = result !== undefined && result !== null;
    const isWin = result === 'W';
    const parsed = new Date(date);
    const validDate = !Number.isNaN(parsed.getTime());
    const day = validDate ? parsed.toLocaleDateString('pl-PL', { day: '2-digit' }) : '--';
    const month = validDate ? parsed.toLocaleDateString('pl-PL', { month: 'short' }).replace('.', '') : '';
    const weekday = validDate ? parsed.toLocaleDateString('pl-PL', { weekday: 'short' }).replace('.', '') : '';
    const time = validDate ? parsed.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : '';

    return (
        <BkpkCard
            onClick={() => onClick?.(id)}
            className="group relative cursor-pointer"
            padding="none"
            hoverEffect
        >
            <div className="flex items-stretch h-full">
                {/* Data */}
                <div className="flex flex-col items-center justify-center w-16 sm:w-20 shrink-0 border-r border-bkpk-border-subtle py-4">
                    <span className="font-display text-[34px] sm:text-[40px] leading-none text-bkpk-text-primary tabular-nums">{day}</span>
                    <span className="label-caps text-[11px] text-bkpk-text-muted mt-1">{month}</span>
                    <span className="text-[11px] text-bkpk-text-muted">{weekday}</span>
                    {!isPlayed && time && <span className="text-[12px] font-semibold text-bkpk-text-primary tabular-nums mt-1">{time}</span>}
                </div>

                <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 p-4 sm:p-5">
                    {/* Para i meta */}
                    <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="kicker text-[12px]">{league || roundLabel || 'Liga KALK'}</span>
                            {isPlayed && (
                                <span className={cn(
                                    'status-flag',
                                    isWin ? 'bg-bkpk-text-primary text-bkpk-bg border-bkpk-text-primary' : 'text-bkpk-text-secondary'
                                )}>
                                    {isWin ? 'Wygrana' : 'Porażka'}
                                </span>
                            )}
                        </div>
                        <h3 className="text-[22px] sm:text-[26px] leading-none text-bkpk-text-primary truncate">
                            BeKaPaKa <span className="text-bkpk-text-muted">–</span> {opponent}
                        </h3>
                        {venue && (
                            <div className="flex items-center gap-1.5 text-bkpk-text-muted text-xs">
                                <MapPin className="w-3.5 h-3.5" aria-hidden />
                                {venue}
                            </div>
                        )}
                    </div>

                    {/* Wynik / status */}
                    <div className="flex items-center gap-4 sm:gap-6 justify-between md:justify-end shrink-0">
                        {isPlayed ? (
                            <div className="flex flex-col items-start md:items-end">
                                <div
                                    className="font-display text-[36px] sm:text-[44px] leading-none tabular-nums flex items-center gap-2"
                                    aria-label={`BeKaPaKa ${scoreUs ?? '-'}, ${opponent} ${scoreThem ?? '-'}`}
                                >
                                    <span className={cn('text-bkpk-text-primary', !isWin && 'outline-text text-bkpk-text-secondary')}>
                                        {scoreUs}
                                    </span>
                                    <span className="text-bkpk-text-muted text-2xl" aria-hidden>:</span>
                                    <span className={cn('text-bkpk-text-primary', isWin && 'outline-text text-bkpk-text-secondary')}>
                                        {scoreThem}
                                    </span>
                                </div>
                                {mvp && (
                                    <div className="flex items-center gap-1 mt-1.5 label-caps text-[11px] text-bkpk-medal-gold">
                                        <Trophy className="w-3 h-3" aria-hidden />
                                        <span>MVP: {mvp}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="status-flag text-bkpk-primary">Nadchodzący</span>
                        )}

                        <span className="flex items-center justify-center w-11 h-11 border border-bkpk-border-strong text-bkpk-text-primary group-hover:bg-bkpk-primary group-hover:border-bkpk-primary transition-colors">
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                    </div>
                </div>
            </div>
        </BkpkCard>
    );
}
