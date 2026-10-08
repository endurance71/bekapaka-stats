// How a match unfolded, from KALK play-by-play: score after each quarter, the quarter's top club scorer,
// scoring runs (with minutes and scorers), the biggest lead, the opponent's longest drought, lead changes.
// Everything is computed here so copy (schematic or AI) only quotes numbers and never does arithmetic.
// Scores are written from the club's side: „49:10” = BeKaPaKa 49, rival 10.

const QUARTER_SEC = 600;
const OT_SEC = 300;

/** Minute of the match (1–40, overtime 41+) of an event, from the quarter and the countdown clock. */
export function matchMinute(period, clockSec) {
  const length = period > 4 ? OT_SEC : QUARTER_SEC;
  const before = period > 4 ? 4 * QUARTER_SEC + (period - 5) * OT_SEC : (period - 1) * QUARTER_SEC;
  const elapsed = before + Math.max(0, length - (clockSec ?? length));
  return Math.max(1, Math.ceil(elapsed / 60));
}

// „1. kwarta” or „1.–2. kwarta” for a run that crosses the break between quarters.
const quarterOf = (minute) => (minute > 40 ? 5 : Math.ceil(minute / 10));
function quarterSpan(from, to) {
  const a = quarterOf(from);
  const b = quarterOf(to);
  const label = (q) => (q > 4 ? 'dogrywka' : `${q}.`);
  return a === b ? (a > 4 ? 'dogrywka' : `${a}. kwarta`) : `${label(a)}–${label(b)} kwarta`.replace('dogrywka kwarta', 'dogrywka');
}

const quarterLabel = (period) => (period > 4 ? `Dogrywka${period > 5 ? ` ${period - 4}` : ''}` : `${period}. kwarta`);

/**
 * @param {Array<{seq:number, period:number, clockSec:number|null, side:string|null, playerName:string|null, scoreHome:number|null, scoreAway:number|null, isScoring:boolean}>} events ordered by seq
 * @param {'home'|'away'} usSide
 */
export function matchFlow(events, usSide, { minRun = 8 } = {}) {
  const scoring = events.filter((e) => e.isScoring && e.scoreHome !== null && e.scoreAway !== null);
  if (scoring.length < 4) return null;
  const us = (e) => (usSide === 'home' ? e.scoreHome : e.scoreAway);
  const them = (e) => (usSide === 'home' ? e.scoreAway : e.scoreHome);
  const team = (e) => (e.side === usSide ? 'us' : 'them');

  let prevUs = 0;
  let prevThem = 0;
  let leader = 0;
  let leadChanges = 0;
  let ties = 0;
  const largest = { us: null, them: null };
  const runs = [];
  let run = null;
  let lastThemAt = { minute: 0, us: 0, them: 0 };
  let drought = null;
  const perQuarter = new Map();

  const closeRun = () => {
    if (run && run.points >= minRun) runs.push(run);
    run = null;
  };

  for (const e of scoring) {
    const u = us(e);
    const t = them(e);
    const du = u - prevUs;
    const dt = t - prevThem;
    if (du <= 0 && dt <= 0) continue;
    const side = du > 0 ? 'us' : 'them';
    const pts = side === 'us' ? du : dt;
    const minute = matchMinute(e.period, e.clockSec);
    const name = e.playerName || '';

    // Runs: consecutive points of one side.
    if (!run || run.team !== side) {
      closeRun();
      run = { team: side, points: 0, from: `${prevUs}:${prevThem}`, to: '', fromMinute: minute, toMinute: minute, scorers: new Map() };
    }
    run.points += pts;
    run.to = `${u}:${t}`;
    run.toMinute = minute;
    if (name) run.scorers.set(name, (run.scorers.get(name) || 0) + pts);

    // Opponent's longest stretch without points (club perspective), measured between rival baskets.
    if (side === 'them') {
      const gap = minute - lastThemAt.minute;
      if (!drought || gap > drought.minutes) drought = { minutes: gap, fromMinute: lastThemAt.minute || 1, toMinute: minute, run: `${u - lastThemAt.us}:${t - pts - lastThemAt.them}` };
      lastThemAt = { minute, us: u, them: t };
    }

    // Lead changes, ties and the biggest lead of each side.
    const diff = u - t;
    const now = Math.sign(diff);
    if (now === 0) ties += 1;
    else if (leader !== 0 && now !== leader) leadChanges += 1;
    if (now !== 0) leader = now;
    if (diff > 0 && (!largest.us || diff > largest.us.points)) largest.us = { points: diff, minute, score: `${u}:${t}` };
    if (diff < 0 && (!largest.them || -diff > largest.them.points)) largest.them = { points: -diff, minute, score: `${u}:${t}` };

    // Club scorers per quarter.
    if (side === 'us' && name) {
      const q = perQuarter.get(e.period) || new Map();
      q.set(name, (q.get(name) || 0) + pts);
      perQuarter.set(e.period, q);
    }
    prevUs = u;
    prevThem = t;
  }
  closeRun();
  // A rival drought that lasts until the final buzzer counts too.
  const lastMinute = matchMinute(scoring.at(-1).period, 0);
  const tail = lastMinute - lastThemAt.minute;
  if (!drought || tail > drought.minutes) drought = { minutes: tail, fromMinute: lastThemAt.minute || 1, toMinute: lastMinute, run: `${prevUs - lastThemAt.us}:${prevThem - lastThemAt.them}` };

  // Score after each quarter: last scoring event of the quarter.
  const periods = [...new Set(events.map((e) => e.period))].sort((a, b) => a - b);
  let afterUs = 0;
  let afterThem = 0;
  const quarters = periods.map((p) => {
    const last = scoring.filter((e) => e.period === p).at(-1);
    const startUs = afterUs;
    const startThem = afterThem;
    if (last) {
      afterUs = us(last);
      afterThem = them(last);
    }
    const scorers = [...(perQuarter.get(p) || new Map())].sort((a, b) => b[1] - a[1]);
    return {
      label: quarterLabel(p),
      us: afterUs - startUs,
      them: afterThem - startThem,
      after: `${afterUs}:${afterThem}`,
      topScorer: scorers[0] ? { name: scorers[0][0], pts: scorers[0][1] } : null,
    };
  });

  const first = scoring[0];
  return {
    quarters,
    runs: runs
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
      .sort((a, b) => a.fromMinute - b.fromMinute)
      .map((r) => ({
        team: r.team,
        points: r.points,
        from: r.from,
        to: r.to,
        fromMinute: r.fromMinute,
        toMinute: r.toMinute,
        quarter: quarterSpan(r.fromMinute, r.toMinute),
        scorers: [...r.scorers].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, pts]) => ({ name, pts })),
      })),
    largestLead: largest.us,
    largestDeficit: largest.them,
    leadChanges,
    ties,
    rivalDrought: drought && drought.minutes >= 3 ? drought : null,
    firstPoints: first ? { team: team(first), name: first.playerName || '', minute: matchMinute(first.period, first.clockSec) } : null,
  };
}
