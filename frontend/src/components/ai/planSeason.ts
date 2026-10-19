/** Minimalny kształt sezonu z /api/seasons potrzebny do etykiet planu. */
export interface PlanSeasonOption {
  id: string;
  label: string;
}

/** „Sezon 2025/2026” albo `season_2025-2026` → „2025/26”; bez lat zwraca etykietę bez słowa „Sezon”. */
export function shortSeasonLabel(labelOrId: string | null | undefined): string | null {
  const raw = labelOrId?.trim();
  if (!raw) return null;
  const years = raw.match(/(\d{4})\D+(\d{2,4})/);
  if (years) return `${years[1]}/${years[2].slice(-2)}`;
  return raw.replace(/^sezon\s+/i, '') || null;
}

/**
 * Sezon zapisanego planu rozwoju i notka, gdy różni się od wybranego w menu
 * (plan z poprzedniego sezonu, bo w bieżącym zawodnik ma za mało meczów).
 */
export function planSeasonInfo({
  planSeasonId,
  selectedSeasonId,
  seasons,
  gamesInSelected
}: {
  planSeasonId: string | null | undefined;
  selectedSeasonId: string | null | undefined;
  seasons: PlanSeasonOption[];
  /** Mecze zawodnika w wybranym sezonie (null = nieznane) */
  gamesInSelected?: number | null;
}): { seasonLabel: string | null; note: string | null } {
  if (!planSeasonId) return { seasonLabel: null, note: null };
  const label = (id: string) => shortSeasonLabel(seasons.find((s) => s.id === id)?.label ?? id);
  const planLabel = label(planSeasonId);
  if (!selectedSeasonId || selectedSeasonId === planSeasonId) return { seasonLabel: planLabel, note: null };
  const selectedLabel = label(selectedSeasonId);
  const note =
    gamesInSelected != null && gamesInSelected < 3
      ? `Za mało meczów w sezonie ${selectedLabel} — pokazujemy plan z sezonu ${planLabel}`
      : `Plan dotyczy sezonu ${planLabel}, nie wybranego ${selectedLabel}`;
  return { seasonLabel: planLabel, note };
}
