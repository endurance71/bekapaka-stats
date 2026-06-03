import { generateGameInsights } from '../insights.js';
import { withShootingMetrics } from '../metrics.js';
import { hashGameForAi } from '../ai/buildMatchContext.js';
import { gameViewFromKalkMatch, isBekapakaTeamName } from './parseMatchBoxScore.js';

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

  if (bekapaka) {
    const source = bekapaka.fourFactors || bekapaka;
    const oppPts = opponent?.pts ?? opponent?.fourFactors?.pts ?? view.scoreThem ?? 0;
    let statsForMetrics = {
      fgm: source.fgm || 0,
      fga: source.fga || 0,
      three_pm: source.three_pm || 0,
      fta: source.fta || 0,
      pts: source.pts || view.scoreUs || 0,
      tov: source.tov || source.turnovers || 0,
      orb: source.orb || source.oreb || 0,
      min: source.min || '40:00',
      opp_pts: oppPts
    };

    if (statsForMetrics.fga === 0 && bekapaka.players?.length) {
      for (const p of bekapaka.players) {
        statsForMetrics.fgm += p.fgm || 0;
        statsForMetrics.fga += p.fga || 0;
        statsForMetrics.three_pm += p.three_pm || 0;
        statsForMetrics.fta += p.fta || 0;
        statsForMetrics.pts += p.pts || 0;
        statsForMetrics.tov += p.tov || 0;
        statsForMetrics.orb += p.orb || 0;
      }
    }

    bekapaka.fourFactors = {
      ...(bekapaka.fourFactors || {}),
      ...withShootingMetrics(statsForMetrics)
    };

    view.insights = generateGameInsights(view, bekapaka.fourFactors, opponent);
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
