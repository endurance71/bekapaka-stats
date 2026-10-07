import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import BkpkCard from '../../shared/ui/BkpkCard';
import useIsMobile from '../../hooks/useIsMobile';
import ScrollableTableShell from '../../shared/ui/ScrollableTableShell';

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

/** Komórki liczbowe — rytm jak .bkpk-table na bekapaka.pl */
const cell = 'px-2 sm:px-4 py-2 sm:py-3 text-center tabular-nums';

/** Memoized table row to prevent unnecessary re-renders */
const PlayerRow = memo(function PlayerRow({ player, idx }: { player: PlayerStat; idx: number }) {
    return (
        <motion.tr
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="group"
        >
            {/* Przyklejona kolumna zawodnika: pełne tło (zebra/hover) + linia zamiast cienia */}
            <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-bkpk-text-primary sticky left-0 z-10 bg-bkpk-bg group-even:bg-[var(--table-stripe)] group-hover:bg-[var(--table-hover)] transition-colors border-r border-bkpk-border-strong min-w-[120px] max-w-[140px]">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {player.number && <span className="font-display text-xs sm:text-sm text-bkpk-primary tabular-nums shrink-0">#{player.number}</span>}
                        <span className="truncate text-xs sm:text-sm">{player.name}</span>
                    </div>
                    <span className="text-[11px] font-normal text-bkpk-text-muted tabular-nums truncate lg:hidden">
                        {player.fg ?? '-'} · {player.threeP ?? '-'} · {player.ft ?? '-'}
                    </span>
                </div>
            </td>
            <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm')}>{player.minutes ?? '-'}</td>
            <td className={cn(cell, 'font-display text-base sm:text-lg leading-none text-bkpk-text-primary')}>{player.points ?? '-'}</td>
            <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm')}>{player.rebounds ?? '-'}</td>
            <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm')}>{player.assists ?? '-'}</td>
            <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm hidden sm:table-cell')}>{player.steals ?? '-'}</td>
            <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm hidden sm:table-cell')}>{player.blocks ?? '-'}</td>
            <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm')}>{player.turnovers ?? '-'}</td>
            <td className={cn(cell, 'text-[11px] sm:text-xs text-bkpk-text-secondary font-medium hidden lg:table-cell')}>{player.fg ?? '-'}</td>
            <td className={cn(cell, 'text-[11px] sm:text-xs text-bkpk-text-secondary font-medium hidden lg:table-cell')}>{player.threeP ?? '-'}</td>
            <td className={cn(cell, 'text-[11px] sm:text-xs text-bkpk-text-secondary font-medium hidden lg:table-cell')}>{player.ft ?? '-'}</td>
            <td className={cn(
                cell,
                'font-medium text-xs sm:text-sm',
                Number(player.plusMinus) > 0 ? 'text-bkpk-success' : Number(player.plusMinus) < 0 ? 'text-bkpk-text-danger' : 'text-bkpk-text-muted'
            )}>
                {Number(player.plusMinus) > 0 ? `+${player.plusMinus}` : player.plusMinus ?? '-'}
            </td>
            <td className={cn(cell, 'font-semibold text-bkpk-text-primary text-xs sm:text-sm')}>{player.eval ?? '-'}</td>
        </motion.tr>
    );
});

const headers = [
    { label: 'Zawodnik', className: 'text-left min-w-[120px] sticky left-0 z-20 bg-[var(--table-head-bg)] border-r border-bkpk-border-strong' },
    { label: 'MIN', className: 'text-center whitespace-nowrap' },
    { label: 'PTS', className: 'text-center whitespace-nowrap' },
    { label: 'REB', className: 'text-center whitespace-nowrap' },
    { label: 'AST', className: 'text-center whitespace-nowrap' },
    { label: 'STL', className: 'text-center whitespace-nowrap hidden sm:table-cell' },
    { label: 'BLK', className: 'text-center whitespace-nowrap hidden sm:table-cell' },
    { label: 'TO', className: 'text-center whitespace-nowrap' },
    { label: 'FG', className: 'text-center whitespace-nowrap hidden lg:table-cell' },
    { label: '3P', className: 'text-center whitespace-nowrap hidden lg:table-cell' },
    { label: 'FT', className: 'text-center whitespace-nowrap hidden lg:table-cell' },
    { label: '+/-', className: 'text-center whitespace-nowrap' },
    { label: 'VAL', className: 'text-center whitespace-nowrap' },
];

function BoxScoreTable({ playerStats, compact }: { playerStats: PlayerStat[]; compact?: boolean }) {
    return (
        <table className={cn('bkpk-table bg-bkpk-bg min-w-[520px]', compact ? 'text-xs' : 'text-sm')}>
            <thead>
                <tr>
                    {headers.map((h, i) => (
                        <th
                            key={i}
                            className={cn(
                                'px-2 sm:px-4 py-2 sm:py-3 bg-[var(--table-head-bg)]',
                                h.className
                            )}
                        >
                            {h.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {playerStats.map((player, idx) => (
                    <PlayerRow key={idx} player={player} idx={idx} />
                ))}
            </tbody>
        </table>
    );
}

export default function BoxScore({ playerStats, loading }: BoxScoreProps) {
    const isMobile = useIsMobile(1024);

    if (loading) {
        return (
            <div className="grid gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-10 bg-bkpk-surface animate-pulse" />
                ))}
            </div>
        );
    }

    if (!playerStats || playerStats.length === 0) {
        return (
            <div className="text-center py-20 bg-bkpk-surface border border-dashed border-bkpk-border-strong">
                <p className="text-bkpk-text-muted">Brak szczegółowych statystyk dla tego meczu</p>
            </div>
        );
    }

    if (isMobile) {
        return (
            <ScrollableTableShell compact hint="Obróć telefon poziomo lub przesuń tabelę w bok">
                <BoxScoreTable playerStats={playerStats} compact />
            </ScrollableTableShell>
        );
    }

    return (
        <BkpkCard variant="glass" padding="none" className="overflow-hidden">
            <ScrollableTableShell className="border-0" hint="Przesuń w bok, aby zobaczyć wszystkie kolumny">
                <BoxScoreTable playerStats={playerStats} />
            </ScrollableTableShell>
        </BkpkCard>
    );
}
