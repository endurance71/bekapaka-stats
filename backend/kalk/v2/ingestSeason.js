/**
 * Import pliku KALK v2 (kontrakt version 3) do bazy — jeden sezon, jawny seasonId.
 *
 * Kolejność: sezon → profile drużyn → KalkTeam → LeagueTeam (tabela) → LeagueMatch (terminarz)
 * → KalkPlayerProfile + KalkPlayer → mecze (transakcja na mecz: KalkMatch, KalkTeamGameStat,
 * KalkPlayerGameLog, KalkPlayByPlayEvent) → KalkPlayerSeasonStat → agregaty KalkPlayer
 * → syncPlayersFromKalk (tylko sezon aktywny).
 *
 * Idempotentny: rekordy porównywane z bazą, zapis tylko przy zmianie; mecz pomijany,
 * gdy `contentHash` (hash wszystkiego, co zapisujemy) jest bez zmian.
 */
import { seasonRowId } from '../../lib/kalkSeason.js';
import { leagueRowsReferSameMatch } from '../../lib/kalkTeamNames.js';
import { boxScoreToLeagueDetails } from '../parseMatchBoxScore.js';
import {
  boxRowSlug,
  boxSides,
  buildBoxScoreJson,
  playByPlayRow,
  playerGameLogRow,
  teamGameStatRow,
  teamTotals
} from './mapBox.js';
import {
  kalkPlayerAggregates,
  logTotalsForAttempts,
  seasonPlayerId,
  seasonStatFromLogs,
  seasonStatFromPage,
  seasonStatTeamKey,
  splitPlayerName,
  sumGameLogs
} from './mapPlayer.js';
import {
  INGEST_VERSION,
  changedFields,
  kalkMatchUrl,
  parseIsoDate,
  seasonLabelFromSlug,
  seasonRangeFromSlug,
  sha256,
  toInt
} from './util.js';
import { validateKalkV2Bundle } from './validateBundle.js';

export const V2_DIVISION_PATH = 'liga/dywizja-ii';
const TX_OPTIONS = { maxWait: 10_000, timeout: 60_000 };

function emptyCounter() {
  return { created: 0, updated: 0, unchanged: 0 };
}

/**
 * Zapis rekordu tylko gdy się zmienił.
 * @returns {Promise<'created'|'updated'|'unchanged'>}
 */
async function writeIfChanged(delegate, { where, existing, data, createData }) {
  if (!existing) {
    await delegate.create({ data: createData || data });
    return 'created';
  }
  const diff = changedFields(existing, data);
  if (!Object.keys(diff).length) return 'unchanged';
  await delegate.update({ where, data: diff });
  return 'updated';
}

function bump(counter, outcome) {
  counter[outcome] = (counter[outcome] || 0) + 1;
}

/**
 * @param {object} bundle — kontrakt v3
 * @param {{
 *   prisma: import('@prisma/client').PrismaClient,
 *   activeSeasonId?: string|null,
 *   logger?: Pick<Console, 'log'|'warn'>,
 *   syncPlayers?: ((opts: { seasonId: string }) => Promise<unknown>) | null,
 *   pruneSchedule?: boolean,
 *   now?: () => Date
 * }} opts
 */
