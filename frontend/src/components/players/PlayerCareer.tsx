import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import BkpkCard from '../../shared/ui/BkpkCard';
import ScrollableTableShell from '../../shared/ui/ScrollableTableShell';
import { cn } from '../../shared/lib/utils';
import { getPositionLabel } from '../../shared/lib/playerUtils';
import StatLabel from '../../shared/ui/StatLabel';
import type { StatKey } from '../../shared/lib/statGlossary';
import { fmt1, fmtPct } from '../../shared/lib/formatStat';

/** GET /api/players/:id/career (backend/kalk/v2/readModels.js → getPlayerCareer). */
export interface CareerSeasonRow {
    seasonId: string | null;
    seasonSlug: string | null;
    seasonLabel: string | null;
    isActiveSeason: boolean;
    competition: string;
    teamName: string;
    source: string;
    games: number;
    perGame: Record<'min' | 'pts' | 'reb' | 'orb' | 'drb' | 'ast' | 'stl' | 'blk' | 'tov' | 'pf' | 'eval', number | null>;
    pct: { fg: number | null; two: number | null; three: number | null; ft: number | null };
}

export interface CareerGameLogSummary {
    seasonId: string;
    seasonLabel: string;
    games: number;
    wins: number;
    losses: number;
    starts: number;
    doubleDoubles: number;
    bestPts: { value: number; matchId: string; opponent: string; date: string | null } | null;
    bestEval: { value: number; matchId: string; opponent: string; date: string | null } | null;
}

export interface PlayerCareerResponse {
    slug: string | null;
    rosterPlayerId: string | null;
    profile: { fullName: string; position: string | null; heightCm: number | null; birthYear: number | null; lastNumber: number | null };
    seasons: CareerSeasonRow[];
    gameLogSummary: CareerGameLogSummary[];
}


const COLUMNS: { key: StatKey; value: (r: CareerSeasonRow) => string; strong?: boolean; pct?: boolean }[] = [
    { key: 'games', value: (r) => String(r.games) },
    { key: 'min', value: (r) => fmt1(r.perGame.min) },
    { key: 'pts', value: (r) => fmt1(r.perGame.pts), strong: true },
    { key: 'reb', value: (r) => fmt1(r.perGame.reb) },
    { key: 'ast', value: (r) => fmt1(r.perGame.ast) },
    { key: 'stl', value: (r) => fmt1(r.perGame.stl) },
    { key: 'blk', value: (r) => fmt1(r.perGame.blk) },
    { key: 'tov', value: (r) => fmt1(r.perGame.tov) },
    { key: 'fg', value: (r) => fmtPct(r.pct.fg), pct: true },
    { key: 'three', value: (r) => fmtPct(r.pct.three), pct: true },
    { key: 'ft', value: (r) => fmtPct(r.pct.ft), pct: true },
    { key: 'eval', value: (r) => fmt1(r.perGame.eval), strong: true },
];

