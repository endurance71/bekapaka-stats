import DashboardCard from './DashboardCard';
import { clsx } from 'clsx';

interface Game {
    result?: 'W' | 'L' | null;
    date: string;
    opponent?: string;
    scoreUs?: number | null;
    scoreThem?: number | null;
}

interface SeasonRecordCardProps {
    games: Game[];
    totalMatches?: number;
    remainingMatches?: number;
    loading?: boolean;
}

export default function SeasonRecordCard({ games, totalMatches, remainingMatches, loading }: SeasonRecordCardProps) {
    if (loading) {
        return (
            <DashboardCard title="Bilans Sezonu" icon="📈">
                <div className="flex items-center justify-center p-8 text-bkpk-text-secondary animate-pulse">Ładowanie...</div>
            </DashboardCard>
        );
    }

    const wins = games.filter(g => g.result === 'W').length;
    const losses = games.filter(g => g.result === 'L').length;
    const currentTotal = wins + losses;

    // Ostatnie 5 meczów
    const recentGames = games
        .filter(g => g.result)
        .slice(0, 5)
        .reverse(); // Najstarsze pierwsze

    // Aktualna seria
    let currentStreak = 0;
    let streakType: 'W' | 'L' | null = null;

    for (let i = 0; i < games.length; i++) {
        const game = games[i];
        if (!game.result) continue;

        if (!streakType) {
            streakType = game.result;
            currentStreak = 1;
        } else if (game.result === streakType) {
            currentStreak++;
        } else {
            break;
        }
    }

    return (
        <DashboardCard title="Bilans Sezonu" icon="📈">
            <div className="flex flex-col gap-6">
                <div className="flex justify-center items-center gap-6">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-5xl font-bold font-outfit text-bkpk-success">{wins}</span>
                        <span className="text-xs text-bkpk-text-secondary uppercase font-semibold tracking-wider">Zwycięstwa</span>
                    </div>
                    <div className="text-3xl text-bkpk-text-muted font-outfit opacity-50">-</div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-5xl font-bold font-outfit text-bkpk-text-danger">{losses}</span>
                        <span className="text-xs text-bkpk-text-secondary uppercase font-semibold tracking-wider">Porażki</span>
                    </div>
                </div>

                <div className="text-center mb-4 text-sm text-bkpk-text-muted">
                    Rozegrane: {currentTotal} {totalMatches ? `/ ${totalMatches}` : ''}
                    {remainingMatches !== undefined && (
                        <span> • Pozostało: {remainingMatches}</span>
                    )}
                </div>

                {recentGames.length > 0 && (
                    <div className="flex flex-col gap-2 items-center">
                        <div className="text-xs text-bkpk-text-secondary uppercase tracking-wide opacity-80">Ostatnie 5 meczów:</div>
                        <div className="flex gap-2">
                            {recentGames.map((game, i) => {
                                const scoreUs = game.scoreUs ?? 0;
                                const scoreThem = game.scoreThem ?? 0;
                                const opponent = game.opponent || 'Rywalem';
                                const resultLabel = game.result === 'W' ? 'Zwycięstwo' : 'Porażka';
                                const tooltip = `${resultLabel} z ${opponent} (${scoreUs}:${scoreThem})`;

                                return (
                                    <span
                                        key={i}
                                        className={clsx(
                                            "w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-transform hover:scale-110 cursor-help relative group",
                                            game.result === 'W' ? "bg-bkpk-success/10" : "bg-bkpk-danger/10"
                                        )}
                                        aria-label={tooltip}
                                    >
                                        {game.result === 'W' ? '🟢' : '🔴'}
                                        {/* Simple CSS-only tooltip for now, or browser title */}
                                        <title>{tooltip}</title>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {currentStreak > 0 && streakType && (
                    <div className="text-center p-3 bg-bkpk-surface-tint-2 rounded-xl border border-bkpk-border-subtle">
                        <span className="text-xs text-bkpk-text-secondary uppercase tracking-wider mr-2">Seria:</span>
                        <span className={clsx(
                            "text-sm font-bold uppercase",
                            streakType === 'W' ? "text-bkpk-success" : "text-bkpk-text-danger"
                        )}>
                            {currentStreak} {streakType === 'W' ? 'zwycięstw' : 'porażek'}
                        </span>
                    </div>
                )}

                {currentTotal === 0 && (
                    <div className="text-center p-4 text-bkpk-text-muted italic">Brak rozegranych meczów w sezonie</div>
                )}
            </div>
        </DashboardCard>
    );
}
