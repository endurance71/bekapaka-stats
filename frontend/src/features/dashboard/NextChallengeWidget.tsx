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
                        <span className="text-bkpk-primary text-xs font-bold uppercase tracking-[0.2em]">Następny Mecz</span>
                        <h3 className="text-2xl font-bold font-outfit mt-1 group-hover:text-bkpk-primary transition-colors">
                            {opponent}
                        </h3>
                    </div>
                    <div className="bg-bkpk-primary/10 p-2 rounded-xl">
                        <Trophy className="w-6 h-6 text-bkpk-primary" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-bkpk-text-muted">
                        <Calendar className="w-4 h-4 text-bkpk-primary shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-xs uppercase font-bold text-bkpk-text-secondary">Data</span>
                            <span className="text-sm font-bold text-bkpk-text-primary">{date} @ {time}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-bkpk-text-muted">
                        <MapPin className="w-4 h-4 text-bkpk-primary shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-xs uppercase font-bold text-bkpk-text-secondary">Lokalizacja</span>
                            <span className="text-sm font-bold text-bkpk-text-primary">{location} ({homeAway})</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-bkpk-text-secondary">
                        <span>Poziom trudności</span>
                        <span className="text-bkpk-primary font-black">Poziom {difficulty}/5</span>
                    </div>
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((level) => (
                            <div
                                key={level}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${level <= difficulty
                                    ? "bg-bkpk-primary shadow-bkpk-primary"
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

            {/* Background patterns */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-bkpk-primary/5 rounded-full blur-3xl group-hover:bg-bkpk-primary/10 transition-colors pointer-events-none" />
        </BkpkCard>
    );
}
