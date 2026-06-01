import type { Game, Team, TeamTotals, ValidationResult } from './types';

export const formatPct = (made?: number, att?: number): string => {
  const a = att ?? 0;
  if (!a) return '0,0';
  const pct = (Number(made ?? 0) / a) * 100;
  return pct.toFixed(1).replace('.', ',');
};

export const sumTeamTotals = (team: Team): TeamTotals => {
  return team.players.reduce(
    (acc, p) => {
      acc.pts += Number(p.pts ?? 0);
      const fgm = Number(p.fgm ?? (Number(p.two_pm ?? 0) + Number(p.three_pm ?? 0)));
      const fga = Number(p.fga ?? (Number(p.two_pa ?? 0) + Number(p.three_pa ?? 0)));
      acc.fgm += fgm;
      acc.fga += fga;
      acc.two_pm += Number(p.two_pm ?? 0);
      acc.two_pa += Number(p.two_pa ?? 0);
      acc.three_pm += Number(p.three_pm ?? 0);
      acc.three_pa += Number(p.three_pa ?? 0);
      acc.ftm += Number(p.ftm ?? 0);
      acc.fta += Number(p.fta ?? 0);
      const oreb = Number(p.oreb ?? 0);
      const dreb = Number(p.dreb ?? 0);
      acc.oreb += oreb;
      acc.dreb += dreb;
      acc.reb += Number(p.reb ?? (oreb + dreb));
      acc.ast += Number(p.ast ?? 0);
      acc.tov += Number(p.tov ?? 0);
      acc.stl += Number(p.stl ?? 0);
      acc.blk += Number(p.blk ?? 0);
      acc.pf += Number(p.pf ?? 0);
      acc.fouls_committed += Number(p.fouls_committed ?? 0);
      acc.fouls_drawn += Number(p.fouls_drawn ?? 0);
      acc.plusMinus += Number(p.plusMinus ?? 0);
      return acc;
    },
    {
      pts: 0, fgm: 0, fga: 0, two_pm: 0, two_pa: 0,
      three_pm: 0, three_pa: 0, ftm: 0, fta: 0,
      oreb: 0, dreb: 0, reb: 0, ast: 0, tov: 0,
      stl: 0, blk: 0, pf: 0, fouls_committed: 0,
      fouls_drawn: 0, plusMinus: 0,
    }
  );
};

export const parseFinalScore = (score?: string) => {
  if (!score) return null;
  const match = score.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!match) return null;
  return { a: Number(match[1]), b: Number(match[2]) };
};

export const normalizeFiveMinute = (input?: Game['fiveMinute']) => {
  if (!input || input.length === 0) {
    return Array.from({ length: 8 }).map((_, i) => ({
      label: `${i * 5}-${i * 5 + 5}`,
      home: 0,
      away: 0,
    }));
  }
  if (input[0]?.label) return input as { label: string; home: number; away: number }[];
  const byTeam = new Map<string, number[]>();
  input.forEach((row: any) => {
    if (row.team && Array.isArray(row.points)) byTeam.set(row.team, row.points);
  });
  const teams = [...byTeam.keys()];
  if (teams.length >= 2) {
    const a = byTeam.get(teams[0]) || [];
    const b = byTeam.get(teams[1]) || [];
    return a.map((home, idx) => ({
      label: `${idx * 5}-${idx * 5 + 5}`,
      home,
      away: b[idx] ?? 0,
    }));
  }
  return Array.from({ length: 8 }).map((_, i) => ({
    label: `${i * 5}-${i * 5 + 5}`,
    home: 0,
    away: 0,
  }));
};

