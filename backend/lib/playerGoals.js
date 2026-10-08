/**
 * Cele sezonu zawodnika (RosterPlayer.goals): ustawia zawodnik, trener widzi i może poprawić.
 * Kształt: { items: [{ stat, target }], updatedAt, updatedBy }. Czyta je też plan rozwoju AI.
 */

/** Statystyki, które można postawić za cel (klucz → opis, zakres). Wartości średnie na mecz lub %. */
export const GOAL_STATS = {
  ppg: { label: 'Punkty na mecz', min: 0, max: 60 },
  rpg: { label: 'Zbiórki na mecz', min: 0, max: 30 },
  apg: { label: 'Asysty na mecz', min: 0, max: 20 },
  spg: { label: 'Przechwyty na mecz', min: 0, max: 10 },
  bpg: { label: 'Bloki na mecz', min: 0, max: 10 },
  evalAvg: { label: 'Eval na mecz', min: -10, max: 60 },
  fgPct: { label: 'Skuteczność z gry %', min: 0, max: 100 },
  threePct: { label: 'Skuteczność za 3 %', min: 0, max: 100 },
  ftPct: { label: 'Skuteczność wolnych %', min: 0, max: 100 },
  tovPg: { label: 'Straty na mecz (mniej = lepiej)', min: 0, max: 15, lowerIsBetter: true }
};
export const MAX_GOALS = 5;

/** @returns {{ items: Array<{ stat: string, target: number }> }} */
export function validateGoals(value) {
  const items = Array.isArray(value?.items) ? value.items : null;
  if (!items) throw new Error('Cele: oczekiwano listy');
  if (items.length > MAX_GOALS) throw new Error(`Maksymalnie ${MAX_GOALS} celów`);
  const seen = new Set();
  const out = items.map((it) => {
    const spec = GOAL_STATS[it?.stat];
    if (!spec) throw new Error('Nieznana statystyka celu');
    if (seen.has(it.stat)) throw new Error('Każda statystyka może mieć jeden cel');
    seen.add(it.stat);
    const target = Number(it.target);
    if (!Number.isFinite(target) || target < spec.min || target > spec.max) throw new Error(`${spec.label}: cel ${spec.min}–${spec.max}`);
    return { stat: it.stat, target: Math.round(target * 10) / 10 };
  });
  return { items: out };
}

/** Cele w nowym kształcie; stary obiekt { ppg, fgPercentage, turnovers } mapowany na listę. */
export function normalizeGoals(goals) {
  if (!goals || typeof goals !== 'object') return { items: [] };
  if (Array.isArray(goals.items)) return goals;
  const legacy = [
    ['ppg', goals.ppg],
    ['fgPct', goals.fgPercentage],
    ['tovPg', goals.turnovers]
  ].filter(([, v]) => Number.isFinite(Number(v)));
  return { items: legacy.map(([stat, target]) => ({ stat, target: Number(target) })) };
}
