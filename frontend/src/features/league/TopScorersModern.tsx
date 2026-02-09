import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../../lib/api';
import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import BkpkCard from '../../shared/ui/BkpkCard';
import { Trophy, Users, Star } from 'lucide-react';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';

interface Scorer {
    id: string;
    name: string;
    team: string;
    pointsTotal: number;
    pointsAverage: number;
    matchesPlayed: number;
}

export default function TopScorersModern() {
    const [scorers, setScorers] = useState<Scorer[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchScorers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchJSON<Scorer[]>('/api/league/scorers?limit=20');
            setScorers(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScorers();
    }, [fetchScorers]);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-bkpk-surface-tint-2 animate-pulse rounded-2xl" />
                ))}
            </div>
        );
    }

    if (scorers.length === 0) {
        return <KalkEmptyState title="Lista strzelców jest pusta" />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Top 3 Podium */}
            <div className="md:col-span-12 lg:col-span-4 space-y-4 order-2 lg:order-1">
                <div className="flex items-center gap-2 mb-6">
                    <Trophy className="w-5 h-5 text-bkpk-warning" />
                    <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit uppercase tracking-tight">Czołówka Strzelców</h3>
                </div>

                {scorers.slice(0, 3).map((player, idx) => (
                    <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <BkpkCard
                            variant="glass"
                            className={cn(
                                "relative overflow-hidden border-bkpk-border-strong group transition-all duration-500",
                                idx === 0 && "border-bkpk-warning/30 bg-bkpk-warning/5",
                                player.team?.toLowerCase().includes('bekapaka') && "border-bkpk-primary/30"
                            )}
                        >
                            <div className="relative z-10 flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center font-black font-outfit text-xl",
                                    idx === 0 ? "bg-bkpk-warning-fill text-white" : "bg-bkpk-surface-tint-4 text-bkpk-text-primary"
                                )}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-bold text-bkpk-text-primary leading-tight">{player.name}</div>
                                    <div className="text-xs font-bold text-bkpk-text-muted uppercase tracking-widest">{player.team}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black font-outfit text-bkpk-text-primary leading-none">{player.pointsAverage.toFixed(1)}</div>
                                    <div className="text-xs font-bold text-bkpk-primary uppercase tracking-widest">PPG</div>
                                </div>
                            </div>

                            {/* Decorative background number */}
                            <div className="absolute -bottom-8 -right-4 text-8xl font-black text-white/[0.02] italic pointer-events-none group-hover:text-white/[0.05] transition-colors">
                                {idx + 1}
                            </div>
                        </BkpkCard>
                    </motion.div>
                ))}
            </div>

            {/* Rest of the List (4-20) */}
            <div className="md:col-span-12 lg:col-span-8 order-1 lg:order-2">
                <BkpkCard variant="glass" padding="none" className="overflow-hidden border-bkpk-border-strong shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-bkpk-surface-tint-2 border-b border-bkpk-border-strong">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted w-12 text-center">#</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted">Zawodnik</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted">Drużyna</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center">M</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center">Suma</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center">Śr.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-bkpk-border-subtle">
                                {scorers.slice(3).map((player, index) => {
                                    const isBkpk = player.team?.toLowerCase().includes('bekapaka');
                                    return (
                                        <motion.tr
                                            key={player.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.02 }}
                                            className={cn(
                                                "group transition-all hover:bg-bkpk-surface-tint-1",
                                                isBkpk && "bg-bkpk-primary/5 hover:bg-bkpk-primary/10"
                                            )}
                                        >
                                            <td className="px-6 py-4 text-center font-bold text-bkpk-text-muted group-hover:text-bkpk-text-secondary transition-colors">
                                                {index + 4}
                                            </td>
                                            <td className={cn(
                                                "px-6 py-4 font-bold text-bkpk-text-primary",
                                                isBkpk && "text-bkpk-primary"
                                            )}>
                                                {player.name}
                                            </td>
                                            <td className="px-6 py-4 text-bkpk-text-muted text-xs font-semibold">{player.team}</td>
                                            <td className="px-6 py-4 text-center text-bkpk-text-secondary tabular-nums">{player.matchesPlayed}</td>
                                            <td className="px-6 py-4 text-center font-bold text-bkpk-text-secondary tabular-nums">{player.pointsTotal}</td>
                                            <td className="px-6 py-4 text-center font-black text-bkpk-text-primary tabular-nums text-lg bg-bkpk-surface-tint-2">
                                                {player.pointsAverage.toFixed(1)}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </BkpkCard>
            </div>
        </div>
    );
}
