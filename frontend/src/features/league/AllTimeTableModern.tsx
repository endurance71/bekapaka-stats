import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchJSON } from '../../lib/api';
import { cn } from '../../shared/lib/utils';
import BkpkCard from '../../shared/ui/BkpkCard';
import KalkEmptyState from '../../shared/ui/KalkEmptyState';
import { MobileDataCard, MobileDataList } from '../../shared/ui/MobileDataCard';
import ScrollableTableShell from '../../shared/ui/ScrollableTableShell';
import { bkpkActivePillClass } from '../../shared/ui/BkpkButton';
import useIsMobile, { usePortraitMobile } from '../../hooks/useIsMobile';

/** GET /api/league/all-time (backend/kalk/v2/readModels.js → getTeamsAllTime). */
interface HeadToHead {
    games: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    lastDate: string | null;
}

export interface AllTimeTeam {
    kalkId: string;
    name: string;
    since: string | null;
    isBekapaka: boolean;
    isArchived: boolean;
    isActive: boolean;
    games: number;
    wins: number;
    losses: number;
    winPct: number | null;
    pointsFor: number | null;
    pointsAgainst: number | null;
    pointsForPerGame: number | null;
    pointsAgainstPerGame: number | null;
    quartersWon: number | null;
    quartersLost: number | null;
    quarterWinPct: number | null;
    overtimes: number | null;
    overtimeWins: number | null;
    overtimeLosses: number | null;
    headToHead: HeadToHead | null;
}

interface AllTimeResponse {
    bekapakaKalkId: string | null;
    headToHeadSince: string;
    teams: AllTimeTeam[];
}

type Scope = 'active' | 'all';

const fmt1 = (v: number | null | undefined) => (v == null ? '–' : v.toFixed(1).replace('.', ','));
const fmtPct = (v: number | null | undefined) => (v == null ? '–' : `${v.toFixed(1).replace('.', ',')}%`);
const sinceYear = (iso: string | null) => (iso ? new Date(iso).getFullYear() : null);
const wl = (w: number | null | undefined, l: number | null | undefined) => (w == null || l == null ? '–' : `${w}–${l}`);

function H2HCell({ h2h }: { h2h: HeadToHead | null }) {
    if (!h2h) return <span className="text-bkpk-text-muted">–</span>;
    const tone = h2h.wins > h2h.losses ? 'text-bkpk-success' : h2h.wins < h2h.losses ? 'text-bkpk-text-danger' : 'text-bkpk-text-primary';
    return (
        <span className={cn('font-semibold tabular-nums', tone)}>
            {h2h.wins}–{h2h.losses}
        </span>
    );
}

function TeamName({ team }: { team: AllTimeTeam }) {
    return (
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{team.name}</span>
            {team.isArchived && <span className="status-flag text-[10px] text-bkpk-text-muted border border-bkpk-border-strong px-1.5">archiwalna</span>}
        </span>
    );
}

