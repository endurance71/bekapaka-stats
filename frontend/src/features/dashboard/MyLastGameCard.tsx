import { Link } from 'react-router-dom';
import BkpkCard from '../../shared/ui/BkpkCard';
import { formatMatchDate } from '../../shared/lib/matchUtils';
import { cn } from '../../shared/lib/utils';

export interface MyLastGame {
    id: string;
    date: string | null;
    opponent: string;
    scoreUs: number | null;
    scoreThem: number | null;
    result: 'W' | 'L' | null;
    pts: number;
    reb: number;
    ast: number;
    eval: number | null;
    minutes: number | null;
    starter: boolean;
}

/** Start → „Mój ostatni mecz”: wynik drużyny i moja linijka (pkt, zb, as, eval) z linkiem do meczu. */
export default function MyLastGameCard({ game, loading }: { game: MyLastGame | null; loading?: boolean }) {
    if (loading) return <div className="h-full min-h-[180px] bg-bkpk-surface border border-bkpk-border-subtle animate-pulse" />;
    if (!game) {
        return (
            <BkpkCard variant="glass" className="h-full">
                <span className="kicker text-bkpk-text-primary">Mój ostatni mecz</span>
                <p className="mt-4 text-sm text-bkpk-text-muted">Brak Twojego meczu w tym sezonie. Statystyki pojawią się po pierwszym meczu, w którym zagrasz.</p>
            </BkpkCard>
        );
    }
    const stats = [
        { label: 'Pkt', value: game.pts },
        { label: 'Zb', value: game.reb },
        { label: 'As', value: game.ast },
        { label: 'Eval', value: game.eval ?? '–' },
    ];
    return (
        <Link to={`/games/${game.id}`} className="block h-full group">
            <BkpkCard variant="glass" hoverEffect className="h-full">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <span className="kicker text-bkpk-text-primary">Mój ostatni mecz</span>
                        <p className="mt-3 font-display uppercase text-[22px] leading-none text-bkpk-text-primary truncate">vs {game.opponent}</p>
                        <p className="mt-1 text-xs text-bkpk-text-muted">
                            {game.date ? formatMatchDate(game.date) : ''}
                            {game.minutes != null ? ` · ${game.minutes} min` : ''}
                            {game.starter ? ' · pierwsza piątka' : ''}
                        </p>
                    </div>
                    {game.result && (
                        <span className={cn('status-flag shrink-0 tabular-nums', game.result === 'W' ? 'bg-bkpk-text-primary text-bkpk-bg border-bkpk-text-primary' : 'text-bkpk-text-secondary')}>
                            {game.result === 'W' ? 'W' : 'P'} {game.scoreUs}:{game.scoreThem}
                        </span>
                    )}
                </div>
                <dl className="mt-5 grid grid-cols-4 border-t-2 border-bkpk-text-primary">
                    {stats.map((s, i) => (
                        <div key={s.label} className={cn('pt-3 px-2', i > 0 && 'border-l border-bkpk-border-subtle')}>
                            <dt className="label-caps text-[11px] text-bkpk-text-muted">{s.label}</dt>
                            <dd className="font-display text-3xl leading-none tabular-nums text-bkpk-text-primary mt-1">{s.value}</dd>
                        </div>
                    ))}
                </dl>
            </BkpkCard>
        </Link>
    );
}
