/**
 * +/- zawodników z akcji po akcji, gdy KALK publikuje same zera (nie liczy +/-), a meczu nie ma w protokołach z Drive.
 *
 * +/- = suma bilansu punktów odcinków gry, w których zawodnik był na parkiecie (odcinki z `lineups.js`). Wynik
 * trafia do box score tylko wtedy, gdy rekonstrukcja piątek jest wiarygodna dla całej drużyny w meczu:
 *  - każdy odcinek ma dokładnie 5 zawodników,
 *  - Σ +/- drużyny = 5 × różnica punktów,
 *  - czas na parkiecie każdego zawodnika zgadza się z minutami z box score (±MINUTES_TOLERANCE_SEC).
 * Sprawdzone na meczach z protokołem (4124 rywal 11/11, 4144 rywal 9/9 zgodnych zawodnik po zawodniku).
 * Drużyna, która nie przejdzie kontroli, zostaje z zerami KALK (analizy traktują je jako brak danych).
 */
import { computeLineupStints } from './lineups.js';

const MINUTES_TOLERANCE_SEC = 60;
const toInt = (v) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0);

/**
 * @param {Array<object>} events — zdarzenia PBP jednego meczu
 * @param {'home'|'away'} side
 * @param {Array<{ slug?: string|null, number?: number|null, secondsPlayed?: number|null }>} players — box score drużyny
 * @param {number} margin — różnica punktów z perspektywy drużyny
 * @returns {{ ok: true, values: Map<string, number> } | { ok: false, reason: string }}
 */
export function plusMinusFromPbp(events, side, players, margin) {
  const { stints } = computeLineupStints(events, side);
  if (!stints.length) return { ok: false, reason: 'brak odcinków gry' };
  if (stints.some((st) => !st.certain)) return { ok: false, reason: 'odcinki bez pewnej piątki' };
  const values = new Map();
  const seconds = new Map();
  for (const st of stints) {
    for (const key of st.players) {
      values.set(key, (values.get(key) || 0) + st.pointsFor - st.pointsAgainst);
      seconds.set(key, (seconds.get(key) || 0) + st.seconds);
    }
  }
  const total = [...values.values()].reduce((a, b) => a + b, 0);
  if (total !== 5 * margin) return { ok: false, reason: `Σ +/- ${total} ≠ 5 × różnica ${5 * margin}` };
  for (const p of players || []) {
    const key = p.slug || (p.number != null ? `#${p.number}` : null);
    const onCourt = key ? seconds.get(key) || 0 : 0;
    if (Math.abs(onCourt - toInt(p.secondsPlayed)) > MINUTES_TOLERANCE_SEC) {
      return { ok: false, reason: `czas gry ${key}: ${onCourt}s z akcji vs ${toInt(p.secondsPlayed)}s w box score` };
    }
  }
  return { ok: true, values };
}

/**
 * Uzupełnia +/- w paczce skrapera (po korektach z protokołów, przed box score i logami). Dotyka tylko drużyn, w których
 * wszyscy zawodnicy mają +/- = 0. Ustawia `team.plusMinusSource = 'pbp'` i przelicza `totals.plusMinus`. Mutuje paczkę.
 * @param {Array<object>} matches — `bundle.matches`
 * @returns {{ teams: number, skipped: string[] }}
 */
export function applyPbpPlusMinus(matches) {
  const out = { teams: 0, skipped: [] };
  for (const match of matches || []) {
    const events = Array.isArray(match?.pbp?.events) ? match.pbp.events : [];
    const teams = Array.isArray(match?.box?.teams) ? match.box.teams : [];
    if (!events.length || teams.length !== 2) continue;
    const pts = Object.fromEntries(teams.map((t) => [t.side, toInt(t.totals?.pts ?? (t.players || []).reduce((s, p) => s + toInt(p.pts), 0))]));
    for (const team of teams) {
      const players = Array.isArray(team.players) ? team.players : [];
      if (!players.length || players.some((p) => toInt(p.plusMinus) !== 0)) continue;
      const other = team.side === 'home' ? 'away' : 'home';
      const res = plusMinusFromPbp(events, team.side, players, pts[team.side] - pts[other]);
      if (!res.ok) {
        out.skipped.push(`mecz ${match.kalkMatchId} ${team.name}: ${res.reason}`);
        continue;
      }
      for (const p of players) {
        const key = p.slug || (p.number != null ? `#${p.number}` : null);
        p.plusMinus = key ? res.values.get(key) || 0 : 0;
      }
      team.plusMinusSource = 'pbp';
      if (team.totals && typeof team.totals === 'object') {
        team.totals.plusMinus = players.reduce((s, p) => s + toInt(p.plusMinus), 0);
      }
      out.teams += 1;
    }
  }
  return out;
}
