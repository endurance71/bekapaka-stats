import { useEffect, useState, useCallback } from 'react';
import { fetchJSON } from '../../lib/api';
import { motion } from 'framer-motion';
import { cn } from '../../shared/lib/utils';
import BkpkCard from '../../shared/ui/BkpkCard';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';
import { MobileDataCard, MobileDataList } from '../../shared/ui/MobileDataCard';
import ScrollableTableShell from '../../shared/ui/ScrollableTableShell';
import { bkpkActivePillClass } from '../../shared/ui/BkpkButton';
import useIsMobile, { usePortraitMobile } from '../../hooks/useIsMobile';
import { FormBadges, StreakBadge } from '../../shared/ui/FormBadges';
import StatLabel from '../../shared/ui/StatLabel';

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

interface LeagueTableModernProps {
    seasonId?: string | null;
}

export default function LeagueTableModern({ seasonId }: LeagueTableModernProps) {
    const [table, setTable] = useState<Team[]>([]);
    const [phase, setPhase] = useState<TablePhase>('regular');
    const [loading, setLoading] = useState(true);
    // Przełącznik „Tabela play-out” tylko gdy play-out istnieje w sezonie
    const [hasPlayout, setHasPlayout] = useState(false);
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

    useEffect(() => {
        if (!seasonId) return;
        let active = true;
        fetchJSON<Team[]>(`/api/league/table?phase=playout&seasonId=${encodeURIComponent(seasonId)}`)
            .then((rows) => active && setHasPlayout((rows || []).length > 0))
            .catch(() => active && setHasPlayout(false));
        return () => {
            active = false;
        };
    }, [seasonId]);

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
                    onClick={() => setPhase('regular')}
                    className={phaseButtonClass(phase === 'regular')}
                >
                    Sezon zasadniczy
                </button>
                <button
                    onClick={() => setPhase('playout')}
                    className={phaseButtonClass(phase === 'playout')}
                >
                    Play-out
                </button>
            </div>
            )}

            {table.length === 0 ? (
                <KalkEmptyState title="Tabela jest pusta" message="Tabela pojawi się po pierwszych meczach sezonu." />
            ) : (
                <BkpkCard variant="flat" padding="none" className="overflow-hidden bg-bkpk-bg">
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
                                <div className="flex flex-col items-center justify-center min-w-[3.25rem] px-2.5 py-1.5 bg-bkpk-bg border border-bkpk-border-strong border-b-2 border-b-bkpk-primary">
                                    <div className="text-xl font-display text-bkpk-text-primary tabular-nums leading-none">
                                        {team.points}
                                    </div>
                                    <div className="label-caps text-[11px] text-bkpk-text-muted mt-1">
                                        pkt
                                    </div>
                                </div>
                            }
                            stats={[
                                { label: 'M', value: team.matches, tone: 'muted' },
                                { label: 'W', value: team.wins, tone: 'success' },
                                { label: 'P', value: team.losses, tone: 'danger' },
                                { label: 'Zdob.', value: team.pointsFor, tone: 'muted' },
                                { label: 'Strac.', value: team.pointsAgainst, tone: 'muted' },
                                {
                                    label: '+/-',
                                    value: diff > 0 ? `+${diff}` : diff,
                                    emphasize: true,
                                    tone: diff > 0 ? 'success' : diff < 0 ? 'danger' : 'muted',
                                }
                            ]}
                            footer={team.form && team.form.length > 0 ? (
                                <div className="flex items-center justify-between gap-3">
                                    <span className="label-caps text-[11px] text-bkpk-text-muted">Forma</span>
                                    <span className="flex items-center gap-2">
                                        <FormBadges form={team.form} />
                                        <StreakBadge streak={team.streak} />
                                    </span>
                                </div>
                            ) : undefined}
                        />
                    );
                })}
            </MobileDataList>
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
                                <motion.tr
                                    key={team.name}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
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
                                        diff > 0 ? "text-bkpk-success" : "text-bkpk-text-danger"
                                    )}>
                                        {diff > 0 ? `+${diff}` : diff}
                                    </td>
                                    <td className="h-12 px-3 sm:px-5 whitespace-nowrap">
                                        <FormBadges form={team.form} />
                                    </td>
                                    <td className="h-12 px-3 sm:px-5 text-center">
                                        <StreakBadge streak={team.streak} />
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
