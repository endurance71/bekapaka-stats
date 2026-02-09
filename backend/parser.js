import { withShootingMetrics } from './metrics.js';

const TEAM_CODE_MAP = {
  BB: 'BeKaPaKa Bobolice',
  GT: 'Grubik Team',
  BC: 'BrdCrew',
  MW: 'Młode Wilki',
  AM: 'Atomówki',
  EBS: 'EMET Basket Szczecinek',
  PK: 'Politechnika',
  '100SIO.PL': '100SIO.PL'
};

const DEFAULT_VENUE = 'Koszalin';
const BEKAPAKA_NAME = 'BeKaPaKa Bobolice';

function parseJson(input) {
  return JSON.parse(input);
}

function normalizeText(value) {
  return value
    .replace(/[–—]/g, '-')
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (m) => ({ ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' }[m]))
    .replace(/[^\w\s/+.-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumber(value) {
  if (value === undefined || value === null) return null;
  const cleaned = value.toString().replace(',', '.').replace(/\s+/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

function parseRatio(value) {
  if (!value) return { made: null, att: null };
  const cleaned = value.toString().replace(/\s+/g, '');
  if (!cleaned.includes('/')) return { made: null, att: null };
  const [madeRaw, attRaw] = cleaned.split('/');
  const made = parseNumber(madeRaw);
  const att = parseNumber(attRaw);
  return { made, att };
}

function isSeparatorRow(cells) {
  return cells.every((c) => c.replace(/-/g, '').trim() === '');
}

function parsePipeTable(lines, startIndex) {
  const tableLines = [];
  let i = startIndex;
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    tableLines.push(lines[i]);
    i += 1;
  }
  const rows = tableLines.map((line) => {
    const parts = line.split('|').map((c) => c.trim());
    if (parts.length && parts[0] === '') parts.shift();
    if (parts.length && parts[parts.length - 1] === '') parts.pop();
    return parts;
  });
  const filtered = rows.filter((cells) => cells.length && !isSeparatorRow(cells));
  return { rows: filtered, endIndex: i };
}

function buildColumnLabels(headerRows) {
  const [row1, row2] = headerRows;
  const cols = [];
  const maxLen = Math.max(row1?.length || 0, row2?.length || 0);
  let lastGroup = '';
  for (let i = 0; i < maxLen; i += 1) {
    const group = row1?.[i] || '';
    if (group) lastGroup = group;
    const sub = row2?.[i] || '';
    const lowerLast = lastGroup.toLowerCase();
    const canInherit =
      lowerLast.includes('za 2') ||
      lowerLast.includes('za 3') ||
      lowerLast.includes('za 1') ||
      lowerLast.includes('za2') ||
      lowerLast.includes('za3') ||
      lowerLast.includes('za1');
    const inheritedGroup = group ? group : canInherit ? lastGroup : '';
    const label = `${inheritedGroup} ${sub}`.trim();
    cols.push(label || (group || sub || ''));
  }
  const normalized = cols.map((c) => normalizeText(c));
  const za2Count = normalized.filter((c) => c.includes('za 2')).length;
  const za1Indexes = normalized
    .map((c, idx) => (c.includes('za 1') ? idx : -1))
    .filter((idx) => idx >= 0);
  if (za2Count === 0 && za1Indexes.length >= 2) {
    const firstZa1 = za1Indexes[0];
    cols[firstZa1] = cols[firstZa1].replace(/Za 1/i, 'Za 2');
  }
  return cols;
}

function resolveColumnKeys(labels) {
  const normalized = labels.map((l) => normalizeText(l));
  const hasGroups = normalized.some((l) => l.includes('za 2') || l.includes('za2') || l.includes('za 3') || l.includes('za3') || l.includes('za 1') || l.includes('za1'));
  const cwIndices = normalized.map((l, idx) => (l === 'c/w' || l === 'cw' ? idx : -1)).filter((idx) => idx >= 0);

  const keys = labels.map((label, idx) => {
    const norm = normalized[idx];
    const rawLabel = label.toLowerCase();
    if (norm.includes('nr')) return 'number';
    if (norm.includes('nazwisko')) return 'name';
    if (norm === 'min') return 'min';

    if (norm.includes('za 2') && norm.includes('c/w')) return 'two_cw';
    if (norm.includes('za 3') && norm.includes('c/w')) return 'three_cw';
    if (norm.includes('za 1') && norm.includes('c/w')) return 'ft_cw';
    if (norm.includes('za 2') && norm.includes('%')) return 'two_pct';
    if (norm.includes('za 3') && norm.includes('%')) return 'three_pct';
    if (norm.includes('za 1') && norm.includes('%')) return 'ft_pct';

    if (norm.startsWith('zb') && norm.includes('a')) return 'oreb';
    if (norm.startsWith('zb') && norm.includes('o')) return 'dreb';
    if (norm.startsWith('zb') && (norm.includes('su') || norm.includes('suma'))) return 'reb';

    if (norm === 'a') return 'ast';
    if (norm === 's') return 'tov';
    if (norm === 'p') return 'stl';
    if (norm === 'b') return 'blk';
    if (norm === 'f') return 'pf';
    if (norm === 'fp') return 'fouls_committed';
    if (norm === 'fw') return 'fouls_drawn';
    if (norm.includes('+/-') || norm.includes('+/–')) return 'plusMinus';
    if (norm.includes('pkt') || norm === 'pk') return 'pts';

    if (norm === 'c/w') {
      const groupText = normalizeText(rawLabel);
      const hasExplicitGroup = groupText.includes('za 1') || groupText.includes('za 2') || groupText.includes('za 3');
      if (!hasGroups || !hasExplicitGroup) return `cw_pair_${cwIndices.indexOf(idx) + 1}`;
    }
    return null;
  });

  return keys;
}

function mapColumnsFromHeaders(header1, header2) {
  const keys = new Array(header1.length).fill(null);
  const h1 = header1.map((c) => normalizeText(c));
  const h2 = header2.map((c) => normalizeText(c ?? ''));

  const idxPlusMinus = h1.findIndex((c) => c.includes('+/-'));
  const idxPts = h1.findIndex((c) => c.includes('pkt') || c === 'pk');

  const idxNr = h1.findIndex((c) => c.includes('nr'));
  const idxName = h1.findIndex((c) => c.includes('nazwisko'));
  const idxMin = h1.findIndex((c) => c === 'min');

  if (idxNr >= 0) keys[idxNr] = 'number';
  if (idxName >= 0) keys[idxName] = 'name';
  if (idxMin >= 0) keys[idxMin] = 'min';

  if (idxPlusMinus >= 0) keys[idxPlusMinus] = 'plusMinus';
  if (idxPts >= 0) keys[idxPts] = 'pts';

  // Rebounds under Zb group: A/O/Su
  const zbStart = h1.findIndex((c) => c.startsWith('zb'));
  if (zbStart >= 0) {
    for (let i = zbStart; i < h1.length; i += 1) {
      if (i !== zbStart && h1[i] && !h1[i].startsWith('zb')) break;
      if (h2[i] === 'a') keys[i] = 'oreb';
      if (h2[i] === 'o') keys[i] = 'dreb';
      if (h2[i] === 'su' || (h2[i] && h2[i].includes('suma'))) keys[i] = 'reb';
    }
  }

  // Basic stat columns by header1 labels (after Zb group)
  h1.forEach((cell, idx) => {
    if (keys[idx]) return;
    if (cell === 'a') keys[idx] = 'ast';
    if (cell === 's') keys[idx] = 'tov';
    if (cell === 'p') keys[idx] = 'stl';
    if (cell === 'b') keys[idx] = 'blk';
    if (cell === 'f') keys[idx] = 'pf';
    if (cell === 'fp') keys[idx] = 'fouls_committed';
    if (cell === 'fw') keys[idx] = 'fouls_drawn';
  });

  // Shot groups (C/W and %)
  const cwIndices = h2
    .map((cell, idx) => (cell === 'c/w' ? idx : -1))
    .filter((idx) => idx >= 0);

  const groupNames = h1.filter((c) => c.includes('za 2') || c.includes('za 3') || c.includes('za 1'));
  const hasZa2 = h1.some((c) => c.includes('za 2'));

  if (groupNames.length >= 1) {
    // Map by order of C/W blocks (Za 2, Za 3, Za 1)
    const cwTargets = hasZa2 ? ['two_cw', 'three_cw', 'ft_cw'] : ['two_cw', 'three_cw', 'ft_cw'];
    cwIndices.forEach((idx, i) => {
      keys[idx] = cwTargets[i] || null;
    });
  } else if (cwIndices.length >= 3) {
    // Fallback: assume 2P, 3P, FT
    const cwTargets = ['two_cw', 'three_cw', 'ft_cw'];
    cwIndices.forEach((idx, i) => {
      keys[idx] = cwTargets[i] || null;
    });
  }

  return keys;
}

function parseBoxscoreTable(rows, teamName) {
  if (rows.length < 2) return { players: [], totals: null };
  const header1 = rows[0];
  const header2 = rows[1];

  const header2HasCW = header2.some((cell) => {
    const safe = (cell ?? '').toString().toLowerCase();
    return safe.includes('c/w') || safe.includes('%');
  });
  const header2HasRatios = header2.filter((cell) => (cell ?? '').toString().includes('/')).length >= 2;
  const hasSubheader = header2HasCW && !header2HasRatios;

  const keys = hasSubheader ? mapColumnsFromHeaders(header1, header2) : mapColumnsFromHeaders(header1, []);

  const dataRows = rows.slice(hasSubheader ? 2 : 1);
  const players = [];
  let totals = null;

  for (const row of dataRows) {
    const rowText = normalizeText(row.join(' '));
    if (rowText.includes('w sumie')) {
      totals = { raw: row };
      continue;
    }
    if (rowText.includes('zespo')) {
      continue;
    }
    const player = { team: teamName };
    row.forEach((cell, idx) => {
      const key = keys[idx];
      if (!key) return;
      if (key === 'number') player.number = cell.replace('*', '').trim();
      else if (key === 'name') player.name = cell.trim();
      else if (key === 'min') {
        player.min = cell.trim();
        player.didNotPlay = cell.trim().toUpperCase() === 'DNP';
      } else if (key === 'fg_cw') {
        const { made, att } = parseRatio(cell);
        player.fgm = made ?? 0;
        player.fga = att ?? 0;
      } else if (key === 'two_cw') {
        const { made, att } = parseRatio(cell);
        player.two_pm = made ?? 0;
        player.two_pa = att ?? 0;
      } else if (key === 'three_cw') {
        const { made, att } = parseRatio(cell);
        player.three_pm = made ?? 0;
        player.three_pa = att ?? 0;
      } else if (key === 'ft_cw') {
        const { made, att } = parseRatio(cell);
        player.ftm = made ?? 0;
        player.fta = att ?? 0;
      } else if (key.startsWith('cw_pair_')) {
        const pairIdx = Number(key.split('_')[2]);
        const { made, att } = parseRatio(cell);
        if (pairIdx === 1) {
          player.fgm = made ?? 0;
          player.fga = att ?? 0;
        }
        if (pairIdx === 2) {
          player.two_pm = made ?? 0;
          player.two_pa = att ?? 0;
        }
        if (pairIdx === 3) {
          player.three_pm = made ?? 0;
          player.three_pa = att ?? 0;
        }
        if (pairIdx === 4) {
          player.ftm = made ?? 0;
          player.fta = att ?? 0;
        }
      } else if (['oreb', 'dreb', 'reb', 'ast', 'tov', 'stl', 'blk', 'pf', 'fouls_committed', 'fouls_drawn', 'pts'].includes(key)) {
        player[key] = parseNumber(cell) ?? 0;
      } else if (key === 'plusMinus') {
        player.plusMinus = parseNumber(cell) ?? 0;
      }
    });

    if (player.fgm === undefined && player.two_pm !== undefined && player.three_pm !== undefined) {
      player.fgm = (player.two_pm || 0) + (player.three_pm || 0);
      player.fga = (player.two_pa || 0) + (player.three_pa || 0);
    }

    if (player.two_pm === undefined && player.fgm !== undefined && player.three_pm !== undefined) {
      player.two_pm = (player.fgm || 0) - (player.three_pm || 0);
    }

    if (player.pts === undefined) {
      const two = player.two_pm ?? null;
      const three = player.three_pm ?? null;
      const ft = player.ftm ?? null;
      if (two !== null || three !== null || ft !== null) {
        player.pts = (two || 0) * 2 + (three || 0) * 3 + (ft || 0);
      }
    }

    if (row.length >= 2) {
      const last = row[row.length - 1];
      const secondLast = row[row.length - 2];
      const lastNum = parseNumber(last);
      const secondLastNum = parseNumber(secondLast);
      if (player.plusMinus === undefined && secondLastNum !== null) {
        player.plusMinus = secondLastNum;
      }
      if (player.pts === undefined && lastNum !== null) {
        player.pts = lastNum;
      }
    }
    players.push(player);
  }

  return { players, totals };
}

function parsePlainBoxscore(lines, teamName) {
  const players = [];
  let totals = null;

  for (const rawLine of lines) {
    const clean = rawLine.replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    const lower = normalizeText(clean);

    if (lower.startsWith('w sumie')) {
      totals = { raw: clean.split(' ') };
      continue;
    }
    if (lower.startsWith('zespol') || lower.startsWith('zespo')) continue;

    if (!/\d{1,2}:\d{2}/.test(clean)) continue;

    const numMatch = clean.match(/^\*?\d+/);
    if (!numMatch) continue;
    const number = numMatch[0].replace('*', '');
    const afterNum = clean.slice(numMatch[0].length).trim();

    const timeMatch = afterNum.match(/(\d{1,2}:\d{2})/);
    if (!timeMatch || timeMatch.index === undefined) continue;

    const name = afterNum.slice(0, timeMatch.index).trim();
    const min = timeMatch[1];
    const afterTime = afterNum.slice(timeMatch.index + timeMatch[0].length).trim();

    const tokens = afterTime.split(/\s+/);
    const ratios = [];
    const percents = [];
    const nums = [];

    for (const token of tokens) {
      if (token.includes('/')) ratios.push(token);
      else if (/^\d+[,.]\d+$/.test(token)) percents.push(token);
      else if (/^[+-]?\d+$/.test(token)) nums.push(token);
    }

    const player = { team: teamName, number, name, min };

    if (ratios[0]) {
      const { made, att } = parseRatio(ratios[0]);
      player.fgm = made ?? 0;
      player.fga = att ?? 0;
    }
    if (ratios[1]) {
      const { made, att } = parseRatio(ratios[1]);
      player.two_pm = made ?? 0;
      player.two_pa = att ?? 0;
    }
    if (ratios[2]) {
      const { made, att } = parseRatio(ratios[2]);
      player.three_pm = made ?? 0;
      player.three_pa = att ?? 0;
    }
    if (ratios[3]) {
      const { made, att } = parseRatio(ratios[3]);
      player.ftm = made ?? 0;
      player.fta = att ?? 0;
    }

    const lastNum = nums.length ? parseNumber(nums[nums.length - 1]) : null;
    const secondLastNum = nums.length > 1 ? parseNumber(nums[nums.length - 2]) : null;
    if (secondLastNum !== null) player.plusMinus = secondLastNum;
    if (lastNum !== null) player.pts = lastNum;

    const core = nums.slice(0, Math.max(0, nums.length - 2)).map((n) => parseNumber(n));
    const coreKeys = [
      'oreb',
      'dreb',
      'reb',
      'ast',
      'tov',
      'stl',
      'blk',
      'pf',
      'fouls_committed',
      'fouls_drawn'
    ];
    core.forEach((val, idx) => {
      if (val === null || val === undefined) return;
      const key = coreKeys[idx];
      if (key) player[key] = val;
    });

    if (player.fgm === undefined && player.two_pm !== undefined && player.three_pm !== undefined) {
      player.fgm = (player.two_pm || 0) + (player.three_pm || 0);
      player.fga = (player.two_pa || 0) + (player.three_pa || 0);
    }

    if (player.pts === undefined) {
      const two = player.two_pm ?? null;
      const three = player.three_pm ?? null;
      const ft = player.ftm ?? null;
      if (two !== null || three !== null || ft !== null) {
        player.pts = (two || 0) * 2 + (three || 0) * 3 + (ft || 0);
      }
    }

    players.push(player);
  }

  return { players, totals };
}

function parseFiveMinute(lines, startIndex) {
  const results = [];
  const normalizePoints = (points) => {
    const normalized = [...points];
    while (normalized.length < 8) normalized.push(null);
    return normalized.slice(0, 8);
  };
  const window = lines.slice(Math.max(0, startIndex - 1), startIndex + 12);
  for (const line of window) {
    if (line.trim().startsWith('|')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c);
      if (cells.length >= 9) {
        const teamCode = cells[0];
        const values = cells.slice(1).map((v) => parseNumber(v)).filter((v) => v !== null);
        if (values.length >= 8) {
          results.push({ team: teamCode, points: normalizePoints(values) });
        }
      }
    } else {
      const tokens = line.replace(/,/g, '.').split(/\s+/).filter(Boolean);
      const codeIndexes = tokens
        .map((token, idx) => (TEAM_CODE_MAP[token] || token === 'BB' || token === 'GT' || token === 'MW' || token === 'BC' || token === 'AM' || token === 'PK' || token === 'EBS' ? idx : -1))
        .filter((idx) => idx >= 0);

      if (codeIndexes.length >= 2) {
        const [firstIdx, secondIdx] = codeIndexes;
        const team1 = tokens[firstIdx];
        const team2 = tokens[secondIdx];
        const vals1 = tokens.slice(firstIdx + 1, secondIdx).map((v) => parseNumber(v)).filter((v) => v !== null);
        const vals2 = tokens.slice(secondIdx + 1).map((v) => parseNumber(v)).filter((v) => v !== null);
        if (vals1.length >= 8) {
          results.push({ team: team1, points: normalizePoints(vals1) });
          if (vals2.length >= 8) results.push({ team: team2, points: normalizePoints(vals2) });
        } else if (vals2.length >= 8) {
          const first = vals2.slice(0, 8);
          const second = vals2.slice(8, 16);
          results.push({ team: team1, points: normalizePoints(first) });
          if (second.length) results.push({ team: team2, points: normalizePoints(second) });
        }
      } else if (codeIndexes.length === 1) {
        const teamCode = tokens[codeIndexes[0]];
        const values = tokens.slice(codeIndexes[0] + 1).map((v) => parseNumber(v)).filter((v) => v !== null);
        if (values.length >= 8) {
          results.push({ team: teamCode, points: normalizePoints(values) });
        }
      }
    }
    if (results.length >= 2) break;
  }
  return results;
}

function parseTeamStats(lines) {
  const stats = {};
  const labels = [
    'Punkty po stratach',
    'Punkty spod kosza',
    'Punkty drugiej szansy',
    'Punkty po szybkim ataku',
    'Punkty do szybkim ataku',
    'Punkty zmienników',
    'Punkty zmineników',
    'Punkty zmiennikow'
  ];
  for (const line of lines) {
    const clean = line.replace(/\s+/g, ' ');
    const label = labels.find((l) => clean.includes(l));
    if (!label) continue;
    const nums = clean.match(/-?\d+/g);
    if (nums && nums.length >= 2) {
      stats[label] = { home: Number(nums[0]), away: Number(nums[1]) };
    }
  }
  return stats;
}

function parseRuns(lines) {
  const runs = {};
  const map = [
    { key: 'Najwyższe prowadzenie', out: 'maxLead' },
    { key: 'Najwyższa seria punktowa', out: 'maxRun' },
    { key: 'Zmiany prowadzenia', out: 'leadChanges' },
    { key: 'Remisy', out: 'ties' },
    { key: 'Czas prowadzenia', out: 'timeLeading' }
  ];
  for (const line of lines) {
    const clean = line.replace(/\s+/g, ' ');
    for (const item of map) {
      if (clean.includes(item.key)) {
        runs[item.out] = clean;
      }
    }
  }
  return runs;
}

function parseMarkdownGame(input) {
  const lines = input
    .replace(/^\uFEFF/, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');
  const league = lines.find((l) => l.includes('WEBSKA BASKET LIGA')) || '';
  const teamsLine = lines.find((l) => l.includes(' vs ')) || '';
  const [leftTeam, rightTeam] = teamsLine.split(' vs ').map((s) => s.trim());
  const homeName = BEKAPAKA_NAME;
  const awayName = leftTeam && leftTeam.toLowerCase().includes('bekapaka') ? rightTeam : leftTeam;
  const scoreLine = lines.find((l) => l.startsWith('#') && l.includes('-')) || '';
  const scoreMatch = scoreLine.match(/(\d+)\s*[-–]\s*(\d+)/);
  const finalScore = scoreMatch ? `${scoreMatch[1]} - ${scoreMatch[2]}` : '';
  const dateTimeLine =
    lines.find((l) => /(\d{2}[./-]\d{2}[./-]\d{4}).*(\d{1,2}:\d{2})/.test(l)) ||
    lines.find((l) => /(\d{2}[./-]\d{2}[./-]\d{4})/.test(l)) ||
    '';
  const dateMatch = dateTimeLine.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);
  const timeCandidates = [...dateTimeLine.matchAll(/(\d{1,2}):(\d{2})/g)];
  const timeMatch = timeCandidates.length ? timeCandidates[timeCandidates.length - 1] : null;
  const date = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : '';
  const time = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '';
  const quartersLine = lines.find((l) => l.startsWith('(') && l.includes('-')) || '';

  const quarters = quartersLine
    .replace(/[()]/g, '')
    .split(',')
    .map((q, idx) => {
      const [home, away] = q.trim().split('-').map((n) => Number(n.trim()));
      return { label: `Q${idx + 1}`, home, away };
    });

  const teams = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].includes('(') && lines[i].includes(')')) {
      const teamLabel = lines[i];
      if (teamLabel.includes('(BB)') || teamLabel.includes('(GT)') || teamLabel.includes('(MW)') || teamLabel.includes('(AM)') || teamLabel.includes('(BC)') || teamLabel.includes('(EBS)') || teamLabel.includes('(PK)')) {
        const teamName = teamLabel.split('(')[0].trim();
        const teamCode = teamLabel.match(/\(([^)]+)\)/)?.[1] || '';
        const nextTeamIdx = lines.findIndex(
          (l, idx) => idx > i && /\([A-Za-z]{1,5}\)/.test(l)
        );
        const endIdx = nextTeamIdx === -1 ? lines.length : nextTeamIdx;
        const block = lines.slice(i + 1, endIdx);
        const pipeIdx = block.findIndex((l) => l.startsWith('|'));

        let boxscore = { players: [], totals: null };
        if (pipeIdx !== -1) {
          const table = parsePipeTable(lines, i + 1 + pipeIdx);
          boxscore = parseBoxscoreTable(table.rows, teamName);
          i = table.endIndex - 1;
        } else {
          boxscore = parsePlainBoxscore(block, teamName);
          i = endIdx - 1;
        }

        const isBekapaka = teamName.toLowerCase().includes('bekapaka');
        teams.push({
          id: teamCode,
          name: teamName,
          code: teamCode,
          isBekapaka,
          isHome: isBekapaka,
          players: boxscore.players,
          totals: boxscore.totals
        });
      }
    }
  }

  if (teams.length < 2) {
    const fallbackTeams = parseTeamsFromTables(lines);
    for (const team of fallbackTeams) {
      if (!teams.find((t) => t.name === team.name || t.code === team.code)) {
        teams.push(team);
      }
    }
  }

  const fiveMinuteIndex = lines.findIndex(
    (l) =>
      l.includes('Punkty w 5-minutowych przedziałach') ||
      l.includes('Punkt w 5-minutowych przedziałach')
  );
  const fiveMinute = fiveMinuteIndex >= 0 ? parseFiveMinute(lines, fiveMinuteIndex + 1) : [];

  const teamStats = parseTeamStats(lines);
  const runs = parseRuns(lines);

  const warning = !teams.length
    ? 'Nie wykryto boxscore w protokole. Sprawdź format pliku .md.'
    : null;

  return {
    league,
    homeName,
    awayName,
    venue: DEFAULT_VENUE,
    homeAway: 'home',
    date,
    time,
    finalScore,
    quarters,
    teams,
    fiveMinute,
    teamStats,
    runs,
    warning
  };
}

function parseTeamsFromTables(lines) {
  const teams = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith('|') && line.includes('Nazwisko') && line.includes('Min')) {
      const table = parsePipeTable(lines, i);
      let teamLabel = '';
      for (let j = i - 1; j >= Math.max(0, i - 6); j -= 1) {
        const prev = lines[j];
        if (!prev.startsWith('|') && prev.length > 1) {
          teamLabel = prev;
          break;
        }
      }
      const teamName = teamLabel.split('(')[0].trim() || `Team ${teams.length + 1}`;
      const teamCode = teamLabel.match(/\(([^)]+)\)/)?.[1] || `T${teams.length + 1}`;
      const boxscore = parseBoxscoreTable(table.rows, teamName);
      teams.push({
        id: teamCode,
        name: teamName,
        code: teamCode,
        isBekapaka: teamName.toLowerCase().includes('bekapaka'),
        isHome: teamName.toLowerCase().includes('bekapaka'),
        players: boxscore.players,
        totals: boxscore.totals
      });
      i = table.endIndex - 1;
    }
  }
  return teams;
}