export async function ingestKalkV2Bundle(bundle, opts = {}) {
  const { prisma, logger = console, pruneSchedule = false } = opts;
  const now = opts.now || (() => new Date());
  if (!prisma) throw new Error('ingestKalkV2Bundle: brak klienta prisma');

  const validation = validateKalkV2Bundle(bundle);
  if (!validation.ok) {
    const err = new Error(`Niepoprawny plik KALK v2: ${validation.errors.join('; ')}`);
    err.validation = validation;
    throw err;
  }

  const manifest = bundle.manifest;
  const sections = new Set(Array.isArray(manifest.sections) ? manifest.sections : []);
  const isFull = (manifest.mode || 'full') === 'full';
  const counts = {
    season: null,
    teamProfiles: emptyCounter(),
    kalkTeams: emptyCounter(),
    leagueTeams: { ...emptyCounter(), deleted: 0 },
    leagueMatches: { ...emptyCounter(), deduplicated: 0, relinkedLegacy: 0, stale: 0, pruned: 0 },
    profiles: emptyCounter(),
    kalkPlayers: emptyCounter(),
    matches: { ...emptyCounter(), skipped: 0 },
    teamGameStats: 0,
    gameLogs: { written: 0, deleted: 0 },
    pbp: { matchesReplaced: 0, eventsWritten: 0, eventsDeleted: 0 },
    seasonStats: emptyCounter(),
    playerAggregates: emptyCounter(),
    rosterSync: null,
    warnings: [...validation.warnings]
  };
  const warn = (msg) => {
    counts.warnings.push(msg);
    logger?.warn?.(`[kalk-v2] ${msg}`);
  };

  // ── 1. Sezon ──────────────────────────────────────────────────────────────
  const season = await upsertSeason(prisma, manifest, counts);
  const seasonId = season.id;
  const seasonSlug = season.slug;

  let activeSeasonId = opts.activeSeasonId;
  if (activeSeasonId === undefined) {
    const active = await prisma.kalkSeason.findFirst({ where: { isActive: true } });
    activeSeasonId = active?.id ?? null;
  }

  // ── 2. Profile drużyn (globalne) ──────────────────────────────────────────
  const teamProfiles = Array.isArray(bundle.teamProfiles) ? bundle.teamProfiles : [];
  if (teamProfiles.length) {
    const existing = await prisma.kalkTeamProfile.findMany({
      where: { id: { in: teamProfiles.map((t) => String(t.id)) } }
    });
    const byId = new Map(existing.map((r) => [r.id, r]));
    for (const tp of teamProfiles) {
      const id = String(tp.id);
      const profileFields = {
        slug: tp.slug || id,
        name: tp.name || id,
        sinceDate: parseIsoDate(tp.sinceDate),
        captainSlug: tp.captainSlug ?? null,
        allTimeGames: toInt(tp.allTimeGames),
        allTimeWins: toInt(tp.allTimeWins),
        allTimeLosses: toInt(tp.allTimeLosses),
        allTimePointsFor: toInt(tp.allTimePointsFor),
        allTimePointsAgainst: toInt(tp.allTimePointsAgainst),
        quartersWon: toInt(tp.quartersWon),
        quartersLost: toInt(tp.quartersLost),
        overtimes: toInt(tp.overtimes),
        overtimeWins: toInt(tp.overtimeWins),
        overtimeLosses: toInt(tp.overtimeLosses)
      };
      const prev = byId.get(id);
      const diff = changedFields(prev, profileFields);
      if (prev && !Object.keys(diff).length) {
        bump(counts.teamProfiles, 'unchanged');
        continue;
      }
      if (prev) {
        await prisma.kalkTeamProfile.update({ where: { id }, data: { ...diff, scrapedAt: now() } });
        bump(counts.teamProfiles, 'updated');
      } else {
        await prisma.kalkTeamProfile.create({ data: { id, ...profileFields, scrapedAt: now() } });
        bump(counts.teamProfiles, 'created');
      }
    }
  }
  const captainByTeam = new Map(teamProfiles.map((t) => [String(t.id), t.captainSlug ?? null]));

  // ── 3. KalkTeam (sezon) ───────────────────────────────────────────────────
  const teams = Array.isArray(bundle.teams) ? bundle.teams : [];
  if (teams.length) {
    const existing = await prisma.kalkTeam.findMany({ where: { seasonId } });
    const byId = new Map(existing.map((r) => [r.id, r]));
    for (const t of teams) {
      const id = String(t.id);
      const data = {
        id,
        seasonId,
        slug: t.slug || id,
        name: t.name,
        profileUrl: t.profileUrl || null,
        logoUrl: t.logoUrl || null,
        playerIds: (t.playerSlugs || []).map(String),
        captainSlug: captainByTeam.get(id) ?? byId.get(id)?.captainSlug ?? null,
        raw: { source: 'v2', id, slug: t.slug || null, name: t.name }
      };
      const outcome = await writeIfChanged(prisma.kalkTeam, {
        where: { seasonId_id: { seasonId, id } },
        existing: byId.get(id),
        data
      });
      bump(counts.kalkTeams, outcome);
    }
  }

  // ── 4. Tabela (LeagueTeam, faza regularna) ────────────────────────────────
  const standings = Array.isArray(bundle.standings) ? bundle.standings : [];
  if (standings.length) {
    const phase = 'regular';
    const existing = await prisma.leagueTeam.findMany({ where: { seasonId, phase } });
    const byName = new Map(existing.map((r) => [r.name, r]));
    for (const row of standings) {
      if (!row?.name) continue;
      const data = {
        seasonId,
        name: row.name,
        phase,
        position: toInt(row.position),
        matches: toInt(row.matches) ?? 0,
        points: toInt(row.points) ?? 0,
        wins: toInt(row.wins) ?? 0,
        losses: toInt(row.losses) ?? 0,
        pointsFor: toInt(row.pointsFor) ?? 0,
        pointsAgainst: toInt(row.pointsAgainst) ?? 0,
        logoUrl: row.logoUrl || null,
        form: Array.isArray(row.form) ? row.form.join(',') : row.form || null,
        streak: row.streak || null
      };
      const outcome = await writeIfChanged(prisma.leagueTeam, {
        where: { seasonId_name_phase: { seasonId, name: row.name, phase } },
        existing: byName.get(row.name),
        data
      });
      bump(counts.leagueTeams, outcome);
    }
    const names = standings.map((r) => r.name).filter(Boolean);
    const stale = existing.filter((r) => !names.includes(r.name));
    if (stale.length) {
      const res = await prisma.leagueTeam.deleteMany({
        where: { seasonId, phase, name: { notIn: names } }
      });
      counts.leagueTeams.deleted += res?.count ?? stale.length;
    }
  }

  // Box score zbudowany raz (terminarz → details, mecze → KalkMatch)
  const schedule = Array.isArray(bundle.schedule) ? bundle.schedule : [];
  const scheduleById = new Map(schedule.map((s) => [String(s.kalkMatchId), s]));
  const matches = Array.isArray(bundle.matches) ? bundle.matches : [];
  const boxById = new Map();
  for (const match of matches) {
    const id = String(match.kalkMatchId);
    boxById.set(id, buildBoxScoreJson(match, scheduleById.get(id) || scoreFromBox(match)));
  }

  // ── 5. Terminarz (LeagueMatch po kalkMatchId) ─────────────────────────────
  const leagueRowsById = new Map();
  if (schedule.length) {
    const existingRows = await prisma.leagueMatch.findMany({ where: { seasonId } });
    const byKalkId = new Map();
    for (const row of existingRows) {
      if (!row.kalkMatchId) continue;
      if (!byKalkId.has(row.kalkMatchId)) byKalkId.set(row.kalkMatchId, []);
      byKalkId.get(row.kalkMatchId).push(row);
    }
    const scheduleIds = new Set(scheduleById.keys());
    const claimed = new Set();

    for (const s of schedule) {
      const id = String(s.kalkMatchId);
      const date = parseIsoDate(s.startsAtUtc) || parseIsoDate(bundleMatch(matches, id)?.info?.startsAtUtc);
      let candidates = byKalkId.get(id) || [];
      if (candidates.length > 1) {
        candidates = [...candidates].sort((a, b) => Number(Boolean(b.details)) - Number(Boolean(a.details)));
        const [, ...dupes] = candidates;
        await prisma.leagueMatch.deleteMany({ where: { id: { in: dupes.map((d) => d.id) } } });
        counts.leagueMatches.deduplicated += dupes.length;
        candidates = [candidates[0]];
      }
      let existing = candidates[0] || null;
      if (!existing && date) {
        existing =
          existingRows.find(
            (row) =>
              !claimed.has(row.id) &&
              (!row.kalkMatchId || !scheduleIds.has(row.kalkMatchId)) &&
              leagueRowsReferSameMatch(
                { homeTeam: row.homeTeam, guestTeam: row.guestTeam, date: row.date },
                { homeTeam: s.homeTeam, guestTeam: s.guestTeam, date }
              )
          ) || null;
        if (existing && existing.kalkMatchId && existing.kalkMatchId !== id) {
          counts.leagueMatches.relinkedLegacy += 1;
          await prisma.kalkMatchIdAlias.upsert({
            where: { legacyId: existing.kalkMatchId },
            create: { legacyId: existing.kalkMatchId, seasonId, kalkMatchId: id },
            update: { seasonId, kalkMatchId: id }
          });
        }
      }
      if (existing) claimed.add(existing.id);
      if (!date && !existing) {
        warn(`terminarz ${id}: brak daty — pominięto`);
        continue;
      }

      const box = boxById.get(id);
      const data = {
        seasonId,
        date: date || existing.date,
        homeTeam: s.homeTeam,
        guestTeam: s.guestTeam,
        scoreHome: toInt(s.scoreHome),
        scoreAway: toInt(s.scoreAway),
        isFinished: Boolean(s.isFinished),
        kalkMatchId: id,
        protocolUrl: s.url || kalkMatchUrl(id),
        phaseLabel: s.stageLabel ?? null,
        stageId: toInt(s.stageId),
        roundId: toInt(s.roundId),
        roundLabel: s.roundLabel ?? null,
        homeTeamKalkId: s.homeTeamKalkId != null ? String(s.homeTeamKalkId) : null,
        guestTeamKalkId: s.guestTeamKalkId != null ? String(s.guestTeamKalkId) : null,
        homeRecordBefore: s.homeRecordBefore ?? null,
        guestRecordBefore: s.guestRecordBefore ?? null,
        venue: s.venue ?? null
      };
      if (box) data.details = boxScoreToLeagueDetails(box);
      const outcome = await writeIfChanged(prisma.leagueMatch, {
        where: { id: existing?.id },
        existing,
        data
      });
      bump(counts.leagueMatches, outcome);
      leagueRowsById.set(id, { ...(existing || {}), ...data });
    }

    if (isFull && sections.has('schedule')) {
      const staleRows = existingRows.filter(
        (row) => !claimed.has(row.id) && (!row.kalkMatchId || !scheduleIds.has(row.kalkMatchId))
      );
      counts.leagueMatches.stale = staleRows.length;
      if (staleRows.length && pruneSchedule) {
        const res = await prisma.leagueMatch.deleteMany({ where: { id: { in: staleRows.map((r) => r.id) } } });
        counts.leagueMatches.pruned = res?.count ?? staleRows.length;
      } else if (staleRows.length) {
        warn(`terminarz: ${staleRows.length} wierszy LeagueMatch spoza źródła (użyj pruneSchedule, aby usunąć)`);
      }
    }
  }

  // ── 6. Profile zawodników + KalkPlayer (tożsamość) ────────────────────────
  const players = Array.isArray(bundle.players) ? bundle.players : [];
  const profiles = Array.isArray(bundle.profiles) ? bundle.profiles : [];
  const profileBySlug = new Map(profiles.map((p) => [p.slug, p]));

  const identities = new Map();
  for (const p of players) {
    identities.set(p.slug, {
      slug: p.slug,
      name: p.fullName || profileBySlug.get(p.slug)?.fullName || p.slug,
      team: p.teamName || null,
      teamKalkId: p.teamKalkId != null ? String(p.teamKalkId) : null,
      number: toInt(p.number),
      profileUrl: p.profileUrl || null,
      fromBoxOnly: false
    });
  }
  for (const match of matches) {
    for (const team of match.box?.teams || []) {
      for (const row of team.players || []) {
        const slug = boxRowSlug(row, team);
        if (identities.has(slug)) continue;
        identities.set(slug, {
          slug,
          name: profileBySlug.get(slug)?.fullName || row.name || slug,
          team: team.name || null,
          teamKalkId: team.teamKalkId != null ? String(team.teamKalkId) : null,
          number: toInt(row.number),
          profileUrl: row.slug ? `https://www.kalk-koszalin.com/zawodnik/${row.slug}` : null,
          fromBoxOnly: true
        });
      }
    }
  }

  const realSlugs = [...identities.keys()].filter((s) => !s.startsWith('anon-'));
  const existingProfiles = realSlugs.length
    ? await prisma.kalkPlayerProfile.findMany({ where: { slug: { in: realSlugs } } })
    : [];
  const profileRows = new Map(existingProfiles.map((r) => [r.slug, r]));
  for (const p of profiles) {
    const names = splitPlayerName(p);
    const data = {
      fullName: p.fullName || `${names.firstName} ${names.lastName}`.trim() || p.slug,
      firstName: p.firstName ?? names.firstName ?? null,
      lastName: p.lastName ?? names.lastName ?? null,
      position: p.position ?? null,
      heightCm: toInt(p.heightCm),
      birthYear: toInt(p.birthYear),
      lastNumber: toInt(p.lastNumber),
      otherCompetitions: p.otherCompetitions ?? null
    };
    const profileHash = sha256(data);
    const prev = profileRows.get(p.slug);
    if (prev && prev.profileHash === profileHash) {
      bump(counts.profiles, 'unchanged');
      continue;
    }
    if (prev) {
      await prisma.kalkPlayerProfile.update({ where: { slug: p.slug }, data: { ...data, profileHash, scrapedAt: now() } });
      bump(counts.profiles, 'updated');
    } else {
      await prisma.kalkPlayerProfile.create({ data: { slug: p.slug, ...data, profileHash, scrapedAt: now() } });
      bump(counts.profiles, 'created');
    }
    profileRows.set(p.slug, { slug: p.slug, ...data, profileHash });
  }
  // Minimalny profil (imię/nazwisko z katalogu) — tylko gdy brak; nie nadpisuje prawdziwego.
  for (const p of players) {
    if (profileRows.has(p.slug) || !p.fullName) continue;
    const names = splitPlayerName(null, p.fullName);
    const data = {
      slug: p.slug,
      fullName: p.fullName,
      firstName: names.firstName || null,
      lastName: names.lastName || null,
      lastNumber: toInt(p.number)
    };
    await prisma.kalkPlayerProfile.create({ data });
    profileRows.set(p.slug, data);
    bump(counts.profiles, 'created');
  }

  const existingPlayers = await prisma.kalkPlayer.findMany({ where: { seasonId } });
  const playerById = new Map(existingPlayers.map((r) => [r.id, r]));
  for (const ident of identities.values()) {
    const id = seasonPlayerId(seasonSlug, ident.slug);
    const prev = playerById.get(id);
    const data = {
      seasonId,
      slug: ident.slug,
      name: ident.name,
      team: ident.team,
      profileUrl: ident.profileUrl,
      raw: { source: 'v2', teamKalkId: ident.teamKalkId, number: ident.number }
    };
    if (prev && ident.fromBoxOnly) {
      // Wiersz tylko z box score ma skrócone imię („D. Olearczyk”) — nie nadpisuj pełnego.
      delete data.name;
      delete data.raw;
      if (prev.profileUrl) delete data.profileUrl;
      if (prev.team) delete data.team;
    }
    const outcome = await writeIfChanged(prisma.kalkPlayer, {
      where: { id },
      existing: prev,
      data,
      createData: { id, ...data, name: ident.name }
    });
    bump(counts.kalkPlayers, outcome);
    playerById.set(id, { ...(prev || { id, name: ident.name }), ...data });
  }

  // ── 7. Mecze (transakcja na mecz) ─────────────────────────────────────────
  if (matches.length) {
    const existingMatches = await prisma.kalkMatch.findMany({
      where: { seasonId, id: { in: matches.map((m) => String(m.kalkMatchId)) } },
      select: { id: true, contentHash: true, sectionHashes: true, hasPlayByPlay: true, date: true }
    });
    const matchById = new Map(existingMatches.map((r) => [r.id, r]));

    for (const match of matches) {
      const id = String(match.kalkMatchId);
      const sched = scheduleById.get(id) || leagueRowToSchedule(leagueRowsById.get(id)) || (await scheduleFromDb(prisma, seasonId, id));
      const prev = matchById.get(id);
      const built = buildMatchWrite({
        seasonId,
        seasonSlug,
        match,
        sched,
        box: boxById.get(id),
        prevDate: prev?.date,
        parserVersion: manifest.parserVersion ?? null
      });
      if (!built) {
        counts.matches.skipped += 1;
        warn(`mecz ${id}: brak daty/terminarza — pominięto`);
        continue;
      }
      if (prev && prev.contentHash === built.contentHash) {
        bump(counts.matches, 'unchanged');
        continue;
      }
      const pbpChanged =
        !prev ||
        (prev.sectionHashes?.pbpIngest ?? null) !== built.pbpIngestHash ||
        Boolean(prev.hasPlayByPlay) !== built.record.hasPlayByPlay;

      const stats = await prisma.$transaction(async (tx) => {
        const out = { logs: 0, logsDeleted: 0, events: 0, eventsDeleted: 0 };
        const record = { ...built.record, contentHash: built.contentHash, scrapedAt: now() };
        await tx.kalkMatch.upsert({
          where: { seasonId_id: { seasonId, id } },
          create: record,
          update: record
        });
        for (const row of built.teamStats) {
          await tx.kalkTeamGameStat.upsert({
            where: { seasonId_kalkMatchId_side: { seasonId, kalkMatchId: id, side: row.side } },
            create: row,
            update: row
          });
        }
        const del = await tx.kalkPlayerGameLog.deleteMany({
          where: { seasonId, kalkMatchId: id, kalkPlayerId: { notIn: built.logs.map((l) => l.kalkPlayerId) } }
        });
        out.logsDeleted = del?.count ?? 0;
        for (const log of built.logs) {
          await tx.kalkPlayerGameLog.upsert({
            where: {
              seasonId_kalkPlayerId_kalkMatchId: { seasonId, kalkPlayerId: log.kalkPlayerId, kalkMatchId: id }
            },
            create: log,
            update: log
          });
          out.logs += 1;
        }
        if (pbpChanged) {
          const delEvents = await tx.kalkPlayByPlayEvent.deleteMany({ where: { seasonId, kalkMatchId: id } });
          out.eventsDeleted = delEvents?.count ?? 0;
          if (built.pbpRows.length) {
            await tx.kalkPlayByPlayEvent.createMany({ data: built.pbpRows });
            out.events = built.pbpRows.length;
          }
        }
        return out;
      }, TX_OPTIONS);

      bump(counts.matches, prev ? 'updated' : 'created');
      counts.teamGameStats += built.teamStats.length;
      counts.gameLogs.written += stats.logs;
      counts.gameLogs.deleted += stats.logsDeleted;
      if (pbpChanged) counts.pbp.matchesReplaced += 1;
      counts.pbp.eventsWritten += stats.events;
      counts.pbp.eventsDeleted += stats.eventsDeleted;
    }
  }

  // ── 8. Statystyki sezonowe (strona zawodnika + Σ logów) ───────────────────
  const seasonLogs = await prisma.kalkPlayerGameLog.findMany({
    where: { seasonId, playerSlug: { not: null } },
    select: {
      playerSlug: true, teamKalkId: true, teamName: true, secondsPlayed: true, pts: true,
      twoPm: true, twoPa: true, threePm: true, threePa: true, ftm: true, fta: true,
      orb: true, drb: true, reb: true, ast: true, stl: true, tov: true, blk: true,
      pf: true, pfDrawn: true, eval: true, plusMinus: true
    }
  });
  const logGroups = new Map(); // slug → teamKey → { teamKalkId, teamName, logs[] }
  for (const log of seasonLogs) {
    if (!log.playerSlug || log.playerSlug.startsWith('anon-')) continue;
    const teamKey = seasonStatTeamKey(log.teamKalkId, log.teamName);
    if (!logGroups.has(log.playerSlug)) logGroups.set(log.playerSlug, new Map());
    const byTeam = logGroups.get(log.playerSlug);
    if (!byTeam.has(teamKey)) byTeam.set(teamKey, { teamKalkId: log.teamKalkId, teamName: log.teamName, logs: [] });
    byTeam.get(teamKey).logs.push(log);
  }

  const existingStats = await prisma.kalkPlayerSeasonStat.findMany({ where: { seasonId } });
  const statKey = (r) => `${r.playerSlug}|${r.competition}|${r.teamKey}`;
  const statByKey = new Map(existingStats.map((r) => [statKey(r), r]));
  const desiredStats = new Map();

  for (const p of players) {
    const rows = Array.isArray(p.seasonStats) ? p.seasonStats : [];
    const byTeam = logGroups.get(p.slug);
    for (const row of rows) {
      const teamKey = seasonStatTeamKey(row.teamKalkId, row.teamName);
      let group = byTeam?.get(teamKey);
      if (!group && byTeam?.size === 1) group = [...byTeam.values()][0];
      const logTotals = group ? logTotalsForAttempts(sumGameLogs(group.logs)) : null;
      const data = seasonStatFromPage(row, { seasonId, playerSlug: p.slug, logTotals });
      desiredStats.set(statKey(data), data);
    }
  }
  const pageSlugs = new Set([
    ...players.filter((p) => (p.seasonStats || []).length).map((p) => p.slug),
    ...existingStats.filter((r) => r.source === 'kalk-page').map((r) => r.playerSlug)
  ]);
  for (const [slug, byTeam] of logGroups) {
    if (pageSlugs.has(slug)) continue;
    for (const group of byTeam.values()) {
      const data = seasonStatFromLogs({
        seasonId,
        playerSlug: slug,
        teamKalkId: group.teamKalkId,
        teamName: group.teamName,
        totals: sumGameLogs(group.logs)
      });
      desiredStats.set(statKey(data), data);
    }
  }
  // Wiersze 'kalk-box' zastąpione przez statystyki ze strony zawodnika
  const obsoleteBox = existingStats.filter(
    (r) => r.source === 'kalk-box' && pageSlugs.has(r.playerSlug) && !desiredStats.has(statKey(r))
  );
  for (const r of obsoleteBox) {
    await prisma.kalkPlayerSeasonStat.deleteMany({
      where: { seasonId, playerSlug: r.playerSlug, competition: r.competition, teamKey: r.teamKey }
    });
    statByKey.delete(statKey(r));
    bump(counts.seasonStats, 'deleted');
  }
  for (const [key, data] of desiredStats) {
    const outcome = await writeIfChanged(prisma.kalkPlayerSeasonStat, {
      where: {
        seasonId_playerSlug_competition_teamKey: {
          seasonId,
          playerSlug: data.playerSlug,
          competition: data.competition,
          teamKey: data.teamKey
        }
      },
      existing: statByKey.get(key),
      data
    });
    bump(counts.seasonStats, outcome);
    statByKey.set(key, { ...(statByKey.get(key) || {}), ...data });
  }

  // ── 9. Agregaty KalkPlayer z KalkPlayerSeasonStat ─────────────────────────
  const statsBySlug = new Map();
  for (const row of statByKey.values()) {
    if (!statsBySlug.has(row.playerSlug)) statsBySlug.set(row.playerSlug, []);
    statsBySlug.get(row.playerSlug).push(row);
  }
  for (const player of playerById.values()) {
    if (!player.slug) continue; // legacy id (stara strona) — poza zakresem v2
    const data = kalkPlayerAggregates(statsBySlug.get(player.slug) || []);
    const diff = changedFields(player, data);
    if (!Object.keys(diff).length) {
      bump(counts.playerAggregates, 'unchanged');
      continue;
    }
    await prisma.kalkPlayer.update({ where: { id: player.id }, data: diff });
    bump(counts.playerAggregates, 'updated');
  }

  // ── 10. Skład (tylko aktywny sezon) ───────────────────────────────────────
  if (activeSeasonId && seasonId === activeSeasonId && opts.syncPlayers !== null) {
    const sync =
      opts.syncPlayers ||
      (async (o) => {
        const { syncPlayersFromKalk } = await import('../../dataStore.js');
        return syncPlayersFromKalk(o);
      });
    const result = await sync({ seasonId });
    counts.rosterSync = summarizeSync(result);
  }

  return { seasonId, seasonSlug, isActiveSeason: seasonId === activeSeasonId, ...counts };
}

