// "2.0.2026-10-03" → "03.10.26" (sidebar label); unknown formats are shown as they are.
export function brandDate(version?: string) {
  const m = version?.match(/(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1].slice(2)}` : version || '—';
}
