/**
 * Audyt integralności danych KALK (P4): kontrole meczu E1–E13 i sezonu S1–S7.
 *
 * Funkcje `checkMatch*` / `recomputeStandings` są czyste (testowalne bez bazy);
 * `auditSeasonIntegrity(prisma, season)` ładuje dane sezonu i składa raport.
 *
 * Mecz:  E1 box score kompletny i zgodny z terminarzem · E2 Σ pkt zawodników = pkt drużyny = wynik
 *        E3 SUMA = Σ wierszy · E4 FGM/FGA/PTS/REB, trafione ≤ oddane · E5 kwarty (Σ = wynik, OT tylko przy remisie)
 *        E6 przebieg co 5 min · E7 PBP (wynik końcowy, monotoniczność, Σ pkt, liczniki vs box, zegar, nazwiska)
 *        E8 5 startujących · E9 minuty ≈ 200 + 25·OT (±6, warn) · E10 bloki A = bloki otrzymane B
 *        E11 5–15 zawodników ze slugiem · E12 brakujące sekcje · E13 tabele typowane (KalkTeamGameStat, logi)
 * Sezon: S1 liczba zakończonych meczów (terminarz vs KalkMatch) + brakujące URL · S2 tabela przeliczona z wyników
 *        S3 statystyki sezonowe vs Σ logów · S4 duplikaty LeagueMatch · S5 unikalność ID meczu między sezonami
 *        S6 RosterPlayer.kalkSlug rozwiązywalny · S7 świeżość ostatniego KalkSyncRun
 */
import { normalizeTeamNameForMatch } from '../../lib/kalkTeamNames.js';
import { kalkMatchUrl } from './util.js';

const SYNC_MAX_AGE_DAYS = 8;
const MINUTES_TOLERANCE = 6;
const PLAYER_EVENT_TYPES = new Set([
  'shot_made', 'shot_missed', 'shot_blocked', 'ft_made', 'ft_missed', 'assist', 'turnover', 'steal', 'foul', 'block'
]);

function issue(severity, code, message, extra = {}) {
  return { severity, code, message, ...extra };
}