function summarizeSync(result) {
  if (!result || typeof result !== 'object') return result ?? null;
  return {
    status: result.status || 'ok',
    created: Array.isArray(result.synced) ? result.synced.length : result.synced ?? 0,
    linked: result.linked ?? 0,
    errors: Array.isArray(result.errors) ? result.errors.length : 0,
    total: result.total ?? 0
  };
}

function bundleMatch(matches, id) {
  return matches.find((m) => String(m.kalkMatchId) === id) || null;
}

function scoreFromBox(match) {
  const { home, away } = boxSides(match);
  return {
    kalkMatchId: match.kalkMatchId,
    homeTeam: home?.name,
    guestTeam: away?.name,
    homeTeamKalkId: home?.teamKalkId,
    guestTeamKalkId: away?.teamKalkId,
    scoreHome: teamTotals(home).pts,
    scoreAway: teamTotals(away).pts,
    isFinished: true,
    startsAtUtc: match.info?.startsAtUtc ?? null,
    stageLabel: match.info?.stageLabel ?? null,
    roundLabel: match.info?.roundLabel ?? null,
    venue: match.info?.venue ?? null
  };
}

function leagueRowToSchedule(row) {
  if (!row) return null;
  return {
    kalkMatchId: row.kalkMatchId,
    homeTeam: row.homeTeam,
    guestTeam: row.guestTeam,
    homeTeamKalkId: row.homeTeamKalkId,
    guestTeamKalkId: row.guestTeamKalkId,
    scoreHome: row.scoreHome,
    scoreAway: row.scoreAway,
    isFinished: row.isFinished,
    startsAtUtc: row.date instanceof Date ? row.date.toISOString() : row.date,
    stageId: row.stageId,
    stageLabel: row.phaseLabel,
    roundId: row.roundId,
    roundLabel: row.roundLabel,
    venue: row.venue
  };
}

