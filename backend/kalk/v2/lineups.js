/**
 * Składy na parkiecie z akcji po akcji (KalkPlayByPlayEvent, od sezonu 2026/27).
 *
 * Czyste funkcje: zdarzenia jednego meczu → odcinki gry tej samej piątki („stinty”) → statystyki par.
 * Zmiana: `playerSlug` wchodzi, `subOutSlug` / `subOutNumber` schodzi; pierwsza piątka = zmiana bez schodzącego
 * („Zmiana: #-2 → …”), także przed `period_start`. „Na boisku” (`on_court`) i akcja zawodnika spoza piątki
 * dopisują go. Odcinek bez dokładnie 5 zawodników jest „niepewny” i nie liczy się do par.
 * KALK często zapisuje zmianę kilka–kilkanaście sekund po pierwszej akcji wchodzącego zawodnika — gdy akcję robi
 * ktoś spoza parkietu, a jego wejście jest zapisane w tej samej kwarcie najwyżej LATE_SUB_WINDOW_SEC później,
 * zmiana (z zejściem) jest stosowana od razu, a późniejszy wpis pomijany.
 */

const LINEUP_SIZE = 5;
const LATE_SUB_WINDOW_SEC = 20;

const playerKey = (slug, number) => slug || (number != null ? `#${number}` : null);

/**
 * @param {Array<object>} events — zdarzenia jednego meczu (dowolna kolejność, sortujemy po `seq`)
 * @param {'home'|'away'} side — strona drużyny, której składy liczymy
 * @returns {{ stints: Array<{ players: string[], startSec: number, endSec: number, seconds: number, pointsFor: number, pointsAgainst: number, certain: boolean }>, players: Map<string, { name: string|null, number: number|null }> }}
 */
export function computeLineupStints(events, side) {
  const sorted = [...(events || [])].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  const players = new Map();
  const onCourt = new Map(); // key → number
  const stints = [];
  const ours = (ev) => (side === 'home' ? ev.scoreHome : ev.scoreAway) ?? 0;
  const theirs = (ev) => (side === 'home' ? ev.scoreAway : ev.scoreHome) ?? 0;

  let current = null;
  let lastEv = null;
  // Wynik przed bieżącym zdarzeniem: zmiana składu zamyka odcinek, zanim nowe punkty trafią na konto nowej piątki
  let before = { scoreHome: 0, scoreAway: 0 };

  const open = (ev, score) => {
    current = {
      players: [...onCourt.keys()].sort(),
      startSec: ev.elapsedSec ?? 0,
      startFor: ours(score),
      startAgainst: theirs(score)
    };
  };
  const close = (ev, score) => {
    if (!current) return;
    const endSec = ev.elapsedSec ?? current.startSec;
    const seconds = Math.max(0, endSec - current.startSec);
    const pointsFor = ours(score) - current.startFor;
    const pointsAgainst = theirs(score) - current.startAgainst;
    if (seconds > 0 || pointsFor || pointsAgainst) {
      stints.push({
        players: current.players,
        startSec: current.startSec,
        endSec,
        seconds,
        pointsFor,
        pointsAgainst,
        certain: current.players.length === LINEUP_SIZE
      });
    }
    current = null;
  };
  const remember = (key, ev) => {
    if (!players.has(key)) players.set(key, { name: ev.playerName ?? null, number: ev.playerNumber ?? null });
  };
  const change = (ev, mutate) => {
    close(ev, before);
    mutate();
    open(ev, before);
  };

  /** Wpisy zmian już zastosowane wcześniej (spóźnione w zapisie KALK). */
  const appliedEarly = new Set();
  const outKeyOf = (sub) =>
    sub.subOutSlug
    || (sub.subOutNumber != null ? [...onCourt.entries()].find(([, n]) => n === sub.subOutNumber)?.[0] : null)
    || null;
  const applySub = (sub) => {
    const inKey = playerKey(sub.playerSlug, sub.playerNumber);
    const outKey = outKeyOf(sub);
    if (outKey) onCourt.delete(outKey);
    if (inKey) {
      onCourt.set(inKey, sub.playerNumber ?? null);
      remember(inKey, sub);
    }
  };
  /** Najbliższe zapisane wejście zawodnika `key` (ta sama strona i kwarta, w oknie czasu). */
  const lateEntryOf = (i, key, ev) => {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const next = sorted[j];
      if (next.period !== ev.period) return null;
      if ((next.elapsedSec ?? 0) - (ev.elapsedSec ?? 0) > LATE_SUB_WINDOW_SEC) return null;
      if (next.side !== side || next.actionType !== 'sub' || appliedEarly.has(next)) continue;
      if (playerKey(next.playerSlug, next.playerNumber) === key) return next;
      // zawodnik schodzi w tym oknie, zanim wejdzie — to nie jest spóźniony wpis jego wejścia
      if (next.subOutSlug === key) return null;
    }
    return null;
  };

  for (let i = 0; i < sorted.length; i += 1) {
    const ev = sorted[i];
    lastEv = ev;
    if (!current) open(ev, before);
    if (ev.side !== side) {
      before = ev;
      continue;
    }
    const inKey = playerKey(ev.playerSlug, ev.playerNumber);

    if (ev.actionType === 'sub') {
      if (appliedEarly.has(ev)) {
        before = ev;
        continue;
      }
      change(ev, () => applySub(ev));
    } else if (inKey && !onCourt.has(inKey) && ev.actionType !== 'on_court' && lateEntryOf(i, inKey, ev)) {
      const late = lateEntryOf(i, inKey, ev);
      appliedEarly.add(late);
      change(ev, () => applySub(late));
    } else if (inKey && !onCourt.has(inKey)) {
      // „Na boisku” albo akcja zawodnika, którego nie widzieliśmy na parkiecie
      change(ev, () => {
        onCourt.set(inKey, ev.playerNumber ?? null);
        remember(inKey, ev);
      });
    } else if (inKey) {
      remember(inKey, ev);
    }
    before = ev;
  }
  if (lastEv) close(lastEv, lastEv);
  return { stints, players };
}

/**
 * Pary zawodników z pewnych odcinków (5 na parkiecie): wspólny czas i bilans punktów w tym czasie.
 * @param {Array<{ players: string[], seconds: number, pointsFor: number, pointsAgainst: number, certain: boolean }>} stints
 * @returns {Map<string, { a: string, b: string, seconds: number, pointsFor: number, pointsAgainst: number }>}
 */
export function pairStats(stints) {
  const out = new Map();
  for (const st of stints || []) {
    if (!st.certain) continue;
    const ps = st.players;
    for (let i = 0; i < ps.length; i += 1) {
      for (let j = i + 1; j < ps.length; j += 1) {
        const [a, b] = [ps[i], ps[j]].sort();
        const key = `${a}___${b}`;
        const row = out.get(key) || { a, b, seconds: 0, pointsFor: 0, pointsAgainst: 0 };
        row.seconds += st.seconds;
        row.pointsFor += st.pointsFor;
        row.pointsAgainst += st.pointsAgainst;
        out.set(key, row);
      }
    }
  }
  return out;
}

/** Ile sekund odcinków było pewnych (5 zawodników) — miara jakości danych meczu. */
export function certainShare(stints) {
  const total = (stints || []).reduce((s, st) => s + st.seconds, 0);
  const certain = (stints || []).filter((st) => st.certain).reduce((s, st) => s + st.seconds, 0);
  return total > 0 ? certain / total : 0;
}