function minToSeconds(min) {
  if (typeof min === 'number') return min * 60;
  const m = String(min || '').match(/^(\d+):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

const n = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Wiersz box score (legacy JSON) → klucze kontraktu. */
function rowStats(p) {
  return {
    secondsPlayed: minToSeconds(p.min),
    pts: n(p.pts),
    twoPm: n(p.two_pm),
    twoPa: n(p.two_pa),
    threePm: n(p.three_pm),
    threePa: n(p.three_pa),
    fgm: n(p.fgm),
    fga: n(p.fga),
    ftm: n(p.ftm),
    fta: n(p.fta),
    orb: n(p.orb),
    drb: n(p.drb),
    reb: n(p.reb),
    ast: n(p.ast),
    stl: n(p.stl),
    tov: n(p.tov),
    pf: n(p.pf),
    pfDrawn: n(p.pfDrawn),
    blk: n(p.blk),
    blkAgainst: n(p.blkAgainst),
    eval: n(p.eval)
  };
}

function sumRows(players) {
  const out = {};
  for (const p of players) {
    for (const [k, v] of Object.entries(rowStats(p))) out[k] = (out[k] || 0) + v;
  }
  return out;
}

function identityIssues(s) {
  const bad = [];
  if (s.fgm !== s.twoPm + s.threePm) bad.push(`FGM ${s.fgm} ≠ 2PM+3PM ${s.twoPm + s.threePm}`);
  if (s.fga !== s.twoPa + s.threePa) bad.push(`FGA ${s.fga} ≠ 2PA+3PA ${s.twoPa + s.threePa}`);
  const pts = 2 * s.twoPm + 3 * s.threePm + s.ftm;
  if (s.pts !== pts) bad.push(`PTS ${s.pts} ≠ 2·2PM+3·3PM+FTM ${pts}`);
  if (s.reb !== s.orb + s.drb) bad.push(`REB ${s.reb} ≠ ORB+DRB ${s.orb + s.drb}`);
  if (s.twoPm > s.twoPa || s.threePm > s.threePa || s.ftm > s.fta || s.fgm > s.fga) bad.push('trafione > oddane');
  return bad;
}

function quartersOf(km) {
  const info = km.info && typeof km.info === 'object' ? km.info : null;
  if (Array.isArray(info?.quarters) && info.quarters.length) {
    return info.quarters.map((q, i) => ({ period: q.period ?? i + 1, home: n(q.home), away: n(q.away) }));
  }
  const box = Array.isArray(km.boxScore?.quarters) ? km.boxScore.quarters : [];
  return box.map((q, i) => ({ period: i + 1, home: n(q.home), away: n(q.away) }));
}

/**
 * Kontrole jednego meczu.
 * @param {object} km — KalkMatch
 * @param {{ schedule?: object|null, teamStats?: object[], logCount?: number|null, events?: object[]|null, kalkNumber?: number|null }} ctx
 * @returns {object[]} lista problemów
 */
export function checkMatch(km, ctx = {}) {
  const out = [];
  const id = km.id;
  const isV2 = km.sourceSite === 'v2';
  const strictSev = isV2 ? 'error' : 'warn';
  const add = (severity, code, message, details) => out.push(issue(severity, code, message, { kalkMatchId: id, details }));
  const teams = Array.isArray(km.boxScore?.teams) ? km.boxScore.teams : [];
  const scores = [km.scoreHome, km.scoreAway];

  // E1 — kompletność i zgodność z terminarzem
  if (teams.length !== 2 || teams.some((t) => !Array.isArray(t.players) || !t.players.length)) {
    add('error', 'E1', 'Box score niekompletny (wymagane 2 drużyny z zawodnikami)');
    return out;
  }
  const s = ctx.schedule;
  if (s) {
    if (s.scoreHome !== km.scoreHome || s.scoreAway !== km.scoreAway) {
      add('error', 'E1', `Wynik ${km.scoreHome}:${km.scoreAway} ≠ terminarz ${s.scoreHome}:${s.scoreAway}`);
    }
    const namesOk =
      normalizeTeamNameForMatch(s.homeTeam) === normalizeTeamNameForMatch(teams[0].name) &&
      normalizeTeamNameForMatch(s.guestTeam) === normalizeTeamNameForMatch(teams[1].name);
    if (!namesOk) add('error', 'E1', `Drużyny box score (${teams[0].name} – ${teams[1].name}) ≠ terminarz (${s.homeTeam} – ${s.guestTeam})`);
  }

  const sums = teams.map((t) => sumRows(t.players));

  // E2 — punkty
  teams.forEach((t, i) => {
    if (sums[i].pts !== n(t.pts) || n(t.pts) !== n(scores[i])) {
      add('error', 'E2', `${t.name}: Σ pkt zawodników ${sums[i].pts}, pkt drużyny ${t.pts}, wynik ${scores[i]}`);
    }
  });

  // E3 — SUMA = Σ wierszy
  teams.forEach((t, i) => {
    if (!t.totals) return;
    const diffs = Object.keys(sums[i])
      .filter((k) => k in t.totals && n(t.totals[k]) !== sums[i][k])
      .map((k) => `${k} ${t.totals[k]}≠${sums[i][k]}`);
    if (diffs.length) add(strictSev, 'E3', `${t.name}: SUMA ≠ Σ wierszy (${diffs.join(', ')})`);
  });
  for (const ts of ctx.teamStats || []) {
    const i = ts.side === 'away' ? 1 : 0;
    const diffs = ['pts', 'fgm', 'fga', 'reb', 'ast', 'tov', 'stl', 'blk']
      .filter((k) => n(ts[k]) !== sums[i][k])
      .map((k) => `${k} ${ts[k]}≠${sums[i][k]}`);
    if (diffs.length) add('error', 'E3', `KalkTeamGameStat ${ts.side} ≠ Σ box (${diffs.join(', ')})`);
  }

  // E4 — tożsamości
  teams.forEach((t, i) => {
    for (const p of t.players) {
      const bad = identityIssues(rowStats(p));
      if (bad.length) add('error', 'E4', `${t.name} / ${p.name}: ${bad.join('; ')}`);
    }
    const teamBad = identityIssues(t.totals ? { ...sums[i], ...pickTotals(t.totals) } : sums[i]);
    if (teamBad.length) add('error', 'E4', `${t.name} (drużyna): ${teamBad.join('; ')}`);
  });

  // E5 — kwarty
  const quarters = quartersOf(km);
  if (!quarters.length) {
    add('warn', 'E5', 'Brak wyników kwart');
  } else {
    const qh = quarters.reduce((a, q) => a + q.home, 0);
    const qa = quarters.reduce((a, q) => a + q.away, 0);
    if (qh !== n(km.scoreHome) || qa !== n(km.scoreAway)) add('error', 'E5', `Σ kwart ${qh}:${qa} ≠ wynik ${km.scoreHome}:${km.scoreAway}`);
    const regular = quarters.filter((q) => q.period <= 4);
    const ot = quarters.filter((q) => q.period >= 5);
    if (ot.length) {
      const rh = regular.reduce((a, q) => a + q.home, 0);
      const ra = regular.reduce((a, q) => a + q.away, 0);
      // Niespójność źródła KALK (np. mecz 3205: kwarty 46:45 + „dogrywka” 10:0) — ostrzeżenie
      if (rh !== ra) add('warn', 'E5', `Dogrywka mimo braku remisu po 4. kwarcie (${rh}:${ra}) — dane źródła KALK`);
    }
    if (isV2 && n(km.overtimes) !== ot.length) add('error', 'E5', `overtimes=${km.overtimes}, okresy OT w kwartach: ${ot.length}`);
  }

  // E6 — przebieg co 5 min
  // Punkty bez wyniku (null) — historyczne mecze mają tylko punkty co 10 min
  const flow = (Array.isArray(km.info?.flow5) ? km.info.flow5 : []).filter(
    (f) => f && f.home != null && f.away != null
  );
  if (flow.length) {
    let ph = 0;
    let pa = 0;
    for (const f of [...flow].sort((a, b) => n(a.minute) - n(b.minute))) {
      if (n(f.home) < ph || n(f.away) < pa) {
        add('error', 'E6', `Przebieg maleje w ${f.minute}. min (${f.home}:${f.away})`);
        break;
      }
      if (n(f.home) > n(km.scoreHome) || n(f.away) > n(km.scoreAway)) {
        add('error', 'E6', `Przebieg ${f.home}:${f.away} w ${f.minute}. min przekracza wynik końcowy`);
        break;
      }
      ph = n(f.home);
      pa = n(f.away);
    }
    const last = flow.reduce((a, b) => (n(b.minute) > n(a.minute) ? b : a));
    const endMinute = 40 + 5 * n(km.overtimes);
    if (n(last.minute) >= endMinute && (n(last.home) !== n(km.scoreHome) || n(last.away) !== n(km.scoreAway))) {
      add('warn', 'E6', `Ostatni punkt przebiegu ${last.home}:${last.away} ≠ wynik końcowy`);
    }
  }

  // E7 — akcja po akcji
  const events = Array.isArray(ctx.events) ? [...ctx.events].sort((a, b) => a.seq - b.seq) : [];
  if (events.length) out.push(...checkPlayByPlay(km, events, teams));

  // E8 — 5 startujących
  teams.forEach((t) => {
    const starters = t.players.filter((p) => p.starter).length;
    if (starters !== 5) add(strictSev, 'E8', `${t.name}: ${starters} startujących (oczekiwano 5)`);
  });

  // E9 — minuty
  teams.forEach((t, i) => {
    const minutes = sums[i].secondsPlayed / 60;
    const expected = 200 + 25 * n(km.overtimes);
    if (minutes > 0 && Math.abs(minutes - expected) > MINUTES_TOLERANCE) {
      add('warn', 'E9', `${t.name}: minuty ${minutes.toFixed(1)} vs oczekiwane ${expected} (±${MINUTES_TOLERANCE})`);
    }
  });

  // E10 — bloki
  if (teams.every((t) => t.players.some((p) => p.blkAgainst != null))) {
    for (const [a, b] of [[0, 1], [1, 0]]) {
      if (sums[a].blk !== sums[b].blkAgainst) {
        add('warn', 'E10', `Bloki ${teams[a].name} ${sums[a].blk} ≠ bloki otrzymane ${teams[b].name} ${sums[b].blkAgainst}`);
      }
    }
  }

  // E11 — liczba zawodników i slugi
  teams.forEach((t) => {
    const count = t.players.length;
    if (count < 5 || count > 15) add(strictSev, 'E11', `${t.name}: ${count} zawodników (dozwolone 5–15)`);
    if (isV2) {
      const noSlug = t.players.filter((p) => !p.slug || String(p.slug).startsWith('anon-'));
      if (noSlug.length) add('warn', 'E11', `${t.name}: ${noSlug.length} zawodników bez sluga (${noSlug.map((p) => p.name).join(', ')})`);
    }
  });

  // E12 — sekcje
  if (isV2) {
    const sections = new Set(km.sectionsAvailable || []);
    for (const sec of ['info', 'statystyki']) {
      if (!sections.has(sec)) add('error', 'E12', `Brak sekcji „${sec}”`);
    }
    if ((ctx.kalkNumber ?? 0) >= 50 && !km.hasPlayByPlay) add('warn', 'E12', 'Brak akcji po akcji (sezon z PBP)');
  }

  // E13 — tabele typowane
  if (isV2) {
    const rows = teams.reduce((a, t) => a + t.players.length, 0);
    if ((ctx.teamStats || []).length !== 2) add('error', 'E13', `KalkTeamGameStat: ${(ctx.teamStats || []).length} wierszy (oczekiwano 2)`);
    if (ctx.logCount != null && ctx.logCount !== rows) add('error', 'E13', `KalkPlayerGameLog: ${ctx.logCount} wierszy, box score: ${rows}`);
    if (km.hasPlayByPlay && !events.length) add('error', 'E13', 'hasPlayByPlay=true, brak zdarzeń KalkPlayByPlayEvent');
  }

  return out;
}

function pickTotals(t) {
  const out = {};
  for (const k of ['pts', 'twoPm', 'twoPa', 'threePm', 'threePa', 'fgm', 'fga', 'ftm', 'fta', 'orb', 'drb', 'reb']) {
    if (t[k] != null) out[k] = n(t[k]);
  }
  return out;
}

/**
 * E7 — PBP vs wynik i box score.
 */
export function checkPlayByPlay(km, events, teams = km.boxScore?.teams || []) {
  const out = [];
  const add = (severity, message, details) => out.push(issue(severity, 'E7', message, { kalkMatchId: km.id, details }));
  const last = events[events.length - 1];
  if (n(last.scoreHome) !== n(km.scoreHome) || n(last.scoreAway) !== n(km.scoreAway)) {
    add('error', `PBP: wynik końcowy ${last.scoreHome}:${last.scoreAway} ≠ ${km.scoreHome}:${km.scoreAway}`);
  }
  let ph = 0;
  let pa = 0;
  const pts = { home: 0, away: 0 };
  const counts = { home: { fgm: 0, threePm: 0, ftm: 0, fta: 0 }, away: { fgm: 0, threePm: 0, ftm: 0, fta: 0 } };
  const clock = new Map();
  let clockIssues = 0;
  let unresolved = 0;
  for (const e of events) {
    if (n(e.scoreHome) < ph || n(e.scoreAway) < pa) {
      add('error', `PBP: wynik maleje (seq ${e.seq}: ${e.scoreHome}:${e.scoreAway})`);
      break;
    }
    ph = n(e.scoreHome);
    pa = n(e.scoreAway);
    const side = e.side === 'home' || e.side === 'away' ? e.side : null;
    if (side) {
      if (e.made && (e.actionType === 'shot_made' || e.actionType === 'ft_made')) pts[side] += n(e.shotValue);
      if (e.actionType === 'shot_made') {
        counts[side].fgm += 1;
        if (e.shotValue === 3) counts[side].threePm += 1;
      }
      if (e.actionType === 'ft_made') {
        counts[side].ftm += 1;
        counts[side].fta += 1;
      }
      if (e.actionType === 'ft_missed') counts[side].fta += 1;
    }
    if (e.clockSec != null) {
      const prev = clock.get(e.period);
      if (prev != null && e.clockSec > prev) clockIssues += 1;
      clock.set(e.period, e.clockSec);
    }
    if (PLAYER_EVENT_TYPES.has(e.actionType) && !e.playerSlug) unresolved += 1;
  }
  if (pts.home !== n(km.scoreHome) || pts.away !== n(km.scoreAway)) {
    add('error', `PBP: Σ punktów ze zdarzeń ${pts.home}:${pts.away} ≠ wynik ${km.scoreHome}:${km.scoreAway}`);
  }
  ['home', 'away'].forEach((side, i) => {
    const t = teams[i];
    if (!t?.players) return;
    const box = sumRows(t.players);
    const diffs = Object.keys(counts[side])
      .filter((k) => counts[side][k] !== box[k])
      .map((k) => `${k} PBP ${counts[side][k]} vs box ${box[k]}`);
    if (diffs.length) add('warn', `PBP ${t.name}: ${diffs.join(', ')}`);
  });
  if (clockIssues) add('warn', `PBP: zegar rośnie w obrębie kwarty (${clockIssues}×)`);
  if (unresolved) add('warn', `PBP: ${unresolved} zdarzeń zawodnika bez sluga`);
  return out;
}

/**
 * Tabela przeliczona z wyników (KALK: 2 pkt za zwycięstwo, 1 za porażkę).
 * @param {object[]} leagueMatches — zakończone mecze fazy zasadniczej
 */
export function recomputeStandings(leagueMatches) {
  const table = new Map();
  const row = (name) => {
    const key = normalizeTeamNameForMatch(name);
    if (!table.has(key)) table.set(key, { name, matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, points: 0 });
    return table.get(key);
  };
  for (const m of leagueMatches) {
    if (!m.isFinished || m.scoreHome == null || m.scoreAway == null) continue;
    const h = row(m.homeTeam);
    const a = row(m.guestTeam);
    h.matches += 1;
    a.matches += 1;
    h.pointsFor += m.scoreHome;
    h.pointsAgainst += m.scoreAway;
    a.pointsFor += m.scoreAway;
    a.pointsAgainst += m.scoreHome;
    if (m.scoreHome > m.scoreAway) {
      h.wins += 1;
      a.losses += 1;
      h.points += 2;
      a.points += 1;
    } else if (m.scoreAway > m.scoreHome) {
      a.wins += 1;
      h.losses += 1;
      a.points += 2;
      h.points += 1;
    }
  }
  return table;
}

export function isRegularSeasonPhase(label) {
  return !label || /zasadnicz/i.test(label);
}

/**
 * Pełny audyt integralności sezonu.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ id: string, slug: string, kalkNumber?: number|null, sourceSite?: string, isActive?: boolean }} season
 * @param {{ now?: Date, includeRoster?: boolean }} [opts]
 */
export async function auditSeasonIntegrity(prisma, season, opts = {}) {
  const now = opts.now || new Date();
  const seasonId = season.id;
  const [kalkMatches, leagueMatches, teamStats, logs, events, leagueTeams, seasonStats, lastSync] = await Promise.all([
    prisma.kalkMatch.findMany({ where: { seasonId } }),
    prisma.leagueMatch.findMany({ where: { seasonId } }),
    prisma.kalkTeamGameStat.findMany({ where: { seasonId } }),
    prisma.kalkPlayerGameLog.findMany({
      where: { seasonId },
      select: { kalkMatchId: true, playerSlug: true, secondsPlayed: true, pts: true, reb: true, ast: true }
    }),
    prisma.kalkPlayByPlayEvent.findMany({
      where: { seasonId },
      select: {
        kalkMatchId: true, seq: true, period: true, clockSec: true, side: true, actionType: true,
        shotValue: true, made: true, scoreHome: true, scoreAway: true, playerSlug: true
      }
    }),
    prisma.leagueTeam.findMany({ where: { seasonId, phase: 'regular' } }),
    prisma.kalkPlayerSeasonStat.findMany({ where: { seasonId } }),
    prisma.kalkSyncRun.findFirst({ where: { seasonId }, orderBy: { startedAt: 'desc' } })
  ]);

  const issues = [];
  const group = (rows, key) => {
    const m = new Map();
    for (const r of rows) {
      const k = r[key];
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    }
    return m;
  };
  const statsByMatch = group(teamStats, 'kalkMatchId');
  const logsByMatch = group(logs, 'kalkMatchId');
  const eventsByMatch = group(events, 'kalkMatchId');
  const leagueByKalkId = group(leagueMatches.filter((l) => l.kalkMatchId), 'kalkMatchId');
  const kalkById = new Map(kalkMatches.map((k) => [k.id, k]));

  // Mecze
  for (const km of kalkMatches) {
    if (!km.isFinished) continue;
    issues.push(
      ...checkMatch(km, {
        schedule: leagueByKalkId.get(km.id)?.[0] || null,
        teamStats: statsByMatch.get(km.id) || [],
        logCount: km.sourceSite === 'v2' ? (logsByMatch.get(km.id) || []).length : null,
        events: eventsByMatch.get(km.id) || [],
        kalkNumber: season.kalkNumber ?? null
      })
    );
  }

  // S1 — liczba zakończonych meczów
  const finishedSchedule = leagueMatches.filter((l) => l.isFinished);
  const finishedKalk = kalkMatches.filter((k) => k.isFinished);
  const missing = finishedSchedule
    .filter((l) => !l.kalkMatchId || !kalkById.has(l.kalkMatchId))
    .map((l) => ({
      leagueMatchId: l.id,
      kalkMatchId: l.kalkMatchId,
      date: l.date instanceof Date ? l.date.toISOString().slice(0, 10) : String(l.date).slice(0, 10),
      homeTeam: l.homeTeam,
      guestTeam: l.guestTeam,
      url: l.kalkMatchId ? kalkMatchUrl(l.kalkMatchId) : null
    }));
  // Walkower KALK (20:0 / 0:20) zwykle nie ma protokołu — brak box score to wtedy ostrzeżenie, nie błąd
  const isWalkover = (l) => {
    const h = Number(l.scoreHome);
    const a = Number(l.scoreAway);
    return (h === 20 && a === 0) || (h === 0 && a === 20);
  };
  const walkovers = missing.filter((m) => isWalkover(finishedSchedule.find((l) => l.id === m.leagueMatchId) || {}));
  const realMissing = missing.filter((m) => !walkovers.includes(m));
  if (walkovers.length) {
    issues.push(issue('warn', 'S1', `Walkowery bez box score: ${walkovers.length}`, { details: { missing: walkovers } }));
  }
  if (realMissing.length || finishedSchedule.length - walkovers.length !== finishedKalk.length) {
    issues.push(
      issue('error', 'S1', `Zakończone mecze: terminarz ${finishedSchedule.length}, KalkMatch ${finishedKalk.length}, brak box score: ${realMissing.length}`, {
        details: { missing: realMissing }
      })
    );
  }

  // S2 — tabela
  const isLegacy = season.sourceSite !== 'v2';
  if (leagueTeams.length) {
    const regular = leagueMatches.filter((l) => isRegularSeasonPhase(l.phaseLabel));
    const recomputed = recomputeStandings(regular);
    for (const lt of leagueTeams) {
      const r = recomputed.get(normalizeTeamNameForMatch(lt.name));
      if (!r) {
        issues.push(issue(isLegacy ? 'warn' : 'error', 'S2', `Tabela: ${lt.name} bez meczów w terminarzu`));
        continue;
      }
      const hard = ['matches', 'wins', 'losses', 'pointsFor', 'pointsAgainst'].filter((k) => r[k] !== lt[k]);
      if (hard.length) {
        issues.push(
          issue(isLegacy ? 'warn' : 'error', 'S2', `Tabela ${lt.name}: ${hard.map((k) => `${k} ${lt[k]}≠${r[k]}`).join(', ')}`)
        );
      } else if (r.points !== lt.points) {
        issues.push(issue('warn', 'S2', `Tabela ${lt.name}: punkty ${lt.points} ≠ przeliczone ${r.points}`));
      }
    }
  }

  // S3 — statystyki sezonowe vs Σ logów
  const logsBySlug = group(logs.filter((l) => l.playerSlug), 'playerSlug');
  const pageBySlug = group(seasonStats.filter((s) => s.source === 'kalk-page'), 'playerSlug');
  for (const [slug, rows] of pageBySlug) {
    const ls = logsBySlug.get(slug) || [];
    const fromLogs = {
      games: ls.filter((l) => (l.secondsPlayed ?? 0) > 0 || (l.pts ?? 0) > 0).length,
      pts: ls.reduce((a, l) => a + n(l.pts), 0),
      reb: ls.reduce((a, l) => a + n(l.reb), 0),
      ast: ls.reduce((a, l) => a + n(l.ast), 0)
    };
    const page = rows.reduce(
      (a, r) => ({ games: a.games + r.games, pts: a.pts + r.pts, reb: a.reb + r.reb, ast: a.ast + r.ast }),
      { games: 0, pts: 0, reb: 0, ast: 0 }
    );
    const diffs = Object.keys(page).filter((k) => page[k] !== fromLogs[k]);
    if (diffs.length) {
      issues.push(issue('warn', 'S3', `Statystyki ${slug}: ${diffs.map((k) => `${k} strona ${page[k]} vs logi ${fromLogs[k]}`).join(', ')}`));
    }
  }

  // S4 — duplikaty LeagueMatch
  for (const [kalkMatchId, rows] of leagueByKalkId) {
    if (rows.length > 1) {
      issues.push(issue('error', 'S4', `LeagueMatch: ${rows.length} wiersze dla kalkMatchId ${kalkMatchId}`, { kalkMatchId }));
    }
  }

  // S5 — globalna unikalność ID meczu
  if (kalkMatches.length) {
    const others = await prisma.kalkMatch.findMany({
      where: { id: { in: kalkMatches.map((k) => k.id) }, seasonId: { not: seasonId } },
      select: { id: true, seasonId: true, sourceSite: true }
    });
    for (const o of others) {
      const mine = kalkById.get(o.id);
      const sev = mine?.sourceSite === 'v2' && o.sourceSite === 'v2' ? 'error' : 'warn';
      issues.push(issue(sev, 'S5', `Mecz ${o.id} istnieje także w sezonie ${o.seasonId}`, { kalkMatchId: o.id }));
    }
  }

  // S6 — skład → slug KALK
  if (opts.includeRoster ?? season.isActive) {
    const roster = await prisma.rosterPlayer.findMany({
      where: { kalkSlug: { not: null } },
      select: { id: true, firstName: true, lastName: true, kalkSlug: true }
    });
    if (roster.length) {
      const slugs = roster.map((r) => r.kalkSlug);
      const [profiles, players] = await Promise.all([
        prisma.kalkPlayerProfile.findMany({ where: { slug: { in: slugs } }, select: { slug: true } }),
        prisma.kalkPlayer.findMany({ where: { slug: { in: slugs } }, select: { slug: true } })
      ]);
      const known = new Set([...profiles, ...players].map((p) => p.slug));
      for (const r of roster) {
        if (!known.has(r.kalkSlug)) {
          issues.push(issue('warn', 'S6', `Skład: ${r.firstName} ${r.lastName} — kalkSlug „${r.kalkSlug}” nie istnieje w KALK`));
        }
      }
    }
  }

  // S7 — świeżość syncu (tylko aktywny sezon)
  if (season.isActive) {
    if (!lastSync) {
      issues.push(issue('warn', 'S7', 'Brak KalkSyncRun dla aktywnego sezonu'));
    } else {
      const ageDays = (now.getTime() - new Date(lastSync.finishedAt || lastSync.startedAt).getTime()) / 86_400_000;
      if (ageDays > SYNC_MAX_AGE_DAYS) issues.push(issue('warn', 'S7', `Ostatni sync ${ageDays.toFixed(1)} dni temu (> ${SYNC_MAX_AGE_DAYS})`));
      if (lastSync.status === 'error') issues.push(issue('warn', 'S7', `Ostatni sync zakończony błędem: ${lastSync.errorMessage || '—'}`));
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warn');
  const byCode = {};
  for (const i of issues) byCode[i.code] = (byCode[i.code] || 0) + 1;
  return {
    seasonId,
    seasonSlug: season.slug,
    generatedAt: now.toISOString(),
    stats: {
      kalkMatches: kalkMatches.length,
      finishedSchedule: finishedSchedule.length,
      finishedKalkMatches: finishedKalk.length,
      missingBoxScore: missing.length,
      pbpMatches: eventsByMatch.size,
      gameLogs: logs.length
    },
    errors,
    warnings,
    counts: { errors: errors.length, warnings: warnings.length, byCode },
    missingMatches: missing
  };
}

/**
 * Kod wyjścia audytu: 0 OK, 1 problemy wg `failOn`. Bez `strict`/`failOn` zawsze 0 (raport).
 * @param {{ counts: { errors: number, warnings: number } }[]} reports
 * @param {{ strict?: boolean, failOn?: 'error'|'warn'|null }} opts
 */
export function auditExitCode(reports, { strict = false, failOn = null } = {}) {
  const mode = failOn || (strict ? 'error' : null);
  if (!mode) return 0;
  const errors = reports.reduce((a, r) => a + (r.counts?.errors ?? 0), 0);
  const warnings = reports.reduce((a, r) => a + (r.counts?.warnings ?? 0), 0);
  if (errors > 0) return 1;
  if (mode === 'warn' && warnings > 0) return 1;
  return 0;
}
