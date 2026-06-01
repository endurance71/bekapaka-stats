export type Player = {
  id: string;
  name: string;
  min?: string;
  number?: string;
  two_pm?: number;
  two_pa?: number;
  three_pm?: number;
  three_pa?: number;
  ftm?: number;
  fta?: number;
  oreb?: number;
  dreb?: number;
  reb?: number;
  ast?: number;
  tov?: number;
  stl?: number;
  blk?: number;
  pf?: number;
  fouls_committed?: number;
  fouls_drawn?: number;
  plusMinus?: number;
  pts?: number;
  fgm?: number;
  fga?: number;
};

export type Team = {
  id: string;
  name: string;
  isBekapaka?: boolean;
  isHome?: boolean;
  players: Player[];
  points_in_paint?: number;
  points_from_turnover?: number;
  points_second_chance?: number;
  points_fast_break?: number;
  biggest_run?: number;
  biggest_lead?: number;
};

export type Game = {
  id: string;
  league: string;
  date: string;
  time?: string;
  venue?: string;
  finalScore: string;
  opponent?: string;
  homeAway?: string;
  quarters: { label: string; home: number; away: number }[];
  teams: Team[];
  fiveMinute?: { label?: string; home?: number; away?: number; team?: string; points?: number[] }[];
  teamStats?: Record<string, { home?: number; away?: number }>;
  runs?: Record<string, any>;
  warning?: string;
};

export type StatKey =
  | 'min'
  | 'two_pm'
  | 'two_pa'
  | 'three_pm'
  | 'three_pa'
  | 'ftm'
  | 'fta'
  | 'oreb'
  | 'dreb'
  | 'reb'
  | 'ast'
  | 'tov'
  | 'stl'
  | 'blk'
  | 'pf'
  | 'fouls_committed'
  | 'fouls_drawn'
  | 'plusMinus'
  | 'pts';

export type ValidationResult = {
  issues: string[];
  scoreMismatch: boolean;
  quartersMismatch: boolean;
  fiveMinMismatch: boolean;
  boxscoreVsQuartersMismatch: boolean;
  quarterMismatchIndices: boolean[];
  homeTotalsMismatch: boolean;
  awayTotalsMismatch: boolean;
};

export type TeamTotals = {
  pts: number;
  fgm: number;
  fga: number;
  two_pm: number;
  two_pa: number;
  three_pm: number;
  three_pa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  tov: number;
  stl: number;
  blk: number;
  pf: number;
  fouls_committed: number;
  fouls_drawn: number;
  plusMinus: number;
};
