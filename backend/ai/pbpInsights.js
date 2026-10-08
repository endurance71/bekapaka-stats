/**
 * Czyste funkcje: wnioski z akcji po akcji (KalkPlayByPlayEvent) dla promptów AI.
 * Brak PBP (sezony historyczne) → { available: false } — prompt ma wtedy pisać „brak danych”.
 *
 * Zdarzenie: { seq, period, clockSec, side: 'home'|'away', actionType, playerName,
 *              scoreHome, scoreAway, isScoring }
 */

const DEFAULT_MIN_RUN = 8;
const DEFAULT_CLUTCH_SECONDS = 300;
const REGULATION_PERIODS = 4;

/**
 * @param {number | null | undefined} sec
 */
function clock(sec) {
  if (typeof sec !== 'number' || !Number.isFinite(sec) || sec < 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * @param {number} period
 */
function periodLabel(period) {
  return period > REGULATION_PERIODS ? `OT${period - REGULATION_PERIODS}` : `Q${period}`;
}

/**
 * @param {{ period?: number, clockSec?: number | null }} ev
 * @param {number} clutchSeconds
 */
function isClutchEvent(ev, clutchSeconds) {
  const period = ev.period ?? 0;
  if (period > REGULATION_PERIODS) return true;
  if (period !== REGULATION_PERIODS) return false;
  return typeof ev.clockSec === 'number' && ev.clockSec <= clutchSeconds;
}

/**
 * @param {object[] | null | undefined} events
 * @param {{ labels?: { home: string, away: string }, minRun?: number, clutchSeconds?: number }} [options]
 */
export function computePbpInsights(events, options = {}) {
  const labels = options.labels || { home: 'home', away: 'away' };
  const minRun = options.minRun ?? DEFAULT_MIN_RUN;
  const clutchSeconds = options.clutchSeconds ?? DEFAULT_CLUTCH_SECONDS;

  if (!Array.isArray(events) || events.length === 0) {
    return { available: false };
  }

  const sorted = [...events]
    .filter((ev) => ev && typeof ev === 'object')
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  /** @type {'home' | 'away'} */
  let side;
  let prevH = 0;
  let prevA = 0;
  /** @type {'home' | 'away' | null} */
  let leader = null;
  let leadChanges = 0;
  let ties = 0;
  const largestLead = { home: 0, away: 0 };

  /** @type {{ side: 'home' | 'away', points: number, start: object } | null} */
  let run = null;
  /** @type {object[]} */
  const runs = [];
  const largestRun = { home: 0, away: 0 };

  const closeRun = (endState) => {
    if (!run) return;
    largestRun[run.side] = Math.max(largestRun[run.side], run.points);
    if (run.points >= minRun) {
      runs.push({
        team: labels[run.side],
        points: run.points,
        conceded: 0,
        from: run.start,
        to: endState
      });
    }
    run = null;
  };

  /** @type {Map<number, { home: number, away: number }>} */
  const periodEndScore = new Map();
  /** @type {Record<'home' | 'away', Record<string, number>>} */
  const fouls = { home: {}, away: {} };
  /** @type {Map<string, { team: string, player: string, fouls: number, fifthFoulPeriod: string | null }>} */
  const playerFouls = new Map();

  let clutchStart = null;
  const clutchPoints = { home: 0, away: 0 };
  let sawRegulationEnd = false;

  for (const ev of sorted) {
    const period = Number(ev.period) || 0;
    const evSide = ev.side === 'home' || ev.side === 'away' ? ev.side : null;

    if (period >= REGULATION_PERIODS) sawRegulationEnd = true;

    if (ev.actionType === 'foul' && evSide) {
      const key = periodLabel(period);
      fouls[evSide][key] = (fouls[evSide][key] || 0) + 1;
      if (ev.playerName) {
        const pKey = `${evSide}|${ev.playerName}`;
        const current = playerFouls.get(pKey) || {
          team: labels[evSide],
          player: ev.playerName,
          fouls: 0,
          fifthFoulPeriod: null
        };
        current.fouls += 1;
        if (current.fouls === 5) current.fifthFoulPeriod = periodLabel(period);
        playerFouls.set(pKey, current);
      }
    }

    const h = typeof ev.scoreHome === 'number' ? ev.scoreHome : prevH;
    const a = typeof ev.scoreAway === 'number' ? ev.scoreAway : prevA;

    if (clutchStart === null && isClutchEvent(ev, clutchSeconds)) {
      clutchStart = { home: prevH, away: prevA };
    }

    if (h === prevH && a === prevA) {
      if (period) periodEndScore.set(period, { home: h, away: a });
      continue;
    }

    const dh = h - prevH;
    const da = a - prevA;

    if (clutchStart !== null && isClutchEvent(ev, clutchSeconds)) {
      if (dh > 0) clutchPoints.home += dh;
      if (da > 0) clutchPoints.away += da;
    }

    const stateBefore = {
      period: periodLabel(period),
      clock: clock(ev.clockSec),
      score: { [labels.home]: prevH, [labels.away]: prevA }
    };
    const stateAfter = {
      period: periodLabel(period),
      clock: clock(ev.clockSec),
      score: { [labels.home]: h, [labels.away]: a }
    };

    if (dh > 0 && da === 0) side = 'home';
    else if (da > 0 && dh === 0) side = 'away';
    else {
      // Korekta wyniku / oba wyniki zmienione naraz — zamknij serię, nie zgaduj.
      closeRun(stateBefore);
      side = null;
    }

    if (side) {
      const pts = side === 'home' ? dh : da;
      if (run && run.side === side) {
        run.points += pts;
        run.end = stateAfter;
      } else {
        closeRun(stateBefore);
        run = { side, points: pts, start: stateBefore, end: stateAfter };
      }
    }

    const margin = h - a;
    /** @type {'home' | 'away' | null} */
    const newLeader = margin > 0 ? 'home' : margin < 0 ? 'away' : null;
    if (margin === 0 && (h > 0 || a > 0)) ties += 1;
    if (newLeader && leader && newLeader !== leader) leadChanges += 1;
    if (newLeader) leader = newLeader;
    if (margin > 0) largestLead.home = Math.max(largestLead.home, margin);
    if (margin < 0) largestLead.away = Math.max(largestLead.away, -margin);

    prevH = h;
    prevA = a;
    if (period) periodEndScore.set(period, { home: h, away: a });
  }
  if (run) {
    const r = run;
    closeRun(r.end);
  }

  const periods = [...periodEndScore.keys()].sort((x, y) => x - y);
  let lastH = 0;
  let lastA = 0;
  const periodScoring = periods.map((p) => {
    const end = periodEndScore.get(p) || { home: lastH, away: lastA };
    const row = {
      period: periodLabel(p),
      [labels.home]: end.home - lastH,
      [labels.away]: end.away - lastA
    };
    lastH = end.home;
    lastA = end.away;
    return row;
  });

  const clutch =
    sawRegulationEnd && clutchStart !== null
      ? {
          available: true,
          window: `ostatnie ${Math.round(clutchSeconds / 60)} min 4. kwarty + dogrywki`,
          scoreAtStart: { [labels.home]: clutchStart.home, [labels.away]: clutchStart.away },
          points: { [labels.home]: clutchPoints.home, [labels.away]: clutchPoints.away }
        }
      : { available: false };

  return {
    available: true,
    eventsCount: sorted.length,
    finalScore: { [labels.home]: prevH, [labels.away]: prevA },
    runs,
    largestRun: { [labels.home]: largestRun.home, [labels.away]: largestRun.away },
    leadChanges,
    ties,
    largestLead: { [labels.home]: largestLead.home, [labels.away]: largestLead.away },
    clutch,
    periodScoring,
    foulsPerPeriod: { [labels.home]: fouls.home, [labels.away]: fouls.away },
    foulTrouble: [...playerFouls.values()]
      .filter((p) => p.fouls >= 4)
      .sort((x, y) => y.fouls - x.fouls)
  };
}

/**
 * Agregat tendencji z wielu meczów (scouting): ile runów ≥ minRun zdobyła / straciła drużyna,
 * średnia zmian prowadzenia, mecze z PBP. `perspective` = etykieta drużyny w wynikach computePbpInsights.
 * @param {Array<ReturnType<typeof computePbpInsights>>} insightsList
 * @param {string} perspective
 * @param {string} otherLabel
 */
export function aggregatePbpTendencies(insightsList, perspective, otherLabel) {
  const available = (insightsList || []).filter((i) => i?.available);
  if (available.length === 0) return { available: false, matchesWithPbp: 0 };

  let runsFor = 0;
  let runsAgainst = 0;
  let leadChanges = 0;
  let clutchFor = 0;
  let clutchAgainst = 0;
  let clutchGames = 0;
  let foulsTotal = 0;
  let fouledOut = 0;
  /** @type {Record<string, number>} */
  const foulsByPeriod = {};

  for (const ins of available) {
    for (const r of ins.runs || []) {
      if (r.team === perspective) runsFor += 1;
      else if (r.team === otherLabel) runsAgainst += 1;
    }
    leadChanges += ins.leadChanges || 0;
    if (ins.clutch?.available) {
      clutchGames += 1;
      clutchFor += ins.clutch.points?.[perspective] || 0;
      clutchAgainst += ins.clutch.points?.[otherLabel] || 0;
    }
    const f = ins.foulsPerPeriod?.[perspective] || {};
    for (const [p, n] of Object.entries(f)) {
      foulsByPeriod[p] = (foulsByPeriod[p] || 0) + n;
      foulsTotal += n;
    }
    fouledOut += (ins.foulTrouble || []).filter(
      (t) => t.team === perspective && t.fouls >= 5
    ).length;
  }

  const n = available.length;
  const round1 = (v) => Math.round(v * 10) / 10;
  return {
    available: true,
    matchesWithPbp: n,
    runsOf8PlusFor: runsFor,
    runsOf8PlusAgainst: runsAgainst,
    avgLeadChanges: round1(leadChanges / n),
    clutch:
      clutchGames > 0
        ? {
            games: clutchGames,
            avgPointsFor: round1(clutchFor / clutchGames),
            avgPointsAgainst: round1(clutchAgainst / clutchGames)
          }
        : null,
    avgFoulsPerGame: round1(foulsTotal / n),
    avgFoulsByPeriod: Object.fromEntries(
      Object.entries(foulsByPeriod)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([p, v]) => [p, round1(v / n)])
    ),
    playersFouledOut: fouledOut
  };
}

const FOUL_OUT = 5;

/**
 * Profil zawodnika z akcji po akcji (wszystkie jego zdarzenia w sezonie): punkty, faule i straty
 * na kwarty, końcówki (ostatnie 5 min 4. kwarty + dogrywki), rzuty za 2/3 i wolne, faule do 5.
 * @param {object[] | null | undefined} events — zdarzenia jednego zawodnika (dowolne mecze)
 * @param {{ clutchSeconds?: number }} [options]
 */
export function computePlayerPbpProfile(events, options = {}) {
  const list = Array.isArray(events) ? events : [];
  if (list.length === 0) return { available: false, matchesWithPbp: 0 };
  const clutchSeconds = options.clutchSeconds ?? DEFAULT_CLUTCH_SECONDS;
  const byPeriod = {};
  const period = (ev) => {
    const key = ev.period ?? 0;
    byPeriod[key] ??= { pts: 0, fouls: 0, turnovers: 0 };
    return byPeriod[key];
  };
  const shots = { twoPm: 0, twoPa: 0, threePm: 0, threePa: 0, ftm: 0, fta: 0, blockedShots: 0 };
  const clutch = { pts: 0, fgm: 0, fga: 0, ftm: 0, fta: 0, turnovers: 0, fouls: 0 };
  const foulsByMatch = new Map();
  const matches = new Set();

  for (const ev of list) {
    matches.add(ev.kalkMatchId ?? 'm');
    const p = period(ev);
    const inClutch = isClutchEvent(ev, clutchSeconds);
    const type = ev.actionType;
    if (type === 'shot_made' || type === 'shot_missed' || type === 'shot_blocked') {
      const three = ev.shotValue === 3;
      const made = type === 'shot_made';
      if (three) { shots.threePa += 1; if (made) shots.threePm += 1; }
      else { shots.twoPa += 1; if (made) shots.twoPm += 1; }
      if (type === 'shot_blocked') shots.blockedShots += 1;
      if (made) p.pts += three ? 3 : 2;
      if (inClutch) { clutch.fga += 1; if (made) { clutch.fgm += 1; clutch.pts += three ? 3 : 2; } }
    } else if (type === 'ft_made' || type === 'ft_missed') {
      shots.fta += 1;
      if (type === 'ft_made') { shots.ftm += 1; p.pts += 1; }
      if (inClutch) { clutch.fta += 1; if (type === 'ft_made') { clutch.ftm += 1; clutch.pts += 1; } }
    } else if (type === 'foul') {
      p.fouls += 1;
      if (inClutch) clutch.fouls += 1;
      const key = ev.kalkMatchId ?? 'm';
      foulsByMatch.set(key, (foulsByMatch.get(key) ?? 0) + 1);
    } else if (type === 'turnover') {
      p.turnovers += 1;
      if (inClutch) clutch.turnovers += 1;
    }
  }

  const ordered = Object.fromEntries(
    Object.keys(byPeriod)
      .map(Number)
      .sort((a, b) => a - b)
      .map((n) => [periodLabel(n), byPeriod[n]])
  );
  return {
    available: true,
    matchesWithPbp: matches.size,
    byPeriod: ordered,
    shots,
    clutch,
    foulOuts: [...foulsByMatch.values()].filter((n) => n >= FOUL_OUT).length
  };
}
