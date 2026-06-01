import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import BkpkCard from '../../shared/ui/BkpkCard';
import useIsMobile from '../../hooks/useIsMobile';
import { ChevronRight } from 'lucide-react';

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

/** Memoized table row to prevent unnecessary re-renders */
const PlayerRow = memo(function PlayerRow({ player, idx }: { player: PlayerStat; idx: number }) {
    return (
        <motion.tr
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="group hover:bg-bkpk-surface-tint-2 transition-colors"
        >
            <td className="px-4 py-3 font-bold text-bkpk-text-primary sticky left-0 z-10 bg-bkpk-surface group-hover:bg-bkpk-surface-elevated transition-colors border-r border-bkpk-border-strong">
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
    );
});

/** Mobile card for a single player's stats */
function PlayerStatCard({ player }: { player: PlayerStat }) {
    const pts = Number(player.points) || 0;
    const pm = Number(player.plusMinus);

    return (
        <div className="bg-bkpk-surface border border-bkpk-border-strong rounded-xl p-4 space-y-3">
            {/* Header: name + key stat */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    {player.number && (
                        <span className="text-xs font-bold text-bkpk-primary tabular-nums">#{player.number}</span>
                    )}
                    <span className="font-bold text-bkpk-text-primary truncate">{player.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xl font-black text-bkpk-text-primary tabular-nums">{pts}</span>
                    <span className="text-[10px] font-bold text-bkpk-text-muted uppercase">PTS</span>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2">
                {[
                    { label: 'MIN', value: player.minutes },
                    { label: 'REB', value: player.rebounds },
                    { label: 'AST', value: player.assists },
                    { label: 'STL', value: player.steals },
                    { label: 'BLK', value: player.blocks },
                    { label: 'TO', value: player.turnovers },
                    { label: 'VAL', value: player.eval, highlight: true },
                    {
                        label: '+/-',
                        value: pm > 0 ? `+${player.plusMinus}` : player.plusMinus,
                        color: pm > 0 ? 'text-bkpk-success' : pm < 0 ? 'text-bkpk-danger' : undefined,
                    },
                ].map((stat) => (
                    <div key={stat.label} className="text-center py-1.5 rounded-lg bg-bkpk-surface-tint-1">
                        <div className="text-[10px] font-bold text-bkpk-text-muted uppercase">{stat.label}</div>
                        <div className={cn(
                            "text-sm font-bold tabular-nums",
                            stat.highlight ? "text-bkpk-warning" : stat.color || "text-bkpk-text-primary"
                        )}>
                            {stat.value ?? '-'}
                        </div>
                    </div>
                ))}
            </div>

            {/* Shooting splits */}
            <div className="flex items-center justify-between px-2 py-2 bg-bkpk-surface-tint-1 rounded-lg text-xs">
                <div className="text-center">
                    <span className="text-bkpk-text-muted font-bold">FG </span>
                    <span className="text-bkpk-text-secondary font-medium tabular-nums">{player.fg ?? '-'}</span>
                </div>
                <div className="w-px h-3 bg-bkpk-border-strong" />
                <div className="text-center">
                    <span className="text-bkpk-text-muted font-bold">3P </span>
                    <span className="text-bkpk-text-secondary font-medium tabular-nums">{player.threeP ?? '-'}</span>
                </div>
                <div className="w-px h-3 bg-bkpk-border-strong" />
                <div className="text-center">
                    <span className="text-bkpk-text-muted font-bold">FT </span>
                    <span className="text-bkpk-text-secondary font-medium tabular-nums">{player.ft ?? '-'}</span>
                </div>
            </div>
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

export default function BoxScore({ playerStats, loading }: BoxScoreProps) {
    const isMobile = useIsMobile();

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

    // ═══ MOBILE: Card-per-player layout ═══
    if (isMobile) {
        return (
            <div className="space-y-3">
                {playerStats.map((player, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                    >
                        <PlayerStatCard player={player} />
                    </motion.div>
                ))}
            </div>
        );
    }

    // ═══ DESKTOP: Table layout with scroll indicator ═══
    return (
        <BkpkCard variant="glass" padding="none" className="overflow-hidden">
            <div className="relative">
                {/* Scroll indicator — right fade */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bkpk-surface to-transparent z-20 pointer-events-none flex items-center justify-end pr-1">
                    <ChevronRight className="w-4 h-4 text-bkpk-text-muted animate-pulse" />
                </div>
                <div className="overflow-x-auto no-scrollbar">
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
                                <PlayerRow key={idx} player={player} idx={idx} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </BkpkCard>
    );
}
