import { describe, expect, it } from 'vitest';
import { createFakePrisma } from '../helpers/fakePrisma.js';
import { getTeamsAllTime, headToHeadByOpponent } from '../../kalk/v2/readModels.js';

const profile = (id, name, over = {}) => ({
  id, slug: name.toLowerCase().replace(/\s+/g, '-'), name, sinceDate: new Date('2016-10-01T00:00:00Z'),
  allTimeGames: 10, allTimeWins: 5, allTimeLosses: 5, allTimePointsFor: 600, allTimePointsAgainst: 610,
  quartersWon: 20, quartersLost: 18, overtimes: 1, overtimeWins: 1, overtimeLosses: 0, ...over
});
const lm = (seasonId, home, guest, sh, sa, date, isFinished = true) => ({
  id: `${seasonId}-${home}-${guest}-${date}`, seasonId, date: new Date(date), homeTeamKalkId: home, guestTeamKalkId: guest,
  scoreHome: sh, scoreAway: sa, isFinished
});

describe('Bilans wszech czasów', () => {
  it('H2H BeKaPaKa z rywalem z terminarza wszystkich sezonów (gospodarz i gość)', () => {
    const h2h = headToHeadByOpponent([
      lm('s1', '138', '18', 60, 50, '2023-10-08'),
      lm('s2', '18', '138', 70, 65, '2024-11-01'),
      lm('s2', '18', '138', 0, 20, '2025-01-01'),
      lm('s3', '138', '18', null, null, '2026-11-01', false),
      lm('s3', '67', '18', 50, 40, '2026-11-02')
    ], '138');
    expect(h2h.get('18')).toEqual({ games: 3, wins: 2, losses: 1, pointsFor: 145, pointsAgainst: 120, lastDate: '2025-01-01T00:00:00.000Z' });
    expect(h2h.has('67')).toBe(false);
  });

  it('lista drużyn: % zwycięstw, średnie, flagi BeKaPaKa/archiwalna/aktywna, sortowanie', async () => {
    const prisma = createFakePrisma({
      kalkSeason: [{ id: 'season_2026-2027', slug: '2026-2027', isActive: true }],
      kalkTeamProfile: [
        profile('138', 'BeKaPaKa Bobolice', { allTimeGames: 50, allTimeWins: 13, allTimeLosses: 37, allTimePointsFor: 2561, allTimePointsAgainst: 3273 }),
        profile('18', 'Grubik Team', { allTimeGames: 181, allTimeWins: 64, allTimeLosses: 116 }),
        profile('128', 'Drużyna archiwalna #208', { allTimeWins: 8, allTimeLosses: 2 }),
        profile('999', 'Pusta', { allTimeGames: 0, allTimeWins: 0, allTimeLosses: 0 })
      ],
      leagueMatch: [
        lm('season_2025-2026', '138', '18', 61, 55, '2026-01-10'),
        lm('season_2026-2027', '18', '67', null, null, '2026-11-01', false)
      ]
    });
    const out = await getTeamsAllTime(prisma);
    expect(out.bekapakaKalkId).toBe('138');
    expect(out.teams.map((t) => t.kalkId)).toEqual(['128', '18', '138']);
    const bkpk = out.teams.find((t) => t.isBekapaka);
    expect(bkpk).toMatchObject({ winPct: 26, pointsForPerGame: 51.2, pointsAgainstPerGame: 65.5, headToHead: null, isActive: false });
    const grubik = out.teams.find((t) => t.kalkId === '18');
    expect(grubik).toMatchObject({ isActive: true, isArchived: false, quarterWinPct: 52.6 });
    expect(grubik.headToHead).toMatchObject({ games: 1, wins: 1, losses: 0 });
    expect(out.teams.find((t) => t.kalkId === '128').isArchived).toBe(true);
  });
});
