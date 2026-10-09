import { memo } from 'react';
import { cn } from '../../shared/lib/utils';
import BkpkCard from '../../shared/ui/BkpkCard';
import useIsMobile from '../../hooks/useIsMobile';
import ScrollableTableShell from '../../shared/ui/ScrollableTableShell';
import { Link } from 'react-router-dom';
import StatLabel from '../../shared/ui/StatLabel';
import type { StatKey } from '../../shared/lib/statGlossary';

export interface PlayerStat {
    name: string;
    /** Link do profilu zawodnika (gdy jest w składzie BeKaPaKa) albo do meczu (dziennik meczów zawodnika) */
    href?: string | null;
    /** Druga linia pod nazwą, np. data meczu */
    subtitle?: string | null;
    /** Wiersz zalogowanego zawodnika — wyróżniony */
    isMe?: boolean;
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
    plusMinus?: number | string | null;
    eval?: number | string;
    /** KALK v2: pierwsza piątka (gwiazdka przy nazwisku). */
    starter?: boolean;
    /** KALK v2: zbiórki w ataku / obronie. */
    offRebounds?: number | null;
    defRebounds?: number | null;
    /** KALK v2: faule popełnione / wymuszone. */
    fouls?: number | null;
    foulsDrawn?: number | null;
    /** KALK v2: bloki otrzymane (rzuty zablokowane przez rywala). */
    blocksAgainst?: number | null;
}

/** Kolumny KALK v2 (ZB A/O, F/Fw, Bl o) — tylko gdy dane są w wierszach. */
export function hasExtendedBoxColumns(rows: PlayerStat[]): boolean {
    return rows.some((p) => p.offRebounds != null || p.fouls != null || p.blocksAgainst != null);
}

const pair = (a: number | null | undefined, b: number | null | undefined) =>
    a == null && b == null ? '-' : `${a ?? 0}/${b ?? 0}`;

interface BoxScoreProps {
    playerStats: PlayerStat[];
    loading?: boolean;
    /** Kolumna +/-: domyślnie tylko gdy ktoś ma wartość ≠ 0 (KALK nie liczy +/- w części meczów). */
    showPlusMinus?: boolean;
    /** Nagłówek pierwszej kolumny („Zawodnik” w meczu, „Mecz” w dzienniku zawodnika) */
    firstColumnLabel?: string;
}

/** Czy w wierszach jest prawdziwy +/- (same zera / brak = KALK go nie podał). */
export function hasPlusMinus(rows: Array<{ plusMinus?: number | string | null }>): boolean {
    return rows.some((r) => {
        const n = Number(r.plusMinus);
        return r.plusMinus != null && Number.isFinite(n) && n !== 0;
    });
}

/** Komórki liczbowe — rytm jak .bkpk-table na bekapaka.pl */
const cell = 'px-2 sm:px-4 py-2 sm:py-3 text-center tabular-nums';

/** Memoized table row to prevent unnecessary re-renders */
/** „Z gry 4/5 · Wolne 4/6” — tylko oddane rodzaje rzutów; nic nie oddał → „Bez rzutów”. */
export function shotSummary(player: Pick<PlayerStat, 'fg' | 'threeP' | 'ft'>): string {
    const parts = ([['Z gry', player.fg], ['Za 3', player.threeP], ['Wolne', player.ft]] as const)
        .filter(([, v]) => v && v !== '0/0')
        .map(([label, v]) => `${label} ${v}`);
    return parts.length ? parts.join(' · ') : 'Bez rzutów';
}

