import { describe, expect, it } from 'vitest';
import { createFakePrisma } from '../helpers/fakePrisma.js';
import { certainShare, computeLineupStints, pairStats } from '../../kalk/v2/lineups.js';
import { computeTeamSynergy } from '../../kalk/v2/synergy.js';
import { matchHasPlusMinus } from '../../kalk/v2/util.js';

let seq = 0;
const ev = (over) => ({
  seq: ++seq,
  period: 1,
  elapsedSec: 0,
  side: 'home',
  playerSlug: null,
  playerName: null,
  playerNumber: null,
  actionType: 'shot_made',
  subOutSlug: null,
  subOutNumber: null,
  scoreHome: 0,
  scoreAway: 0,
  ...over
});
const starter = (slug, n) => ev({ actionType: 'sub', playerSlug: slug, playerName: slug, playerNumber: n });
const STARTERS = ['a', 'b', 'c', 'd', 'e'];

function game() {
  seq = 0;
  return [
    // pierwsza piątka przed „Początkiem okresu” (jak w meczu 4116) + rywal
    ...STARTERS.map((s, i) => starter(s, i + 1)),
    ev({ side: 'away', actionType: 'sub', playerSlug: 'x1', playerNumber: 11 }),
    ev({ side: null, actionType: 'period_start' }),
    ev({ elapsedSec: 60, playerSlug: 'a', scoreHome: 2 }),
    ev({ elapsedSec: 90, side: 'away', playerSlug: 'x1', scoreHome: 2, scoreAway: 3 }),
    // zmiana: e schodzi, f wchodzi (wynik 2:3)
    ev({ elapsedSec: 120, actionType: 'sub', playerSlug: 'f', playerNumber: 6, subOutSlug: 'e', subOutNumber: 5, scoreHome: 2, scoreAway: 3 }),
    ev({ elapsedSec: 300, playerSlug: 'f', scoreHome: 4, scoreAway: 3 }),
    // dogrywka: okres 5 = 300 s, koniec meczu w 2700 s
    ev({ period: 5, elapsedSec: 2700, side: null, actionType: 'period_end', scoreHome: 4, scoreAway: 3 })
  ];
}

describe('computeLineupStints', () => {
  it('piątka startowa, zmiana i punkty po stronie BeKaPaKa', () => {
    const { stints, players } = computeLineupStints(game(), 'home');
    expect(stints).toHaveLength(2);
    expect(stints[0]).toMatchObject({ players: ['a', 'b', 'c', 'd', 'e'], seconds: 120, pointsFor: 2, pointsAgainst: 3, certain: true });
    expect(stints[1]).toMatchObject({ players: ['a', 'b', 'c', 'd', 'f'], seconds: 2580, pointsFor: 2, pointsAgainst: 0, certain: true });
    expect(players.get('f')).toMatchObject({ number: 6 });
    expect(certainShare(stints)).toBe(1);
  });

  it('strona gości liczy wynik odwrotnie', () => {
    const { stints } = computeLineupStints(game(), 'away');
    const total = stints.reduce((s, st) => ({ f: s.f + st.pointsFor, a: s.a + st.pointsAgainst }), { f: 0, a: 0 });
    expect(total).toEqual({ f: 3, a: 4 });
  });

  it('„Na boisku” bez schodzącego → 6 zawodników = odcinek niepewny, pomijany w parach', () => {
    const events = game();
    // między akcją rywala (90 s) a zmianą (120 s)
    events.push(ev({ seq: events[8].seq + 0.5, elapsedSec: 100, actionType: 'on_court', playerSlug: 'g', playerNumber: 7, scoreHome: 2, scoreAway: 3 }));
    const { stints } = computeLineupStints(events, 'home');
    const uncertain = stints.filter((s) => !s.certain);
    expect(uncertain.length).toBeGreaterThan(0);
    expect(certainShare(stints)).toBeLessThan(1);
    const pairs = pairStats(stints);
    // g nie trafia do par, bo nigdy nie był w pewnej piątce
    expect([...pairs.keys()].some((k) => k.includes('g'))).toBe(false);
  });

  it('zmiana tylko z numerem schodzącego (bez sluga)', () => {
    const events = game();
    const sub = events.find((e) => e.actionType === 'sub' && e.subOutSlug === 'e');
    sub.subOutSlug = null;
    const { stints } = computeLineupStints(events, 'home');
    expect(stints[1].players).toEqual(['a', 'b', 'c', 'd', 'f']);
  });
});

