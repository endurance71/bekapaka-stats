import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import BkpkCard from './BkpkCard';
import { Calendar, MapPin, ChevronRight, Trophy } from 'lucide-react';

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
    onClick?: (id: string) => void;
}

export default function MatchCard({
    id,
    opponent,
    date,
    result,
    scoreUs,
    scoreThem,
    homeAway,
    mvp,
    league,
    onClick
}: MatchCardProps) {
    const isPlayed = result !== undefined && result !== null;
    const isWin = result === 'W';

    return (
        <BkpkCard
            onClick={() => onClick?.(id)}
            className="group relative cursor-pointer border-bkpk-border-strong"
            hoverEffect
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Match Info */}
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-bkpk-primary px-2 py-0.5 bg-bkpk-primary/10 rounded-full">
                            {league || 'Mecz Sezonowy'}
                        </span>
                        {isPlayed && (
                            <span className={cn(
                                "text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                                isWin ? "bg-bkpk-success/20 text-bkpk-success" : "bg-bkpk-danger/15 text-bkpk-text-danger-subtle"
                            )}>
                                {isWin ? 'Wygrana' : 'Porażka'}
                            </span>
                        )}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold font-outfit text-bkpk-text-primary group-hover:text-bkpk-primary transition-colors">
                            {homeAway === 'home' ? 'BeKaPaKa' : opponent} vs {homeAway === 'home' ? opponent : 'BeKaPaKa'}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-bkpk-text-muted text-xs">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(date).toLocaleDateString()}
                            </div>
                             <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                KOSiR Koszalin
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score / Status */}
                <div className="flex items-center gap-6 justify-between w-full md:w-auto md:justify-start">
                    {isPlayed ? (
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center">
                                <span className="text-2xl md:text-3xl font-bold font-outfit text-bkpk-text-primary">
                                    {scoreUs} : {scoreThem}
                                </span>
                                {mvp && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-bkpk-warning font-bold uppercase">
                                        <Trophy className="w-3 h-3" />
                                        <span>MVP: {mvp}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 py-2 bg-bkpk-surface-tint-2 rounded-lg border border-bkpk-border-strong text-bkpk-text-muted text-xs font-bold uppercase tracking-wider">
                            Nadchodzący
                        </div>
                    )}

                    <motion.div
                        className="w-10 h-10 rounded-full bg-bkpk-surface-tint-2 border border-bkpk-border-strong flex items-center justify-center group-hover:bg-bkpk-primary group-hover:border-bkpk-primary transition-all"
                        whileHover={{ x: 5 }}
                    >
                        <ChevronRight className="w-5 h-5 text-bkpk-text-primary" />
                    </motion.div>
                </div>
            </div>

            {/* Background Glow */}
            <div className={cn(
                "absolute -inset-1 opacity-0 group-hover:opacity-10 transition-opacity blur-2xl rounded-bkpk-lg -z-10",
                isPlayed ? (isWin ? "bg-bkpk-success" : "bg-bkpk-danger") : "bg-bkpk-primary"
            )} />
        </BkpkCard>
    );
}
