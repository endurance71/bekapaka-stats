import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../../lib/api';
import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import BkpkCard from '../../shared/ui/BkpkCard';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';

interface Team {
    name: string;
    matches: number;
    points: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
}

export default function LeagueTableModern() {
    const [table, setTable] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTable = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchJSON<Team[]>('/api/league/table');
            setTable(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTable();
    }, [fetchTable]);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 bg-bkpk-surface-tint-2 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (table.length === 0) {
        return <KalkEmptyState title="Tabela Ligowa jest pusta" />;
    }

    return (
        <BkpkCard variant="glass" padding="none" className="overflow-hidden border-bkpk-border-strong shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-bkpk-surface-tint-2 border-b border-bkpk-border-strong">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted w-12 text-center">#</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted sticky left-0 z-10 bg-inherit">Drużyna</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center">M</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center">PKT</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center text-bkpk-success">Z</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center text-bkpk-danger">P</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center">RZ</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center">ST</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center">+/-</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-bkpk-border-subtle">
                        {table.map((team, index) => {
                            const isBkpk = team.name.toLowerCase().includes('bekapaka');
                            return (
                                <motion.tr
                                    key={team.name}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={cn(
                                        "group transition-all hover:bg-bkpk-surface-tint-1",
                                        isBkpk && "bg-bkpk-primary/5 hover:bg-bkpk-primary/10"
                                    )}
                                >
                                    <td className="px-6 py-4 text-center font-bold text-bkpk-text-muted group-hover:text-bkpk-text-secondary transition-colors">
                                        {index + 1}
                                    </td>
                                    <td className={cn(
                                        "px-6 py-4 font-bold text-bkpk-text-primary sticky left-0 z-10 bg-inherit border-r border-bkpk-border-strong",
                                        isBkpk && "text-bkpk-primary"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            {isBkpk && <div className="w-1.5 h-1.5 rounded-full bg-bkpk-primary shadow-bkpk-glow animate-pulse" />}
                                            {team.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-bkpk-text-secondary tabular-nums">{team.matches}</td>
                                    <td className="px-6 py-4 text-center font-black text-bkpk-text-primary tabular-nums text-lg">{team.points}</td>
                                    <td className="px-6 py-4 text-center text-bkpk-success/80 font-bold tabular-nums">{team.wins}</td>
                                    <td className="px-6 py-4 text-center text-bkpk-danger/80 font-bold tabular-nums">{team.losses}</td>
                                    <td className="px-6 py-4 text-center text-bkpk-text-muted tabular-nums">{team.pointsFor}</td>
                                    <td className="px-6 py-4 text-center text-bkpk-text-muted tabular-nums">{team.pointsAgainst}</td>
                                    <td className={cn(
                                        "px-6 py-4 text-center font-bold tabular-nums",
                                        (team.pointsFor - team.pointsAgainst) > 0 ? "text-bkpk-success" : "text-bkpk-danger"
                                    )}>
                                        {(team.pointsFor - team.pointsAgainst) > 0 ? `+${team.pointsFor - team.pointsAgainst}` : team.pointsFor - team.pointsAgainst}
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </BkpkCard>
    );
}