export const computeValidation = (game: Game): ValidationResult => {
  const homeTeam = game.teams.find((t) => t.isBekapaka) || game.teams[0];
  const awayTeam = game.teams.find((t) => !t.isBekapaka) || game.teams[1];
  const homeTotals = homeTeam ? sumTeamTotals(homeTeam) : null;
  const awayTotals = awayTeam ? sumTeamTotals(awayTeam) : null;
  const quartersHome = game.quarters.reduce((s, q) => s + (Number(q.home) || 0), 0);
  const quartersAway = game.quarters.reduce((s, q) => s + (Number(q.away) || 0), 0);
  const score = parseFinalScore(game.finalScore);
  const issues: string[] = [];
  const scoreMismatch =
    !!(score && homeTotals && awayTotals && (homeTotals.pts !== score.a || awayTotals.pts !== score.b));
  const quartersMismatch = !!(score && (quartersHome !== score.a || quartersAway !== score.b));
  const fiveMinRows = normalizeFiveMinute(game.fiveMinute);
  const fiveMinHome = fiveMinRows.reduce((s, r) => s + (Number(r.home) || 0), 0);
  const fiveMinAway = fiveMinRows.reduce((s, r) => s + (Number(r.away) || 0), 0);
  const fiveMinQuarters = [
    (Number(fiveMinRows[0]?.home) || 0) + (Number(fiveMinRows[1]?.home) || 0),
    (Number(fiveMinRows[2]?.home) || 0) + (Number(fiveMinRows[3]?.home) || 0),
    (Number(fiveMinRows[4]?.home) || 0) + (Number(fiveMinRows[5]?.home) || 0),
    (Number(fiveMinRows[6]?.home) || 0) + (Number(fiveMinRows[7]?.home) || 0),
  ];
  const fiveMinQuartersAway = [
    (Number(fiveMinRows[0]?.away) || 0) + (Number(fiveMinRows[1]?.away) || 0),
    (Number(fiveMinRows[2]?.away) || 0) + (Number(fiveMinRows[3]?.away) || 0),
    (Number(fiveMinRows[4]?.away) || 0) + (Number(fiveMinRows[5]?.away) || 0),
    (Number(fiveMinRows[6]?.away) || 0) + (Number(fiveMinRows[7]?.away) || 0),
  ];
  const anyFiveMin = fiveMinRows.some((r) => Number(r.home) || Number(r.away));
  const quarterMismatchIndices = game.quarters.map((q, idx) => {
    if (!anyFiveMin) return false;
    const homeOk = Number(q.home) === fiveMinQuarters[idx];
    const awayOk = Number(q.away) === fiveMinQuartersAway[idx];
    return !(homeOk && awayOk);
  });
  const fiveMinMismatch = !!(score && (fiveMinHome !== score.a || fiveMinAway !== score.b));
  const boxscoreVsQuartersMismatch =
    !!(homeTotals && awayTotals && (homeTotals.pts !== quartersHome || awayTotals.pts !== quartersAway));

  const homeTotalsMismatch =
    !!(homeTotals && (homeTotals.fgm !== homeTotals.two_pm + homeTotals.three_pm ||
      homeTotals.fga !== homeTotals.two_pa + homeTotals.three_pa ||
      homeTotals.two_pm > homeTotals.two_pa ||
      homeTotals.three_pm > homeTotals.three_pa ||
      homeTotals.ftm > homeTotals.fta));
  const awayTotalsMismatch =
    !!(awayTotals && (awayTotals.fgm !== awayTotals.two_pm + awayTotals.three_pm ||
      awayTotals.fga !== awayTotals.two_pa + awayTotals.three_pa ||
      awayTotals.two_pm > awayTotals.two_pa ||
      awayTotals.three_pm > awayTotals.three_pa ||
      awayTotals.ftm > awayTotals.fta));

  if (homeTotals && awayTotals && score && scoreMismatch) {
    issues.push(
      `Suma punktów z boxscore (${homeTotals.pts}-${awayTotals.pts}) nie zgadza się z wynikiem (${score.a}-${score.b}).`
    );
  }
  if (score && quartersMismatch) {
    issues.push(
      `Suma kwart (${quartersHome}-${quartersAway}) nie zgadza się z wynikiem (${score.a}-${score.b}).`
    );
  }
  if (score && fiveMinMismatch) {
    issues.push(
      `Suma 5-min (${fiveMinHome}-${fiveMinAway}) nie zgadza się z wynikiem (${score.a}-${score.b}).`
    );
  }
  if (homeTotals && awayTotals && boxscoreVsQuartersMismatch) {
    issues.push(
      `Suma boxscore (${homeTotals.pts}-${awayTotals.pts}) nie zgadza się z sumą kwart (${quartersHome}-${quartersAway}).`
    );
  }
  if (homeTotalsMismatch || awayTotalsMismatch) {
    issues.push('Niespójne sumy C/W w wierszu „W sumie".');
  }
  return {
    issues,
    scoreMismatch,
    quartersMismatch,
    fiveMinMismatch,
    boxscoreVsQuartersMismatch,
    quarterMismatchIndices,
    homeTotalsMismatch,
    awayTotalsMismatch,
  };
};

export const createEmptyGame = (): Game => ({
  id: `draft-${Date.now()}`,
  league: 'atom WEBSKA BASKET LIGA - II D - RZ',
  date: '',
  time: '',
  venue: 'Koszalin',
  finalScore: '',
  opponent: '',
  homeAway: 'home',
  quarters: [
    { label: '1', home: 0, away: 0 },
    { label: '2', home: 0, away: 0 },
    { label: '3', home: 0, away: 0 },
    { label: '4', home: 0, away: 0 },
  ],
  teams: [
    {
      id: 'BB',
      name: 'BEKAPAKA BOBOLICE',
      isBekapaka: true,
      isHome: true,
      players: Array.from({ length: 12 }).map((_, idx) => ({
        id: `bb-${idx + 1}`,
        number: '',
        name: '',
        min: '',
      })),
    },
    {
      id: 'OP',
      name: 'RYWAL',
      isBekapaka: false,
      isHome: false,
      players: Array.from({ length: 12 }).map((_, idx) => ({
        id: `op-${idx + 1}`,
        number: '',
        name: '',
        min: '',
      })),
    },
  ],
  fiveMinute: Array.from({ length: 8 }).map((_, i) => ({
    label: `${i * 5}-${i * 5 + 5}`,
    home: 0,
    away: 0,
  })),
  teamStats: {
    'Punkty po stratach': { home: 0, away: 0 },
    'Punkty spod kosza': { home: 0, away: 0 },
    'Punkty drugiej szansy': { home: 0, away: 0 },
    'Punkty po szybkim ataku': { home: 0, away: 0 },
    'Punkty zmienników': { home: 0, away: 0 },
  },
  runs: {
    maxLead: '',
    maxRun: '',
    leadChanges: '',
    ties: '',
    timeLeading: '',
  },
});
