import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Medal } from 'lucide-react';
import { BkpkCard } from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';
import { resolvePlayerPhoto } from '../../shared/lib/playerUtils';
import { formatStatFixed } from '../../shared/lib/formatStat';

interface Player {
    id: string;
    firstName: string;
    lastName: string;
    ppg: number;
    rpg?: number;
    apg?: number;
    eval?: number | null;
    gamesPlayed?: number;
    photo?: string | null;
    data?: any;
    kalkPlayer?: any;
}

interface TopPlayersCardProps {
    players: Player[];
    loading?: boolean;
}

function resolvePlayerEval(player: Player): number | null {
    if (player.eval != null) return player.eval;
    return null;
}

export default function TopPlayersCard({ players, loading }: TopPlayersCardProps) {
    const topPlayers = useMemo(() => {
        return [...players]
            .sort((a, b) => (b.ppg ?? 0) - (a.ppg ?? 0))
            .slice(0, 3);
    }, [players]);

    if (loading) {
        return (
            <BkpkCard title="Top 3 Zawodnicy" icon={<Star className="w-5 h-5 text-bkpk-primary" />}>
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-bkpk-border-strong border-t-bkpk-primary rounded-full animate-spin" />
                </div>
            </BkpkCard>
        );
    }

    const hasAnyStats = topPlayers.some((p) => (p.ppg ?? 0) > 0 || (p.gamesPlayed ?? 0) > 0);

    if (topPlayers.length === 0 || !hasAnyStats) {
        return (
            <BkpkCard title="Top 3 Zawodnicy" icon={<Star className="w-5 h-5 text-bkpk-primary" />}>
                <div className="flex flex-col items-center justify-center py-12 text-bkpk-text-muted text-center px-4">
                    <Trophy className="w-12 h-12 mb-4 text-bkpk-text-muted" aria-hidden="true" />
                    <p className="label-caps text-sm text-bkpk-text-primary">Brak statystyk meczowych</p>
                    <p className="text-xs text-bkpk-text-muted mt-1">Liderzy zespołu pojawią się po rozegraniu pierwszych meczów w sezonie.</p>
                </div>
            </BkpkCard>
        );
    }

    return (
        <BkpkCard
            title="Top 3 Zawodnicy"
            icon={<Star className="w-5 h-5 text-bkpk-primary" />}
            className="h-full"
        >
            <div className="space-y-2">
                {topPlayers.map((player, index) => {
                    const isFirst = index === 0;
                    const evalVal = resolvePlayerEval(player);
                    return (
                        <motion.div
                            key={player.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "group relative flex items-center gap-4 p-3 sm:p-4 border transition-colors duration-200",
                                isFirst
                                    ? "bg-bkpk-bg border-bkpk-border-strong border-l-4 border-l-bkpk-medal-gold"
                                    : "bg-bkpk-bg border-bkpk-border-subtle hover:border-bkpk-border-strong"
                            )}
                        >
                             <div className="relative">
                                 <div className="w-12 h-12 overflow-hidden bg-bkpk-surface-tint-2 border border-bkpk-border-strong flex items-center justify-center relative">
                                     <img
                                         src={resolvePlayerPhoto(player)}
                                         onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                                         className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                                         loading="lazy"
                                         decoding="async"
                                         alt=""
                                     />
                                     <div className={cn(
                                         "absolute bottom-0 right-0 w-5 h-5 flex items-center justify-center font-display text-[12px] leading-none tabular-nums",
                                         index === 0 ? "bg-bkpk-medal-gold text-bkpk-bg" :
                                             index === 1 ? "bg-bkpk-medal-silver text-bkpk-bg" :
                                                 "bg-bkpk-medal-bronze text-bkpk-bg"
                                     )}>
                                         {index + 1}
                                     </div>
                                 </div>
                                 {isFirst && (
                                     <Medal className="absolute -top-1.5 -left-1.5 w-5 h-5 text-bkpk-medal-gold z-20" aria-hidden="true" />
                                 )}
                             </div>

                            <div className="flex-1 min-w-0">
                                <div className="font-display font-extrabold uppercase text-lg leading-tight text-bkpk-text-primary truncate">
                                    {player.firstName} {player.lastName}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="text-2xl leading-none font-display font-extrabold tabular-nums text-bkpk-text-primary">
                                        {formatStatFixed(player.ppg)} <span className="label-caps text-[11px] text-bkpk-text-muted">PPG</span>
                                    </div>
                                    {(player.rpg ?? 0) > 0 && (
                                        <div className="text-sm font-semibold tabular-nums text-bkpk-text-secondary">
                                            {formatStatFixed(player.rpg)} <span className="label-caps text-[11px] text-bkpk-text-muted">REB</span>
                                        </div>
                                    )}
                                    <div className="text-sm font-semibold tabular-nums text-bkpk-text-secondary">
                                        {evalVal != null && evalVal > 0
                                            ? formatStatFixed(evalVal)
                                            : '—'}{' '}
                                        <span className="label-caps text-[11px] text-bkpk-text-muted">EVAL</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </BkpkCard>
    );
}
