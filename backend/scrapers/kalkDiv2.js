import { load as parseHtml } from 'cheerio';

const KALK_DIV2_URL = 'https://www.kalk-koszalin.com/dzial,dywizja-2,4.html';
const TABLE_URL = 'https://www.kalk-koszalin.com/poddzial,tabela,35.html';
const CACHE_TTL_MS = 5 * 60 * 1000;
const HEADER_SELECTOR = 'h1, h2, h3, h4, h5, h6';

let cachedSnapshot = null;
let cachedAt = 0;

function normalizeText(value) {
  if (!value) return '';
  return value
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function cleanLine(value) {
  return value
    .toString()
    .replace(/\u00A0/g, ' ')
    .replace(/\uFEFF/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumber(value) {
  if (!value) return null;
  const cleaned = value.toString().replace(/,/g, '.').replace(/[^\d.+\-]/g, '');
  if (cleaned === '' || cleaned === '+' || cleaned === '-' || cleaned === '.' || cleaned === '+.') {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

function splitBySeparator(lines) {
  const text = lines.join('\n');
  return text
    .split(/\*+\s*\*+\s*\*+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function findSectionLines($, needle) {
  const normalizedNeedle = normalizeText(needle);
  const heading = $(HEADER_SELECTOR)
    .filter((_, el) => normalizeText($(el).text()).includes(normalizedNeedle))
    .first();

  if (!heading.length) return [];

  const lines = [];
  let next = heading.next();
  while (next.length) {
    const tag = next[0].tagName;
    if (tag && /^h[1-6]$/i.test(tag)) break;
    const textValue = next.text();
    if (textValue) {
      textValue.split(/\r?\n/).forEach((line) => {
        const cleaned = cleanLine(line);
        if (cleaned) lines.push(cleaned);
      });
    }
    next = next.next();
  }

  return lines;
}

function parseRecentMatches(lines) {
  const chunks = splitBySeparator(lines);
  const matches = [];
  for (const chunk of chunks) {
    const chunkLines = chunk
      .split(/\r?\n/)
      .map((line) => cleanLine(line))
      .filter(Boolean);
    if (chunkLines.length < 4) continue;

    const homeTeam = chunkLines[0];
    const awayTeam = chunkLines[1];
    const homeScore = parseNumber(chunkLines[chunkLines.length - 2]);
    const awayScore = parseNumber(chunkLines[chunkLines.length - 1]);
    if (!homeTeam || !awayTeam || homeScore === null || awayScore === null) continue;
    matches.push({ homeTeam, awayTeam, homeScore, awayScore });
  }
  return matches;
}

function parseUpcomingMatches(lines) {
  const chunks = splitBySeparator(lines);
  const matches = [];
  for (const chunk of chunks) {
    const chunkLines = chunk
      .split(/\r?\n/)
      .map((line) => cleanLine(line))
      .filter(Boolean);
    if (chunkLines.length < 4) continue;

    const homeTeam = chunkLines[0];
    const awayTeam = chunkLines[1];
    const possibleDate = chunkLines[chunkLines.length - 2];
    const possibleTime = chunkLines[chunkLines.length - 1];
    const date = parseDate(possibleDate);
    const time = parseTime(possibleTime);
    if (!homeTeam || !awayTeam || !date || !time) continue;
    matches.push({ homeTeam, awayTeam, date, time });
  }
  return matches;
}

function parseDate(value) {
  if (!value) return null;
  const match = value.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function parseTime(value) {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, hour, minute] = match;
  return `${hour.padStart(2, '0')}:${minute}`;
}

function parseStandings(lines) {
  const sanitized = lines.map((line) => cleanLine(line)).filter(Boolean);
  const entries = [];
  for (const line of sanitized) {
    const rowMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (!rowMatch) continue;
    const rank = Number(rowMatch[1]);
    const body = rowMatch[2].trim();
    if (!body) continue;

    const tokens = body.split(/\s+/);
    const statsCount = 5;
    let team = body;
    let matches = null;
    let wins = null;
    let losses = null;
    let points = null;
    let ratio = null;

    if (tokens.length > statsCount) {
      const statTokens = tokens.slice(-statsCount);
      const teamTokens = tokens.slice(0, tokens.length - statsCount);
      team = teamTokens.join(' ').trim() || team;
      matches = Number.isNaN(Number(statTokens[0])) ? null : Number(statTokens[0]);
      wins = Number.isNaN(Number(statTokens[1])) ? null : Number(statTokens[1]);
      losses = Number.isNaN(Number(statTokens[2])) ? null : Number(statTokens[2]);
      points = Number.isNaN(Number(statTokens[3])) ? null : Number(statTokens[3]);
      ratio = parseNumber(statTokens[4]);
    }

    entries.push({ rank, team, matches, wins, losses, points, ratio });
  }
  return entries;
}

function findTableWithHeaders($) {
  const important = ['zesp', 'druż', 'klub', 'pkt', 'm', 'w', 'l'];
  let selected = null;
  $('table').each((_, table) => {
    const headers = $(table)
      .find('th')
      .toArray()
      .map((th) => normalizeText($(th).text()))
      .join(' ');
    if (!headers) return;
    const match = important.filter((keyword) => headers.includes(keyword));
    if (!match.length) return;
    selected = table;
    return false;
  });
  return selected;
}

function parseStandingsFromTable($table) {
  const entries = [];
  const rows = $table.find('tbody tr').length ? $table.find('tbody tr') : $table.find('tr').slice(1);
  rows.each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 2) return;
    const values = cells.toArray().map((cell) => cleanLine($(cell).text()));
    const rank = parseNumber(values[0]);
    const team = values[1];
    const matches = parseNumber(values[2]);
    const wins = parseNumber(values[3]);
    const losses = parseNumber(values[4]);
    const points = parseNumber(values[5]);
    const ratio = parseNumber(values[6] ?? '');
    if (!team) return;
    entries.push({ rank, team, matches, wins, losses, points, ratio });
  });
  return entries;
}

async function fetchOfficialStandings(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(TABLE_URL, {
        headers: {
          'User-Agent': 'BeKaPaKa Stats Hub (scraper)',
          Accept: 'text/html'
        }
      });

      if (!response.ok) {
        throw new Error(`Tabela KALK: złe HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = parseHtml(html, { decodeEntities: false });
      const table = findTableWithHeaders($);

      if (!table) {
        console.warn(`Próba ${attempt}/${retries}: Nie znaleziono tabeli`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        return [];
      }

      const standings = parseStandingsFromTable($(table));

      // Walidacja danych
      if (standings.length === 0) {
        console.warn('UWAGA: Tabela jest pusta!');
      }

      const bekapakaEntry = standings.find(entry =>
        entry.team && entry.team.toLowerCase().includes('bekapaka')
      );

      if (!bekapakaEntry) {
        console.warn('UWAGA: Nie znaleziono BeKaPaKa w tabeli!');
      } else {
        console.log('BeKaPaKa: pozycja %d, %d meczów, %d pkt',
          bekapakaEntry.rank, bekapakaEntry.matches, bekapakaEntry.points);
      }

      console.log(`Pobrano tabelę: ${standings.length} drużyn`);
      return standings;

    } catch (error) {
      console.error(`Próba ${attempt}/${retries} nie powiodła się:`, error.message);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } else {
        throw error;
      }
    }
  }
  return [];
}

function buildSnapshot(html) {
  const $ = parseHtml(html, { decodeEntities: false });
  const recentMatches = parseRecentMatches(findSectionLines($, 'ostatnie mecze'));
  const upcomingMatches = parseUpcomingMatches(findSectionLines($, 'następne mecze'));
  const standings = parseStandings(findSectionLines($, 'tabela'));

  return {
    source: 'kalk-koszalin.com',
    division: 'dywizja-2-grupa-4',
    url: KALK_DIV2_URL,
    fetchedAt: new Date().toISOString(),
    recentMatches,
    upcomingMatches,
    standings
  };
}

export async function fetchKalkDiv2Snapshot(options = {}) {
  const now = Date.now();
  const useCache = !options.noCache;

  if (cachedSnapshot && useCache && now - cachedAt < CACHE_TTL_MS) {
    console.log('Zwracam dane z cache (wiek: %dms)', now - cachedAt);
    return cachedSnapshot;
  }

  console.log('Pobieram świeże dane z KALK...');

  const response = await fetch(KALK_DIV2_URL, {
    headers: {
      'User-Agent': 'BeKaPaKa Stats Hub (scraper)',
      Accept: 'text/html'
    }
  });

  if (!response.ok) {
    throw new Error(`Kalk scraper: bad response ${response.status}`);
  }

  const html = await response.text();
  const snapshot = buildSnapshot(html);
  try {
    const officialStandings = await fetchOfficialStandings();
    if (officialStandings.length) {
      snapshot.standings = officialStandings;
    }
  } catch (error) {
    console.warn('Nie udało się pobrać tabeli z oddzielnej zakładki:', error);
  }

  cachedAt = now;
  cachedSnapshot = snapshot;
  return snapshot;
}
