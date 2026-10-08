import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFakePrisma } from '../helpers/fakePrisma.js';
import { ingestKalkV2Bundle } from '../../kalk/v2/ingestSeason.js';
import { validateKalkV2Bundle } from '../../kalk/v2/validateBundle.js';
import { resolveKalkMatchById } from '../../kalk/v2/resolveMatch.js';
import { createDryRunPrisma } from '../../kalk/v2/dryRunPrisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/kalk-v2-bundle.min.json'), 'utf-8'));
const bundle = () => structuredClone(FIXTURE);
const quiet = { warn() {}, log() {} };

const ACTIVE = { id: 'season_2026-2027', slug: '2026-2027', label: 'Sezon 2026/2027', isActive: true, kalkNumber: null, sourceSite: 'legacy', divisionPath: 'dzial,dywizja-2,4.html', startsAt: new Date('2026-09-01T00:00:00Z'), endsAt: new Date('2027-08-31T23:59:59Z') };
const PREVIOUS = { id: 'season_2025-2026', slug: '2025-2026', label: 'Sezon 2025/2026', isActive: false, kalkNumber: null, sourceSite: 'legacy', divisionPath: 'dzial,dywizja-2,4.html', startsAt: new Date('2025-09-01T00:00:00Z'), endsAt: new Date('2026-08-31T23:59:59Z') };

function seededPrisma(extra = {}) {
  return createFakePrisma({ kalkSeason: [{ ...ACTIVE }, { ...PREVIOUS }], ...extra });
}

describe('KALK v2 — walidacja kontraktu', () => {
  it('akceptuje fixture i odrzuca złą wersję / brak manifestu', () => {
    expect(validateKalkV2Bundle(bundle()).ok).toBe(true);
    const bad = bundle();
    bad.version = 2;
    delete bad.manifest;
    const res = validateKalkV2Bundle(bad);
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/wersja/);
    expect(res.errors.join(' ')).toMatch(/manifest/);
  });

  it('ingest rzuca błąd przy niepoprawnym pliku (nic nie zapisuje)', async () => {
    const prisma = seededPrisma();
    const bad = bundle();
    bad.matches[0].box.teams.pop();
    await expect(ingestKalkV2Bundle(bad, { prisma, syncPlayers: null, logger: quiet })).rejects.toThrow(/box\.teams/);
    expect(prisma.$writes).toHaveLength(0);
  });
});

