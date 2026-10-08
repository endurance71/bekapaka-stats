/** Typy odpowiedzi KALK v2: GET /api/games/:id/info i /play-by-play (backend/kalk/v2/readModels.js). */

export type Side = 'home' | 'away';

export interface MatchSideTeam {
    name: string;
    teamKalkId: string | null;
    isBekapaka: boolean;
    score: number | null;
}

export interface PbpEvent {
    seq: number;
    period: number;
    clockSec: number | null;
    side: Side | null;
    playerName: string | null;
    playerSlug: string | null;
    playerNumber: number | null;
    actionRaw: string;
    actionType: string;
    shotValue: number | null;
    made: boolean | null;
    reboundType: string | null;
    subOutNumber: number | null;
    scoreHome: number;
    scoreAway: number;
    isScoring: boolean;
}

export interface PbpRun {
    side: Side;
    points: number;
    startSeq: number;
    endSeq: number;
    period: number;
    endPeriod: number;
    fromScore: { home: number; away: number };
    toScore: { home: number; away: number };
}

export interface PlayByPlayResponse {
    matchId: string;
    seasonId: string;
    available: boolean;
    home: MatchSideTeam;
    away: MatchSideTeam;
    bekapakaSide: Side | null;
    events: PbpEvent[];
    periods: { period: number; label: string; scoreHome: number; scoreAway: number }[];
    runs: PbpRun[];
    leadChanges: number;
    ties: number;
    largestLead: { home: number; away: number };
    largestRun: { home: number; away: number };
}

export interface LeaderEntry {
    slug?: string | null;
    name: string;
    teamKalkId?: string | null;
    value: number;
    side: Side | null;
}

export interface PointsSources {
    ptsOffTurnovers: number | null;
    ptsInPaint: number | null;
    secondChancePts: number | null;
    fastBreakPts: number | null;
}

export interface TeamGameStat {
    side: Side;
    teamName: string;
    pts: number;
    fgm: number;
    fga: number;
    twoPm: number;
    twoPa: number;
    threePm: number;
    threePa: number;
    ftm: number;
    fta: number;
    orb: number;
    drb: number;
    reb: number;
    ast: number;
    stl: number;
    tov: number;
    pf: number;
    blk: number;
    eval: number;
    startersPts: number | null;
    benchPts: number | null;
    ptsOffTurnovers: number | null;
    ptsInPaint: number | null;
    secondChancePts: number | null;
    fastBreakPts: number | null;
}

export interface RecordEntry {
    value: number;
    players: { name: string; slug: string | null; number: number | null }[];
}

export type RecordKey = 'pts' | 'reb' | 'ast' | 'stl' | 'blk' | 'eval';

export interface H2hMeeting {
    matchId: string;
    seasonId: string;
    date: string;
    homeTeamName: string;
    guestTeamName: string;
    scoreHome: number;
    scoreAway: number;
    stageLabel: string | null;
    roundLabel: string | null;
    focusAtHome: boolean;
    focusScore: number;
    otherScore: number;
    focusWon: boolean;
}

export interface GameInfoResponse {
    matchId: string;
    seasonId: string;
    home: MatchSideTeam;
    away: MatchSideTeam;
    bekapakaSide: Side | null;
    stageLabel: string | null;
    roundLabel: string | null;
    venue: string | null;
    city: string | null;
    startsAtUtc: string | null;
    date: string;
    overtimes: number;
    hasPlayByPlay: boolean;
    sectionsAvailable: string[];
    mvp: {
        slug?: string | null;
        name: string | null;
        number?: number | null;
        eval?: number | null;
        side: Side | null;
        teamName?: string;
        line?: { pts: number | null; reb: number | null; ast: number | null; eval: number | null };
    } | null;
    referees: string[];
    commissioner: string | null;
    statistician: string | null;
    leaders: Partial<Record<'pts' | 'reb' | 'ast' | 'eval', LeaderEntry[]>>;
    flow5: { minute: number; home: number; away: number }[];
    quarters: { period: number; label: string; home: number; away: number }[];
    pointsSources: { home: PointsSources | null; away: PointsSources | null } | null;
    teamStats: { home: TeamGameStat | null; away: TeamGameStat | null };
    h2h: {
        focusSide: Side;
        focusTeam: string;
        otherTeam: string;
        games: number;
        focusWins: number;
        otherWins: number;
        meetings: H2hMeeting[];
    };
    records: Record<Side, Partial<Record<RecordKey, RecordEntry | null>>>;
}

/** Strona „nasza” (lewa kolumna): BeKaPaKa, a gdy nie gra — gospodarz. */
export function leftSideOf(bekapakaSide: Side | null): Side {
    return bekapakaSide === 'away' ? 'away' : 'home';
}

export function otherSide(side: Side): Side {
    return side === 'home' ? 'away' : 'home';
}

/** „BeKaPaKa Bobolice” → „BeKaPaKa” (krótko w nagłówkach porównań). */
export function shortTeamName(name: string): string {
    return (name || '').replace(/\s+bobolice$/i, '');
}
