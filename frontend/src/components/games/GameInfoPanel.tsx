import { Link } from 'react-router-dom';
import { Users, History, Activity, Target } from 'lucide-react';
import { TrophyIcon as Trophy, VenueIcon as MapPin, MvpIcon as Crown } from '../../shared/ui/BrandIcon';
import type { IconComponent } from '../../shared/ui/BrandIcon';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import BkpkCard from '../../shared/ui/BkpkCard';
import { cn } from '../../shared/lib/utils';
import {
    chartAxisProps,
    chartColors,
    chartGridProps,
    chartTooltipItemStyle,
    chartTooltipLabelStyle,
    chartTooltipStyle,
} from '../../shared/lib/chartTheme';
import CompareBars, { type CompareRow } from './CompareBars';
import { leftSideOf, otherSide, shortTeamName, type GameInfoResponse, type RecordKey, type Side } from './kalkMatchTypes';

const RECORD_LABELS: { key: RecordKey; label: string }[] = [
    { key: 'pts', label: 'Punkty' },
    { key: 'reb', label: 'Zbiórki' },
    { key: 'ast', label: 'Asysty' },
    { key: 'stl', label: 'Przechwyty' },
    { key: 'blk', label: 'Bloki' },
    { key: 'eval', label: 'Eval' },
];


function formatDate(value: string | null | undefined, withTime = false): string | null {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
}

function SectionTitle({ icon: Icon, children, gold = false }: { icon: IconComponent; children: React.ReactNode; gold?: boolean }) {
    return (
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-bkpk-border-subtle">
            <div className={cn('flex items-center justify-center w-9 h-9 border shrink-0', gold ? 'border-bkpk-medal-gold' : 'border-bkpk-border-strong')}>
                <Icon className={cn('w-5 h-5', gold ? 'text-bkpk-medal-gold' : 'text-bkpk-primary')} aria-hidden="true" />
            </div>
            <h3 className="text-[22px] sm:text-[24px] text-bkpk-text-primary">{children}</h3>
        </div>
    );
}

function TeamTag({ side, info }: { side: Side | null; info: GameInfoResponse }) {
    if (!side) return null;
    const team = info[side];
    return (
        <span className={cn('label-caps text-[11px] truncate', team.isBekapaka ? 'text-[var(--brand-text)]' : 'text-bkpk-text-muted')} title={team.name}>
            {shortTeamName(team.name)}
        </span>
    );
}