/** Zakładka Liga → „Wszech czasów”: bilans drużyn Dywizji II od założenia (KALK) i bilans z BeKaPaKa. */
export default function AllTimeTableModern() {
    const [data, setData] = useState<AllTimeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [scope, setScope] = useState<Scope>('active');
    const showCards = usePortraitMobile();
    const isNarrow = useIsMobile(1024);

    useEffect(() => {
        let active = true;
        fetchJSON<AllTimeResponse>('/api/league/all-time')
            .then((res) => active && setData(res))
            .catch((err) => console.error(err))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    const bekapaka = data?.teams.find((t) => t.isBekapaka) ?? null;
    const hasActive = Boolean(data?.teams.some((t) => t.isActive));
    const teams = useMemo(() => {
        const all = data?.teams ?? [];
        return scope === 'active' && hasActive ? all.filter((t) => t.isActive) : all;
    }, [data, scope, hasActive]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-24 bg-bkpk-surface-tint-2 animate-pulse" />
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-bkpk-surface-tint-2 animate-pulse" />
                ))}
            </div>
        );
    }

    if (!data || data.teams.length === 0) {
        return <KalkEmptyState title="Brak bilansu wszech czasów" />;
    }

    const scopeButtonClass = (on: boolean) =>
        cn(
            'flex-1 sm:flex-none min-h-[44px] px-4 sm:px-5 label-caps text-[12px] sm:text-[13px] transition-colors text-center',
            on
                ? bkpkActivePillClass
                : 'border border-bkpk-border-strong text-bkpk-text-secondary hover:text-bkpk-text-primary hover:border-bkpk-text-secondary'
        );

    const bkpkFacts = bekapaka
        ? [
              { label: 'Mecze', value: String(bekapaka.games) },
              { label: 'Bilans', value: wl(bekapaka.wins, bekapaka.losses) },
              { label: '% zwycięstw', value: fmtPct(bekapaka.winPct) },
              { label: 'Pkt / mecz', value: fmt1(bekapaka.pointsForPerGame) },
              { label: 'Stracone / mecz', value: fmt1(bekapaka.pointsAgainstPerGame) },
              { label: 'Dogrywki', value: wl(bekapaka.overtimeWins, bekapaka.overtimeLosses) },
          ]
        : [];

    return (
        <div className="space-y-6">
            {bekapaka && (
                <BkpkCard variant="flat" padding="none" className="bg-bkpk-bg border-l-[3px] border-l-bkpk-primary">
                    <div className="p-4 sm:p-5 space-y-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="kicker">BeKaPaKa w KALK</p>
                            {sinceYear(bekapaka.since) && (
                                <p className="text-sm text-bkpk-text-muted">w lidze od {sinceYear(bekapaka.since)}</p>
                            )}
                        </div>
                        <dl className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-bkpk-border-subtle border border-bkpk-border-subtle">
                            {bkpkFacts.map((f) => (
                                <div key={f.label} className="bg-bkpk-bg px-3 py-3 text-center">
                                    <dt className="label-caps text-[11px] text-bkpk-text-muted">{f.label}</dt>
                                    <dd className="mt-1 font-display text-[22px] leading-none text-bkpk-text-primary tabular-nums">{f.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </BkpkCard>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2 w-full sm:w-fit">
                    <button type="button" onClick={() => setScope('active')} className={scopeButtonClass(scope === 'active')} disabled={!hasActive}>
                        Drużyny w sezonie
                    </button>
                    <button type="button" onClick={() => setScope('all')} className={scopeButtonClass(scope === 'all')}>
                        Wszystkie
                    </button>
                </div>
                <p className="text-sm text-bkpk-text-muted">
                    Bilans od założenia drużyny (KALK). „Z BeKaPaKa” — mecze od sezonu 2023/24.
                </p>
            </div>

            <BkpkCard variant="flat" padding="none" className="overflow-hidden bg-bkpk-bg">
                {showCards ? (
                    <MobileDataList>
                        {teams.map((team, index) => (
                            <MobileDataCard
                                key={team.kalkId}
                                rank={index + 1}
                                title={<TeamName team={team} />}
                                subtitle={sinceYear(team.since) ? `od ${sinceYear(team.since)}` : undefined}
                                accent={team.isBekapaka}
                                statsColumns={3}
                                highlight={
                                    <div className="flex flex-col items-center justify-center min-w-[3.75rem] px-2.5 py-1.5 bg-bkpk-bg border border-bkpk-border-strong border-b-2 border-b-bkpk-primary">
                                        <div className="text-xl font-display text-bkpk-text-primary tabular-nums leading-none">{fmtPct(team.winPct)}</div>
                                        <div className="label-caps text-[11px] text-bkpk-text-muted mt-1">zw.</div>
                                    </div>
                                }
                                stats={[
                                    { label: 'M', value: team.games, tone: 'muted' },
                                    { label: 'Z', value: team.wins, tone: 'success' },
                                    { label: 'P', value: team.losses, tone: 'danger' },
                                    { label: 'Pkt/m', value: fmt1(team.pointsForPerGame), tone: 'muted' },
                                    { label: 'Str/m', value: fmt1(team.pointsAgainstPerGame), tone: 'muted' },
                                    { label: 'Kwarty', value: wl(team.quartersWon, team.quartersLost), tone: 'muted' },
                                ]}
                                footer={
                                    team.isBekapaka ? undefined : (
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="label-caps text-[11px] text-bkpk-text-muted">Z BeKaPaKa</span>
                                            <H2HCell h2h={team.headToHead} />
                                        </div>
                                    )
                                }
                            />
                        ))}
                    </MobileDataList>
                ) : (
                    <ScrollableTableShell compact={isNarrow} className="border-0 bg-bkpk-bg">
                        <table className="bkpk-table text-[15px] text-left min-w-[980px]">
                            <thead>
                                <tr>
                                    <th scope="col" className="h-12 px-3 sm:px-4 w-10 text-center">#</th>
                                    <th scope="col" className="h-12 px-3 sm:px-4 text-left sticky left-0 z-10 shadow-[1px_0_0_var(--c-ink-500)]">Drużyna</th>
                                    <th scope="col" className="h-12 px-3 sm:px-4 text-center" title="W lidze od">Od</th>
                                    <th scope="col" className="h-12 px-3 sm:px-4 text-center" title="Mecze">M</th>
                                    <th scope="col" className="h-12 px-3 sm:px-4 text-center" title="Zwycięstwa">Z</th>
                                    <th scope="col" className="h-12 px-3 sm:px-4 text-center" title="Porażki">P</th>
                                    <th scope="col" className="h-12 px-3 sm:px-4 text-center shadow-[inset_0_-3px_0_var(--c-red-500)]" title="Procent zwycięstw">%Z</th>
                                    <th scope="col" className="h-12 px-3 sm:px-4 text-center whitespace-nowrap" title="Punkty zdobyte na mecz">Pkt/m</th>
                                    <th scope="col" className="h-12 px-3 sm:px-4 text-center whitespace-nowrap" title="Punkty stracone na mecz">Str/m</th>
                                    <th scope="col" className="h-12 px-3 sm:px-4 text-center whitespace-nowrap" title="Kwarty wygrane–przegrane">Kwarty</th>
                                    <th scope="col" className="h-12 px-3 sm:px-4 text-center whitespace-nowrap" title="Dogrywki wygrane–przegrane">Dogr.</th>
                                    <th scope="col" className="h-12 px-3 sm:px-4 text-center whitespace-nowrap" title="Bilans meczów z BeKaPaKa (od 2023/24)">Z BeKaPaKa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map((team, index) => {
                                    const isOddRow = index % 2 === 0;
                                    return (
                                        <motion.tr
                                            key={team.kalkId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className={cn(
                                                'transition-colors',
                                                team.isBekapaka ? 'bkpk-row-highlight' : isOddRow && '[&>*]:bg-bkpk-bg hover:[&>*]:bg-ink-700'
                                            )}
                                        >
                                            <td className="h-12 px-3 sm:px-4 text-center text-bkpk-text-secondary tabular-nums">{index + 1}</td>
                                            <td className="h-12 px-3 sm:px-4 font-semibold sticky left-0 z-10 shadow-[1px_0_0_var(--c-ink-500)] text-bkpk-text-primary">
                                                <TeamName team={team} />
                                            </td>
                                            <td className="h-12 px-3 sm:px-4 text-center text-bkpk-text-secondary tabular-nums">{sinceYear(team.since) ?? '–'}</td>
                                            <td className="h-12 px-3 sm:px-4 text-center text-bkpk-text-secondary tabular-nums">{team.games}</td>
                                            <td className="h-12 px-3 sm:px-4 text-center text-bkpk-text-primary tabular-nums">{team.wins}</td>
                                            <td className="h-12 px-3 sm:px-4 text-center text-bkpk-text-primary tabular-nums">{team.losses}</td>
                                            <td className="h-12 px-3 sm:px-4 text-center font-display text-[19px] leading-none text-bkpk-text-primary tabular-nums">{fmtPct(team.winPct)}</td>
                                            <td className="h-12 px-3 sm:px-4 text-center text-bkpk-text-secondary tabular-nums">{fmt1(team.pointsForPerGame)}</td>
                                            <td className="h-12 px-3 sm:px-4 text-center text-bkpk-text-secondary tabular-nums">{fmt1(team.pointsAgainstPerGame)}</td>
                                            <td className="h-12 px-3 sm:px-4 text-center text-bkpk-text-secondary tabular-nums whitespace-nowrap">{wl(team.quartersWon, team.quartersLost)}</td>
                                            <td className="h-12 px-3 sm:px-4 text-center text-bkpk-text-secondary tabular-nums whitespace-nowrap">{wl(team.overtimeWins, team.overtimeLosses)}</td>
                                            <td className="h-12 px-3 sm:px-4 text-center">
                                                {team.isBekapaka ? <span className="text-bkpk-text-muted">—</span> : <H2HCell h2h={team.headToHead} />}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </ScrollableTableShell>
                )}
            </BkpkCard>
        </div>
    );
}