async function scheduleFromDb(prisma, seasonId, kalkMatchId) {
  const row = await prisma.leagueMatch.findFirst({ where: { seasonId, kalkMatchId } });
  return leagueRowToSchedule(row);
}

/**
 * Wszystko, co zapisujemy dla meczu (+ contentHash do pomijania niezmienionych).
 */
export function buildMatchWrite({ seasonId, seasonSlug, match, sched, box, prevDate = null, parserVersion = null }) {
  const id = String(match.kalkMatchId);
  const info = match.info || null;
  const fallback = scoreFromBox(match);
  const s = { ...fallback, ...(sched || {}) };
  const date = parseIsoDate(s.startsAtUtc) || parseIsoDate(info?.startsAtUtc) || (prevDate ? new Date(prevDate) : null);
  if (!date) return null;

  const { home, away } = boxSides(match);
  const scoreHome = toInt(s.scoreHome) ?? teamTotals(home).pts;
  const scoreAway = toInt(s.scoreAway) ?? teamTotals(away).pts;
  const boxScore = box || buildBoxScoreJson(match, { scoreHome, scoreAway });
  const pbpEvents = Array.isArray(match.pbp?.events) ? match.pbp.events : [];
  const pbpRows = pbpEvents.map((e) => playByPlayRow(seasonId, id, e));
  const pbpIngestHash = pbpRows.length
    ? sha256({ v: INGEST_VERSION, source: match.sectionHashes?.pbp ?? null, rows: match.sectionHashes?.pbp ? null : pbpRows })
    : null;
  const referees = Array.isArray(info?.referees) ? info.referees.filter(Boolean) : [];
  const quartersCount = Array.isArray(info?.quarters) ? info.quarters.filter((q) => (q.period ?? 0) >= 5).length : 0;

  const record = {
    id,
    seasonId,
    slug: '',
    date,
    roundCode: s.roundLabel ?? info?.roundLabel ?? null,
    matchNumber: null,
    homeTeamId: s.homeTeamKalkId != null ? String(s.homeTeamKalkId) : home?.teamKalkId != null ? String(home.teamKalkId) : null,
    guestTeamId: s.guestTeamKalkId != null ? String(s.guestTeamKalkId) : away?.teamKalkId != null ? String(away.teamKalkId) : null,
    homeTeamName: s.homeTeam || home?.name || '',
    guestTeamName: s.guestTeam || away?.name || '',
    scoreHome,
    scoreAway,
    isFinished: true,
    referees: referees.length ? referees.join(', ') : null,
    statistician: null,
    boxScore,
    meta: { source: 'v2', matchUrl: kalkMatchUrl(id), city: info?.city ?? null },
    stageId: toInt(s.stageId),
    stageLabel: s.stageLabel ?? info?.stageLabel ?? null,
    roundId: toInt(s.roundId),
    roundLabel: s.roundLabel ?? info?.roundLabel ?? null,
    roundNumber: toInt(s.roundNumber),
    venue: s.venue ?? info?.venue ?? null,
    startsAtUtc: parseIsoDate(s.startsAtUtc) || parseIsoDate(info?.startsAtUtc),
    overtimes: toInt(info?.overtimes) ?? quartersCount,
    hasPlayByPlay: pbpRows.length > 0,
    sectionsAvailable: Array.isArray(match.sectionsAvailable) ? match.sectionsAvailable : [],
    sectionHashes: { ...(match.sectionHashes || {}), pbpIngest: pbpIngestHash },
    parserVersion,
    sourceSite: 'v2',
    mvpPlayerSlug: info?.mvp?.slug ?? null,
    mvpEval: toInt(info?.mvp?.eval),
    commissioner: info?.commissioner ?? null,
    refereeList: referees,
    info: info
      ? {
          leaders: info.leaders ?? null,
          flow5: info.flow5 ?? [],
          quarters: info.quarters ?? [],
          pointsSources: info.pointsSources ?? null,
          mvp: info.mvp ?? null,
          city: info.city ?? null,
          unresolvedNames: match.pbp?.unresolvedNames ?? null
        }
      : null,
    extras: match.extras ?? null
  };

  const sides = [
    { side: 'home', team: home, opponent: away, ptsFor: scoreHome, ptsAgainst: scoreAway },
    { side: 'away', team: away, opponent: home, ptsFor: scoreAway, ptsAgainst: scoreHome }
  ];
  const teamStats = sides.map((x) =>
    teamGameStatRow({ seasonId, kalkMatchId: id, info, ...x })
  );
  const logs = [];
  const seen = new Set();
  for (const x of sides) {
    for (const player of x.team?.players || []) {
      const slug = boxRowSlug(player, x.team);
      const kalkPlayerId = seasonPlayerId(seasonSlug, slug);
      if (seen.has(kalkPlayerId)) continue;
      seen.add(kalkPlayerId);
      logs.push(playerGameLogRow({ seasonId, kalkMatchId: id, kalkPlayerId, player, ...x }));
    }
  }

  const contentHash = sha256({ v: INGEST_VERSION, record, teamStats, logs, pbpIngestHash });
  return { record, teamStats, logs, pbpRows, pbpIngestHash, contentHash };
}