function MvpCard({ info }: { info: GameInfoResponse }) {
    const mvp = info.mvp;
    if (!mvp?.name) return null;
    const line = mvp.line;
    return (
        <BkpkCard variant="glass" className="border-t-2 border-t-bkpk-medal-gold">
            <div className="flex items-start gap-4">
                <div className="w-14 h-14 flex items-center justify-center border-[1.5px] border-bkpk-medal-gold shrink-0">
                    <Trophy className="w-7 h-7 text-bkpk-medal-gold" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                    <span className="label-caps text-xs text-bkpk-medal-gold">MVP meczu</span>
                    <p className="font-display font-extrabold uppercase text-2xl sm:text-3xl leading-none text-bkpk-text-primary mt-1 break-words">
                        {mvp.number != null && <span className="text-bkpk-medal-gold tabular-nums mr-2">#{mvp.number}</span>}
                        {mvp.name}
                    </p>
                    <div className="mt-1"><TeamTag side={mvp.side} info={info} /></div>
                </div>
            </div>
            {(line || mvp.eval != null) && (
                <div className="grid grid-cols-4 mt-5 border-t border-bkpk-border-subtle">
                    {[
                        { key: 'pts', label: 'Pkt', value: line?.pts },
                        { key: 'reb', label: 'Zb', value: line?.reb },
                        { key: 'ast', label: 'As', value: line?.ast },
                        { key: 'eval', label: 'Eval', value: line?.eval ?? mvp.eval },
                    ].map((s, i) => (
                        <div key={s.key} className={cn('pt-3 px-2', i > 0 && 'border-l border-bkpk-border-subtle')}>
                            <div className="label-caps text-[11px] text-bkpk-text-muted">{s.label}</div>
                            <div className={cn('font-display font-extrabold text-3xl leading-none tabular-nums mt-1', s.key === 'eval' ? 'text-bkpk-medal-gold' : 'text-bkpk-text-primary')}>
                                {s.value ?? '–'}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </BkpkCard>
    );
}

function FactsCard({ info }: { info: GameInfoResponse }) {
    const facts: { label: string; value: React.ReactNode }[] = [];
    if (info.stageLabel) facts.push({ label: 'Faza', value: info.stageLabel });
    if (info.roundLabel) facts.push({ label: 'Kolejka', value: info.roundLabel.replace(/^kolejka\s*-\s*/i, '') });
    const when = formatDate(info.startsAtUtc ?? info.date, Boolean(info.startsAtUtc));
    if (when) facts.push({ label: 'Termin', value: <span className="tabular-nums">{when}</span> });
    if (info.venue || info.city) facts.push({ label: 'Hala', value: [info.venue, info.city].filter(Boolean).join(', ') });
    if (info.overtimes > 0) facts.push({ label: 'Dogrywki', value: <span className="tabular-nums">{info.overtimes}</span> });
    if (info.referees.length) facts.push({ label: info.referees.length > 1 ? 'Sędziowie' : 'Sędzia', value: info.referees.join(', ') });
    if (info.commissioner) facts.push({ label: 'Komisarz', value: info.commissioner });
    if (info.statistician) facts.push({ label: 'Statystyk', value: info.statistician });
    if (!facts.length) return null;
    return (
        <BkpkCard variant="glass">
            <SectionTitle icon={MapPin}>Mecz</SectionTitle>
            <dl className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-4">
                {facts.map((f) => (
                    <div key={f.label} className="contents">
                        <dt className="label-caps text-[11px] text-bkpk-text-muted py-2.5 border-b border-bkpk-border-subtle">{f.label}</dt>
                        <dd className="text-sm text-bkpk-text-primary py-2.5 border-b border-bkpk-border-subtle break-words">{f.value}</dd>
                    </div>
                ))}
            </dl>
        </BkpkCard>
    );
}

function FlowCard({ info, left, right }: { info: GameInfoResponse; left: Side; right: Side }) {
    if (info.flow5.length < 2) return null;
    const leftName = shortTeamName(info[left].name);
    const rightName = shortTeamName(info[right].name);
    const data = [{ minute: 0, left: 0, right: 0 }, ...info.flow5.map((f) => ({ minute: f.minute, left: f[left], right: f[right] }))];
    return (
        <BkpkCard variant="glass">
            <SectionTitle icon={Activity}>Przebieg co 5 minut</SectionTitle>
            <div className="w-full h-[220px] sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                        <CartesianGrid {...chartGridProps} />
                        <XAxis dataKey="minute" {...chartAxisProps} tickFormatter={(m: number) => `${m}'`} />
                        <YAxis {...chartAxisProps} allowDecimals={false} />
                        <Tooltip
                            contentStyle={chartTooltipStyle}
                            itemStyle={chartTooltipItemStyle}
                            labelStyle={chartTooltipLabelStyle}
                            labelFormatter={(m) => `${m}. minuta`}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }} />
                        <Line type="linear" dataKey="left" name={leftName} stroke={chartColors.team} strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                        <Line type="linear" dataKey="right" name={rightName} stroke={chartColors.opponent} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <table className="sr-only">
                <caption>Wynik co 5 minut</caption>
                <thead><tr><th>Minuta</th><th>{leftName}</th><th>{rightName}</th></tr></thead>
                <tbody>{info.flow5.map((f) => <tr key={f.minute}><td>{f.minute}</td><td>{f[left]}</td><td>{f[right]}</td></tr>)}</tbody>
            </table>
        </BkpkCard>
    );
}

function PointsSourcesCard({ info, left, right }: { info: GameInfoResponse; left: Side; right: Side }) {
    const rows: CompareRow[] = [];
    const ps = info.pointsSources;
    const add = (label: string, l: number | null | undefined, r: number | null | undefined) => {
        if (l == null && r == null) return;
        rows.push({ label, left: String(l ?? 0), right: String(r ?? 0), leftValue: l ?? 0, rightValue: r ?? 0 });
    };
    if (ps) {
        add('Po stratach rywala', ps[left]?.ptsOffTurnovers, ps[right]?.ptsOffTurnovers);
        add('Z drugiej szansy', ps[left]?.secondChancePts, ps[right]?.secondChancePts);
        add('Z kontrataku', ps[left]?.fastBreakPts, ps[right]?.fastBreakPts);
        // KALK często raportuje 0 w polu trzech sekund dla obu drużyn — wtedy pomijamy.
        if ((ps[left]?.ptsInPaint ?? 0) + (ps[right]?.ptsInPaint ?? 0) > 0) {
            add('Spod kosza', ps[left]?.ptsInPaint, ps[right]?.ptsInPaint);
        }
    }
    const benchRows: CompareRow[] = [];
    const ts = info.teamStats;
    if (ts[left]?.startersPts != null || ts[right]?.startersPts != null) {
        const l = ts[left];
        const r = ts[right];
        benchRows.push(
            { label: 'Pierwsza piątka', left: String(l?.startersPts ?? 0), right: String(r?.startersPts ?? 0), leftValue: l?.startersPts ?? 0, rightValue: r?.startersPts ?? 0 },
            { label: 'Rezerwowi', left: String(l?.benchPts ?? 0), right: String(r?.benchPts ?? 0), leftValue: l?.benchPts ?? 0, rightValue: r?.benchPts ?? 0 },
        );
    }
    if (!rows.length && !benchRows.length) return null;
    const leftName = shortTeamName(info[left].name);
    const rightName = shortTeamName(info[right].name);
    return (
        <BkpkCard variant="glass">
            <SectionTitle icon={Target}>Skąd punkty</SectionTitle>
            <div className="grid lg:grid-cols-2 gap-x-12 gap-y-8">
                {rows.length > 0 && <CompareBars leftLabel={leftName} rightLabel={rightName} rows={rows} />}
                {benchRows.length > 0 && (
                    <div className="grid gap-3">
                        <CompareBars leftLabel={leftName} rightLabel={rightName} rows={benchRows} />
                        <p className="text-xs text-bkpk-text-muted">Pierwsza piątka vs rezerwowi — punkty zdobyte w meczu.</p>
                    </div>
                )}
            </div>
        </BkpkCard>
    );
}

function RecordsCard({ info, left, right }: { info: GameInfoResponse; left: Side; right: Side }) {
    const rows = RECORD_LABELS.filter(({ key }) => info.records[left]?.[key] || info.records[right]?.[key]);
    if (!rows.length) return null;
    const cell = (side: Side, key: RecordKey, best: number | null, align: 'left' | 'right') => {
        const rec = info.records[side]?.[key];
        if (!rec) return <td className={cn('px-3 py-2.5 text-bkpk-text-muted', align === 'right' && 'text-right')}>–</td>;
        const isBest = best != null && rec.value === best;
        return (
            <td className={cn('px-3 py-2.5 align-top', align === 'right' && 'text-right')}>
                <div className={cn('flex flex-col gap-0.5', align === 'right' && 'items-end')}>
                    <span className={cn('font-display font-extrabold text-2xl leading-none tabular-nums', isBest ? 'text-bkpk-medal-gold' : 'text-bkpk-text-primary')}>
                        {rec.value}
                    </span>
                    <span className="text-xs text-bkpk-text-secondary break-words">
                        {rec.players.map((p) => p.name).join(', ')}
                    </span>
                </div>
            </td>
        );
    };
    return (
        <BkpkCard variant="glass" padding="none" className="overflow-hidden">
            <div className="px-3.5 pt-3.5 sm:px-5 sm:pt-5 md:px-6 md:pt-6">
                <SectionTitle icon={Trophy} gold>Rekordy meczu</SectionTitle>
            </div>
            <table className="bkpk-table w-full text-sm table-fixed">
                <thead>
                    <tr>
                        <th className="px-3 py-2.5 text-left">{shortTeamName(info[left].name)}</th>
                        <th className="px-3 py-2.5 text-center w-[6.5rem] sm:w-32">Kategoria</th>
                        <th className="px-3 py-2.5 text-right">{shortTeamName(info[right].name)}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(({ key, label }) => {
                        const values = [info.records[left]?.[key]?.value, info.records[right]?.[key]?.value].filter((v): v is number => typeof v === 'number');
                        const best = values.length ? Math.max(...values) : null;
                        return (
                            <tr key={key}>
                                {cell(left, key, best, 'left')}
                                <td className="px-2 py-2.5 text-center label-caps text-[11px] text-bkpk-text-secondary align-middle">{label}</td>
                                {cell(right, key, best, 'right')}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <p className="px-3.5 sm:px-5 md:px-6 py-3 text-xs text-bkpk-text-muted">Złotem — najlepszy wynik meczu w kategorii.</p>
        </BkpkCard>
    );
}

function H2hCard({ info }: { info: GameInfoResponse }) {
    const h2h = info.h2h;
    return (
        <BkpkCard variant="glass">
            <SectionTitle icon={History}>Bezpośrednie mecze</SectionTitle>
            {h2h.meetings.length === 0 ? (
                <p className="text-sm text-bkpk-text-secondary">Brak wcześniejszych meczów tych drużyn w bazie.</p>
            ) : (
                <>
                    <p className="label-caps text-xs text-bkpk-text-secondary mb-3">
                        Bilans {shortTeamName(h2h.focusTeam)}:{' '}
                        <span className="font-display text-lg text-bkpk-text-primary tabular-nums">{h2h.focusWins}–{h2h.otherWins}</span>
                    </p>
                    <ol className="border-t border-bkpk-border-subtle">
                        {h2h.meetings.map((m) => (
                            <li key={`${m.seasonId}-${m.matchId}`} className="border-b border-bkpk-border-subtle">
                                <Link
                                    to={`/games/${encodeURIComponent(m.matchId)}?seasonId=${encodeURIComponent(m.seasonId)}`}
                                    className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 min-h-[52px] py-2 hover:bg-bkpk-surface-tint-2 transition-colors"
                                >
                                    <span className={cn('status-flag justify-center', m.focusWon ? 'bg-bkpk-text-primary border-bkpk-text-primary text-bkpk-bg' : 'text-bkpk-text-secondary')}>
                                        {m.focusWon ? 'W' : 'P'}
                                    </span>
                                    <span className="min-w-0 flex flex-col">
                                        <span className="text-sm text-bkpk-text-primary tabular-nums">{formatDate(m.date)}</span>
                                        <span className="text-xs text-bkpk-text-muted truncate">
                                            {[m.focusAtHome ? 'dom' : 'wyjazd', m.stageLabel, m.roundLabel?.replace(/^kolejka\s*-\s*/i, 'kol. ')].filter(Boolean).join(' · ')}
                                        </span>
                                    </span>
                                    <span className="font-display font-extrabold text-2xl leading-none tabular-nums">
                                        <span className={cn(!m.focusWon && 'outline-text')}>{m.focusScore}</span>
                                        <span className="text-bkpk-text-muted mx-1">:</span>
                                        <span className={cn(m.focusWon && 'outline-text')}>{m.otherScore}</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ol>
                </>
            )}
        </BkpkCard>
    );
}

/** Zakładka „Info” meczu (KALK v2). */
export default function GameInfoPanel({ info }: { info: GameInfoResponse }) {
    const left = leftSideOf(info.bekapakaSide);
    const right = otherSide(left);
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-8 space-y-6 min-w-0">
                <FlowCard info={info} left={left} right={right} />
                <PointsSourcesCard info={info} left={left} right={right} />
                <RecordsCard info={info} left={left} right={right} />
            </div>
            <aside className="lg:col-span-4 space-y-6 min-w-0">
                <MvpCard info={info} />
                <FactsCard info={info} />
                <H2hCard info={info} />
                {!info.mvp && !info.referees.length && !info.flow5.length && (
                    <BkpkCard variant="outline">
                        <div className="flex items-center gap-3 text-sm text-bkpk-text-secondary">
                            <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                            Szczegóły meczu (MVP, obsada, przebieg) są dostępne od sezonu KALK v2.
                        </div>
                    </BkpkCard>
                )}
            </aside>
        </div>
    );
}
