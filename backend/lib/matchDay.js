/**
 * Dzień meczowy (LeagueMatch.matchDay): logistyka dla drużyny — zbiórka, strój, uwagi trenera.
 * Wewnętrzne dane panelu (nie trafiają na stronę publiczną ani do kalendarza .ics).
 */

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DEFAULT_GATHERING_MINUTES = 45;

/** @returns {{ gatheringTime?: string, kit?: string, notes?: string } | null} null = wyczyść */
export function validateMatchDay(value) {
  if (value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Nieprawidłowe dane dnia meczowego');
  const allowed = ['gatheringTime', 'kit', 'notes'];
  if (Object.keys(value).some((k) => !allowed.includes(k))) throw new Error('Nieznane pole dnia meczowego');
  const out = {};
  if (value.gatheringTime != null && value.gatheringTime !== '') {
    if (typeof value.gatheringTime !== 'string' || !TIME_RE.test(value.gatheringTime)) throw new Error('Zbiórka w formacie GG:MM');
    out.gatheringTime = value.gatheringTime;
  }
  for (const [key, max] of [['kit', 60], ['notes', 1000]]) {
    const v = value[key];
    if (v == null || v === '') continue;
    if (typeof v !== 'string' || v.length > max) throw new Error(key === 'kit' ? 'Strój: do 60 znaków' : 'Uwagi: do 1000 znaków');
    out[key] = v.trim();
  }
  return Object.keys(out).length ? out : null;
}

/** Zbiórka do pokazania: ustawiona przez trenera albo orientacyjnie 45 min przed meczem (czas lokalny Polski). */
export function resolveMatchDay(matchDay, startsAt) {
  const md = matchDay && typeof matchDay === 'object' ? matchDay : {};
  let gatheringTime = md.gatheringTime ?? null;
  let gatheringEstimated = false;
  if (!gatheringTime && startsAt) {
    const d = new Date(new Date(startsAt).getTime() - DEFAULT_GATHERING_MINUTES * 60 * 1000);
    gatheringTime = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
    gatheringEstimated = true;
  }
  return { gatheringTime, gatheringEstimated, kit: md.kit ?? null, notes: md.notes ?? null };
}

const warsawTime = (d) => d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });

/**
 * Logistyka meczu z terminarza (LeagueMatch): godzina meczu i zbiórki (czas polski), strój.
 * Brak meczu w terminarzu → same null (nie zgadujemy godzin ani stroju).
 */
export function matchLogistics(leagueMatch) {
  const date = leagueMatch?.date ? new Date(leagueMatch.date) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { matchDate: null, tipoffTime: null, gatheringTime: null, kit: null };
  }
  const md = resolveMatchDay(leagueMatch.matchDay, date);
  return { matchDate: date, tipoffTime: warsawTime(date), gatheringTime: md.gatheringTime, kit: md.kit };
}
