import { Link } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import BkpkCard from '../../shared/ui/BkpkCard';
import StatLabel from '../../shared/ui/StatLabel';
import type { StatKey } from '../../shared/lib/statGlossary';
import { chartAxisProps, chartColors, chartGridProps, chartTooltipItemStyle, chartTooltipLabelStyle, chartTooltipStyle } from '../../shared/lib/chartTheme';
import { cn } from '../../shared/lib/utils';
import type { shootingSeries } from './meStats';

const fmt1 = (v: number | null | undefined) => (v == null ? '–' : v.toFixed(1).replace('.', ','));
const fmtPct = (v: number | null | undefined) => (v == null ? '–' : `${v.toFixed(1).replace('.', ',')}%`);

/** Sezon w Karierze (CareerSeasonRow) — tylko pola potrzebne do porównania. */
interface SeasonRow {
    seasonLabel: string | null;
    games: number;
    perGame: { pts: number | null; reb: number | null; ast: number | null; eval: number | null };
    pct: { fg: number | null; three: number | null; ft: number | null };
}

const COMPARE: { key: StatKey; get: (r: SeasonRow) => number | null; pct?: boolean }[] = [
    { key: 'pts', get: (r) => r.perGame.pts },
    { key: 'reb', get: (r) => r.perGame.reb },
    { key: 'ast', get: (r) => r.perGame.ast },
    { key: 'eval', get: (r) => r.perGame.eval },
    { key: 'fg', get: (r) => r.pct.fg, pct: true },
    { key: 'three', get: (r) => r.pct.three, pct: true },
    { key: 'ft', get: (r) => r.pct.ft, pct: true }
];

function Delta({ now, before }: { now: number | null; before: number | null }) {
    if (now == null || before == null) return null;
    const d = Math.round((now - before) * 10) / 10;
    if (d === 0) return <span className="text-xs text-bkpk-text-muted">bez zmian</span>;
    return (
        <span className={cn('text-xs tabular-nums', d > 0 ? 'text-bkpk-success' : 'text-bkpk-text-danger-subtle')}>
            {d > 0 ? '▲' : '▼'} {Math.abs(d).toFixed(1).replace('.', ',')}
        </span>
    );
}

/** „Mój sezon vs poprzedni” — wiersze BeKaPaKa z Kariery. */
export function SeasonCompareCard({ current, previous }: { current: SeasonRow | null; previous: SeasonRow | null }) {
    return (
        <BkpkCard variant="glass" className="space-y-4">
            <div>
                <span className="kicker text-bkpk-text-primary">Mój sezon vs poprzedni</span>
                {current && (
                    <p className="mt-1 text-sm text-bkpk-text-muted">
                        {current.seasonLabel} ({current.games} m.){previous ? ` vs ${previous.seasonLabel} (${previous.games} m.)` : ''} — średnie na mecz
                    </p>
                )}
            </div>
            {!current ? (
                <p className="text-sm text-bkpk-text-secondary">Brak meczów w BeKaPaKa w tym sezonie.</p>
            ) : (
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {COMPARE.map((c) => {
                        const now = c.get(current);
                        const before = previous ? c.get(previous) : null;
                        return (
                            <div key={c.key}>
                                <dt className="label-caps text-xs text-bkpk-text-secondary">
                                    <StatLabel k={c.key} perGame={!c.pct} />
                                </dt>
                                <dd className="font-display text-2xl tabular-nums text-bkpk-text-primary leading-tight">{c.pct ? fmtPct(now) : fmt1(now)}</dd>
                                {previous && (
                                    <dd className="flex items-center gap-2">
                                        <span className="text-xs text-bkpk-text-muted tabular-nums">było {c.pct ? fmtPct(before) : fmt1(before)}</span>
                                        <Delta now={now} before={before} />
                                    </dd>
                                )}
                            </div>
                        );
                    })}
                </dl>
            )}
            {current && !previous && <p className="text-xs text-bkpk-text-muted">To Twój pierwszy sezon w BeKaPaKa w danych KALK (od 2023/24).</p>}
        </BkpkCard>
    );
}

type GameRecord = { value: number; matchId: string; opponent: string; date: string | null } | null;
export interface CareerRecords {
    games: number;
    doubleDoubles: number;
    bestPts: GameRecord;
    bestReb: GameRecord;
    bestAst: GameRecord;
    bestThreePm: GameRecord;
    bestEval: GameRecord;
}

