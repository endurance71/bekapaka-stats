import { TrophyIcon as Trophy, CalendarIcon as Calendar, VenueIcon as MapPin } from '../../shared/ui/BrandIcon';
import BkpkCard from '../../shared/ui/BkpkCard';
import BkpkButton from '../../shared/ui/BkpkButton';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface NextChallengeWidgetProps {
    opponent: string;
    /** „5. miejsce · 0–1” */
    opponentInfo?: string | null;
    /** ID meczu (KALK) — link do zapowiedzi */
    matchId?: string | null;
    date: string;
    time: string;
    /** Hala z terminarza KALK; brak → wiersz ukryty */
    location?: string | null;
    /** null = rywal bez meczów w sezonie (bez paska) */
    difficulty: 1 | 2 | 3 | 4 | 5 | null;
    /** Gospodarz formalny KALK (wszystkie mecze w jednej hali) */
    host: string;
    /** Dzień meczowy (zbiórka, strój, kalendarz) pod datą i halą */
    children?: ReactNode;
}

export function NextChallengeWidget({
    opponent,
    opponentInfo,
    matchId,
    date,
    time,
    location,
    difficulty,
    host,
    children
}: NextChallengeWidgetProps) {
    const navigate = useNavigate();

    return (
        <BkpkCard variant="glass" className="relative group overflow-hidden">
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="kicker text-bkpk-text-primary">Następny Mecz</span>
                        <h3 className="text-[28px] leading-none font-display text-bkpk-text-primary mt-3">
                            {opponent}
                        </h3>
                        {opponentInfo && <span className="mt-1.5 text-xs text-bkpk-text-muted tabular-nums">{opponentInfo}</span>}
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 border border-bkpk-border-strong shrink-0">
                        <Trophy className="w-5 h-5 text-bkpk-primary" aria-hidden="true" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-bkpk-border-subtle">
                    <div className="flex items-center gap-3 text-bkpk-text-muted">
                        <Calendar className="w-4 h-4 text-bkpk-text-secondary shrink-0" aria-hidden="true" />
                        <div className="flex flex-col gap-0.5">
                            <span className="label-caps text-xs text-bkpk-text-secondary">Data</span>
                            <span className="text-sm font-semibold tabular-nums text-bkpk-text-primary">{date}, {time}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-bkpk-text-muted">
                        <MapPin className="w-4 h-4 text-bkpk-text-secondary shrink-0" aria-hidden="true" />
                        <div className="flex flex-col gap-0.5">
                            <span className="label-caps text-xs text-bkpk-text-secondary">Hala</span>
                            <span className="text-sm font-semibold text-bkpk-text-primary">{location || '—'}</span>
                            <span className="text-xs text-bkpk-text-muted">gospodarz: {host}</span>
                        </div>
                    </div>
                </div>

                {children}

                {difficulty != null && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center label-caps text-xs text-bkpk-text-secondary">
                        <span>Poziom trudności</span>
                        <span className="text-bkpk-text-primary tabular-nums">Poziom {difficulty}/5</span>
                    </div>
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((level) => (
                            <div
                                key={level}
                                className={`h-1.5 flex-1 transition-colors duration-300 ${level <= difficulty
                                    ? "bg-bkpk-primary"
                                    : "bg-bkpk-surface-tint-2"
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-bkpk-text-muted">Z bilansu rywala w sezonie i meczów z BeKaPaKa.</p>
                </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-2">
                    {matchId ? (
                        <BkpkButton variant="ghost" className="w-full" onClick={() => navigate(`/games/${matchId}`)}>
                            Szczegóły
                        </BkpkButton>
                    ) : <span />}
                    <BkpkButton variant="primary" className="w-full" onClick={() => navigate('/rywal')}>
                        Raport o rywalu
                    </BkpkButton>
                </div>
            </div>

        </BkpkCard>
    );
}
