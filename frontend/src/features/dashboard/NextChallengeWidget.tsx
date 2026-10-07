import { motion } from 'framer-motion';
import { LucideIcon, Trophy, Calendar, MapPin, AlertCircle } from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import BkpkButton from '../../shared/ui/BkpkButton';
import { useNavigate } from 'react-router-dom';

export interface NextChallengeWidgetProps {
    opponent: string;
    date: string;
    time: string;
    location: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    homeAway: 'Dom' | 'Wyjazd';
}

export function NextChallengeWidget({
    opponent,
    date,
    time,
    location,
    difficulty,
    homeAway
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
                            <span className="text-sm font-semibold tabular-nums text-bkpk-text-primary">{date} @ {time}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-bkpk-text-muted">
                        <MapPin className="w-4 h-4 text-bkpk-text-secondary shrink-0" aria-hidden="true" />
                        <div className="flex flex-col gap-0.5">
                            <span className="label-caps text-xs text-bkpk-text-secondary">Lokalizacja</span>
                            <span className="text-sm font-semibold text-bkpk-text-primary">{location} ({homeAway})</span>
                        </div>
                    </div>
                </div>

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
                </div>

                <BkpkButton
                    variant="ghost"
                    className="w-full mt-2 group/btn"
                    onClick={() => navigate('/scouting')}
                >
                    Zobacz Raport Scoutingu
                    <motion.span
                        className="ml-2"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        →
                    </motion.span>
                </BkpkButton>
            </div>

        </BkpkCard>
    );
}