describe('KALK v2 — ingestKalkV2Bundle', () => {
  it('zapisuje sezon, tabelę, terminarz, mecz, statystyki drużyn, logi, PBP i statystyki sezonowe', async () => {
    const prisma = seededPrisma();
    const res = await ingestKalkV2Bundle(bundle(), { prisma, syncPlayers: null, logger: quiet });
    const t = prisma.$tables;

    expect(res.seasonId).toBe('season_2026-2027');
    const season = t.kalkSeason.find((s) => s.id === 'season_2026-2027');
    expect(season).toMatchObject({ kalkNumber: 50, sourceSite: 'v2', isActive: true, divisionPath: 'dzial,dywizja-2,4.html' });

    expect(t.leagueTeam.map((r) => [r.name, r.form, r.streak])).toEqual([
      ['BeKaPaKa Bobolice', 'W', 'W1'],
      ['Kosz-All-In', 'L', 'L1']
    ]);
    const lm = t.leagueMatch.find((r) => r.kalkMatchId === '4124');
    expect(lm).toMatchObject({
      phaseLabel: 'Sezon zasadniczy', stageId: 361, roundId: 1234, roundLabel: 'Kolejka - 3',
      homeTeamKalkId: '138', guestTeamKalkId: '148', homeRecordBefore: '0–0', venue: 'ZOS - KOSiR',
      protocolUrl: 'https://www.kalk-koszalin.com/mecz/4124', isFinished: true
    });
    expect(lm.date.toISOString()).toBe('2026-10-04T10:00:00.000Z');
    expect(lm.details.teams).toHaveLength(2);
    expect(t.leagueMatch.find((r) => r.kalkMatchId === '4130').isFinished).toBe(false);

    const km = t.kalkMatch[0];
    expect(km).toMatchObject({ id: '4124', sourceSite: 'v2', hasPlayByPlay: true, overtimes: 0, mvpPlayerSlug: 'filip-karpinski', stageId: 361, parserVersion: '4.0.0' });
    // Kształt boxScore zgodny z legacy (+ slug, blkAgainst, totals)
    const home = km.boxScore.teams[0];
    expect(home).toMatchObject({ name: 'BeKaPaKa Bobolice', isBekapaka: true, pts: 12 });
    expect(home.fourFactors).toMatchObject({ fgm: 5, fga: 9, three_pm: 1, tov: 2, orb: 1 });
    expect(home.totals.pts).toBe(12);
    expect(home.players[0]).toMatchObject({ name: 'F. Karpiński', slug: 'filip-karpinski', min: '40:00', two_pm: 2, blkAgainst: 0 });
    expect(km.boxScore.quarters.map((q) => q.label)).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);

    expect(t.kalkTeamGameStat).toHaveLength(2);
    expect(t.kalkTeamGameStat.find((r) => r.side === 'home')).toMatchObject({ pts: 12, ptsAgainst: 7, isWin: true, q1: 4, q4: 3, otPts: null, startersPts: 12, benchPts: 0, fastBreakPts: 2, blkAgainst: 1 });
    expect(t.kalkPlayerGameLog).toHaveLength(10);
    const log = t.kalkPlayerGameLog.find((l) => l.playerSlug === 'dawid-olearczyk');
    expect(log).toMatchObject({ kalkPlayerId: '2026-2027__dawid-olearczyk', isWin: true, ast: 2, ftm: 1, fta: 2, side: 'home', starter: true });
    expect(log.stats).toMatchObject({ opponent: 'Kosz-All-In', pts: 3, three_pm: 0, min: '40:00', scoreLabel: '12:7' });
    expect(t.kalkPlayByPlayEvent).toHaveLength(17);
    expect(res.pbp.eventsWritten).toBe(17);
  });

  it('jest idempotentny — drugi import nie zmienia niczego', async () => {
    const prisma = seededPrisma();
    await ingestKalkV2Bundle(bundle(), { prisma, syncPlayers: null, logger: quiet });
    const snapshot = structuredClone(prisma.$tables);
    prisma.$resetWrites();

    const res = await ingestKalkV2Bundle(bundle(), { prisma, syncPlayers: null, logger: quiet });

    expect(prisma.$writes).toEqual([]);
    expect(res.matches).toMatchObject({ created: 0, updated: 0, unchanged: 1 });
    expect(res.leagueMatches).toMatchObject({ created: 0, updated: 0, unchanged: 2 });
    expect(res.kalkPlayers).toMatchObject({ created: 0, updated: 0 });
    expect(res.seasonStats).toMatchObject({ created: 0, updated: 0 });
    expect(res.playerAggregates.updated).toBe(0);
    expect(res.pbp.matchesReplaced).toBe(0);
    for (const [model, rows] of Object.entries(snapshot)) {
      expect(prisma.$tables[model].length, model).toBe(rows.length);
    }
  });

  it('zmiana box score → aktualizacja meczu, PBP bez zmian hash nie jest przepisywane', async () => {
    const prisma = seededPrisma();
    await ingestKalkV2Bundle(bundle(), { prisma, syncPlayers: null, logger: quiet });
    const b = bundle();
    b.matches[0].box.teams[0].players[4].eval = 2; // korekta EVAL
    b.matches[0].box.teams[0].totals.eval += 1;
    b.matches[0].sectionHashes.box = 'h-box-2';
    const res = await ingestKalkV2Bundle(b, { prisma, syncPlayers: null, logger: quiet });
    expect(res.matches.updated).toBe(1);
    expect(res.pbp.matchesReplaced).toBe(0);
    expect(prisma.$tables.kalkPlayByPlayEvent).toHaveLength(17);
    expect(prisma.$tables.kalkPlayerGameLog.find((l) => l.playerSlug === 'tomasz-kaszubowski').eval).toBe(2);
  });

  it('naprawia rozjazd kluczy: agregaty zbiórek/asyst/przechwytów/bloków są wypełnione', async () => {
    const prisma = seededPrisma();
    await ingestKalkV2Bundle(bundle(), { prisma, syncPlayers: null, logger: quiet });
    const kp = prisma.$tables.kalkPlayer.find((p) => p.id === '2026-2027__filip-karpinski');
    expect(kp).toMatchObject({
      slug: 'filip-karpinski', name: 'Filip Karpiński', matchesPlayed: 1, pointsTotal: 7,
      reboundsTotal: 3, reboundsAverage: 3, assistsTotal: 1, stealsTotal: 1, blocksTotal: 1, blocksAverage: 1,
      threePointsMade: 1, threePointsAttempted: 2, threePointsPct: 50, minutesTotal: 40
    });
    // Dokładne próby z Σ logów (strona podaje tylko trafione i %)
    const stat = prisma.$tables.kalkPlayerSeasonStat.find((s) => s.playerSlug === 'filip-karpinski');
    expect(stat).toMatchObject({ source: 'kalk-page', twoPa: 3, threePa: 2, fta: 0, teamKey: '138' });
    // Zawodnik bez wiersza na stronie → statystyki z box score
    const ol = prisma.$tables.kalkPlayer.find((p) => p.slug === 'dawid-olearczyk');
    expect(ol).toMatchObject({ reboundsTotal: 1, assistsTotal: 2, matchesPlayed: 1, name: 'Dawid Olearczyk' });
    expect(prisma.$tables.kalkPlayerSeasonStat.find((s) => s.playerSlug === 'dawid-olearczyk').source).toBe('kalk-box');
  });

  it('istniejące dane 2026/27 ze starego importu (KalkPlayer bez slug, stary log) są przejmowane w jednym przebiegu', async () => {
    const prisma = seededPrisma({
      kalkPlayer: [{ id: '2026-2027__filip-karpinski', seasonId: 'season_2026-2027', slug: null, name: 'Filip Karpiński', team: 'BeKaPaKa Bobolice', pointsTotal: 7, reboundsTotal: null, raw: { zbiorki_suma: 3 } }],
      kalkMatch: [{ id: '4124', seasonId: 'season_2026-2027', contentHash: 'legacy', sectionHashes: null, hasPlayByPlay: false, date: new Date('2026-10-04T10:00:00Z'), boxScore: { teams: [] }, sourceSite: 'legacy' }],
      kalkPlayerGameLog: [{ id: 'old-log', seasonId: 'season_2026-2027', kalkPlayerId: '2026-2027__filip-karpinski', kalkMatchId: '4124', teamName: 'BeKaPaKa', opponentName: 'Kosz-All-In', stats: { pts: 7 } }]
    });
    const first = await ingestKalkV2Bundle(bundle(), { prisma, syncPlayers: null, logger: quiet });
    expect(first.matches.updated).toBe(1);
    const kp = prisma.$tables.kalkPlayer.find((p) => p.id === '2026-2027__filip-karpinski');
    expect(kp).toMatchObject({ slug: 'filip-karpinski', reboundsTotal: 3, assistsTotal: 1 });
    const logs = prisma.$tables.kalkPlayerGameLog.filter((l) => l.kalkPlayerId === '2026-2027__filip-karpinski');
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ id: 'old-log', teamName: 'BeKaPaKa Bobolice', playerSlug: 'filip-karpinski', pts: 7 });

    prisma.$resetWrites();
    await ingestKalkV2Bundle(bundle(), { prisma, syncPlayers: null, logger: quiet });
    expect(prisma.$writes).toEqual([]);
  });

  it('terminarz: przełożony mecz (ten sam kalkMatchId, nowa data) nie tworzy duplikatu; duplikaty są scalane', async () => {
    const prisma = seededPrisma({
      leagueMatch: [
        { id: 'lm-old', seasonId: 'season_2026-2027', kalkMatchId: '4130', date: new Date('2026-10-11T12:40:00Z'), homeTeam: 'Kosz-All-In', guestTeam: 'BeKaPaKa Bobolice', isFinished: false, scoreHome: null, scoreAway: null },
        { id: 'lm-dup-a', seasonId: 'season_2026-2027', kalkMatchId: '4124', date: new Date('2026-10-04T10:00:00Z'), homeTeam: 'BeKaPaKa Bobolice', guestTeam: 'Kosz-All-In', isFinished: true, scoreHome: 12, scoreAway: 7, details: { source: 'kalk' } },
        { id: 'lm-dup-b', seasonId: 'season_2026-2027', kalkMatchId: '4124', date: new Date('2026-09-27T10:00:00Z'), homeTeam: 'BeKaPaKa Bobolice', guestTeam: 'Kosz-All-In', isFinished: false, scoreHome: null, scoreAway: null }
      ]
    });
    const res = await ingestKalkV2Bundle(bundle(), { prisma, syncPlayers: null, logger: quiet });
    const rows = prisma.$tables.leagueMatch;
    expect(rows.filter((r) => r.kalkMatchId === '4130')).toHaveLength(1);
    expect(rows.find((r) => r.kalkMatchId === '4130')).toMatchObject({ id: 'lm-old' });
    expect(rows.find((r) => r.kalkMatchId === '4130').date.toISOString()).toBe('2026-10-18T12:40:00.000Z');
    expect(rows.filter((r) => r.kalkMatchId === '4124').map((r) => r.id)).toEqual(['lm-dup-a']);
    expect(res.leagueMatches.deduplicated).toBe(1);
    expect(rows).toHaveLength(2);
  });

  it('nowy sezon historyczny: tworzony jako nieaktywny, bez syncu składu', async () => {
    const prisma = seededPrisma();
    const sync = vi.fn();
    const b = bundle();
    b.manifest.seasonSlug = '2024-2025';
    b.manifest.seasonLabel = '2024/2025';
    b.manifest.kalkNumber = 48;
    const res = await ingestKalkV2Bundle(b, { prisma, syncPlayers: sync, logger: quiet });
    expect(res.seasonId).toBe('season_2024-2025');
    expect(res.isActiveSeason).toBe(false);
    expect(sync).not.toHaveBeenCalled();
    const season = prisma.$tables.kalkSeason.find((s) => s.slug === '2024-2025');
    expect(season).toMatchObject({ isActive: false, sourceSite: 'v2', kalkNumber: 48, label: 'Sezon 2024/2025', divisionPath: 'liga/dywizja-ii' });
    expect(season.startsAt.toISOString()).toBe('2024-09-01T00:00:00.000Z');
    expect(season.endsAt.toISOString()).toBe('2025-08-31T23:59:59.000Z');
    expect(prisma.$tables.kalkPlayer.every((p) => p.id.startsWith('2024-2025__'))).toBe(true);
    // Aktywny sezon bez zmian
    expect(prisma.$tables.kalkSeason.find((s) => s.id === 'season_2026-2027').isActive).toBe(true);
  });

  it('odrzuca kalkNumber przypisany do innego sezonu', async () => {
    const prisma = seededPrisma();
    prisma.$tables.kalkSeason[1].kalkNumber = 50; // 2025-2026 ma już 50
    await expect(ingestKalkV2Bundle(bundle(), { prisma, syncPlayers: null, logger: quiet })).rejects.toThrow(/kalkNumber 50/);
  });

  it('dry-run: zapisy są tylko liczone', async () => {
    const prisma = seededPrisma();
    const { client, writes } = createDryRunPrisma(prisma);
    const res = await ingestKalkV2Bundle(bundle(), { prisma: client, syncPlayers: null, logger: quiet });
    expect(res.matches.created).toBe(1);
    expect(writes['kalkMatch.upsert']).toBe(1);
    expect(prisma.$writes).toEqual([]);
    expect(prisma.$tables.kalkMatch).toHaveLength(0);
  });
});

