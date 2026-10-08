import { useEffect, useState } from 'react';
import BkpkCard from '../../shared/ui/BkpkCard';
import BkpkButton from '../../shared/ui/BkpkButton';
import { putJSON } from '../../lib/api';
import { cn } from '../../shared/lib/utils';
import { GOAL_OPTIONS, MAX_GOALS, goalProgress, type Goal, type GoalStat, type Goals } from './meStats';

const fmt = (v: number | null, pct?: boolean) => (v == null ? '–' : `${v.toFixed(1).replace('.', ',')}${pct ? '%' : ''}`);
const fieldControl =
    'w-full min-h-[44px] px-3 bg-bkpk-bg border border-bkpk-border-strong text-bkpk-text-primary font-text normal-case tracking-normal font-normal hover:border-bkpk-text-secondary transition-colors';

/**
 * Cele sezonu: zawodnik ustawia sam (Ja), trener widzi na profilu zawodnika i może poprawić.
 * Postęp = aktualna średnia z meczów sezonu vs cel. Zapis: PUT /api/players/:id/goals.
 */
export default function GoalsCard({
    playerId,
    goals,
    values,
    canEdit,
    title = 'Moje cele na sezon',
    emptyText = 'Nie masz jeszcze celów. Ustaw do 5 — np. 8 punktów na mecz albo 60% wolnych.'
}: {
    playerId: string;
    goals: Goals | null | undefined;
    values: Partial<Record<GoalStat, number | null>>;
    canEdit: boolean;
    title?: string;
    emptyText?: string;
}) {
    const [saved, setSaved] = useState<Goals>(goals ?? { items: [] });
    const [draft, setDraft] = useState<Goal[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    useEffect(() => setSaved(goals ?? { items: [] }), [goals]);

    const used = new Set((draft ?? []).map((g) => g.stat));
    const freeStats = (Object.keys(GOAL_OPTIONS) as GoalStat[]).filter((s) => !used.has(s));

    async function save() {
        if (!draft) return;
        setSaving(true);
        setError(null);
        try {
            const res = await putJSON<{ goals: Goals }>(`/api/players/${encodeURIComponent(playerId)}/goals`, { items: draft });
            setSaved(res.goals);
            setDraft(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Nie udało się zapisać celów');
        } finally {
            setSaving(false);
        }
    }

    return (
        <BkpkCard variant="glass" className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <span className="kicker text-bkpk-text-primary">{title}</span>
                    {saved.updatedAt && (
                        <p className="mt-1 text-xs text-bkpk-text-muted">
                            Zmienione {new Date(saved.updatedAt).toLocaleDateString('pl-PL')}
                            {saved.updatedBy === 'coach' ? ' przez trenera' : ''}
                        </p>
                    )}
                </div>
                {canEdit && !draft && (
                    <BkpkButton variant="ghost" size="sm" onClick={() => setDraft(saved.items.map((g) => ({ ...g })))}>
                        {saved.items.length ? 'Zmień cele' : 'Ustaw cele'}
                    </BkpkButton>
                )}
            </div>

            {draft ? (
                <form
                    className="space-y-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        void save();
                    }}
                >
                    {draft.map((g, i) => (
                        <div key={i} className="grid grid-cols-[1fr_6rem_auto] gap-2 items-end">
                            <label className="grid gap-1 text-xs text-bkpk-text-secondary">
                                Statystyka
                                <select
                                    className={fieldControl}
                                    value={g.stat}
                                    onChange={(e) => setDraft(draft.map((d, j) => (j === i ? { ...d, stat: e.target.value as GoalStat } : d)))}
                                >
                                    {[g.stat, ...freeStats].map((s) => (
                                        <option key={s} value={s}>{GOAL_OPTIONS[s].label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-1 text-xs text-bkpk-text-secondary">
                                Cel{GOAL_OPTIONS[g.stat].pct ? ' (%)' : ''}
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    min={GOAL_OPTIONS[g.stat].min}
                                    max={GOAL_OPTIONS[g.stat].max}
                                    className={fieldControl}
                                    value={Number.isFinite(g.target) ? g.target : ''}
                                    onChange={(e) => setDraft(draft.map((d, j) => (j === i ? { ...d, target: e.target.valueAsNumber } : d)))}
                                    required
                                />
                            </label>
                            <BkpkButton type="button" variant="ghost" size="sm" aria-label={`Usuń cel: ${GOAL_OPTIONS[g.stat].label}`} onClick={() => setDraft(draft.filter((_, j) => j !== i))}>
                                Usuń
                            </BkpkButton>
                        </div>
                    ))}
                    {draft.length < MAX_GOALS && freeStats.length > 0 && (
                        <BkpkButton type="button" variant="outline" size="sm" onClick={() => setDraft([...draft, { stat: freeStats[0], target: values[freeStats[0]] ?? 0 }])}>
                            + Dodaj cel
                        </BkpkButton>
                    )}
                    {error && <p role="alert" className="text-sm text-bkpk-text-danger-subtle">{error}</p>}
                    <div className="flex gap-2 pt-2 border-t border-bkpk-border-subtle">
                        <BkpkButton type="submit" variant="primary" size="sm" disabled={saving}>{saving ? 'Zapisywanie…' : 'Zapisz cele'}</BkpkButton>
                        <BkpkButton type="button" variant="ghost" size="sm" onClick={() => { setDraft(null); setError(null); }}>Anuluj</BkpkButton>
                    </div>
                </form>
            ) : !saved.items.length ? (
                <p className="text-sm text-bkpk-text-secondary">{emptyText}</p>
            ) : (
                <ul className="space-y-4">
                    {saved.items.map((g) => {
                        const spec = GOAL_OPTIONS[g.stat];
                        const p = goalProgress(g, values[g.stat] ?? null);
                        return (
                            <li key={g.stat} className="space-y-1.5">
                                <div className="flex items-baseline justify-between gap-3 text-sm">
                                    <span className="text-bkpk-text-primary">{spec.label}</span>
                                    <span className="tabular-nums text-bkpk-text-secondary">
                                        <strong className="text-bkpk-text-primary">{fmt(p.current, spec.pct)}</strong> / cel {fmt(g.target, spec.pct)}
                                    </span>
                                </div>
                                <div
                                    className="h-1.5 bg-bkpk-surface-tint-2"
                                    role="progressbar"
                                    aria-label={spec.label}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={p.percent}
                                >
                                    <div className={cn('h-full transition-all', p.done ? 'bg-bkpk-success' : 'bg-bkpk-primary')} style={{ width: `${p.percent}%` }} />
                                </div>
                                {p.done && <p className="text-xs text-bkpk-success">Cel osiągnięty</p>}
                            </li>
                        );
                    })}
                </ul>
            )}
        </BkpkCard>
    );
}
