import { generateGameInsights } from '../insights.js';
import { hashGameForAi } from '../ai/buildMatchContext.js';
import { enrichKalkTeamStats, gameViewFromKalkMatch, isBekapakaTeamName } from './parseMatchBoxScore.js';

/**
 * @param {import('@prisma/client').KalkMatch} km
 */
export function kalkMatchToGameDetail(km) {
  const boxScore = km.boxScore;
  const parsed = {
    id: km.id,
    matchId: km.id,
    slug: km.slug,
    date: km.date,
    dateRaw: km.date?.toISOString?.() || km.date,
    homeTeamName: km.homeTeamName,
    guestTeamName: km.guestTeamName,
    scoreHome: km.scoreHome,
    scoreAway: km.scoreAway,
    roundCode: km.roundCode,
    referees: km.referees,
    statistician: km.statistician,
    boxScore
  };

  const view = gameViewFromKalkMatch(parsed, km.seasonId);
  const teams = view.teams || view.teamStats || [];
  const bekapaka = teams.find((t) => t.isBekapaka) || teams[0];
  const opponent = teams.find((t) => !t.isBekapaka) || teams[1];
  const oppPtsForBekapaka = opponent?.pts ?? view.scoreThem ?? 0;
  const oppPtsForOpponent = bekapaka?.pts ?? view.scoreUs ?? 0;

  if (bekapaka) {
    Object.assign(bekapaka, enrichKalkTeamStats(bekapaka, oppPtsForBekapaka));
    view.insights = generateGameInsights(view, bekapaka.fourFactors, opponent);
  }
  if (opponent) {
    Object.assign(opponent, enrichKalkTeamStats(opponent, oppPtsForOpponent));
  }

  view.teams = teams;
  view.teamStats = teams;
  view.dataSource = 'kalk';
  view.kalkMatchId = km.id;
  view.isFromKalkMatch = true;

  if (km.aiSummary && km.aiSummaryHash) {
    view.aiSummary = km.aiSummary;
    view.aiSummaryAt = km.aiSummaryAt;
    view.aiSummaryModel = km.aiSummaryModel;
    view.aiSummaryHash = km.aiSummaryHash;
    const currentHash = hashGameForAi(view);
    view.aiSummaryStale = Boolean(currentHash && currentHash !== km.aiSummaryHash);
  }

  return view;
}

/**
 * @param {import('@prisma/client').KalkMatch} km
 */
export function kalkMatchToListItem(km) {
  const isHome = isBekapakaTeamName(km.homeTeamName);
  const opponent = isHome ? km.guestTeamName : km.homeTeamName;
  const scoreUs = isHome ? km.scoreHome : km.scoreAway;
  const scoreThem = isHome ? km.scoreAway : km.scoreHome;
  let result = null;
  if (km.isFinished && scoreUs != null && scoreThem != null) {
    result = scoreUs > scoreThem ? 'W' : scoreThem > scoreUs ? 'L' : null;
  }

  return {
    id: km.id,
    date: km.date.toISOString(),
    opponent,
    result,
    scoreUs,
    scoreThem,
    homeAway: isHome ? 'home' : 'away',
    dataSource: 'kalk',
    isFromKalkMatch: true,
    roundCode: km.roundCode
  };
}
