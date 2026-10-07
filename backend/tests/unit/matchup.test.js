import { describe, expect, it } from 'vitest';
import { buildMatchup, headToHead, leaderDuels, leagueRanks, playerAverages, seasonAverages } from '../../lib/matchup.js';

const player = (name, url, stats) => ({ name, profile_url: url, number: 7, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, eval: 0, ...stats });
const team = (name, pts, extra = {}) => ({
  name, pts, reb: 30, orb: 10, drb: 20, ast: 10, stl: 5, blk: 2, tov: 12, fgm: 30, fga: 60, three_pm: 5, three_pa: 20, ftm: 10, fta: 20, players: [], ...extra
});

// Mecze sezonu w postaci kalkMatchToGameDetail (gospodarz pierwszy).
const seasonMatches = [
  {
    teams: [
      team('GMVT TEAM', 70, { players: [player('J. Rywal', 'kalk/jan-rywal', { pts: 20, reb: 4, eval: 18 })] }),
      team('BeKaPaKa Bobolice', 80, { reb: 40, fgm: 32, fga: 64, players: [player('F. Karpiński', 'kalk/filip-karpinski', { pts: 28, reb: 6, ast: 4, eval: 36 }), player('P. Sosiński', 'kalk/piotr-sosinski', { pts: 2, reb: 8 })] })
    ]
  }, // BeKaPaKa na wyjeździe
  {
    teams: [
      team('BeKaPaKa Bobolice', 60, { reb: 20, fgm: 24, fga: 66, players: [player('F. Karpiński', 'kalk/filip-karpinski', { pts: 12, reb: 2, ast: 6, eval: 10 })] }),
      team('Młode Wilki', 66)
    ]
  },
  { teams: [team('GMVT TEAM', 50, { ast: 20, players: [player('J. Rywal', 'kalk/jan-rywal', { pts: 10, reb: 10, eval: 8 })] }), team('Pantery', 55)] },
  { teams: [team('Fasolki', 40)] } // bez pełnego box score
];

const table = [
  { name: 'BeKaPaKa Bobolice', position: 1, matches: 2, wins: 1, losses: 1, pointsFor: 140, pointsAgainst: 136, form: ['W', 'P'], streak: 'P1', logoUrl: null },
  { name: 'GMVT TEAM', position: 5, matches: 2, wins: 1, losses: 1, pointsFor: 120, pointsAgainst: 135, form: ['P', 'W'], streak: 'W1', logoUrl: 'https://kalk/gmvt.png' },
  { name: 'Pantery', position: 2, matches: 1, wins: 1, losses: 0, pointsFor: 55, pointsAgainst: 50, form: ['W'], streak: 'W1' },
  { name: 'Młode Wilki', position: 3, matches: 1, wins: 1, losses: 0, pointsFor: 66, pointsAgainst: 60, form: ['W'], streak: 'W1' }
];

describe('matchup', () => {
  it('averages a team across its own side of every season match, home and away; percentages from totals', () => {
    const us = seasonAverages('BeKaPaKa Bobolice', seasonMatches);
    expect(us.boxScoreGames).toBe(2);
    expect(us.perGame).toMatchObject({ pts: 70, opp: 68, reb: 30, orb: 10, drb: 20, ast: 10 });
    expect(us.pct.fg).toBe(43.1); // (32 + 24) / (64 + 66) = 56 / 130
    expect(us.pct.two).toBe(51.1); // (56 − 10) / (130 − 40) = 46 / 90
    expect(seasonAverages('Atomówki', seasonMatches)).toEqual({ boxScoreGames: 0, perGame: null, pct: null });
  });

  it('ranks each stat across the league, lower is better for points allowed and turnovers', () => {
    const averages = Object.fromEntries(table.map((row) => [row.name, seasonAverages(row.name, seasonMatches)]));
    const { ranks, teams } = leagueRanks('BeKaPaKa Bobolice', averages);
    expect(teams).toBe(4);
    expect(ranks.pts).toBe(1); // 70 vs 60 / 55 / 66
    expect(ranks.opp).toBe(4); // 68 allowed — the most
  });

  it('averages players from box scores with full names from KALK profiles and picks leader duels', () => {
    const names = new Map([['kalk/filip-karpinski', 'Filip Karpiński']]);
    const us = playerAverages('BeKaPaKa Bobolice', seasonMatches, names);
    expect(us.find((p) => p.name === 'Filip Karpiński')).toMatchObject({ games: 2, perGame: { pts: 20, reb: 4, ast: 5, eval: 23 } });
    const them = playerAverages('GMVT TEAM', seasonMatches, names);
    expect(them[0]).toMatchObject({ name: 'J. Rywal', games: 2, perGame: { pts: 15, reb: 7 } });
    const duels = leaderDuels(us, them);
    expect(duels.find((d) => d.category === 'reb')).toMatchObject({ us: { name: 'P. Sosiński', value: 8 }, them: { name: 'J. Rywal', value: 7 } });
    expect(duels.find((d) => d.category === 'stl')).toBeUndefined(); // nikt nie ma przechwytu
  });

  it('lists head-to-head games newest first with the score from the BeKaPaKa side', () => {
    const matches = [
      { id: 1, date: '2025-11-02', seasonId: 's25', homeTeamName: 'GMVT TEAM', guestTeamName: 'BeKaPaKa BOBOLICE', scoreHome: 50, scoreAway: 61 },
      { id: 2, date: '2026-03-08', seasonId: 's25', homeTeamName: 'BeKaPaKa Bobolice', guestTeamName: 'GMVT TEAM', scoreHome: 70, scoreAway: 72 },
      { id: 3, date: '2026-03-15', seasonId: 's25', homeTeamName: 'Pantery', guestTeamName: 'GMVT TEAM', scoreHome: 70, scoreAway: 72 },
      { id: 4, date: '2026-04-01', seasonId: 's25', homeTeamName: 'BeKaPaKa Bobolice', guestTeamName: 'GMVT TEAM', scoreHome: null, scoreAway: null }
    ];
    expect(headToHead('GMVT TEAM', matches, { s25: 'Sezon 2025/2026' }).map((g) => [g.gameId, g.scoreUs, g.scoreThem])).toEqual([
      ['2', 70, 72],
      ['1', 61, 50]
    ]);
  });

  it('builds both sides with ranks, leaders and top scorers; unknown opponent → null', () => {
    const result = buildMatchup({ opponent: 'GMVT TEAM', season: { id: 's26', label: 'Sezon 2026/2027' }, table, seasonMatches, allMatches: [], players: [{ name: 'Filip Karpiński', profileUrl: 'kalk/filip-karpinski' }] });
    expect(result.teams.us).toMatchObject({ name: 'BeKaPaKa Bobolice', position: 1, boxScoreGames: 2, leagueTeams: 4 });
    expect(result.teams.them).toMatchObject({ name: 'GMVT TEAM', logoUrl: 'https://kalk/gmvt.png', boxScoreGames: 2 });
    expect(result.teams.us.ranks.pts).toBe(1);
    expect(result.leaders.find((d) => d.category === 'pts')).toMatchObject({ us: { name: 'Filip Karpiński', value: 20 }, them: { name: 'J. Rywal', value: 15 } });
    expect(result.scorers.us[0]).toEqual({ name: 'Filip Karpiński', pointsAverage: 20, matchesPlayed: 2 });
    expect(buildMatchup({ opponent: 'Nieznani', season: null, table, seasonMatches, allMatches: [] })).toBeNull();
  });
});
