import { useState, useMemo } from 'react';
import GameCard from './GameCard';
import GameFilters from './GameFilters';

interface Game {
    id: string;
    date: string;
    opponent: string;
    result?: 'W' | 'L' | null;
    scoreUs?: number | null;
    scoreThem?: number | null;
    homeAway?: string;
    mvp?: string | null;
}

interface GamesListProps {
    games: Game[];
    loading?: boolean;
}

export default function GamesList({ games, loading }: GamesListProps) {
    const [resultFilter, setResultFilter] = useState<'all' | 'W' | 'L'>('all');
    const [homeAwayFilter, setHomeAwayFilter] = useState<'all' | 'home' | 'away'>('all');
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc'>('date-desc');

    // Filtrowanie i sortowanie
    const filteredGames = useMemo(() => {
        let filtered = games.filter(g => g !== null && typeof g === 'object');

        // Filtr wyniku
        if (resultFilter !== 'all') {
            filtered = filtered.filter(game => game.result === resultFilter);
        }

        // Filtr lokalizacji
        if (homeAwayFilter !== 'all') {
            filtered = filtered.filter(game => game.homeAway === homeAwayFilter);
        }

        // Sortowanie
        filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortBy === 'date-desc' ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    }, [games, resultFilter, homeAwayFilter, sortBy]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-bkpk-text-secondary">
                <div className="text-5xl animate-spin mb-4">⏳</div>
                <p className="font-medium">Ładowanie meczów...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <GameFilters
                resultFilter={resultFilter}
                homeAwayFilter={homeAwayFilter}
                sortBy={sortBy}
                onResultChange={setResultFilter}
                onHomeAwayChange={setHomeAwayFilter}
                onSortChange={setSortBy}
            />

            {filteredGames.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-bkpk-surface-tint-1 rounded-xl border border-dashed border-bkpk-border-strong">
                    <div className="text-6xl mb-4 opacity-50 grayscale">🏀</div>
                    <h3 className="text-xl font-bold text-bkpk-text-primary mb-2 font-outfit">Brak meczów</h3>
                    <p className="text-bkpk-text-secondary max-w-sm mx-auto">
                        {games.length === 0
                            ? 'Nie ma jeszcze żadnych meczów w systemie.'
                            : 'Nie znaleziono meczów spełniających wybrane kryteria.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-bkpk-text-secondary px-2">
                        <span>Znaleziono: <strong className="text-bkpk-primary">{filteredGames.length}</strong> {filteredGames.length === 1 ? 'mecz' : 'meczów'}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredGames.map(game => (
                            <GameCard key={game.id} game={game} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
