import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../../lib/api';
import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import BkpkCard from '../../shared/ui/BkpkCard';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';
import { MobileDataCard, MobileDataList } from '../../shared/ui/MobileDataCard';
import ScrollableTableShell from '../../shared/ui/ScrollableTableShell';
import useIsMobile, { usePortraitMobile } from '../../hooks/useIsMobile';

interface Team {
    name: string;
    matches: number;
    points: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
}

type TablePhase = 'regular' | 'playout';

interface LeagueTableModernProps {
    seasonId?: string | null;
}

export default function LeagueTableModern({ seasonId }: LeagueTableModernProps) {
    const [table, setTable] = useState<Team[]>([]);
    const [phase, setPhase] = useState<TablePhase>('regular');
    const [loading, setLoading] = useState(true);
    const showCards = usePortraitMobile();
    const isNarrow = useIsMobile(1024);

    const fetchTable = useCallback(async () => {
        if (!seasonId) return;
        setLoading(true);
        try {
            const q = new URLSearchParams({ phase });
            q.set('seasonId', seasonId);
            const data = await fetchJSON<Team[]>(`/api/league/table?${q.toString()}`);
            setTable(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [phase, seasonId]);

    useEffect(() => {
        fetchTable();
    }, [fetchTable]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 bg-bkpk-surface-tint-2 animate-pulse rounded-xl w-64" />
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 bg-bkpk-surface-tint-2 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Phase Selector */}
            <div className="flex gap-2 p-1 bg-bkpk-glass border border-bkpk-glass-border rounded-xl w-full sm:w-fit">
                <button
                    onClick={() => setPhase('regular')}
                    className={cn(
                        "flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all text-center",
                        phase === 'regular'
                            ? "bg-bkpk-surface-tint-4 text-bkpk-text-primary shadow-bkpk-glow"
                            : "text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2"
                    )}
                >
                    Runda Zasadnicza
                </button>
                <button
                    onClick={() => setPhase('playout')}
                    className={cn(
                        "flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all text-center",
                        phase === 'playout'
                            ? "bg-bkpk-surface-tint-4 text-bkpk-text-primary shadow-bkpk-glow"
                            : "text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2"
                    )}
                >
                    Tabela Play-out
                </button>
            </div>

            {table.length === 0 ? (
                <KalkEmptyState title="Tabela Ligowa jest pusta" />
            ) : (
                <BkpkCard variant="glass" padding="none" className="overflow-hidden border-bkpk-border-strong shadow-2xl">
            {showCards ? (
            <MobileDataList>
                {table.map((team, index) => {
                    const isBkpk = team.name.toLowerCase().includes('bekapaka');
                    const diff = team.pointsFor - team.pointsAgainst;
                    return (
                        <MobileDataCard
                            key={team.name}
                            rank={index + 1}
                            title={team.name}
                            accent={isBkpk}
                            statsColumns={3}
                            highlight={
                                <div className="flex flex-col items-center justify-center min-w-[3.25rem] px-2.5 py-1.5 rounded-xl bg-bkpk-surface border border-bkpk-border-strong">
                                    <div className="text-lg font-black font-outfit text-bkpk-text-primary tabular-nums leading-none">
                                        {team.points}
                                    </div>
                                    <div className="text-[9px] font-bold text-bkpk-text-muted uppercase tracking-wider mt-0.5">
                                        pkt
                                    </div>
                                </div>
                            }
                            stats={[
                                { label: 'M', value: team.matches, tone: 'muted' },
                                { label: 'Z', value: team.wins, tone: 'success' },
                                { label: 'P', value: team.losses, tone: 'danger' },
                                { label: 'RZ', value: team.pointsFor, tone: 'muted' },
                                { label: 'ST', value: team.pointsAgainst, tone: 'muted' },
                                {
                                    label: '+/-',
                                    value: diff > 0 ? `+${diff}` : diff,
                                    emphasize: true,
                                    tone: diff > 0 ? 'success' : diff < 0 ? 'danger' : 'muted',
                                }
                            ]}
                        />
                    );
                })}
            </MobileDataList>
            ) : (
            <ScrollableTableShell compact={isNarrow} className="border-0 rounded-none">
                <table className="w-full text-sm text-left border-collapse min-w-[560px]">
                    <thead>
                        <tr className="bg-bkpk-surface-tint-2 border-b border-bkpk-border-strong">
                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted w-10 sm:w-12 text-center">#</th>
                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted sticky left-0 z-10 bg-bkpk-surface border-r border-bkpk-border-strong">Drużyna</th>
                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center">M</th>
                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center">PKT</th>
                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center text-bkpk-success">Z</th>
                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center text-bkpk-text-danger">P</th>
                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center whitespace-nowrap">RZ</th>
                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center whitespace-nowrap">ST</th>
                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-xs font-bold uppercase tracking-widest text-bkpk-text-muted text-center whitespace-nowrap">+/-</th>
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
                                        "group transition-all hover:bg-bkpk-surface-tint-2",
                                        isBkpk && "bg-bkpk-primary/5 hover:bg-bkpk-primary/10"
                                    )}
                                >
                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4 text-center font-bold text-bkpk-text-muted group-hover:text-bkpk-text-secondary transition-colors">
                                        {index + 1}
                                    </td>
                                    <td className={cn(
                                        "px-3 py-2.5 sm:px-6 sm:py-4 font-bold transition-colors sticky left-0 z-10 border-r border-bkpk-border-strong",
                                        isBkpk
                                            ? "text-bkpk-primary bkpk-row-highlight"
                                            : "bg-bkpk-surface group-hover:bg-bkpk-surface-elevated"
                                    )}>
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            {isBkpk && <div className="w-1.5 h-1.5 rounded-full bg-bkpk-primary shadow-bkpk-glow animate-pulse" />}
                                            {team.name}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4 text-center text-bkpk-text-secondary tabular-nums">{team.matches}</td>
                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4 text-center font-black text-bkpk-text-primary tabular-nums text-base sm:text-lg">{team.points}</td>
                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4 text-center text-bkpk-success/80 font-bold tabular-nums">{team.wins}</td>
                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4 text-center text-bkpk-text-danger font-bold tabular-nums">{team.losses}</td>
                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4 text-center text-bkpk-text-muted tabular-nums">{team.pointsFor}</td>
                                    <td className="px-3 py-2.5 sm:px-6 sm:py-4 text-center text-bkpk-text-muted tabular-nums">{team.pointsAgainst}</td>
                                    <td className={cn(
                                        'px-3 py-2.5 sm:px-6 sm:py-4 text-center font-bold tabular-nums',
                                        (team.pointsFor - team.pointsAgainst) > 0 ? "text-bkpk-success" : "text-bkpk-text-danger"
                                    )}>
                                        {(team.pointsFor - team.pointsAgainst) > 0 ? `+${team.pointsFor - team.pointsAgainst}` : team.pointsFor - team.pointsAgainst}
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </ScrollableTableShell>
            )}
        </BkpkCard>
      )}
    </div>
  );
}