/** Sekcja „Kariera” na profilu zawodnika: sezony KALK od 2023/24 (średnie na mecz) + profil. */
/** `showPersonal` — wzrost i rocznik tylko dla samego zawodnika i trenera. */
export default function PlayerCareer({ career, showPersonal = false }: { career: PlayerCareerResponse; showPersonal?: boolean }) {
    const { profile, seasons, gameLogSummary } = career;
    const facts = [
        profile.position ? { label: 'Pozycja', value: getPositionLabel(profile.position) } : null,
        showPersonal && profile.heightCm ? { label: 'Wzrost', value: `${profile.heightCm} cm` } : null,
        showPersonal && profile.birthYear ? { label: 'Rocznik', value: String(profile.birthYear) } : null,
        profile.lastNumber != null ? { label: 'Numer', value: `#${profile.lastNumber}` } : null,
    ].filter((f): f is { label: string; value: string } => Boolean(f));

    return (
        <section className="space-y-4" aria-labelledby="player-career-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 border border-bkpk-border-strong shrink-0">
                        <History className="w-5 h-5 text-bkpk-primary" aria-hidden="true" />
                    </div>
                    <h3 id="player-career-title" className="text-[22px] sm:text-[24px] text-bkpk-text-primary">Kariera</h3>
                </div>
                {facts.length > 0 && (
                    <dl className="flex flex-wrap gap-x-6 gap-y-2">
                        {facts.map((f) => (
                            <div key={f.label} className="flex items-baseline gap-2">
                                <dt className="label-caps text-[11px] text-bkpk-text-muted">{f.label}</dt>
                                <dd className="font-display text-lg leading-none text-bkpk-text-primary tabular-nums">{f.value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </div>

            {seasons.length === 0 ? (
                <BkpkCard variant="outline">
                    <p className="text-sm text-bkpk-text-secondary">Brak statystyk sezonowych KALK dla tego zawodnika.</p>
                </BkpkCard>
            ) : (
                <BkpkCard variant="glass" padding="none" className="overflow-hidden">
                    <ScrollableTableShell className="border-0" hint="Przesuń w bok, aby zobaczyć wszystkie kolumny">
                        <table className="bkpk-table min-w-[760px] text-sm">
                            <thead>
                                <tr>
                                    <th scope="col" className="px-3 py-3 text-left sticky left-0 z-20 bg-[var(--table-head-bg)] border-r border-bkpk-border-strong">Sezon</th>
                                    {COLUMNS.map((c) => (
                                        <th key={c.key} scope="col" className="px-2 sm:px-3 py-3 text-center whitespace-nowrap">
                                            <StatLabel k={c.key} />
                                            {c.pct ? ' %' : ''}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {seasons.map((r, idx) => (
                                    <tr key={`${r.seasonSlug}-${r.competition}-${r.teamName}-${idx}`} className={cn('group', r.isActiveSeason && 'bkpk-row-highlight')}>
                                        <th scope="row" className="px-3 py-2.5 text-left font-normal sticky left-0 z-10 border-r border-bkpk-border-strong min-w-[150px]">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-display text-base leading-none text-bkpk-text-primary tabular-nums">{r.seasonLabel ?? '–'}</span>
                                                <span className="text-[11px] text-bkpk-text-muted truncate max-w-[180px]" title={`${r.teamName} · ${r.competition}`}>
                                                    {r.teamName}{r.competition && r.competition !== 'Dywizja II' ? ` · ${r.competition}` : ''}
                                                </span>
                                            </div>
                                        </th>
                                        {COLUMNS.map((c) => (
                                            <td
                                                key={c.key}
                                                className={cn(
                                                    'px-2 sm:px-3 py-2.5 text-center tabular-nums whitespace-nowrap',
                                                    c.strong ? 'font-display text-base leading-none text-bkpk-text-primary' : 'text-bkpk-text-secondary'
                                                )}
                                            >
                                                {c.value(r)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </ScrollableTableShell>
                </BkpkCard>
            )}
            {seasons.length > 0 && <p className="text-[11px] text-bkpk-text-muted">Średnie na mecz, procenty z sum sezonu. Wyróżniony wiersz — bieżący sezon.</p>}

            {gameLogSummary.length > 0 && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {gameLogSummary.map((s) => (
                        <BkpkCard key={s.seasonId} variant="glass" padding="sm" animateEntrance={false}>
                            <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-bkpk-border-subtle">
                                <span className="font-display text-xl leading-none text-bkpk-text-primary tabular-nums">{s.seasonLabel}</span>
                                <span className="label-caps text-[11px] text-bkpk-text-muted tabular-nums">
                                    Bilans {s.wins}–{s.losses}
                                </span>
                            </div>
                            <dl className="grid grid-cols-3 gap-2 pt-3">
                                {[
                                    { label: 'Mecze', value: s.games },
                                    { label: 'W piątce', value: s.starts },
                                    { label: 'Double-double', value: s.doubleDoubles },
                                ].map((x) => (
                                    <div key={x.label}>
                                        <dt className="label-caps text-[10px] text-bkpk-text-muted">{x.label}</dt>
                                        <dd className="font-display text-2xl leading-none tabular-nums text-bkpk-text-primary mt-1">{x.value}</dd>
                                    </div>
                                ))}
                            </dl>
                            {s.bestPts && (
                                <Link
                                    to={`/games/${encodeURIComponent(s.bestPts.matchId)}?seasonId=${encodeURIComponent(s.seasonId)}`}
                                    className="mt-3 flex items-center justify-between gap-3 min-h-[44px] border-t border-bkpk-border-subtle pt-2 hover:text-bkpk-text-primary text-bkpk-text-secondary transition-colors"
                                >
                                    <span className="text-xs truncate">Najlepszy mecz: vs {s.bestPts.opponent}</span>
                                    <span className="font-display text-lg leading-none tabular-nums text-bkpk-medal-gold shrink-0">{s.bestPts.value} pkt</span>
                                </Link>
                            )}
                        </BkpkCard>
                    ))}
                </div>
            )}
        </section>
    );
}