const PlayerRow = memo(function PlayerRow({ player, idx, extended, showPlusMinus }: { player: PlayerStat; idx: number; extended: boolean; showPlusMinus: boolean }) {
    return (
        <tr
            key={idx}
            className="group"
            aria-current={player.isMe ? 'true' : undefined}
        >
            {/* Przyklejona kolumna zawodnika: pełne tło (zebra/hover) + linia zamiast cienia */}
            <td className={cn('px-2 sm:px-4 py-2 sm:py-3 font-semibold text-bkpk-text-primary sticky left-0 z-10 bg-bkpk-bg group-even:bg-[var(--table-stripe)] group-hover:bg-[var(--table-hover)] transition-colors border-r border-bkpk-border-strong min-w-[120px] max-w-[140px]', player.isMe && 'shadow-[inset_4px_0_0_var(--c-red-500)]')}>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {player.number && <span className="font-display text-xs sm:text-sm text-bkpk-primary tabular-nums shrink-0">#{player.number}</span>}
                        {player.href ? (
                            <Link to={player.href} className="truncate py-3 -my-3 text-xs sm:text-sm hover:text-bkpk-primary underline-offset-2 hover:underline">{player.name}</Link>
                        ) : (
                            <span className="truncate text-xs sm:text-sm">{player.name}</span>
                        )}
                        {player.isMe && <span className="label-caps text-[11px] text-bkpk-primary shrink-0">Ja</span>}
                        {player.starter && (
                            <span className="text-bkpk-primary font-display text-sm leading-none shrink-0" title="Pierwsza piątka">*<span className="sr-only"> (pierwsza piątka)</span></span>
                        )}
                    </div>
                    {player.subtitle && <span className="text-xs font-normal text-bkpk-text-muted tabular-nums">{player.subtitle}</span>}
                    {/* Telefon: kolumny rzutów są ukryte — skrót z podpisami, bez rodzajów rzutów 0/0 */}
                    <span className="text-xs font-normal text-bkpk-text-muted tabular-nums truncate lg:hidden">
                        {shotSummary(player)}
                    </span>
                </div>
            </td>
            <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm')}>{player.minutes ?? '-'}</td>
            <td className={cn(cell, 'font-display text-base sm:text-lg leading-none text-bkpk-text-primary')}>{player.points ?? '-'}</td>
            <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm')}>{player.rebounds ?? '-'}</td>
            {extended && <td className={cn(cell, 'text-[11px] sm:text-xs text-bkpk-text-secondary font-medium hidden sm:table-cell')}>{pair(player.offRebounds, player.defRebounds)}</td>}
            <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm')}>{player.assists ?? '-'}</td>
            <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm hidden sm:table-cell')}>{player.steals ?? '-'}</td>
            <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm hidden sm:table-cell')}>{player.blocks ?? '-'}</td>
            <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm')}>{player.turnovers ?? '-'}</td>
            {extended && <td className={cn(cell, 'text-[11px] sm:text-xs text-bkpk-text-secondary font-medium hidden sm:table-cell')}>{pair(player.fouls, player.foulsDrawn)}</td>}
            {extended && <td className={cn(cell, 'text-bkpk-text-primary text-xs sm:text-sm hidden lg:table-cell')}>{player.blocksAgainst ?? '-'}</td>}
            <td className={cn(cell, 'text-[11px] sm:text-xs text-bkpk-text-secondary font-medium hidden lg:table-cell')}>{player.fg ?? '-'}</td>
            <td className={cn(cell, 'text-[11px] sm:text-xs text-bkpk-text-secondary font-medium hidden lg:table-cell')}>{player.threeP ?? '-'}</td>
            <td className={cn(cell, 'text-[11px] sm:text-xs text-bkpk-text-secondary font-medium hidden lg:table-cell')}>{player.ft ?? '-'}</td>
            {showPlusMinus && (
                <td className={cn(
                    cell,
                    'font-medium text-xs sm:text-sm',
                    Number(player.plusMinus) > 0 ? 'text-bkpk-success' : Number(player.plusMinus) < 0 ? 'text-bkpk-text-danger' : 'text-bkpk-text-muted'
                )}>
                    {player.plusMinus == null ? '–' : Number(player.plusMinus) > 0 ? `+${player.plusMinus}` : player.plusMinus}
                </td>
            )}
            <td className={cn(cell, 'font-semibold text-bkpk-text-primary text-xs sm:text-sm')}>{player.eval ?? '-'}</td>
        </tr>
    );
});

type Header = { label: string; key?: StatKey; className: string; title?: string; extended?: boolean; plusMinus?: boolean };

const headers: Header[] = [
    { label: 'Zawodnik', className: 'text-left min-w-[120px] sticky left-0 z-20 bg-[var(--table-head-bg)] border-r border-bkpk-border-strong' },
    { label: 'Min', key: 'min', className: 'text-center whitespace-nowrap' },
    { label: 'Pkt', key: 'pts', className: 'text-center whitespace-nowrap' },
    { label: 'Zb', key: 'reb', className: 'text-center whitespace-nowrap' },
    { label: 'Zb A/O', title: 'Zbiórki w ataku / w obronie', className: 'text-center whitespace-nowrap hidden sm:table-cell', extended: true },
    { label: 'As', key: 'ast', className: 'text-center whitespace-nowrap' },
    { label: 'Prz', key: 'stl', className: 'text-center whitespace-nowrap hidden sm:table-cell' },
    { label: 'Bl', key: 'blk', className: 'text-center whitespace-nowrap hidden sm:table-cell' },
    { label: 'Str', key: 'tov', className: 'text-center whitespace-nowrap' },
    { label: 'F/Fw', title: 'Faule popełnione / wymuszone', className: 'text-center whitespace-nowrap hidden sm:table-cell', extended: true },
    { label: 'Bl o', key: 'blkAgainst', className: 'text-center whitespace-nowrap hidden lg:table-cell', extended: true },
    { label: 'Z gry', key: 'fg', className: 'text-center whitespace-nowrap hidden lg:table-cell' },
    { label: 'Za 3', key: 'three', className: 'text-center whitespace-nowrap hidden lg:table-cell' },
    { label: 'Wolne', key: 'ft', className: 'text-center whitespace-nowrap hidden lg:table-cell' },
    { label: '+/-', key: 'plusMinus', className: 'text-center whitespace-nowrap', plusMinus: true },
    { label: 'Eval', key: 'eval', className: 'text-center whitespace-nowrap' },
];

function BoxScoreTable({ playerStats, compact, showPlusMinus, firstColumnLabel }: { playerStats: PlayerStat[]; compact?: boolean; showPlusMinus: boolean; firstColumnLabel?: string }) {
    const extended = hasExtendedBoxColumns(playerStats);
    const visibleHeaders = headers
        .filter((h) => (extended || !h.extended) && (showPlusMinus || !h.plusMinus))
        .map((h, i) => (i === 0 && firstColumnLabel ? { ...h, label: firstColumnLabel } : h));
    return (
        <table className={cn('bkpk-table bg-bkpk-bg min-w-[520px]', compact ? 'text-xs' : 'text-sm')}>
            <thead>
                <tr>
                    {visibleHeaders.map((h, i) => (
                        <th
                            key={i}
                            title={h.title}
                            scope="col"
                            className={cn(
                                'px-2 sm:px-4 py-2 sm:py-3 bg-[var(--table-head-bg)]',
                                h.className
                            )}
                        >
                            {h.key ? <StatLabel k={h.key} /> : h.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {playerStats.map((player, idx) => (
                    <PlayerRow key={idx} player={player} idx={idx} extended={extended} showPlusMinus={showPlusMinus} />
                ))}
            </tbody>
        </table>
    );
}

export default function BoxScore({ playerStats, loading, showPlusMinus, firstColumnLabel }: BoxScoreProps) {
    const isMobile = useIsMobile(1024);
    const plusMinusVisible = showPlusMinus ?? hasPlusMinus(playerStats ?? []);

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

    const legend = hasExtendedBoxColumns(playerStats) ? (
        <p className="mt-2 text-[11px] text-bkpk-text-muted">
            <span className="text-bkpk-primary">*</span> pierwsza piątka · Zb A/O — zbiórki w ataku/obronie · F/Fw — faule popełnione/wymuszone · Bl o — bloki otrzymane · <Link to="/slowniczek" className="underline">słowniczek</Link>
        </p>
    ) : null;

    if (isMobile) {
        return (
            <div>
                <ScrollableTableShell compact hint="Obróć telefon poziomo lub przesuń tabelę w bok">
                    <BoxScoreTable playerStats={playerStats} compact showPlusMinus={plusMinusVisible} firstColumnLabel={firstColumnLabel} />
                </ScrollableTableShell>
                {legend}
            </div>
        );
    }

    return (
        <div>
            <BkpkCard variant="glass" padding="none" className="overflow-hidden">
                <ScrollableTableShell className="border-0" hint="Przesuń w bok, aby zobaczyć wszystkie kolumny">
                    <BoxScoreTable playerStats={playerStats} showPlusMinus={plusMinusVisible} firstColumnLabel={firstColumnLabel} />
                </ScrollableTableShell>
            </BkpkCard>
            {legend}
        </div>
    );
}