describe('pairStats', () => {
  it('wspólny czas i bilans pary', () => {
    const pairs = pairStats(computeLineupStints(game(), 'home').stints);
    expect(pairs.get('a___b')).toMatchObject({ seconds: 2700, pointsFor: 4, pointsAgainst: 3 });
    expect(pairs.get('a___e')).toMatchObject({ seconds: 120, pointsFor: 2, pointsAgainst: 3 });
    expect(pairs.get('a___f')).toMatchObject({ seconds: 2580 });
    expect(pairs.has('e___f')).toBe(false);
  });
});

describe('computeTeamSynergy', () => {
  const season = 'season_2026-2027';
  const roster = STARTERS.concat('f').map((slug, i) => ({ id: `rp-${slug}`, firstName: slug.toUpperCase(), lastName: 'Test', number: i + 1, kalkSlug: slug }));

  it('akcja po akcji: tylko BeKaPaKa, pary od 10 minut, linki do składu', async () => {
    const prisma = createFakePrisma({
      kalkMatch: [
        { id: 'm1', seasonId: season, homeTeamName: 'BeKaPaKa Bobolice', guestTeamName: 'Rywal' },
        // mecz innych drużyn — nie może trafić do duetów
        { id: 'm2', seasonId: season, homeTeamName: 'Pantery', guestTeamName: 'BrdCrew' }
      ],
      kalkPlayByPlayEvent: [
        ...game().map((e) => ({ ...e, seasonId: season, kalkMatchId: 'm1' })),
        ...game().map((e) => ({ ...e, seasonId: season, kalkMatchId: 'm2', playerSlug: e.playerSlug ? `obcy-${e.playerSlug}` : null }))
      ],
      rosterPlayer: roster
    });
    const res = await computeTeamSynergy(prisma, season);
    expect(res.source).toBe('pbp');
    expect(res.gamesAnalyzed).toBe(1);
    expect(res.duos.every((d) => !d.player1.id.startsWith('obcy') && !d.player2.id.startsWith('obcy'))).toBe(true);
    // a+e grali razem 2 min → poniżej progu 10 min
    expect(res.duos.find((d) => d.id === 'a___e')).toBeUndefined();
    const ab = res.duos.find((d) => d.id === 'a___b');
    expect(ab).toMatchObject({ minutesTogether: 45, plusMinus: 1, gamesTogether: 1 });
    expect(ab.player1).toMatchObject({ rosterId: 'rp-a', name: 'A Test' });
    expect(res.bestOffensivePair).not.toBeNull();
  });

  it('bez akcji po akcji: wspólne mecze BeKaPaKa od 3 meczów, bez +/-', async () => {
    const matches = ['m1', 'm2', 'm3'].map((id) => ({ id, seasonId: season, homeTeamName: 'Rywal', guestTeamName: 'BeKaPaKa BOBOLICE' }));
    const logs = matches.flatMap((m) => [
      { seasonId: season, kalkMatchId: m.id, playerSlug: 'a', teamName: 'BeKaPaKa BOBOLICE', pts: 10 },
      { seasonId: season, kalkMatchId: m.id, playerSlug: 'b', teamName: 'BeKaPaKa BOBOLICE', pts: 4 },
      { seasonId: season, kalkMatchId: m.id, playerSlug: 'rywal-1', teamName: 'Rywal', pts: 20 }
    ]);
    const prisma = createFakePrisma({ kalkMatch: matches, kalkPlayerGameLog: logs, rosterPlayer: roster });
    const res = await computeTeamSynergy(prisma, season);
    expect(res.source).toBe('box');
    expect(res.duos).toEqual([
      expect.objectContaining({ id: 'a___b', gamesTogether: 3, avgCombinedPpg: 14 })
    ]);
    expect(res.duos[0]).not.toHaveProperty('plusMinus');
    expect(res.bestDefensivePair).toBeNull();
  });
});

describe('matchHasPlusMinus', () => {
  it('same zera = KALK nie podał +/-', () => {
    expect(matchHasPlusMinus({ teams: [{ players: [{ plusMinus: 0 }, { plusMinus: 0 }] }, { players: [{ plusMinus: 0 }] }] })).toBe(false);
    expect(matchHasPlusMinus({ teams: [{ players: [{ plusMinus: 0 }, { plusMinus: -3 }] }] })).toBe(true);
    expect(matchHasPlusMinus(null)).toBe(false);
  });
});