async function upsertSeason(prisma, manifest, counts) {
  const slug = String(manifest.seasonSlug);
  const kalkNumber = manifest.kalkNumber;
  const label = seasonLabelFromSlug(slug);
  const existing = await prisma.kalkSeason.findUnique({ where: { slug } });

  const byNumber = await prisma.kalkSeason.findFirst({ where: { kalkNumber } });
  if (byNumber && byNumber.slug !== slug) {
    throw new Error(`kalkNumber ${kalkNumber} jest już przypisany do sezonu ${byNumber.slug} (plik: ${slug})`);
  }

  if (!existing) {
    const range = seasonRangeFromSlug(slug);
    const data = {
      id: seasonRowId(slug),
      slug,
      label,
      divisionPath: V2_DIVISION_PATH,
      kalkNumber,
      sourceSite: 'v2',
      isActive: false,
      startsAt: range.startsAt,
      endsAt: range.endsAt
    };
    const created = await prisma.kalkSeason.create({ data });
    counts.season = { id: data.id, slug, outcome: 'created' };
    return created || data;
  }

  const range = seasonRangeFromSlug(slug);
  const data = { kalkNumber, sourceSite: 'v2', label };
  if (!existing.startsAt && range.startsAt) data.startsAt = range.startsAt;
  if (!existing.endsAt && range.endsAt) data.endsAt = range.endsAt;
  const diff = changedFields(existing, data);
  if (Object.keys(diff).length) {
    await prisma.kalkSeason.update({ where: { id: existing.id }, data: diff });
  }
  counts.season = { id: existing.id, slug, outcome: Object.keys(diff).length ? 'updated' : 'unchanged' };
  return { ...existing, ...diff };
}