/** „Moje rekordy” — najlepszy mecz w karierze (od 2023/24). */
export function RecordsCard({ records }: { records: CareerRecords | null }) {
    const items: { label: string; rec: GameRecord }[] = records
        ? [
              { label: 'Punkty', rec: records.bestPts },
              { label: 'Zbiórki', rec: records.bestReb },
              { label: 'Asysty', rec: records.bestAst },
              { label: 'Trójki', rec: records.bestThreePm },
              { label: 'Eval', rec: records.bestEval }
          ]
        : [];
    return (
        <BkpkCard variant="glass" className="space-y-4">
            <div>
                <span className="kicker text-bkpk-text-primary">Moje rekordy</span>
                <p className="mt-1 text-sm text-bkpk-text-muted">Najlepszy mecz w karierze (od sezonu 2023/24){records ? ` · ${records.games} m., double-double: ${records.doubleDoubles}` : ''}</p>
            </div>
            {!records ? (
                <p className="text-sm text-bkpk-text-secondary">Rekordy pojawią się po pierwszym meczu z protokołem KALK.</p>
            ) : (
                <ul className="divide-y divide-bkpk-border-subtle">
                    {items.map(({ label, rec }) => (
                        <li key={label} className="flex items-center justify-between gap-3 py-2">
                            <span className="text-sm text-bkpk-text-secondary">{label}</span>
                            {rec && rec.value > 0 ? (
                                <Link to={`/games/${rec.matchId}`} className="flex items-baseline gap-2 min-h-[44px] items-center text-right hover:text-bkpk-primary">
                                    <span className="font-display text-2xl tabular-nums text-bkpk-text-primary">{rec.value}</span>
                                    <span className="text-xs text-bkpk-text-muted">
                                        vs {rec.opponent}
                                        {rec.date ? `, ${new Date(rec.date).toLocaleDateString('pl-PL')}` : ''}
                                    </span>
                                </Link>
                            ) : (
                                <span className="text-sm text-bkpk-text-muted">–</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </BkpkCard>
    );
}

export interface RankInfo { label: string; rank: number; of: number | null }

/** „Moje miejsce” — w drużynie i w lidze. */
export function RankCard({ ranks }: { ranks: RankInfo[] }) {
    return (
        <BkpkCard variant="glass" className="space-y-4">
            <span className="kicker text-bkpk-text-primary">Moje miejsce</span>
            {!ranks.length ? (
                <p className="text-sm text-bkpk-text-secondary">Miejsce w rankingu pojawi się po pierwszym meczu w sezonie.</p>
            ) : (
                <ul className="grid grid-cols-2 gap-4">
                    {ranks.map((r) => (
                        <li key={r.label}>
                            <span className="font-display text-3xl tabular-nums text-bkpk-text-primary">{r.rank}.</span>
                            {r.of != null && <span className="ml-1 text-sm text-bkpk-text-muted tabular-nums">z {r.of}</span>}
                            <p className="text-xs text-bkpk-text-secondary">{r.label}</p>
                        </li>
                    ))}
                </ul>
            )}
        </BkpkCard>
    );
}

/** „Skuteczność w czasie” — z gry / za 3 / wolne mecz po meczu. */
export function ShootingTrendCard({ series }: { series: ReturnType<typeof shootingSeries> }) {
    const data = series.map((g, i) => ({ ...g, label: `${i + 1}. ${g.opponent}` }));
    return (
        <BkpkCard variant="glass" className="space-y-4">
            <div>
                <span className="kicker text-bkpk-text-primary">Skuteczność w czasie</span>
                <p className="mt-1 text-sm text-bkpk-text-muted">Procent celnych rzutów w kolejnych meczach sezonu. Brak punktu = brak rzutów danego typu.</p>
            </div>
            {data.length < 2 ? (
                <p className="text-sm text-bkpk-text-secondary">Wykres pojawi się po 2. meczu w sezonie.</p>
            ) : (
                <div className="w-full h-[220px] sm:h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                            <CartesianGrid {...chartGridProps} />
                            <XAxis dataKey="label" {...chartAxisProps} tickFormatter={(l: string) => l.split('.')[0]} />
                            <YAxis {...chartAxisProps} domain={[0, 100]} unit="%" />
                            <Tooltip
                                contentStyle={chartTooltipStyle}
                                itemStyle={chartTooltipItemStyle}
                                labelStyle={chartTooltipLabelStyle}
                                formatter={(v) => `${String(v).replace('.', ',')}%`}
                            />
                            <Legend />
                            <Line type="linear" dataKey="fg" name="Z gry" stroke={chartColors.team} strokeWidth={3} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
                            <Line type="linear" dataKey="three" name="Za 3" stroke={chartColors.highlight} strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
                            <Line type="linear" dataKey="ft" name="Wolne" stroke={chartColors.opponent} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} connectNulls isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </BkpkCard>
    );
}
