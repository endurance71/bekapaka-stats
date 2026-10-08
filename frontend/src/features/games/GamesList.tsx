import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { CalendarIcon as Calendar } from '../../shared/ui/BrandIcon';
import MatchCard from '../../shared/ui/MatchCard';
import { bkpkActivePillClass } from '../../shared/ui/BkpkButton';
import { useNavigate } from 'react-router-dom';

export interface Game {
    id: string;
    date: string;
    opponent: string;
    result?: 'W' | 'L' | null;
    scoreUs?: number | null;
    scoreThem?: number | null;
    homeAway?: string;
    mvp?: string | null;
    venue?: string | null;
    roundLabel?: string | null;
}

export interface GamesListProps {
    games: Game[];
    loading?: boolean;
}

export default function GamesList({ games, loading }: GamesListProps) {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | 'played' | 'upcoming'>('all');

    const filteredGames = useMemo(() => {
        return games.filter(g => {
            if (filter === 'played') return g.result !== null && g.result !== undefined;
            if (filter === 'upcoming') return g.result === null || g.result === undefined;
            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [games, filter]);

    if (loading) {
        return (
            <div className="grid gap-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-bkpk-surface border border-bkpk-border-subtle animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Filters */}
            <div className="flex border border-bkpk-border-strong self-start w-fit">
                {[
                    { id: 'all', label: 'Wszystkie' },
                    { id: 'played', label: 'Rozegrane' },
                    { id: 'upcoming', label: 'Nadchodzące' }
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={`px-4 py-2.5 min-h-[44px] label-caps text-xs transition-colors touch-manipulation ${filter === f.id
                            ? bkpkActivePillClass
                            : "text-bkpk-text-secondary hover:text-bkpk-text-primary"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="grid gap-3">
                {filteredGames.map((game, idx) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.4 }}
                    >
                        <MatchCard
                            {...game}
                            onClick={(id) => navigate(`/games/${id}`)}
                        />
                    </motion.div>
                ))}

                {filteredGames.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-bkpk-surface border border-bkpk-border-subtle text-center space-y-3 px-4">
                        <Calendar className="w-12 h-12 text-bkpk-text-muted" aria-hidden="true" />
                        <div className="space-y-1">
                            <p className="font-display text-xl uppercase text-bkpk-text-primary">Brak meczów w wybranym sezonie</p>
                            <p className="text-bkpk-text-muted text-sm max-w-sm">Mecze pojawią się w terminarzu po pobraniu danych z ligi KALK lub dodaniu ich w panelu administracyjnym.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