function sumBy(players, field) {
  return players.reduce((acc, p) => acc + (Number(p[field]) || 0), 0);
}

function validateTeamTotals(team) {
  const issues = [];
  const totals = team.totals?.raw || [];
  const totalPts = sumBy(team.players, 'pts');
  const totalFgm = sumBy(team.players, 'fgm');
  const totalFga = sumBy(team.players, 'fga');
  const totalFtm = sumBy(team.players, 'ftm');
  const totalFta = sumBy(team.players, 'fta');

  const rowText = totals.join(' ');
  const ptsInTotals = rowText.match(/\\b(\\d{1,3})\\b/g)?.map((n) => Number(n)) || [];
  const maxPtsCandidate = ptsInTotals.length ? Math.max(...ptsInTotals) : null;

  if (maxPtsCandidate !== null && Math.abs(maxPtsCandidate - totalPts) > 1) {
    issues.push(`Suma punktów zawodników (${totalPts}) nie zgadza się z wierszem W sumie (${maxPtsCandidate}).`);
  }
  if (totalFga && totalFgm > totalFga) {
    issues.push('FGM większe niż FGA.');
  }
  if (totalFta && totalFtm > totalFta) {
    issues.push('FTM większe niż FTA.');
  }

  return { totalPts, totalFgm, totalFga, totalFtm, totalFta, issues };
}

