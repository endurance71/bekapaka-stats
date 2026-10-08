import { memo, useMemo, useState } from 'react';
import { cn } from '../../shared/lib/utils';
import { pluralPl } from '../../shared/lib/plural';
import { bkpkActivePillClass } from '../../shared/ui/BkpkButton';
import { leftSideOf, otherSide, shortTeamName, type PbpEvent, type PbpRun, type PlayByPlayResponse, type Side } from './kalkMatchTypes';
import {
    PBP_CATEGORIES,
    countPbpCategories,
    describeEvent,
    formatClock,
    groupEventsByPeriod,
    periodLongLabel,
    periodShortLabel,
    runLabel,
    runsByEndSeq,
    type PbpCategory,
} from './pbpFormat';

const segBtn = 'px-3 sm:px-4 min-h-[44px] min-w-[44px] label-caps text-xs transition-colors shrink-0';
const segIdle = 'text-bkpk-text-secondary hover:text-bkpk-text-primary';

interface RowProps {
    ev: PbpEvent;
    left: Side;
    leftIsBekapaka: boolean;
    leftName: string;
    rightName: string;
    run: PbpRun | undefined;
}

/** Jedno zdarzenie: desktop = lewa kolumna (BeKaPaKa) | czas + wynik | prawa kolumna (rywal); mobile = czas | opis | wynik. */
const EventRow = memo(function EventRow({ ev, left, leftIsBekapaka, leftName, rightName, run }: RowProps) {
    const isLeft = ev.side === left;
    const scoreLeft = left === 'home' ? ev.scoreHome : ev.scoreAway;
    const scoreRight = left === 'home' ? ev.scoreAway : ev.scoreHome;
    const description = describeEvent(ev);
    return (
        <li
            className={cn(
                'grid grid-cols-[3rem_minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 min-h-[48px] px-3 py-2 even:bg-[var(--table-stripe)] [content-visibility:auto] [contain-intrinsic-size:auto_52px]',
                isLeft && leftIsBekapaka && 'shadow-[inset_4px_0_0_var(--c-red-500)]'
            )}
        >
            {/* Czas + wynik: na mobile rozbite na kolumny 1 i 3 (display: contents), na desktopie środkowa kolumna */}
            <div className="contents sm:flex sm:flex-col sm:items-center sm:justify-center sm:col-start-2 sm:row-start-1">
                <time className="col-start-1 row-start-1 text-xs text-bkpk-text-secondary tabular-nums">{formatClock(ev.clockSec)}</time>
                <span
                    className={cn(
                        'col-start-3 row-start-1 text-right sm:text-center font-display tabular-nums leading-none whitespace-nowrap',
                        ev.isScoring ? 'text-lg sm:text-xl text-bkpk-text-primary font-extrabold' : 'text-sm text-bkpk-text-muted'
                    )}
                >
                    {scoreLeft}:{scoreRight}
                </span>
            </div>
            <div
                className={cn(
                    'col-start-2 row-start-1 min-w-0 flex flex-col gap-1',
                    isLeft ? 'sm:col-start-1 sm:items-end sm:text-right' : 'sm:col-start-3 sm:items-start'
                )}
            >
                <span className={cn('sm:hidden label-caps text-[10px] truncate max-w-full', isLeft && leftIsBekapaka ? 'text-[var(--brand-text)]' : 'text-bkpk-text-muted')}>
                    {isLeft ? leftName : rightName}
                </span>
                <span className={cn('flex flex-wrap gap-x-2 text-sm leading-snug', isLeft && 'sm:justify-end')}>
                    {ev.playerName && (
                        <strong className="font-semibold text-bkpk-text-primary">
                            {ev.playerNumber != null && <span className="tabular-nums text-bkpk-text-muted mr-1">#{ev.playerNumber}</span>}
                            {ev.playerName}
                        </strong>
                    )}
                    <span className={ev.isScoring ? 'font-semibold text-bkpk-text-primary' : 'text-bkpk-text-secondary'}>{description}</span>
                </span>
                {run && (
                    <span
                        className={cn('status-flag', run.side === left ? 'text-bkpk-text-primary border-bkpk-primary' : 'text-bkpk-text-secondary')}
                        title={`Seria ${run.points}:0 (od ${run.fromScore.home}:${run.fromScore.away})`}
                    >
                        {runLabel(run)}
                    </span>
                )}
            </div>
        </li>
    );
});

/** Zakładka „Akcja po akcji” meczu (KALK v2). */
export default function PlayByPlayPanel({ data, mySlug = null }: { data: PlayByPlayResponse; /** slug KALK zalogowanego zawodnika → filtr „Moje akcje” */ mySlug?: string | null }) {
    const [period, setPeriod] = useState<number | 'all'>('all');
    const [side, setSide] = useState<Side | 'all'>('all');
    const [category, setCategory] = useState<PbpCategory>('all');
    const [onlyMine, setOnlyMine] = useState(false);
    // „Moje akcje” tylko, gdy zawodnik zagrał w tym meczu
    const iPlayed = Boolean(mySlug && data.events.some((ev) => ev.playerSlug === mySlug));
    const playerSlug = onlyMine && iPlayed ? mySlug : null;

    const left = leftSideOf(data.bekapakaSide);
    const right = otherSide(left);
    const leftTeam = data[left];
    const rightTeam = data[right];
    const leftName = shortTeamName(leftTeam.name);
    const rightName = shortTeamName(rightTeam.name);

    const groups = useMemo(() => groupEventsByPeriod(data.events, { period, side, category, playerSlug }), [data.events, period, side, category, playerSlug]);
    const counts = useMemo(() => countPbpCategories(data.events, { period, side, playerSlug }), [data.events, period, side, playerSlug]);
    const filtered = period !== 'all' || side !== 'all' || category !== 'all' || playerSlug != null;
    const runIndex = useMemo(() => runsByEndSeq(data.runs), [data.runs]);
    const shown = groups.reduce((n, g) => n + g.events.length, 0);

    const stats = [
        { label: 'Zmiany prowadzenia', value: String(data.leadChanges) },
        { label: 'Remisy', value: String(data.ties) },
        { label: 'Najwyższe prowadzenie', value: `${data.largestLead[left]} / ${data.largestLead[right]}` },
        { label: 'Najdłuższa seria', value: `${data.largestRun[left]} / ${data.largestRun[right]}` },
    ];

    return (
        <div className="space-y-6">
            {/* Podsumowanie przebiegu */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border-t-2 border-bkpk-text-primary">
                {stats.map((s, i) => (
                    <div key={s.label} className={cn('pt-3 pb-1 px-3', i % 2 === 1 && 'border-l border-bkpk-border-subtle', i >= 2 && 'mt-3 lg:mt-0 border-t lg:border-t-0 lg:border-l border-bkpk-border-subtle')}>
                        <div className="label-caps text-[11px] text-bkpk-text-muted">{s.label}</div>
                        <div className="font-display font-extrabold text-3xl sm:text-4xl leading-none tabular-nums mt-2 text-bkpk-text-primary">{s.value}</div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-bkpk-text-muted -mt-3">Wartości „X / Y”: {leftName} / {rightName}. Seria = punkty bez odpowiedzi rywala (od 8 pkt).</p>

            {/* Filtry */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex max-w-full overflow-x-auto no-scrollbar border border-bkpk-border-strong" role="group" aria-label="Kwarta">
                    <button type="button" aria-pressed={period === 'all'} onClick={() => setPeriod('all')} className={cn(segBtn, period === 'all' ? bkpkActivePillClass : segIdle)}>
                        Mecz
                    </button>
                    {data.periods.map((p) => (
                        <button
                            key={p.period}
                            type="button"
                            aria-pressed={period === p.period}
                            onClick={() => setPeriod(p.period)}
                            className={cn(segBtn, period === p.period ? bkpkActivePillClass : segIdle)}
                        >
                            {periodShortLabel(p.period)}
                        </button>
                    ))}
                </div>
                <div className="flex max-w-full overflow-x-auto no-scrollbar border border-bkpk-border-strong" role="group" aria-label="Drużyna">
                    {([
                        { key: 'all', label: 'Obie' },
                        { key: left, label: leftName },
                        { key: right, label: rightName },
                    ] as const).map((opt) => (
                        <button
                            key={opt.key}
                            type="button"
                            aria-pressed={side === opt.key}
                            onClick={() => setSide(opt.key)}
                            className={cn(segBtn, 'max-w-[11rem] truncate', side === opt.key ? bkpkActivePillClass : segIdle)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                {iPlayed && (
                    <button
                        type="button"
                        aria-pressed={onlyMine}
                        onClick={() => setOnlyMine((v) => !v)}
                        className={cn(segBtn, 'border border-bkpk-border-strong', onlyMine ? bkpkActivePillClass : segIdle)}
                    >
                        Moje akcje
                    </button>
                )}
                <label className="relative">
                    <span className="sr-only">Rodzaj akcji</span>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as PbpCategory)}
                        className="min-h-[44px] pl-3 pr-9 bg-bkpk-bg border border-bkpk-border-strong text-sm text-bkpk-text-primary appearance-none cursor-pointer focus:outline-none focus:border-bkpk-text-primary"
                    >
                        {PBP_CATEGORIES.filter((c) => c.key === 'all' || c.key === category || counts[c.key] > 0).map((c) => (
                            <option key={c.key} value={c.key}>
                                {c.label} ({counts[c.key]})
                            </option>
                        ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 border-x-[5px] border-x-transparent border-t-[6px] border-t-bkpk-text-secondary" aria-hidden="true" />
                </label>
                {filtered && (
                    <button
                        type="button"
                        onClick={() => {
                            setPeriod('all');
                            setSide('all');
                            setCategory('all');
                            setOnlyMine(false);
                        }}
                        className={cn(segBtn, 'border border-bkpk-border-strong', segIdle)}
                    >
                        Resetuj
                    </button>
                )}
                <span className="text-xs text-bkpk-text-muted tabular-nums" aria-live="polite">{shown} {pluralPl(shown, 'zdarzenie', 'zdarzenia', 'zdarzeń')}</span>
            </div>

            {/* Nagłówek kolumn (desktop): BeKaPaKa zawsze po lewej */}
            <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)] gap-x-3 px-3 pb-2 border-b-2 border-bkpk-text-primary font-display font-extrabold uppercase text-lg leading-none">
                <span className="text-right truncate text-bkpk-text-primary" title={leftTeam.name}>{leftName}</span>
                <span className="text-center label-caps text-[11px] font-text font-semibold text-bkpk-text-muted self-end">Czas · wynik</span>
                <span className="truncate text-bkpk-text-secondary" title={rightTeam.name}>{rightName}</span>
            </div>

            {shown === 0 ? (
                <p className="text-sm text-bkpk-text-secondary py-6">Brak zdarzeń dla wybranych filtrów.</p>
            ) : (
                <div className="space-y-6">
                    {groups.filter((g) => g.events.length > 0).map((g) => {
                        const endLeft = g.endScore ? (left === 'home' ? g.endScore.home : g.endScore.away) : null;
                        const endRight = g.endScore ? (left === 'home' ? g.endScore.away : g.endScore.home) : null;
                        return (
                            <section key={g.period} aria-label={periodLongLabel(g.period)}>
                                <header className="sticky top-0 z-10 flex items-center justify-between min-h-[48px] px-3 py-2 bg-[var(--table-head-bg)] text-[var(--table-head-text)]">
                                    <h4 className="font-display font-extrabold uppercase text-xl leading-none">{periodLongLabel(g.period)}</h4>
                                    {g.endScore && (
                                        <span className="text-xs">
                                            po okresie <strong className="font-display font-extrabold text-lg tabular-nums ml-1">{endLeft}:{endRight}</strong>
                                        </span>
                                    )}
                                </header>
                                <ol className="list-none m-0 p-0" role="list">
                                    {g.events.map((ev) => (
                                        <EventRow
                                            key={ev.seq}
                                            ev={ev}
                                            left={left}
                                            leftIsBekapaka={leftTeam.isBekapaka}
                                            leftName={leftName}
                                            rightName={rightName}
                                            run={runIndex.get(ev.seq)}
                                        />
                                    ))}
                                </ol>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
