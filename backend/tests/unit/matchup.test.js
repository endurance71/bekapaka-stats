import { describe, expect, it } from 'vitest';
import { buildMatchup, headToHead, seasonAverages } from '../../lib/matchup.js';

const team = (name, pts, extra = {}) => ({ name, pts, reb: 30, ast: 10, stl: 5, blk: 2, tov: 12, fgm: 30, fga: 60, three_pm: 5, three_pa: 20, ftm: 10, fta: 20, ...extra });

// Mecze sezonu w postaci kalkMatchToGameDetail (gospodarz pierwszy).
const seasonMatches = [
  { teams: [team('GMVT TEAM', 70), team('BeKaPaKa Bobolice', 80, { reb: 40, fgm: 32, fga: 64 })] }, // BeKaPaKa na wyjeździe
  { teams: [team('BeKaPaKa Bobolice', 60, { reb: 20, fgm: 24, fga: 66 }), team('Młode Wilki', 66)] },
  { teams: [team('GMVT TEAM', 50, { ast: 20 }), team('Pantery', 55)] },
  { teams: [team('Fasolki', 40)] } // bez pełnego box score
];

const table = [
  { name: 'BeKaPaKa Bobolice', position: 1, matches: 2, wins: 1, losses: 1, pointsFor: 140, pointsAgainst: 136, form: ['W', 'P'], streak: 'P1', logoUrl: null },
  { name: 'GMVT TEAM', position: 5, matches: 2, wins: 1, losses: 1, pointsFor: 120, pointsAgainst: 135, form: ['P', 'W'], streak: 'W1', logoUrl: 'https://kalk/gmvt.png' },
  { name: 'Pantery', position: 2, matches: 1, wins: 1, losses: 0, pointsFor: 55, pointsAgainst: 50, form: ['W'], streak: 'W1' }
];

describe('matchup', () => {
  it('averages a team across its own side of every season match, from both home and away games', () => {
    const us = seasonAverages('BeKaPaKa Bobolice', seasonMatches);
    expect(us.boxScoreGames).toBe(2);
    expect(us.perGame).toMatchObject({ pts: 70, opp: 68, reb: 30, ast: 10 });
    expect(us.pct.fg).toBe(43.1); // (32 + 24) / (64 + 66) = 56 / 130, from totals — not the mean of percentages
    const them = seasonAverages('GMVT TEAM', seasonMatches);
    expect(them.boxScoreGames).toBe(2);
    expect(them.perGame).toMatchObject({ pts: 60, opp: 67.5, ast: 15 });
    expect(seasonAverages('Atomówki', seasonMatches)).toEqual({ boxScoreGames: 0, perGame: null, pct: null });
  });

  it('lists head-to-head games newest first with the score from the BeKaPaKa side', () => {
    const matches = [
      { id: 1, date: '2025-11-02', seasonId: 's25', homeTeamName: 'GMVT TEAM', guestTeamName: 'BeKaPaKa BOBOLICE', scoreHome: 50, scoreAway: 61 },
      { id: 2, date: '2026-03-08', seasonId: 's25', homeTeamName: 'BeKaPaKa Bobolice', guestTeamName: 'GMVT TEAM', scoreHome: 70, scoreAway: 72 },
      { id: 3, date: '2026-03-15', seasonId: 's25', homeTeamName: 'Pantery', guestTeamName: 'GMVT TEAM', scoreHome: 70, scoreAway: 72 },
      { id: 4, date: '2026-04-01', seasonId: 's25', homeTeamName: 'BeKaPaKa Bobolice', guestTeamName: 'GMVT TEAM', scoreHome: null, scoreAway: null }
    ];
    expect(headToHead('GMVT TEAM', matches, { s25: 'Sezon 2025/2026' })).toEqual([
      { gameId: '2', date: new Date('2026-03-08').toISOString(), seasonId: 's25', seasonLabel: 'Sezon 2025/2026', scoreUs: 70, scoreThem: 72 },
      { gameId: '1', date: new Date('2025-11-02').toISOString(), seasonId: 's25', seasonLabel: 'Sezon 2025/2026', scoreUs: 61, scoreThem: 50 }
    ]);
  });

  it('builds both sides with table data, scorers and averages; unknown opponent → null', () => {
    const players = [
      { name: 'Filip Karpiński', team: 'BeKaPaKa Bobolice', pointsAverage: 28, matchesPlayed: 1 },
      { name: 'Jan Rywal', team: 'GMVT TEAM', pointsAverage: 15.25, matchesPlayed: 2 },
      { name: 'Ktoś Inny', team: 'Pantery', pointsAverage: 30, matchesPlayed: 1 },
      { name: 'Bez Meczu', team: 'GMVT TEAM', pointsAverage: 0, matchesPlayed: 0 }
    ];
    const result = buildMatchup({ opponent: 'GMVT TEAM', season: { id: 's26', label: 'Sezon 2026/2027' }, table, seasonMatches, allMatches: [], players });
    expect(result.teams.us).toMatchObject({ name: 'BeKaPaKa Bobolice', position: 1, wins: 1, losses: 1, boxScoreGames: 2 });
    expect(result.teams.them).toMatchObject({ name: 'GMVT TEAM', position: 5, logoUrl: 'https://kalk/gmvt.png', boxScoreGames: 2 });
    expect(result.scorers.us.map((p) => p.name)).toEqual(['Filip Karpiński']);
    expect(result.scorers.them).toEqual([{ name: 'Jan Rywal', pointsAverage: 15.3, matchesPlayed: 2 }]);
    expect(result.season).toEqual({ id: 's26', label: 'Sezon 2026/2027' });
    expect(buildMatchup({ opponent: 'Nieznani', season: null, table, seasonMatches, allMatches: [], players })).toBeNull();
  });
});
