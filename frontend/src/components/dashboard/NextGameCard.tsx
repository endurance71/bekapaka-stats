import DashboardCard from './DashboardCard';
import { clsx } from 'clsx';

interface Game {
    id: string;
    date: string;
    opponent: string;
    homeAway?: string;
}

interface NextGameCardProps {
    game: Game | null;
    loading?: boolean;
}

export default function NextGameCard({ game, loading }: NextGameCardProps) {
    if (loading) {
        return (
            <DashboardCard title="Następny Mecz" icon="📅">
                <div className="flex items-center justify-center p-8 text-bkpk-text-secondary animate-pulse">Ładowanie...</div>
            </DashboardCard>
        );
    }

    if (!game) {
        return (
            <DashboardCard title="Następny Mecz" icon="📅">
                <div className="p-8 text-center text-bkpk-text-muted border border-dashed border-bkpk-border-strong rounded-bkpk-md">Brak zaplanowanych meczów</div>
            </DashboardCard>
        );
    }

    const gameDate = new Date(game.date);
    if (isNaN(gameDate.getTime())) {
        return (
            <DashboardCard title="Następny Mecz" icon="📅">
                <div className="p-8 text-center text-bkpk-text-danger bg-bkpk-danger/10 rounded-bkpk-md">Błąd daty meczu</div>
            </DashboardCard>
        );
    }
    const now = new Date();
    const daysUntil = Math.ceil((gameDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <DashboardCard title="Następny Mecz" icon="📅">
            <div className="flex flex-col gap-4 items-center">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-bkpk-text-muted uppercase font-semibold tracking-wider">vs</span>
                    <span className="text-2xl font-bold font-outfit text-bkpk-text-primary text-center">{game.opponent}</span>
                </div>

                <div className="text-center">
                    <div className="text-base text-bkpk-text-primary mb-1 capitalize">
                        {gameDate.toLocaleDateString('pl-PL', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </div>
                    <div className="text-xl font-bold text-bkpk-primary font-outfit">
                        {gameDate.toLocaleTimeString('pl-PL', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>

                {daysUntil >= 0 && (
                    <div className="flex flex-col items-center p-4 bg-bkpk-primary/10 rounded-xl min-w-[120px]">
                        <span className="text-4xl font-bold text-bkpk-primary leading-none font-outfit">{daysUntil}</span>
                        <span className="text-sm text-bkpk-text-secondary mt-1 font-medium uppercase tracking-tighter">
                            {daysUntil === 0 ? 'Dzisiaj!' : daysUntil === 1 ? 'dzień' : 'dni'}
                        </span>
                    </div>
                )}
            </div >
        </DashboardCard >
    );
}