function validateGameScore(game) {
  const issues = [];
  const scoreMatch = game.finalScore.match(/(\\d+)\\s*-\\s*(\\d+)/);
  if (!scoreMatch) return { issues };
  const scoreA = Number(scoreMatch[1]);
  const scoreB = Number(scoreMatch[2]);
  if (!game.teams.length) return { issues };

  const teamTotals = game.teams.map((t) => validateTeamTotals(t));
  const pts = teamTotals.map((t) => t.totalPts);
  const sortedScore = [scoreA, scoreB].sort((a, b) => a - b);
  const sortedPts = [...pts].sort((a, b) => a - b);
  if (sortedScore.length === 2 && sortedPts.length === 2) {
    if (sortedScore[0] !== sortedPts[0] || sortedScore[1] !== sortedPts[1]) {
      issues.push(`Wynik meczu (${scoreA}-${scoreB}) nie zgadza się z sumą punktów zespołów (${pts.join('-')}).`);
    }
  }

  return { issues, teamTotals };
}

export function parseImportPayload(payload) {
  const { format, content } = payload;
  if (format === 'json') return parseJson(content);

  const game = parseMarkdownGame(content);
  const validation = validateGameScore(game);
  return {
    source: 'markdown',
    game,
    validation
  };
}

export function computeDerived(player) {
  return {
    ...player,
    metrics: withShootingMetrics({
      fgm: player.fgm,
      fga: player.fga,
      three_pm: player.three_pm,
      fta: player.fta,
      pts: player.pts,
      tov: player.tov
    })
  };
}
