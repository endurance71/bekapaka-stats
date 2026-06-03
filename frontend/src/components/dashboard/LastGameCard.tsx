import { useMemo } from 'react';
import DashboardCard from './DashboardCard';
import { clsx } from 'clsx';

interface Game {
    id: string;
    date: string;
    opponent: string;
    result?: 'W' | 'L' | null;
    scoreUs?: number | null;
    scoreThem?: number | null;
    mvp?: string | null;
    playerStats?: any;
}

interface LastGameCardProps {
    game: Game | null;
    loading?: boolean;
}

export default function LastGameCard({ game, loading }: LastGameCardProps) {
    const mvpStats = useMemo(() => {
        if (!game?.playerStats || !game?.mvp) return null;

        try {
            const stats = typeof game.playerStats === 'string'
                ? JSON.parse(game.playerStats)
                : game.playerStats;

            if (!Array.isArray(stats)) return null;

            const mvpData = stats.find((p: any) => p.name === game.mvp);
            return mvpData;
        } catch {
            return null;
        }
    }, [game]);

    if (loading) {
        return (
            <DashboardCard title="Ostatni Mecz" icon="🏀">
                <div className="flex items-center justify-center p-8 text-bkpk-text-secondary animate-pulse">Ładowanie...</div>
            </DashboardCard>
        );
    }

    if (!game) {
        return (
            <DashboardCard title="Ostatni Mecz" icon="🏀">
                <div className="p-8 text-center text-bkpk-text-muted border border-dashed border-bkpk-border-strong rounded-bkpk-md">Brak danych o ostatnim meczu</div>
            </DashboardCard>
        );
    }

    const score = game.scoreUs !== null && game.scoreThem !== null
        ? `${game.scoreUs} - ${game.scoreThem}`
        : '—';

    return (
        <DashboardCard title="Ostatni Mecz" icon="🏀">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-y-2">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-bkpk-text-primary font-outfit">BeKaPaKa</span>
                        <span className={clsx(
                            "font-mono text-xl font-bold px-2 py-0.5 rounded",
                            game.result === 'W' ? "bg-bkpk-success/10 text-bkpk-success" :
                                game.result === 'L' ? "bg-bkpk-danger/15 text-bkpk-text-danger-subtle" : "text-bkpk-text-secondary"
                        )}>{score}</span>
                        <span className="font-bold text-bkpk-text-primary font-outfit text-right">{game.opponent}</span>
                    </div>

                    {game.result && (
                        <span className={clsx(
                            "px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider",
                            game.result === 'W' ? "bg-bkpk-success/20 text-bkpk-success" : "bg-bkpk-danger/15 text-bkpk-text-danger-subtle"
                        )}>
                            {game.result === 'W' ? 'Zwycięstwo' : 'Porażka'}
                        </span>
                    )}
                </div>

                <div className="text-sm text-bkpk-text-secondary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-bkpk-text-muted"></span>
                    {new Date(game.date).toLocaleDateString('pl-PL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}
                </div>

                {game.mvp && (
                    <div className="mt-2 pt-4 border-t border-bkpk-border-strong flex flex-col gap-1">
                        <div className="text-xs font-bold text-bkpk-primary uppercase tracking-widest">⭐ MVP Meczu</div>
                        <div className="flex items-baseline justify-between">
                            <div className="text-lg font-bold text-bkpk-text-primary font-outfit">{game.mvp}</div>
                            {mvpStats && (
                                <div className="text-sm font-medium text-bkpk-text-secondary">
                                    {mvpStats.points && <span className="text-bkpk-text-primary font-bold">{mvpStats.points} <span className="text-xs font-normal text-bkpk-text-muted">PKT</span></span>}
                                    {mvpStats.rebounds && <span className="ml-2">{mvpStats.rebounds} <span className="text-xs text-bkpk-text-muted">ZB</span></span>}
                                    {mvpStats.assists && <span className="ml-2">{mvpStats.assists} <span className="text-xs text-bkpk-text-muted">AST</span></span>}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardCard>
    );
}
