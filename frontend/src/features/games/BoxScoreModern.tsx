import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import BkpkCard from '../../shared/ui/BkpkCard';

export interface PlayerStat {
    name: string;
    number?: number | string;
    minutes?: number | string;
    points?: number | string;
    rebounds?: number | string;
    assists?: number | string;
    steals?: number | string;
    blocks?: number | string;
    turnovers?: number | string;
    fg?: string;
    threeP?: string;
    ft?: string;
    plusMinus?: number | string;
    eval?: number | string;
}

interface BoxScoreProps {
    playerStats: PlayerStat[];
    loading?: boolean;
}

export default function BoxScore({ playerStats, loading }: BoxScoreProps) {
    if (loading) {
        return (
            <div className="grid gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-10 bg-bkpk-surface-tint-2 animate-pulse rounded-md" />
                ))}
            </div>
        );
    }

    if (!playerStats || playerStats.length === 0) {
        return (
            <div className="text-center py-20 bg-bkpk-surface-tint-2 border border-dashed border-bkpk-border-strong rounded-bkpk-lg">
                <p className="text-bkpk-text-muted">Brak szczegółowych statystyk dla tego meczu</p>
            </div>
        );
    }

    const headers = [
        { label: 'Zawodnik', className: 'text-left min-w-[150px] sticky left-0 z-10 bg-bkpk-surface' },
        { label: 'MIN', className: 'text-center text-bkpk-text-secondary' },
        { label: 'PTS', className: 'text-center font-bold text-bkpk-primary' },
        { label: 'REB', className: 'text-center text-bkpk-text-secondary' },
        { label: 'AST', className: 'text-center text-bkpk-text-secondary' },
        { label: 'STL', className: 'text-center text-bkpk-text-secondary' },
        { label: 'BLK', className: 'text-center text-bkpk-text-secondary' },
        { label: 'TO', className: 'text-center text-bkpk-text-secondary' },
        { label: 'FG', className: 'text-center text-bkpk-text-secondary' },
        { label: '3P', className: 'text-center text-bkpk-text-secondary' },
        { label: 'FT', className: 'text-center text-bkpk-text-secondary' },
        { label: '+/-', className: 'text-center text-bkpk-text-secondary' },
        { label: 'VAL', className: 'text-center font-bold text-bkpk-warning' },
    ];

    return (
        <BkpkCard variant="glass" padding="none" className="overflow-hidden">
            <div className="overflow-x-auto -u-scrollbar-hide">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-bkpk-surface-tint-2 border-b border-bkpk-border-strong">
                            {headers.map((h, i) => (
                                <th key={i} className={cn("px-4 py-3 text-xs font-bold uppercase tracking-wider text-bkpk-text-secondary", h.className)}>
                                    {h.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-bkpk-border-subtle">
                        {playerStats.map((player, idx) => (
                            <motion.tr
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="hover:bg-bkpk-surface-tint-2 transition-colors"
                            >
                                <td className="px-4 py-3 font-bold text-bkpk-text-primary sticky left-0 z-10 bg-inherit border-r border-bkpk-border-strong">
                                    <div className="flex items-center gap-2">
                                        {player.number && <span className="text-xs text-bkpk-primary tabular-nums">#{player.number}</span>}
                                        <span className="truncate">{player.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center text-bkpk-text-primary tabular-nums">{player.minutes ?? '-'}</td>
                                <td className="px-4 py-3 text-center font-bold text-bkpk-text-primary tabular-nums">{player.points ?? '-'}</td>
                                <td className="px-4 py-3 text-center text-bkpk-text-primary tabular-nums">{player.rebounds ?? '-'}</td>
                                <td className="px-4 py-3 text-center text-bkpk-text-primary tabular-nums">{player.assists ?? '-'}</td>
                                <td className="px-4 py-3 text-center text-bkpk-text-primary tabular-nums">{player.steals ?? '-'}</td>
                                <td className="px-4 py-3 text-center text-bkpk-text-primary tabular-nums">{player.blocks ?? '-'}</td>
                                <td className="px-4 py-3 text-center text-bkpk-text-primary tabular-nums">{player.turnovers ?? '-'}</td>
                                <td className="px-4 py-3 text-center text-xs text-bkpk-text-muted tabular-nums font-medium bg-bkpk-surface-tint-2">{player.fg ?? '-'}</td>
                                <td className="px-4 py-3 text-center text-xs text-bkpk-text-muted tabular-nums font-medium bg-bkpk-surface-tint-2">{player.threeP ?? '-'}</td>
                                <td className="px-4 py-3 text-center text-xs text-bkpk-text-muted tabular-nums font-medium bg-bkpk-surface-tint-2">{player.ft ?? '-'}</td>
                                <td className={cn(
                                    "px-4 py-3 text-center font-medium tabular-nums",
                                    Number(player.plusMinus) > 0 ? "text-bkpk-success" : Number(player.plusMinus) < 0 ? "text-bkpk-danger" : "text-bkpk-text-muted"
                                )}>
                                    {Number(player.plusMinus) > 0 ? `+${player.plusMinus}` : player.plusMinus ?? '-'}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-bkpk-warning tabular-nums">{player.eval ?? '-'}</td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </BkpkCard>
    );
}
