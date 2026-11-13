import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({ prisma: {} }));

import { buildOwnPlayerStats } from '../../ai/pregameOwnStats.js';
import { buildPreGameCardSystemInstruction, buildPreGameCardUserPrompt } from '../../ai/prompts/pregameBriefingCard.pl.js';

const roster = [
  { id: 'r-karp', firstName: 'Filip', lastName: 'Karpiński', number: 69, kalkPlayer: { id: 'k-karp' } },
  { id: 'r-sos', firstName: 'Piotr', lastName: 'Sosiński', number: 8, kalkPlayer: { id: 'k-sos' } },
  { id: 'r-mal', firstName: 'Mirosław', lastName: 'Malina', number: 11, kalkPlayer: { id: 'k-mal' } },
  { id: 'r-new', firstName: 'Jan', lastName: 'Nowy', number: 5, kalkPlayer: null }
];

const log = (kalkPlayerId, over = {}) => ({
  kalkPlayerId,
  starter: false,
  secondsPlayed: 600,
  pts: 0,
  twoPm: 0,
  twoPa: 0,
  threePm: 0,
  threePa: 0,
  ftm: 0,
  fta: 0,
  orb: 0,
  reb: 0,
  ast: 0,
  stl: 0,
  blk: 0,
  tov: 0,
  pf: 0,
  plusMinus: 0,
  ...over
});

describe('statystyki naszych zawodników do karty przedmeczowej', () => {
  const { players, withoutGames } = buildOwnPlayerStats(roster, [
    // m1 i m2 mają +/- w protokole; m3 to mecz bez +/- (KALK: same zera u wszystkich)
    log('k-karp', { kalkMatchId: 'm1', starter: true, secondsPlayed: 1860, pts: 24, twoPm: 11, twoPa: 16, reb: 7, orb: 3, plusMinus: 11 }),
    log('k-karp', { kalkMatchId: 'm3', starter: true, secondsPlayed: 1860, pts: 20, twoPm: 9, twoPa: 14, ftm: 2, fta: 4, reb: 6, orb: 2 }),
    log('k-sos', { kalkMatchId: 'm1', starter: true, secondsPlayed: 1400, reb: 9, orb: 2, plusMinus: 20 }),
    log('k-sos', { kalkMatchId: 'm2', starter: true, secondsPlayed: 1400, reb: 8, orb: 2, plusMinus: 22 }),
    log('k-mal', { kalkMatchId: 'm3', secondsPlayed: 576, pts: 3, threePm: 1, threePa: 2, reb: 2, orb: 1, tov: 2 })
  ]);


  it('liczy średnie już od jednego meczu i podaje próbę', () => {
    const malina = players.find((p) => p.name === 'Mirosław Malina');
    expect(malina).toMatchObject({ playerId: 'r-mal', games: 1, starts: 0, mpg: 9.6, ppg: 3, tovPg: 2 });
    expect(malina.threePt).toEqual({ made: 1, attempted: 2, pct: 50 });
  });

  it('sumuje rzuty, zbiórki w ataku i +/- dla zawodnika z kilkoma meczami', () => {
    const karp = players.find((p) => p.playerId === 'r-karp');
    expect(karp).toMatchObject({ games: 2, starts: 2, mpg: 31, ppg: 22, rpg: 6.5, orbPg: 2.5 });
    expect(karp.twoPt).toEqual({ made: 20, attempted: 30, pct: 66.7 });
    expect(karp.ft).toEqual({ made: 2, attempted: 4, pct: 50 });
    expect(karp.threePt.pct).toBeNull();
    expect(players.find((p) => p.playerId === 'r-sos')).toMatchObject({ plusMinusTotal: 42, plusMinusGames: 2 });
  });

  it('mecz bez +/- w protokole nie wchodzi do sumy +/- (brak danych, nie zero)', () => {
    expect(players.find((p) => p.playerId === 'r-karp')).toMatchObject({ games: 2, plusMinusTotal: 11, plusMinusGames: 1 });
    expect(players.find((p) => p.playerId === 'r-mal')).toMatchObject({ games: 1, plusMinusTotal: null, plusMinusGames: 0 });
  });

  it('zawodnik bez meczów nie dostaje liczb, a kolejność zaczyna się od wyjść w piątce', () => {
    expect(withoutGames).toEqual(['Jan Nowy']);
    expect(players.map((p) => p.playerId)).toEqual(['r-karp', 'r-sos', 'r-mal']);
  });

  it('prompt karty zawiera liczby naszych zawodników i wymaga porównań także przy 1 meczu', () => {
    const user = buildPreGameCardUserPrompt({
      opponentName: 'Maxbau Okna Dako PSP',
      opponentStats: { keyPlayers: [{ name: 'Rafał Dolik', games: 2, rpg: 15 }] },
      ownStats: { players, withoutGames },
      roster,
      nextMatch: null
    });
    expect(user).toContain('Statystyki zawodników BeKaPaKa w sezonie');
    expect(user).toContain('"name": "Mirosław Malina"');
    expect(user).toContain('"withoutGames"');
    expect(user).toMatch(/także przy próbie 1–2 meczów/);

    const system = buildPreGameCardSystemInstruction();
    expect(system).toContain('ZADANIA MIEJSC STREFY (OBOWIĄZKOWE)');
    expect(system).toContain('NIE wybieraj pierwszej piątki');
    expect(system).toContain('strefą 2-3');
    expect(system).toMatch(/z 1 lub 2 meczów/);
  });

  it('bez meczów w bazie prompt mówi to wprost zamiast podawać pusty JSON', () => {
    const user = buildPreGameCardUserPrompt({ opponentName: 'Pantery', ownStats: { players: [], withoutGames: ['Jan Nowy'] }, roster });
    expect(user).toContain('brak meczów w bazie');
  });
});
