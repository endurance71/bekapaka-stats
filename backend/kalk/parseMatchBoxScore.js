import { createHash } from 'crypto';
import { withShootingMetrics } from '../metrics.js';

const BEKAPAKA_KEYWORDS = ['bekapaka', 'bobolice'];

/**
 * @param {string} value
 */
export function parseCoAtt(value) {
  if (!value || typeof value !== 'string') {
    return { made: 0, att: 0 };
  }
  const cleaned = value.replace(/\s+/g, ' ').trim();
  const parts = cleaned.split('/');
  if (parts.length !== 2) {
    const num = parseInt(cleaned, 10);
    return { made: Number.isFinite(num) ? num : 0, att: 0 };
  }
  return {
    made: parseInt(parts[0].trim(), 10) || 0,
    att: parseInt(parts[1].trim(), 10) || 0
  };
}

/**
 * @param {string} text
 */
function parseIntCell(text) {
  if (text == null) return 0;
  const cleaned = String(text).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const match = cleaned.match(/-?\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * @param {string} htmlCell
 */
function stripCell(htmlCell) {
  return String(htmlCell || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} nameCell
 */
function extractPlayerFromNameCell(nameCell) {
  const linkMatch = nameCell.match(/href="[^"]*zawodnik,([^,]+),(\d+),/i);
  const text = stripCell(nameCell);
  return {
    name: text,
    kalkPlayerSlug: linkMatch?.[1] || null,
    kalkPlayerNumericId: linkMatch?.[2] || null
  };
}

/**
 * @param {string[]} cells — 24 kolumny danych (bez nagłówka)
 */
export function parsePlayerRow(cells) {
  const nameCell = cells[1] || '';
  const identity = extractPlayerFromNameCell(nameCell);
  const two = parseCoAtt(stripCell(cells[5]));
  const three = parseCoAtt(stripCell(cells[7]));
  const fg = parseCoAtt(stripCell(cells[9]));
  const ft = parseCoAtt(stripCell(cells[11]));

  return {
    ...identity,
    number: parseIntCell(cells[0]),
    starter: stripCell(cells[2]) === '*',
    pts: parseIntCell(cells[3]),
    min: stripCell(cells[4]),
    two_pm: two.made,
    two_pa: two.att,
    three_pm: three.made,
    three_pa: three.att,
    fgm: fg.made,
    fga: fg.att,
    ftm: ft.made,
    fta: ft.att,
    orb: parseIntCell(cells[13]),
    drb: parseIntCell(cells[14]),
    reb: parseIntCell(cells[15]),
    ast: parseIntCell(cells[16]),
    pf: parseIntCell(cells[17]),
    pfDrawn: parseIntCell(cells[18]),
    tov: parseIntCell(cells[19]),
    stl: parseIntCell(cells[20]),
    blk: parseIntCell(cells[21]),
    plusMinus: parseIntCell(cells[22]),
    eval: parseIntCell(cells[23]),
    three_pm_legacy: three.made,
    three_pa_legacy: three.att
  };
}

/**
 * @param {object[]} players
 * @param {number} oppPts
 */
export function aggregateTeamFromPlayers(players, oppPts = 0) {
  const totals = players.reduce(
    (acc, p) => {
      acc.pts += p.pts || 0;
      acc.fgm += p.fgm || 0;
      acc.fga += p.fga || 0;
      acc.three_pm += p.three_pm || 0;
      acc.three_pa += p.three_pa || 0;
      acc.ftm += p.ftm || 0;
      acc.fta += p.fta || 0;
      acc.tov += p.tov || 0;
      acc.orb += p.orb || 0;
      acc.drb += p.drb || 0;
      acc.ast += p.ast || 0;
      acc.reb += p.reb || 0;
      acc.stl += p.stl || 0;
      acc.blk += p.blk || 0;
      return acc;
    },
    {
      pts: 0,
      fgm: 0,
      fga: 0,
      three_pm: 0,
      three_pa: 0,
      ftm: 0,
      fta: 0,
      tov: 0,
      orb: 0,
      drb: 0,
      ast: 0,
      reb: 0,
      stl: 0,
      blk: 0
    }
  );

  const fourFactors = {
    ...totals,
    ...withShootingMetrics({ ...totals, opp_pts: oppPts })
  };

  return {
    players,
    pts: totals.pts,
    fourFactors
  };
}

/**
 * Uzupełnia statystyki drużyny z box score (sumy z zawodników + four factors).
 * @param {object | null | undefined} team
 * @param {number} [oppPts]
 */
export function enrichKalkTeamStats(team, oppPts = 0) {
  if (!team) return team;
  const players = team.players || [];
  const agg = players.length ? aggregateTeamFromPlayers(players, oppPts) : null;
  const existingFf = team.fourFactors && typeof team.fourFactors === 'object' ? team.fourFactors : {};
  const hasBoxTotals = (existingFf.fga ?? team.fga ?? 0) > 0;

  const totals = hasBoxTotals
    ? {
        pts: team.pts ?? existingFf.pts ?? 0,
        fgm: team.fgm ?? existingFf.fgm ?? 0,
        fga: team.fga ?? existingFf.fga ?? 0,
        three_pm: team.three_pm ?? existingFf.three_pm ?? 0,
        three_pa: team.three_pa ?? existingFf.three_pa ?? 0,
        ftm: team.ftm ?? existingFf.ftm ?? 0,
        fta: team.fta ?? existingFf.fta ?? 0,
        tov: team.tov ?? existingFf.tov ?? 0,
        orb: team.orb ?? existingFf.orb ?? 0,
        drb: team.drb ?? existingFf.drb ?? 0,
        ast: team.ast ?? existingFf.ast ?? 0,
        reb: team.reb ?? existingFf.reb ?? 0,
        stl: team.stl ?? existingFf.stl ?? 0,
        blk: team.blk ?? existingFf.blk ?? 0
      }
    : agg
      ? {
          pts: team.pts ?? agg.pts,
          fgm: agg.fourFactors.fgm,
          fga: agg.fourFactors.fga,
          three_pm: agg.fourFactors.three_pm,
          three_pa: agg.fourFactors.three_pa,
          ftm: agg.fourFactors.ftm,
          fta: agg.fourFactors.fta,
          tov: agg.fourFactors.tov,
          orb: agg.fourFactors.orb,
          drb: agg.fourFactors.drb,
          ast: agg.fourFactors.ast,
          reb: agg.fourFactors.reb,
          stl: agg.fourFactors.stl,
          blk: agg.fourFactors.blk
        }
      : { pts: team.pts ?? 0 };

  const fourFactors = {
    ...existingFf,
    ...withShootingMetrics({ ...totals, opp_pts: oppPts, min: existingFf.min || team.min || '40:00' })
  };

  return {
    ...team,
    ...totals,
    fourFactors
  };
}

/**
 * Parsuje linię kwart z KALK, np. `(15:18; 17:18; 23:11; 7:15;)`.
 * @param {string | null | undefined} raw
 * @returns {{ label: string, home: number, away: number }[]}
 */
export function parseQuartersFromRaw(raw) {
  if (!raw || typeof raw !== 'string') return [];

  const inner = raw.replace(/^\(+|\)+$/g, '').trim();
  if (!inner) return [];

  const parts = inner.split(';').map((p) => p.trim()).filter(Boolean);
  const quarters = [];

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const scoreMatch = part.match(/(\d{1,3})\s*:\s*(\d{1,3})/);
    if (!scoreMatch) continue;
    const home = parseInt(scoreMatch[1], 10);
    const away = parseInt(scoreMatch[2], 10);
    if (Number.isNaN(home) || Number.isNaN(away)) continue;
    quarters.push({
      label: `Q${quarters.length + 1}`,
      home,
      away
    });
  }

  return quarters;
}

/**
 * Kwarty z perspektywy BeKaPaKa (home/away względem naszej drużyny).
 * @param {object} parsed
 * @param {boolean} isHome — czy BeKaPaKa grała u siebie w tym meczu
 */
export function quartersForBekapakaView(parsed, isHome) {
  const box = parsed.boxScore || parsed;
  const fromMeta = parseQuartersFromRaw(box.meta?.quartersRaw);
  const fromBox = Array.isArray(box.quarters) ? box.quarters : [];
  const source = fromBox.length ? fromBox : fromMeta;
  if (!source.length) return [];

  return source.map((q, idx) => {
    const home = Number(q.home) || 0;
    const away = Number(q.away) || 0;
    return {
      label: q.label || `Q${idx + 1}`,
      home: isHome ? home : away,
      away: isHome ? away : home
    };
  });
}

/**
 * @param {string} teamName
 */
export function isBekapakaTeamName(teamName) {
  const n = (teamName || '').toLowerCase();
  return BEKAPAKA_KEYWORDS.some((k) => n.includes(k));
}

/**
 * @param {string} tableHtml
 * @param {string} teamName
 */
function parseTeamTable(tableHtml, teamName) {
  const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const players = [];

  for (const row of rows) {
    const rowHtml = row[1];
    if (/colspan="3">\s*Drużyna/i.test(rowHtml)) continue;
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
    if (cells.length < 20) continue;
    const label = stripCell(cells[1]);
    if (label === 'SUMY' || label === 'Drużyna') continue;
    if (!/\d/.test(stripCell(cells[0])) && !/<a\s/i.test(cells[1])) continue;
    players.push(parsePlayerRow(cells));
  }

  return { name: teamName, players };
}

/**
 * @param {string} html
 */
export function parseMatchHtml(html) {
  const meta = {};

  const roundMatch = html.match(/RZ\s*-\s*(\d+)/i);
  if (roundMatch) meta.roundCode = `RZ-${roundMatch[1]}`;

  const matchNumMatch = html.match(/numer meczu[^<]*<\/i>\s*(\d+)/i);
  if (matchNumMatch) meta.matchNumber = parseInt(matchNumMatch[1], 10);

  const dateMatch = html.match(/fa-calendar[^>]*>[^<]*<\/[^>]+>\s*([\d-]{10}[\d:\s-]*)/i)
    || html.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
  if (dateMatch) meta.dateRaw = dateMatch[1].trim();

  const refMatch = html.match(/Sędziowie:\s*([^<]+)/i);
  if (refMatch) meta.referees = refMatch[1].trim();

  const statMatch = html.match(/Statystyk:\s*([^.<]+)/i);
  if (statMatch) meta.statistician = statMatch[1].trim();

  const slugMatch = html.match(/mecz,([^,]+),(\d+),/i);
  const matchId = slugMatch?.[2] || null;
  const slug = slugMatch?.[1] || null;

  const teamBlocks = [...html.matchAll(/<h3>([^<]+)<\/h3>[\s\S]*?<table>([\s\S]*?)<\/table>/gi)];
  const teams = teamBlocks.map((block) => parseTeamTable(block[2], stripCell(block[1])));

  if (teams.length < 2) {
    throw new Error('Nie znaleziono dwóch tabel drużyn w HTML meczu KALK');
  }

  const scoreHeader = html.match(/<h1>\s*(\d{1,3})\s*:\s*(\d{1,3})\s*<\/h1>/i);
  const scoreHome = scoreHeader ? parseInt(scoreHeader[1], 10) : null;
  const scoreAway = scoreHeader ? parseInt(scoreHeader[2], 10) : null;

  const quarterLine = html.match(/\((\d{1,2}:\d{1,2};\s*){2,}/);
  if (quarterLine) {
    meta.quartersRaw = quarterLine[0];
    const quarters = parseQuartersFromRaw(quarterLine[0]);
    if (quarters.length) meta.quarters = quarters;
  }

  const home = teams[0];
  const guest = teams[1];
  home.isBekapaka = isBekapakaTeamName(home.name);
  guest.isBekapaka = isBekapakaTeamName(guest.name);

  const homePts = scoreHome ?? home.players.reduce((s, p) => s + (p.pts || 0), 0);
  const guestPts = scoreAway ?? guest.players.reduce((s, p) => s + (p.pts || 0), 0);

  const homeAgg = aggregateTeamFromPlayers(home.players, guestPts);
  const guestAgg = aggregateTeamFromPlayers(guest.players, homePts);

  const boxScore = {
    teams: [
      {
        name: home.name,
        isBekapaka: home.isBekapaka,
        players: homeAgg.players,
        pts: homePts,
        fourFactors: homeAgg.fourFactors
      },
      {
        name: guest.name,
        isBekapaka: guest.isBekapaka,
        players: guestAgg.players,
        pts: guestPts,
        fourFactors: guestAgg.fourFactors
      }
    ],
    meta
  };

  return {
    matchId,
    slug,
    boxScore,
    homeTeamName: home.name,
    guestTeamName: guest.name,
    scoreHome: homePts,
    scoreAway: guestPts,
    isFinished: homePts != null && guestPts != null
  };
}

/**
 * Struktura LeagueMatch.details (kompatybilność getOpponentAdvancedStats).
 * @param {object} boxScore
 */
export function boxScoreToLeagueDetails(boxScore) {
  return {
    source: 'kalk',
    teams: (boxScore?.teams || []).map((t) => ({
      name: t.name,
      isBekapaka: t.isBekapaka,
      players: t.players,
      fourFactors: t.fourFactors,
      pts: t.pts
    }))
  };
}

/**
 * @param {object} parsed — wynik parseMatchHtml lub JSON ze scrapera
 */
export function gameViewFromKalkMatch(parsed, seasonId) {
  const box = parsed.boxScore || parsed;
  const teams = box.teams || [];
  const bekapaka = teams.find((t) => t.isBekapaka) || teams[0];
  const opponent = teams.find((t) => !t.isBekapaka) || teams[1];
  const isHome = bekapaka?.name === parsed.homeTeamName;

  const scoreUs = isHome ? parsed.scoreHome : parsed.scoreAway;
  const scoreThem = isHome ? parsed.scoreAway : parsed.scoreHome;
  let result = null;
  if (scoreUs != null && scoreThem != null) {
    if (scoreUs > scoreThem) result = 'W';
    else if (scoreUs < scoreThem) result = 'L';
  }

  const quarters = quartersForBekapakaView(parsed, Boolean(isHome));

  return {
    id: parsed.matchId || parsed.id,
    dataSource: 'kalk',
    seasonId,
    date: parsed.date || parsed.dateRaw,
    opponent: opponent?.name || parsed.guestTeamName,
    homeAway: isHome ? 'home' : 'away',
    result,
    scoreUs,
    scoreThem,
    teamStats: teams,
    teams,
    playerStats: (bekapaka?.players || []).concat(opponent?.players || []),
    kalkMatchId: parsed.matchId || parsed.id,
    roundCode: parsed.roundCode || box.meta?.roundCode,
    referees: parsed.referees || box.meta?.referees,
    statistician: parsed.statistician || box.meta?.statistician,
    quarters,
    hasBoxScore: (bekapaka?.players?.length ?? 0) > 0
  };
}

/**
 * @param {object} payload
 */
export function hashBoxScore(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/**
 * @param {object} row — wiersz „mecz po meczu” ze scrapera
 */
export function normalizePlayerGameLogRow(row) {
  const two = parseCoAtt(row.two_pt || row.twoPt);
  const three = parseCoAtt(row.three_pt || row.threePt);
  const fg = parseCoAtt(row.fg);
  const ft = parseCoAtt(row.ft);

  return {
    opponent: row.opponent || row.opponentName,
    matchUrl: row.match_url || row.matchUrl,
    kalkMatchId: row.kalk_match_id || row.kalkMatchId,
    scoreLabel: row.score || row.scoreLabel,
    min: row.min,
    pts: row.pts,
    two_pm: two.made,
    two_pa: two.att,
    three_pm: three.made,
    three_pa: three.att,
    fgm: fg.made,
    fga: fg.att,
    ftm: ft.made,
    fta: ft.att,
    orb: row.orb,
    drb: row.drb,
    reb: row.reb,
    ast: row.ast,
    pf: row.pf,
    tov: row.tov ?? row.s,
    stl: row.stl ?? row.p,
    blk: row.blk ?? row.b,
    plusMinus: row.plusMinus ?? row.plus_minus,
    eval: row.eval
  };
}
