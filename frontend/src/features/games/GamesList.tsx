import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
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
            <div className="grid gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-bkpk-surface/50 animate-pulse rounded-bkpk-lg" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Filters */}
            <div className="flex bg-bkpk-surface-tint-2 p-1 rounded-xl border border-bkpk-border-strong self-start w-fit">
                {[
                    { id: 'all', label: 'Wszystkie' },
                    { id: 'played', label: 'Rozegrane' },
                    { id: 'upcoming', label: 'Nadchodzące' }
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === f.id
                            ? bkpkActivePillClass
                            : "text-bkpk-text-muted hover:text-bkpk-text-secondary"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="grid gap-6">
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
                    <div className="text-center py-20 bg-bkpk-glass border border-bkpk-glass-border rounded-bkpk-lg">
                        <p className="text-bkpk-text-muted font-medium">Nie znaleziono meczów spełniających kryteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
