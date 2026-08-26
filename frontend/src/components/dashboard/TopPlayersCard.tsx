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
                    <div className="w-8 h-8 border-4 border-bkpk-primary/20 border-t-bkpk-primary rounded-full animate-spin" />
                </div>
            </BkpkCard>
        );
    }

    const hasAnyStats = topPlayers.some((p) => (p.ppg ?? 0) > 0 || (p.gamesPlayed ?? 0) > 0);

    if (topPlayers.length === 0 || !hasAnyStats) {
        return (
            <BkpkCard title="Top 3 Zawodnicy" icon={<Star className="w-5 h-5 text-bkpk-primary" />}>
                <div className="flex flex-col items-center justify-center py-12 text-bkpk-text-muted text-center px-4">
                    <Trophy className="w-12 h-12 mb-4 opacity-20 text-bkpk-primary" />
                    <p className="font-bold text-sm uppercase tracking-widest text-bkpk-text-primary">Brak statystyk meczowych</p>
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
            <div className="space-y-4">
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
                                "group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300",
                                isFirst
                                    ? "bg-bkpk-primary/10 border border-bkpk-primary/20"
                                    : "bg-bkpk-surface-tint-1 border border-bkpk-border-strong hover:bg-bkpk-surface-tint-2"
                            )}
                        >
                             <div className="relative">
                                 <div className="w-12 h-12 rounded-full overflow-hidden bg-bkpk-surface-tint-2 border border-bkpk-border-strong shadow-lg flex items-center justify-center relative">
                                     <img
                                         src={resolvePlayerPhoto(player)}
                                         onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                                         className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                                         loading="lazy"
                                         decoding="async"
                                         alt=""
                                     />
                                     <div className={cn(
                                         "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-black font-outfit text-[10px] shadow-md border border-bkpk-border-strong",
                                         index === 0 ? "bg-bkpk-medal-gold text-black" :
                                             index === 1 ? "bg-bkpk-medal-silver text-black" :
                                                 "bg-bkpk-medal-bronze text-black"
                                     )}>
                                         {index + 1}
                                     </div>
                                 </div>
                                 {isFirst && (
                                     <Medal className="absolute -top-1.5 -left-1.5 w-5 h-5 text-bkpk-primary drop-shadow-[0_0_8px_rgba(236,167,44,0.45)] z-20" />
                                 )}
                             </div>

                            <div className="flex-1 min-w-0">
                                <div className="font-black font-outfit text-bkpk-text-primary truncate group-hover:text-bkpk-primary transition-colors">
                                    {player.firstName} {player.lastName}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="text-xl font-black font-outfit text-bkpk-primary">
                                        {formatStatFixed(player.ppg)} <span className="text-2xs uppercase tracking-tighter text-bkpk-text-muted">PPG</span>
                                    </div>
                                    {(player.rpg ?? 0) > 0 && (
                                        <div className="text-xs font-bold text-bkpk-text-muted">
                                            {formatStatFixed(player.rpg)} <span className="text-2xs text-bkpk-text-muted">REB</span>
                                        </div>
                                    )}
                                    <div className="text-xs font-bold text-bkpk-text-muted">
                                        {evalVal != null && evalVal > 0
                                            ? formatStatFixed(evalVal)
                                            : '—'}{' '}
                                        <span className="text-2xs text-bkpk-text-muted">EVAL</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 opacity-40">
                                <div className="w-8 h-1 bg-bkpk-primary/40 rounded-full" />
                                <div className="w-12 h-1 bg-bkpk-primary/20 rounded-full" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </BkpkCard>
    );
}
