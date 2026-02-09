import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Medal } from 'lucide-react';
import { BkpkCard } from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';

interface Player {
    id: string;
    firstName: string;
    lastName: string;
    ppg: number;
    rpg?: number;
    apg?: number;
}

interface TopPlayersCardProps {
    players: Player[];
    loading?: boolean;
}

export default function TopPlayersCard({ players, loading }: TopPlayersCardProps) {
    const topPlayers = useMemo(() => {
        return [...players]
            .sort((a, b) => b.ppg - a.ppg)
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

    if (topPlayers.length === 0) {
        return (
            <BkpkCard title="Top 3 Zawodnicy" icon={<Star className="w-5 h-5 text-bkpk-primary" />}>
                <div className="flex flex-col items-center justify-center py-12 text-bkpk-text-muted">
                    <Trophy className="w-12 h-12 mb-4 opacity-10" />
                    <p className="font-bold text-sm uppercase tracking-widest">Brak danych o zawodnikach</p>
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
                    return (
                        <motion.div
                            key={player.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-500",
                                isFirst
                                    ? "bg-bkpk-primary/10 border border-bkpk-primary/20"
                                    : "bg-bkpk-surface-tint-1 border border-bkpk-border-strong hover:bg-bkpk-surface-tint-2"
                            )}
                        >
                            <div className="relative">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center font-black font-outfit text-xl shadow-lg",
                                    index === 0 ? "bg-bkpk-primary text-black" :
                                        index === 1 ? "bg-slate-300 text-slate-900" :
                                            "bg-orange-800 text-orange-200"
                                )}>
                                    {index + 1}
                                </div>
                                {isFirst && (
                                    <Medal className="absolute -top-1 -right-1 w-5 h-5 text-bkpk-primary drop-shadow-[0_0_8px_rgba(255,107,53,0.5)]" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="font-black font-outfit text-bkpk-text-primary truncate group-hover:text-bkpk-primary transition-colors">
                                    {player.firstName} {player.lastName}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="text-xl font-black font-outfit text-bkpk-primary">
                                        {player.ppg.toFixed(1)} <span className="text-xs uppercase tracking-tighter opacity-50">PPG</span>
                                    </div>
                                    {(player.rpg ?? 0) > 0 && (
                                        <div className="text-xs font-bold text-bkpk-text-muted">
                                            {player.rpg?.toFixed(1)} <span className="text-xs opacity-50">REB</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
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
