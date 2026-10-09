import { Fragment, useState } from 'react';
import { cn } from '../../shared/lib/utils';
import BkpkCard from '../../shared/ui/BkpkCard';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';
import ScrollableTableShell from '../../shared/ui/ScrollableTableShell';
import { bkpkActivePillClass } from '../../shared/ui/BkpkButton';
import useIsMobile, { usePortraitMobile } from '../../hooks/useIsMobile';
import { FormBadges, StreakBadge } from '../../shared/ui/FormBadges';
import StatLabel from '../../shared/ui/StatLabel';
import LoadError from '../../shared/ui/LoadError';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import { useCachedJSON } from '../../hooks/useCachedJSON';

interface Team {
    name: string;
    matches: number;
    points: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    /** Ostatnie wyniki z KALK, np. ['W','L','W'] */
    form?: string[];
    streak?: string | null;
}

type TablePhase = 'regular' | 'playout';

/**
 * Telefon: cała tabela na jednym ekranie (miejsce · drużyna · M · W · P · pkt).
 * Stuknięcie w wiersz rozwija punkty zdobyte/stracone, bilans i formę.
 */
function CompactLeagueTable({ table }: { table: Team[] }) {
    const [open, setOpen] = useState<string | null>(null);
    return (
        <table className="w-full text-sm bg-bkpk-bg">
            <thead>
                <tr className="label-caps text-[11px] text-bkpk-text-muted border-b border-bkpk-border-strong">
                    <th scope="col" className="w-8 py-2 pl-3 text-left">#</th>
                    <th scope="col" className="py-2 text-left">Drużyna</th>
                    <th scope="col" className="w-8 py-2 text-center"><StatLabel k="games" /></th>
                    <th scope="col" className="w-8 py-2 text-center"><StatLabel k="wins" /></th>
                    <th scope="col" className="w-8 py-2 text-center"><StatLabel k="losses" /></th>
                    <th scope="col" className="w-12 py-2 pr-3 text-right"><StatLabel k="leaguePoints" /></th>
                </tr>
            </thead>
            <tbody>
                {table.map((team, index) => {
                    const isBkpk = team.name.toLowerCase().includes('bekapaka');
                    const diff = team.pointsFor - team.pointsAgainst;
                    const expanded = open === team.name;
                    return (
                        <Fragment key={team.name}>
                            <tr
                                className={cn('border-b border-bkpk-border-subtle', isBkpk && 'bg-bkpk-surface shadow-[inset_3px_0_0_var(--c-red-500)]')}
                            >
                                <td className="py-0 pl-3 tabular-nums text-bkpk-text-muted">{index + 1}</td>
                                <td className="py-0">
                                    <button
                                        type="button"
                                        aria-expanded={expanded}
                                        onClick={() => setOpen(expanded ? null : team.name)}
                                        className={cn('w-full min-h-[44px] text-left font-semibold truncate', isBkpk ? 'text-bkpk-text-primary' : 'text-bkpk-text-secondary')}
                                    >
                                        {team.name}
                                    </button>
                                </td>
                                <td className="text-center tabular-nums">{team.matches}</td>
                                <td className="text-center tabular-nums">{team.wins}</td>
                                <td className="text-center tabular-nums">{team.losses}</td>
                                <td className="pr-3 text-right font-display text-lg tabular-nums text-bkpk-text-primary">{team.points}</td>
                            </tr>
                            {expanded && (
                                <tr className="border-b border-bkpk-border-subtle bg-bkpk-surface">
                                    <td />
                                    <td colSpan={5} className="py-3 pr-3">
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-bkpk-text-secondary tabular-nums">
                                            <span><StatLabel k="pointsFor" /> {team.pointsFor}</span>
                                            <span><StatLabel k="pointsAgainst" /> {team.pointsAgainst}</span>
                                            <span className={diff > 0 ? 'text-bkpk-success' : diff < 0 ? 'text-bkpk-text-danger-subtle' : ''}>
                                                <StatLabel k="pointDiff" /> {diff > 0 ? `+${diff}` : diff}
                                            </span>
                                            {team.form && team.form.length > 0 && (
                                                <span className="flex items-center gap-2">
                                                    <FormBadges form={team.form} />
                                                    <StreakBadge streak={team.streak} />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </Fragment>
                    );
                })}
            </tbody>
        </table>
    );
}

interface LeagueTableModernProps {
    seasonId?: string | null;
}

export default function LeagueTableModern({ seasonId }: LeagueTableModernProps) {
    const [phase, setPhase] = useState<TablePhase>('regular');
    const showCards = usePortraitMobile();
    const isNarrow = useIsMobile(1024);
    // Pamięć między stronami — tabela od razu po powrocie, świeża w tle
    const tableQ = useCachedJSON<Team[]>(seasonId ? `/api/league/table?phase=${phase}&seasonId=${encodeURIComponent(seasonId)}` : null);
    // Przełącznik „Tabela play-out” tylko gdy play-out istnieje w sezonie
    const playoutQ = useCachedJSON<Team[]>(seasonId ? `/api/league/table?phase=playout&seasonId=${encodeURIComponent(seasonId)}` : null, 10 * 60_000);
    const table = tableQ.data || [];
    const loading = tableQ.loading;
    const error = tableQ.error;
    const hasPlayout = (playoutQ.data || []).length > 0;
    const fetchTable = () => void tableQ.reload();
    useRefetchOnFocus(fetchTable);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 bg-bkpk-surface-tint-2 animate-pulse w-64" />
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 bg-bkpk-surface-tint-2 animate-pulse" />
                ))}
            </div>
        );
    }

    const phaseButtonClass = (active: boolean) =>
        cn(
            "flex-1 sm:flex-none min-h-[44px] px-4 sm:px-5 label-caps text-[12px] sm:text-[13px] transition-colors text-center",
            active
                ? bkpkActivePillClass
                : "border border-bkpk-border-strong text-bkpk-text-secondary hover:text-bkpk-text-primary hover:border-bkpk-text-secondary"
        );

    return (
        <div className="space-y-6">
            {/* Phase Selector — segment jak `.segmented` na bekapaka.pl (tylko gdy jest play-out) */}
            {hasPlayout && (
            <div className="flex gap-2 w-full sm:w-fit">
                <button
                    aria-pressed={phase === 'regular'}
                    onClick={() => setPhase('regular')}
                    className={phaseButtonClass(phase === 'regular')}
                >
                    Sezon zasadniczy
                </button>
                <button
                    aria-pressed={phase === 'playout'}
                    onClick={() => setPhase('playout')}
                    className={phaseButtonClass(phase === 'playout')}
                >
                    Play-out
                </button>
            </div>
            )}

            {error ? (
                <LoadError title="Nie udało się wczytać tabeli" error={error} onRetry={fetchTable} />
            ) : table.length === 0 ? (
                <KalkEmptyState title="Tabela jest pusta" message="Tabela pojawi się po pierwszych meczach sezonu." />
            ) : (
                <BkpkCard variant="flat" padding="none" className="overflow-hidden bg-bkpk-bg">
            {showCards ? (
            <CompactLeagueTable table={table} />
            ) : (
            <ScrollableTableShell compact={isNarrow} className="border-0 bg-bkpk-bg">
                {/* Tabela jak StandingsBoard na bekapaka.pl: nagłówek pasmem, zebra, wiersz BeKaPaKa, Pkt Condensed */}
                <table className="bkpk-table text-[15px] text-left min-w-[760px]">
                    <thead>
                        <tr>
                            <th scope="col" className="h-12 px-3 sm:px-5 w-10 sm:w-12 text-center">#</th>
                            <th scope="col" className="h-12 px-3 sm:px-5 text-left sticky left-0 z-10 shadow-[1px_0_0_var(--c-ink-500)]">Drużyna</th>
                            <th scope="col" className="h-12 px-3 sm:px-5 text-center">M</th>
                            <th scope="col" className="h-12 px-3 sm:px-5 text-center shadow-[inset_0_-3px_0_var(--c-red-500)]">PKT</th>
                            <th scope="col" className="h-12 px-3 sm:px-5 text-center"><StatLabel k="wins" /></th>
                            <th scope="col" className="h-12 px-3 sm:px-5 text-center"><StatLabel k="losses" /></th>
                            <th scope="col" className="h-12 px-3 sm:px-5 text-center whitespace-nowrap"><StatLabel k="pointsFor" /></th>
                            <th scope="col" className="h-12 px-3 sm:px-5 text-center whitespace-nowrap"><StatLabel k="pointsAgainst" /></th>
                            <th scope="col" className="h-12 px-3 sm:px-5 text-center whitespace-nowrap">+/-</th>
                            <th scope="col" className="h-12 px-3 sm:px-5 text-left whitespace-nowrap">Forma</th>
                            <th scope="col" className="h-12 px-3 sm:px-5 text-center whitespace-nowrap">Seria</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table.map((team, index) => {
                            const isBkpk = team.name.toLowerCase().includes('bekapaka');
                            const diff = team.pointsFor - team.pointsAgainst;
                            // Nieparzyste wiersze: nieprzezroczyste tło, żeby przyklejona kolumna nie prześwitywała
                            const isOddRow = index % 2 === 0;
                            return (
                                <tr
                                    key={team.name}
                                    className={cn(
                                        "transition-colors",
                                        isBkpk
                                            ? "bkpk-row-highlight"
                                            : isOddRow && "[&>*]:bg-bkpk-bg hover:[&>*]:bg-ink-700"
                                    )}
                                >
                                    <td className="h-12 px-3 sm:px-5 text-center text-bkpk-text-secondary tabular-nums">
                                        {index + 1}
                                    </td>
                                    <td className="h-12 px-3 sm:px-5 font-semibold sticky left-0 z-10 shadow-[1px_0_0_var(--c-ink-500)] text-bkpk-text-primary">
                                        {team.name}
                                    </td>
                                    <td className="h-12 px-3 sm:px-5 text-center text-bkpk-text-secondary tabular-nums">{team.matches}</td>
                                    <td className="h-12 px-3 sm:px-5 text-center font-display text-[19px] leading-none text-bkpk-text-primary tabular-nums">{team.points}</td>
                                    <td className="h-12 px-3 sm:px-5 text-center text-bkpk-text-primary tabular-nums">{team.wins}</td>
                                    <td className="h-12 px-3 sm:px-5 text-center text-bkpk-text-primary tabular-nums">{team.losses}</td>
                                    <td className="h-12 px-3 sm:px-5 text-center text-bkpk-text-secondary tabular-nums">{team.pointsFor}</td>
                                    <td className="h-12 px-3 sm:px-5 text-center text-bkpk-text-secondary tabular-nums">{team.pointsAgainst}</td>
                                    <td className={cn(
                                        'h-12 px-3 sm:px-5 text-center font-semibold tabular-nums',
                                        diff > 0 ? "text-bkpk-success" : diff < 0 ? "text-bkpk-text-danger" : "text-bkpk-text-muted"
                                    )}>
                                        {diff > 0 ? `+${diff}` : diff}
                                    </td>
                                    <td className="h-12 px-3 sm:px-5 whitespace-nowrap">
                                        <FormBadges form={team.form} />
                                    </td>
                                    <td className="h-12 px-3 sm:px-5 text-center">
                                        <StreakBadge streak={team.streak} />
                                    </td>
                                </tr>
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
