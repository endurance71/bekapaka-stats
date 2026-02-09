export function calcEFG(fgm, fga, threePm) {
  if (!fga) return 0;
  return (fgm + 0.5 * threePm) / fga;
}

export function calcTS(pts, fga, fta) {
  const denom = fga + 0.44 * fta;
  if (!denom) return 0;
  return (0.5 * pts) / denom;
}

export function calcTOVPct(tov, fga, fta) {
  const denom = fga + 0.44 * fta + tov;
  if (!denom) return 0;
  return tov / denom;
}

export function calcFTRate(fta, fga) {
  if (!fga) return 0;
  return fta / fga;
}

export function calcPossessions(fga, fta, tov, orb) {
  // Basic possession formula: FGA + 0.44 * FTA + TOV - ORB
  return (fga || 0) + 0.44 * (fta || 0) + (tov || 0) - (orb || 0);
}

export function calcOffRtg(pts, possessions) {
  if (!possessions) return 0;
  return (pts / possessions) * 100;
}

export function calcDefRtg(oppPts, possessions) {
  if (!possessions) return 0;
  return (oppPts / possessions) * 100;
}

export function calcNetRtg(offRtg, defRtg) {
  return offRtg - defRtg;
}

export function calcPace(possessions, minutes) {
  if (!minutes) return 0;
  // Pace normalized to 40 minutes (FIBA)
  return (possessions / minutes) * 40;
}

export function round1(value) {
  return Math.round(value * 10) / 10;
}

export function round3(value) {
  return Math.round(value * 1000) / 1000;
}

export function withShootingMetrics(statLine) {
  const { fgm, fga, three_pm, fta, pts, tov, orb, min, opp_pts } = statLine;
  const possessions = calcPossessions(fga, fta, tov, orb);
  const offRtg = calcOffRtg(pts, possessions);
  
  const result = {
    efg: round3(calcEFG(fgm, fga, three_pm)),
    ts: round3(calcTS(pts, fga, fta)),
    tovPct: round3(calcTOVPct(tov, fga, fta)),
    ftRate: round3(calcFTRate(fta, fga)),
    possessions: round1(possessions),
    offRtg: round1(offRtg)
  };

  if (min) {
    result.pace = round1(calcPace(possessions, parseMinutes(min)));
  }

  if (opp_pts !== undefined && opp_pts !== null) {
    const defRtg = calcDefRtg(opp_pts, possessions);
    result.defRtg = round1(defRtg);
    result.netRtg = round1(calcNetRtg(offRtg, defRtg));
  }

  return result;
}

function parseMinutes(minStr) {
  if (!minStr) return 0;
  if (typeof minStr === 'number') return minStr;
  const parts = minStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60;
  }
  return parseFloat(minStr) || 0;
}
