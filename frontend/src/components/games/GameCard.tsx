import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

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

interface GameCardProps {
    game: Game;
}

export default function GameCard({ game }: GameCardProps) {
    const gameDate = new Date(game.date);
    const isPlayed = game.result !== null && game.result !== undefined;
    const isHome = game.homeAway === 'home';

    return (
        <Link
            to={`/games/${game.id}`}
            className={clsx(
                "block bg-bkpk-surface-elevated rounded-bkpk-md p-4 no-underline text-inherit transition-all duration-200 border-l-4 border-transparent",
                "hover:-translate-y-0.5 hover:shadow-lg",
                {
                    "border-l-bkpk-success": game.result === 'W',
                    "border-l-bkpk-danger": game.result === 'L',
                    "border-l-bkpk-info": !game.result
                }
            )}
        >
            <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col items-center bg-bkpk-surface-tint-2 rounded-lg py-2 px-3 min-w-[60px]">
                    <div className="text-2xl font-bold text-bkpk-text-primary leading-none font-outfit">
                        {gameDate.toLocaleDateString('pl-PL', { day: 'numeric' })}
                    </div>
                    <div className="text-xs text-bkpk-text-secondary uppercase mt-0.5">
                        {gameDate.toLocaleDateString('pl-PL', { month: 'short' })}
                    </div>
                </div>

                <div className="text-2xl">
                    🏀
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-bkpk-text-muted uppercase font-semibold tracking-wider">vs</span>
                    <span className="text-lg font-semibold text-bkpk-text-primary font-outfit">{game.opponent}</span>
                </div>

                {isPlayed ? (
                    <div className="flex items-center gap-2 text-3xl font-bold my-2 font-outfit">
                        <span className={clsx(
                            game.result === 'W' && "text-bkpk-success",
                            game.result === 'L' && "text-bkpk-text-danger",
                            !game.result && "text-bkpk-text-primary"
                        )}>{game.scoreUs}</span>
                        <span className="text-bkpk-text-muted text-xl">-</span>
                        <span className={clsx(
                            game.result === 'W' && "text-bkpk-text-muted",
                            game.result === 'L' && "text-bkpk-text-primary",
                            !game.result && "text-bkpk-text-secondary"
                        )}>{game.scoreThem}</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 my-2">
                        <span className="text-xs text-bkpk-info font-semibold uppercase tracking-wider">Zaplanowany</span>
                        <span className="text-xl font-bold text-bkpk-text-primary font-outfit">
                            {gameDate.toLocaleTimeString('pl-PL', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                )}

                {game.result && (
                    <div className={clsx(
                        "inline-block px-3 py-1 rounded-bkpk-md text-xs font-bold uppercase self-start tracking-wider",
                        game.result === 'W' ? "bg-bkpk-success/20 text-bkpk-success" : "bg-bkpk-danger/15 text-bkpk-text-danger-subtle"
                    )}>
                        {game.result === 'W' ? 'Zwycięstwo' : 'Porażka'}
                    </div>
                )}

                {game.mvp && (
                    <div className="text-sm text-bkpk-primary font-medium mt-1">
                        ⭐ MVP: {game.mvp}
                    </div>
                )}
            </div>
        </Link>
    );
}