describe('KALK v2 — rozwiązywanie meczu po ID (sezon + alias)', () => {
  it('przy ID w wielu sezonach wybiera aktywny i loguje ostrzeżenie; fallback na alias', async () => {
    const prisma = seededPrisma({
      kalkMatch: [
        { id: '3842', seasonId: 'season_2025-2026', sourceSite: 'legacy' },
        { id: '3842', seasonId: 'season_2026-2027', sourceSite: 'v2' },
        { id: '4601', seasonId: 'season_2025-2026', sourceSite: 'v2' }
      ],
      kalkMatchIdAlias: [{ legacyId: '999', seasonId: 'season_2025-2026', kalkMatchId: '4601' }]
    });
    const logger = { warn: vi.fn() };
    const row = await resolveKalkMatchById(prisma, '3842', { logger });
    expect(row.seasonId).toBe('season_2026-2027');
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('3842'));

    expect((await resolveKalkMatchById(prisma, '3842', { seasonId: 'season_2025-2026', logger })).sourceSite).toBe('legacy');
    expect((await resolveKalkMatchById(prisma, '999', { logger })).id).toBe('4601');
    expect(await resolveKalkMatchById(prisma, '12345', { logger })).toBeNull();
  });
});

describe('KALK v2 — skład (syncPlayersFromKalk przez ingest)', () => {
  let prisma;
  let dataStore;

  beforeEach(async () => {
    vi.resetModules();
    prisma = seededPrisma({
      rosterPlayer: [
        // istniejący zawodnik z poprawną kolejnością imię/nazwisko, powiązany ze starym ID
        { id: 'rp-karp', firstName: 'Filip', lastName: 'Karpiński', kalkPlayerId: '2025-2026__zawodnikfilip-karpinski4310html', kalkSlug: null, gamesPlayed: 0, ppg: 0, rpg: 0, apg: 0, threePercentage: 0, ftPercentage: 0 },
        // zapisany odwrotnie (stara strona KALK: „Nazwisko Imię”) — kolejność z profilu KALK
        { id: 'rp-ol', firstName: 'Olearczyk', lastName: 'Dawid', kalkPlayerId: null, kalkSlug: null, gamesPlayed: 0, ppg: 0, rpg: 0, apg: 0 }
      ]
    });
    vi.doMock('../../lib/prisma.js', () => ({ prisma }));
    dataStore = await import('../../dataStore.js');
  });

  afterEach(() => {
    vi.doUnmock('../../lib/prisma.js');
    vi.resetModules();
  });

  it('aktywny sezon: łączy po slug/imieniu, odwraca zamienione imię i nazwisko wg profilu, tworzy brakujących', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { ingestKalkV2Bundle: ingest } = await import('../../kalk/v2/ingestSeason.js');
    const res = await ingest(bundle(), { prisma, logger: quiet });
    warn.mockRestore();

    const roster = prisma.$tables.rosterPlayer;
    const karp = roster.find((r) => r.id === 'rp-karp');
    expect(karp).toMatchObject({ firstName: 'Filip', lastName: 'Karpiński', kalkSlug: 'filip-karpinski', kalkPlayerId: '2026-2027__filip-karpinski' });
    expect(karp.rpg).toBe(3);
    expect(karp.apg).toBe(1);
    const ol = roster.find((r) => r.id === 'rp-ol');
    expect(ol).toMatchObject({ firstName: 'Dawid', lastName: 'Olearczyk', kalkSlug: 'dawid-olearczyk' });

    // Nowi z BeKaPaKa: „Imię Nazwisko” z profilu/katalogu
    const bortnik = roster.find((r) => r.kalkSlug === 'jedrzej-bortnik');
    expect(bortnik).toMatchObject({ firstName: 'Jędrzej', lastName: 'Bortnik', kalkPlayerId: '2026-2027__jedrzej-bortnik' });
    // Rywale nie trafiają do składu
    expect(roster.find((r) => r.kalkSlug === 'adam-nowak')).toBeUndefined();
    expect(roster).toHaveLength(5);
    expect(res.rosterSync).toMatchObject({ created: 3, linked: 2, errors: 0 });

    // Drugi sync nie zmienia już nazw ani liczby zawodników
    prisma.$resetWrites();
    const again = await dataStore.syncPlayersFromKalk({ seasonId: 'season_2026-2027' });
    expect(again.synced).toHaveLength(0);
    expect(prisma.$writes.filter((w) => w.model === 'rosterPlayer' && w.op === 'create')).toHaveLength(0);
    expect(prisma.$tables.rosterPlayer.find((r) => r.id === 'rp-ol').firstName).toBe('Dawid');
  });

  it('sezon nieaktywny: nie tworzy ani nie łączy zawodników w składzie', async () => {
    const { ingestKalkV2Bundle: ingest } = await import('../../kalk/v2/ingestSeason.js');
    const b = bundle();
    b.manifest.seasonSlug = '2025-2026';
    b.manifest.kalkNumber = 49;
    const res = await ingest(b, { prisma, logger: quiet });
    expect(res.isActiveSeason).toBe(false);
    expect(res.rosterSync).toBeNull();
    expect(prisma.$tables.rosterPlayer).toHaveLength(2);
    expect(prisma.$writes.filter((w) => w.model === 'rosterPlayer')).toEqual([]);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const direct = await dataStore.syncPlayersFromKalk({ seasonId: 'season_2025-2026' });
    warn.mockRestore();
    expect(direct.status).toBe('skipped_inactive_season');
    expect(prisma.$writes.filter((w) => w.model === 'rosterPlayer')).toEqual([]);
  });

  it('stary import terminarza: przełożony mecz aktualizuje wiersz po kalkMatchId', async () => {
    prisma.$tables.leagueMatch.push({
      id: 'lm-1', seasonId: 'season_2026-2027', kalkMatchId: '4130', date: new Date('2026-10-11T12:40:00Z'),
      homeTeam: 'Kosz-All-In', guestTeam: 'BeKaPaKa Bobolice', isFinished: false
    });
    await dataStore.ingestLeagueSchedule([
      { date: '18.10.2026 14:40', homeTeam: 'Kosz-All-In', guestTeam: 'BeKaPaKa Bobolice', scoreHome: null, scoreAway: null, isFinished: false, meczId: '4130', roundCode: 'Kolejka - 4' }
    ]);
    const rows = prisma.$tables.leagueMatch.filter((r) => r.kalkMatchId === '4130');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('lm-1');
    expect(rows[0].roundLabel).toBe('Kolejka - 4');
  });

  it('stary import zawodników: klucze zbiorki_/asysty_/prz_/bl_ trafiają do agregatów', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await dataStore.ingestKalkPlayers([
      { id_zawodnika: 'filip-karpinski', imie_nazwisko: 'Filip Karpiński', druzyna: 'BeKaPaKa Bobolice', mecze_rozegrane: 1, punkty_suma: 7, srednia_punktow: 7,
        zbiorki_suma: 3, zbiorki_srednia: 3, asysty_suma: 1, asysty_srednia: 1, prz_suma: 1, prz_srednia: 1, bl_suma: 1, bl_srednia: 1 }
    ]);
    log.mockRestore();
    const kp = prisma.$tables.kalkPlayer.find((p) => p.id === '2026-2027__filip-karpinski');
    expect(kp).toMatchObject({ reboundsTotal: 3, assistsAverage: 1, stealsTotal: 1, blocksAverage: 1 });
  });
});
