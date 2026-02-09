import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_URL = 'https://www.kalk-koszalin.com/';
const DIVISION_PATH = 'dzial,dywizja-2,4.html';
const TEAM_PAGE_URL = 'https://www.kalk-koszalin.com/klub,bekapaka-bobolice,222,2.html';
const RATE_LIMIT_MS = 2000;

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7'
};

// Helper: Rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Fetch HTML with retries
async function fetchHTML(url, retries = 3) {
    console.log(`[Scraper] Fetching: ${url}`);
    await sleep(RATE_LIMIT_MS);

    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url, {
                headers: HEADERS,
                timeout: 20000 // 20s timeout
            });
            return cheerio.load(response.data);
        } catch (err) {
            console.error(`[Scraper] Attempt ${i + 1} failed for ${url}: ${err.message}`);
            if (i === retries - 1) throw err;
            await sleep(RATE_LIMIT_MS * 2); // Wait longer before retry
        }
    }
}

// Helper: Parse date from various formats
function parseDate(dateStr) {
    if (!dateStr) return new Date();

    // Try YYYY-MM-DD HH:mm:ss format (team page format)
    const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (isoMatch) {
        const [, year, month, day, hours, minutes, seconds] = isoMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
    }

    // Try DD-MM-YYYY HH:mm format (general schedule format)
    const ddmmMatch = dateStr.match(/(\d{2})-(\d{2})-(\d{4})\s*(\d{2}):(\d{2})/);
    if (ddmmMatch) {
        const [, day, month, year, hours, minutes] = ddmmMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    }

    // Try DD-MM-YYYYHH:mm (glued)
    const gluedMatch = dateStr.match(/(\d{2})-(\d{2})-(\d{4})(\d{2}):(\d{2})/);
    if (gluedMatch) {
        const [, day, month, year, hours, minutes] = gluedMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    }

    // Fallback: try standard Date constructor (but this is unreliable for non-ISO formats)
    console.warn(`[Scraper] Warning: Using fallback date parsing for: "${dateStr}"`);
    return new Date(dateStr);
}

// Helper: Parse score
function parseScore(scoreText) {
    if (!scoreText || scoreText.trim() === ':' || scoreText.trim() === '-' || scoreText.trim() === '-:-') {
        return { scoreHome: null, scoreAway: null, isFinished: false };
    }

    const parts = scoreText.split(':');
    if (parts.length === 2) {
        const home = parseInt(parts[0].trim());
        const away = parseInt(parts[1].trim());
        if (!isNaN(home) && !isNaN(away)) {
            return { scoreHome: home, scoreAway: away, isFinished: true };
        }
    }

    return { scoreHome: null, scoreAway: null, isFinished: false };
}

// Helper: Parse M/A stats (e.g., "5/10")
function parseMA(text) {
    if (!text) return { made: 0, attempted: 0, percentage: 0 };
    const parts = text.split('/');
    if (parts.length === 2) {
        const made = parseInt(parts[0].trim()) || 0;
        const attempted = parseInt(parts[1].trim()) || 0;
        const percentage = attempted > 0 ? (made / attempted) * 100 : 0;
        return { made, attempted, percentage };
    }
    return { made: 0, attempted: 0, percentage: 0 };
}

// 1. Scrape League Table
export async function scrapeLeagueTable() {
    const $ = await fetchHTML(BASE_URL + DIVISION_PATH);

    // Find "Tabela" link
    let tableUrl = null;
    $('a').each((i, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes('tabela')) {
            const href = $(el).attr('href');
            tableUrl = href.startsWith('http') ? href : BASE_URL + href;
            return false;
        }
    });

    if (!tableUrl) {
        console.log('[Scraper] Table link not found');
        return [];
    }

    const $table = await fetchHTML(tableUrl);
    const teams = [];

    $table('table tr').each((i, row) => {
        const cells = $table(row).find('td');
        if (cells.length < 10) return;

        try {
            const name = $table(cells[1]).text().trim();
            console.log(`[DEBUG] Scraped player name: "${name}"`);
            const matches = parseInt($table(cells[2]).text().trim());
            const wins = parseInt($table(cells[3]).text().trim());
            const losses = parseInt($table(cells[4]).text().trim());
            const pointsFor = parseInt($table(cells[5]).text().trim());
            const pointsAgainst = parseInt($table(cells[7]).text().trim());
            const points = parseInt($table(cells[cells.length - 1]).text().trim());

            teams.push({
                name,
                matches,
                wins,
                losses,
                pointsFor,
                pointsAgainst,
                points
            });
        } catch (e) {
            // Skip malformed rows
        }
    });

    console.log(`[Scraper] Found ${teams.length} teams in league table`);
    return teams;
}

// 2. Scrape General Schedule (from rounds)
export async function scrapeGeneralSchedule() {
    const $ = await fetchHTML(BASE_URL + DIVISION_PATH);

    // Find "Terminarz" link
    let scheduleUrl = null;
    $('a').each((i, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes('terminarz')) {
            const href = $(el).attr('href');
            scheduleUrl = href.startsWith('http') ? href : BASE_URL + href;
            return false;
        }
    });

    if (!scheduleUrl) {
        console.log('[Scraper] Schedule link not found');
        return [];
    }

    const $schedule = await fetchHTML(scheduleUrl);

    // Find all round links
    const roundLinks = new Set();
    $schedule('a').each((i, el) => {
        const href = $schedule(el).attr('href');
        if (href && href.includes('kolejka_id=')) {
            const fullUrl = href.startsWith('http') ? href : BASE_URL + href;
            roundLinks.add(fullUrl);
        }
    });

    console.log(`[Scraper] Found ${roundLinks.size} rounds`);

    const allMatches = [];

    for (const roundUrl of roundLinks) {
        const $round = await fetchHTML(roundUrl);

        $round('.pusty2').each((i, matchDiv) => {
            try {
                // Parse date
                const dateDiv = $round(matchDiv).find('.data_meczu');
                let dateStr = '0000-00-00 00:00';
                if (dateDiv.length) {
                    const parts = dateDiv.text().trim().split('\n').map(s => s.trim()).filter(Boolean);
                    if (parts.length >= 2) {
                        dateStr = `${parts[0]} ${parts[1]}`;
                    } else if (parts.length === 1) {
                        dateStr = parts[0];
                    }
                }

                // Parse score
                const scoreLink = $round(matchDiv).find('a.bialy_link');
                const scoreText = scoreLink.length ? scoreLink.text().trim() : '-:-';
                const href = scoreLink.attr('href');
                const protocolUrl = href ? (href.startsWith('http') ? href : BASE_URL + href) : null;

                const { scoreHome, scoreAway, isFinished } = parseScore(scoreText);

                // Parse teams
                const fullText = $round(matchDiv).clone().children().remove().end().text().trim();
                const teamsMatch = fullText.match(/^(.+?)\s*-\s*(.+?)$/);

                if (teamsMatch) {
                    const homeTeam = teamsMatch[1].trim();
                    const guestTeam = teamsMatch[2].trim();

                    allMatches.push({
                        date: parseDate(dateStr),
                        homeTeam,
                        guestTeam,
                        scoreHome,
                        scoreAway,
                        isFinished,
                        protocolUrl
                    });
                }
            } catch (e) {
                console.error('[Scraper] Error parsing match:', e.message);
            }
        });
    }

    console.log(`[Scraper] Found ${allMatches.length} matches from general schedule`);
    return allMatches;
}

// 3. Scrape Team Schedule (BeKaPaKa specific)
export async function scrapeTeamSchedule() {
    const $ = await fetchHTML(TEAM_PAGE_URL);
    const matches = [];

    $('table tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length < 4) return;

        try {
            const dateStr = $(cells[0]).text().trim();
            const matchLink = $(cells[1]).find('a');
            const matchText = $(cells[1]).text().trim();
            const scoreLink = $(cells[2]).find('a');
            const scoreText = $(cells[2]).text().trim();

            // Protocol URL can be in score column or match name column
            let protocolUrl = null;
            if (scoreLink.length) {
                const href = scoreLink.attr('href');
                protocolUrl = href ? (href.startsWith('http') ? href : BASE_URL + href) : null;
            } else if (matchLink.length) {
                const href = matchLink.attr('href');
                protocolUrl = href ? (href.startsWith('http') ? href : BASE_URL + href) : null;
            }

            // Parse teams using regex to handle inconsistent spacing
            const teamsMatch = matchText.match(/^(.+?)\s*-\s*(.+?)$/);
            if (!teamsMatch) return;

            const homeTeam = teamsMatch[1].trim();
            const guestTeam = teamsMatch[2].trim();

            const { scoreHome, scoreAway, isFinished } = parseScore(scoreText);

            matches.push({
                date: parseDate(dateStr),
                homeTeam,
                guestTeam,
                scoreHome,
                scoreAway,
                isFinished,
                protocolUrl
            });
        } catch (e) {
            console.error('[Scraper] Error parsing team match:', e.message);
        }
    });

    console.log(`[Scraper] Found ${matches.length} matches from team page`);
    return matches;
}

// 3.1 Scrape Individual Match Protocol
export async function scrapeMatchProtocol(url) {
    if (!url) return null;
    const $ = await fetchHTML(url);

    try {
        // Find all tables and filter for those that look like box scores
        const tables = [];
        $('table').each((i, el) => {
            const tableText = $(el).text();
            if (tableText.includes('imię i nazwisko') && tableText.includes('pkt')) {
                tables.push(el);
            }
        });

        // Parse Quarter Scores
        let quarterScores = [];
        const bodyText = $('body').text().replace(/\s+/g, ' ');
        // Pattern: "(15:12; 18:19; 17:11; 27:18;)"
        const quartersMatch = bodyText.match(/\(((\d{1,3}:\d{1,3};\s*)+)\)/);

        if (quartersMatch && quartersMatch[1]) {
            quarterScores = quartersMatch[1].split(';')
                .map(s => s.trim())
                .filter(s => s.includes(':'))
                .map(s => {
                    const [h, a] = s.split(':').map(Number);
                    return { home: h, away: a };
                });
        }

        if (tables.length === 0) {
            console.log(`[Scraper] No box score tables found on protocol page: ${url}`);
            return null;
        }

        const teams = [];

        tables.forEach((table, i) => {
            // Find team name - it's usually in a th with colspan in the thead
            // or in an h3 above the table
            let teamName = $(table).find('thead tr th').first().text().trim();

            // If theade search fails, look at the previous h3
            if (!teamName || teamName === 'imię i nazwisko' || teamName === 'Nr') {
                const prevH3 = $(table).prevAll('h3, div').first().text().trim();
                if (prevH3 && prevH3.length < 50) teamName = prevH3;
            }

            if (!teamName) {
                teamName = `Team ${i + 1}`;
                console.warn(`[Scraper] Could not find team name for table ${i + 1}, using fallback: ${teamName}`);
            }

            const players = [];
            const isBekapaka = teamName.toLowerCase().includes('bekapaka') || teamName.toLowerCase().includes('bobolice');

            $(table).find('tbody tr, tr').each((j, row) => {
                const cells = $(row).find('td');
                if (cells.length < 15) return; // Not a player row

                const nameLink = $(row).find('a.orangeblack');
                if (!nameLink.length) return;

                const name = nameLink.text().trim();
                const number = $(cells[0]).text().trim();
                const starter = $(cells[2]).text().includes('*');
                const pts = parseInt($(cells[3]).text().trim()) || 0;
                const min = parseInt($(cells[4]).text().trim()) || 0;

                const twoP = parseMA($(cells[5]).text().trim());
                const threeP = parseMA($(cells[7]).text().trim());
                const ft = parseMA($(cells[11]).text().trim());

                const orb = parseInt($(cells[13]).text().trim()) || 0;
                const drb = parseInt($(cells[14]).text().trim()) || 0;
                const reb = parseInt($(cells[15]).text().trim()) || 0;
                const ast = parseInt($(cells[16]).text().trim()) || 0;
                const pf = parseInt($(cells[17]).text().trim()) || 0;
                const fw = parseInt($(cells[18]).text().trim()) || 0;
                const tov = parseInt($(cells[19]).text().trim()) || 0;
                const stl = parseInt($(cells[20]).text().trim()) || 0;
                const blk = parseInt($(cells[21]).text().trim()) || 0;
                const plusMinus = parseInt($(cells[22]).text().trim()) || 0;
                const evalScore = parseInt($(cells[23]).text().trim()) || 0;

                players.push({
                    name, number, starter, pts, min,
                    two_pm: twoP.made, two_pa: twoP.attempted,
                    three_pm: threeP.made, three_pa: threeP.attempted,
                    ftm: ft.made, fta: ft.attempted,
                    fgm: twoP.made + threeP.made, fga: twoP.attempted + threeP.attempted,
                    orb, drb, reb, ast, pf, fw, stl, tov, blk, plusMinus, eval: evalScore
                });
            });

            // Calculate Team Totals & Four Factors
            const teamTotals = players.reduce((acc, p) => ({
                pts: acc.pts + p.pts,
                fga: acc.fga + p.fga,
                fgm: acc.fgm + p.fgm,
                three_pa: acc.three_pa + p.three_pa,
                three_pm: acc.three_pm + p.three_pm,
                fta: acc.fta + p.fta,
                ftm: acc.ftm + p.ftm,
                orb: acc.orb + p.orb,
                drb: acc.drb + p.drb,
                reb: acc.reb + p.reb,
                tov: acc.tov + p.tov,
                ast: acc.ast + p.ast,
                stl: acc.stl + p.stl,
                blk: acc.blk + p.blk,
                pf: acc.pf + p.pf,
                fw: acc.fw + p.fw,
                plusMinus: acc.plusMinus + p.plusMinus,
                eval: acc.eval + p.eval
            }), { pts: 0, fga: 0, fgm: 0, three_pa: 0, three_pm: 0, fta: 0, ftm: 0, orb: 0, drb: 0, reb: 0, tov: 0, ast: 0, stl: 0, blk: 0, pf: 0, fw: 0, plusMinus: 0, eval: 0 });

            // Basic Four Factors calculation (simplified version)
            const efg = teamTotals.fga > 0 ? (teamTotals.fgm + 0.5 * teamTotals.three_pm) / teamTotals.fga : 0;
            const tovPct = (teamTotals.fga + 0.44 * teamTotals.fta + teamTotals.tov) > 0
                ? teamTotals.tov / (teamTotals.fga + 0.44 * teamTotals.fta + teamTotals.tov) : 0;
            const ftRate = teamTotals.fga > 0 ? teamTotals.fta / teamTotals.fga : 0;
            // Note: ORB% requires opponent DRB, but we have it as this is a full protocol
            // We'll fix this in the merge phase below

            teams.push({
                name: teamName,
                isBekapaka,
                players,
                fourFactors: { efg, tovPct, ftRate, ...teamTotals }
            });
        });

        // Refine Four Factors (cross-team stats)
        if (teams.length === 2) {
            const t1 = teams[0];
            const t2 = teams[1];

            // ORB% = ORB / (ORB + Opp DRB)
            t1.fourFactors.orbPct = (t1.fourFactors.orb + t2.fourFactors.drb) > 0
                ? (t1.fourFactors.orb / (t1.fourFactors.orb + t2.fourFactors.drb)) : 0;
            t2.fourFactors.orbPct = (t2.fourFactors.orb + t1.fourFactors.drb) > 0
                ? (t2.fourFactors.orb / (t2.fourFactors.orb + t1.fourFactors.drb)) : 0;

            // Possessions = FGA + 0.44*FTA + TOV - ORB
            const poss = (t) => t.fga + 0.44 * t.fta + t.tov - t.orb;
            t1.fourFactors.possessions = Number(poss(t1.fourFactors).toFixed(2));
            t2.fourFactors.possessions = Number(poss(t2.fourFactors).toFixed(2));
        }

        return {
            protocolUrl: url,
            quarters: quarterScores,
            teams
        };
    } catch (e) {
        console.error(`[Scraper] Error scraping protocol ${url}:`, e.message);
        return null;
    }
}

// 4. Scrape Player Stats
export async function scrapePlayerStats() {
    const $ = await fetchHTML(BASE_URL + DIVISION_PATH);

    // Find "Statystyki" link
    let statsUrl = null;
    $('a').each((i, el) => {
        const text = $(el).text().toLowerCase();
        if (text.includes('statystyki')) {
            const href = $(el).attr('href');
            statsUrl = href.startsWith('http') ? href : BASE_URL + href;
            return false;
        }
    });

    if (!statsUrl) {
        console.log('[Scraper] Stats link not found');
        return [];
    }

    const $stats = await fetchHTML(statsUrl);
    const players = [];

    // Detect column indices from header
    let colMap = { name: 1, team: 2, points: 3, matches: 4, avg: 5, eval: -1 };

    const rows = $stats('table tr').toArray();

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const ths = $stats(row).find('th');
        if (ths.length) {
            console.log('[DEBUG] Header row text:', $stats(row).text().trim());
            ths.each((idx, th) => {
                const txt = $(th).text().trim().toLowerCase();
                console.log(`[DEBUG] Header col ${idx}: "${txt}"`);
                if (txt.includes('zawodnik') || txt.includes('imię')) colMap.name = idx;
                else if (txt.includes('drużyna') || txt.includes('zespół')) colMap.team = idx;
                else if (txt.includes('męcz') || txt.includes('mecze') || txt === 'm') colMap.matches = idx;
                else if (txt.includes('uśred') || txt.includes('śred') || txt.includes('avg')) colMap.avg = idx;
                else if (txt.includes('suma') || txt.includes('pkt') || txt.includes('pts')) colMap.points = idx;
                else if (txt.includes('eval') || txt.includes('eff') || txt.includes('val')) colMap.eval = idx;
            });
            console.log('[Scraper] Detected columns:', colMap);
            continue;
        }

        const cells = $stats(row).find('td');
        if (cells.length < 5) continue;

        try {
            const link = $stats(cells[colMap.name]).find('a');
            if (!link.length) continue;

            const name = link.text().trim();
            const href = link.attr('href');
            const profileUrl = href && (href.startsWith('http') ? href : BASE_URL + href);

            // PROBE: Check first player profile for stats
            if (i === 1 && profileUrl) {
                console.log(`[PROBE] Fetching profile: ${profileUrl}`);
                try {
                    const $p = await fetchHTML(profileUrl);
                    const bodyText = $p('body').text();
                    console.log('[PROBE] "za 3" count:', (bodyText.match(/za 3/gi) || []).length);
                    console.log('[PROBE] "3pkt" count:', (bodyText.match(/3pkt/gi) || []).length);
                    // Dump table headers from profile
                    $p('table th').each((_, th) => console.log('[PROBE] Profile TH:', $p(th).text().trim()));
                } catch (err) { console.error('[PROBE] Failed:', err); }
            }

            const team = $stats(cells[colMap.team]).text().trim();
            const points = parseFloat($stats(cells[colMap.points]).text().trim().replace(',', '.')) || 0;
            const matches = parseInt($stats(cells[colMap.matches]).text().trim()) || 0;
            const avg = parseFloat($stats(cells[colMap.avg]).text().trim().replace(',', '.')) || 0;

            let evalVal = 0;
            if (colMap.eval > -1 && cells[colMap.eval]) {
                evalVal = parseFloat($stats(cells[colMap.eval]).text().trim().replace(',', '.')) || 0;
            }

            // Generate player ID from profile URL
            let id = `player-${i}`;
            if (profileUrl) {
                const urlParts = profileUrl.split('/');
                const extracted = urlParts[urlParts.length - 1].replace(/[^A-Za-z0-9_-]/g, '');
                if (extracted) id = extracted;
            }

            players.push({
                id,
                name,
                team,
                matchesPlayed: matches,
                pointsTotal: points,
                pointsAverage: avg,
                eval: evalVal,
                profileUrl: profileUrl
            });
        } catch (e) {
            // Skip malformed rows
        }
    }

    console.log(`[Scraper] Scraped ${players.length} players. Sample:`, players[0]);
    return players;
}

// 5. Merge and deduplicate schedules
function mergeSchedules(generalSchedule, teamSchedule) {
    // NEW STRATEGY: Team schedule has absolute priority
    // We keep ALL team schedule matches, and only add general schedule matches
    // that don't conflict with team schedule

    const matchMap = new Map();

    // Helper function to normalize team names for comparison
    const normalizeTeam = (name) => name.toLowerCase().trim().replace(/\s+/g, ' ');

    // Helper function to create a flexible match key (date + normalized teams)
    function createMatchKey(match) {
        if (!match.date || isNaN(match.date.getTime())) return null;
        const normalizedHome = normalizeTeam(match.homeTeam);
        const normalizedGuest = normalizeTeam(match.guestTeam);
        const datePart = match.date.toISOString().split('T')[0];
        return `${datePart}_${normalizedHome}_${normalizedGuest}`;
    }
    ;

    // FIRST: Add ALL team schedule matches (these have priority)
    for (const match of teamSchedule) {
        const key = createMatchKey(match);
        matchMap.set(key, match);
    }

    console.log(`[Scraper] Added ${teamSchedule.length} matches from team schedule`);

    // SECOND: Add general schedule matches ONLY if they don't already exist
    let addedFromGeneral = 0;
    for (const match of generalSchedule) {
        const key = createMatchKey(match);
        if (key && !matchMap.has(key)) {
            matchMap.set(key, match);
            addedFromGeneral++;
        }
    }

    console.log(`[Scraper] Added ${addedFromGeneral} additional matches from general schedule`);

    const uniqueMatches = Array.from(matchMap.values());

    // DEBUG: Count BeKaPaKa matches
    const bekapakaMatches = uniqueMatches.filter(m =>
        m.homeTeam.toLowerCase().includes('bekapaka') ||
        m.homeTeam.toLowerCase().includes('bobolice') ||
        m.guestTeam.toLowerCase().includes('bekapaka') ||
        m.guestTeam.toLowerCase().includes('bobolice')
    );

    console.log(`[Scraper] Final result: ${uniqueMatches.length} total matches (${bekapakaMatches.length} BeKaPaKa)`);

    return uniqueMatches;
}

// 6. Deep Scrape for Player Profile (3-point stats etc)
// 6. Deep Scrape for Player Profile (3-point stats etc)
export async function scrapePlayerDetailedStats(playerProfileUrl) {
    if (!playerProfileUrl) return null;
    try {
        console.log(`[Scraper] Deep scraping: ${playerProfileUrl}`);
        const $ = await fetchHTML(playerProfileUrl);
        const bodyText = $('body').text().replace(/\s+/g, ' ');

        // Strategy: Find "Rzuty za 3" and look at text BEFORE it.
        // Context: "28.0 % Rzuty za 3"

        let threePtVal = '-';

        // Regex to find percentage before "Rzuty za 3"
        // Look for: number % Rzuty za 3
        const regex = /([\d\.,]+)\s*%\s*Rzuty za 3/i;
        const match = bodyText.match(regex);

        if (match) {
            threePtVal = match[1] + '%';
        } else {
            // Try "3pkt" or other variants
            const regex2 = /([\d\.,]+)\s*%\s*3pkt/i;
            const match2 = bodyText.match(regex2);
            if (match2) threePtVal = match2[1] + '%';
        }

        console.log(`[Scraper] Deep scrape result: ${threePtVal}`);
        return { threePt: threePtVal };

    } catch (e) {
        console.error(`[Scraper] Deep scrape failed: ${e.message}`);
        return null;
    }
}

// 7. Main scrape function
export async function runFullScrape() {
    console.log('[Scraper] ========================================');
    console.log('[Scraper] Starting KALK Dywizja II scraper...');
    console.log('[Scraper] ========================================');

    try {
        // Fetch data
        const [table, generalSchedule, teamSchedule, players] = await Promise.all([
            scrapeLeagueTable(),
            scrapeGeneralSchedule(),
            scrapeTeamSchedule(),
            scrapePlayerStats()
        ]);

        const mergedSchedule = mergeSchedules(generalSchedule, teamSchedule);
        console.log(`[Scraper] Scraped ${generalSchedule.length} total matches, merged into ${mergedSchedule.length} unique records`);

        // Save to database in a transaction
        await prisma.$transaction(async (tx) => {
            // Clear old data
            console.log('[Scraper] Clearing old league data...');
            await tx.leagueMatch.deleteMany();
            await tx.leagueTeam.deleteMany();
            // REMOVED: await tx.game.deleteMany(); - We now use upsert to preserve manual notes
            console.log('[Scraper] Database cleared (LeagueMatch, LeagueTeam). Games preserved for upsert.');

            // Insert teams
            if (table.length > 0) {
                await tx.leagueTeam.createMany({ data: table });
                console.log(`[Scraper] Inserted ${table.length} teams`);
            }

            // Insert matches
            if (mergedSchedule.length > 0) {
                // Now we support protocolUrl and details in schema
                const matchesForLeague = mergedSchedule.map(m => ({
                    ...m,
                    details: undefined // Will be populated lazily
                }));
                await tx.leagueMatch.createMany({ data: matchesForLeague });
                console.log(`[Scraper] Successfully inserted ${mergedSchedule.length} matches into LeagueMatch`);
            }

            // Upsert players
            for (const player of players) {
                await tx.kalkPlayer.upsert({
                    where: { id: player.id },
                    update: {
                        name: player.name,
                        team: player.team,
                        matchesPlayed: player.matchesPlayed,
                        pointsTotal: player.pointsTotal,
                        pointsAverage: player.pointsAverage,
                        eval: player.eval,
                        profileUrl: player.profileUrl
                    },
                    create: player
                });
            }
            console.log(`[Scraper] Upserted ${players.length} league players`);
        });

        // 7. Scrape Match Protocols for Finished Games
        console.log('[Scraper] Checking for missing box scores...');
        const finishedMatches = teamSchedule.filter(m => m.isFinished && m.protocolUrl);
        let scrapedCount = 0;

        for (const match of finishedMatches) {
            // Check if game already exists in detailed Game table
            const existing = await prisma.game.findFirst({
                where: {
                    date: match.date,
                    opponent: match.homeTeam.toLowerCase().includes('bekapaka') ? match.guestTeam : match.homeTeam
                }
            });

            console.log(`[Scraper] Processing box score for match vs ${match.homeTeam} - ${match.guestTeam}...`);
            const protocol = await scrapeMatchProtocol(match.protocolUrl);
            if (protocol) {
                const isHome = match.homeTeam.toLowerCase().includes('bekapaka') || match.homeTeam.toLowerCase().includes('bobolice');
                const opponent = isHome ? match.guestTeam : match.homeTeam;
                const scoreUs = isHome ? match.scoreHome : match.scoreAway;
                const scoreThem = isHome ? match.scoreAway : match.scoreHome;

                if (existing) {
                    // UPDATE existing game (preserve manual notes)
                    await prisma.game.update({
                        where: { id: existing.id },
                        data: {
                            scoreUs: scoreUs,
                            scoreThem: scoreThem,
                            result: scoreUs > scoreThem ? 'W' : 'L',
                            data: protocol,
                            playerStats: protocol.teams.find(t => t.isBekapaka)?.players || [],
                            teamStats: protocol.teams
                        }
                    });
                    console.log(`[Scraper] Updated existing game: vs ${opponent}`);
                } else {
                    // CREATE new game
                    await prisma.game.create({
                        data: {
                            date: match.date,
                            opponent: opponent,
                            homeAway: isHome ? 'home' : 'away',
                            scoreUs: scoreUs,
                            scoreThem: scoreThem,
                            result: scoreUs > scoreThem ? 'W' : 'L',
                            data: protocol,
                            playerStats: protocol.teams.find(t => t.isBekapaka)?.players || [],
                            teamStats: protocol.teams
                        }
                    });
                    console.log(`[Scraper] Created new game record: vs ${opponent}`);
                }
                scrapedCount++;
            }
        }
        console.log(`[Scraper] Saved ${scrapedCount} new box scores to Game table`);

        console.log('[Scraper] ========================================');
        console.log('[Scraper] Scraping completed successfully!');
        console.log(`[Scraper] Summary: ${table.length} teams, ${teamSchedule.length} matches, ${players.length} players`);
        console.log('[Scraper] ========================================');

        return {
            success: true,
            teams: table.length,
            matches: teamSchedule.length,
            players: players.length
        };
    } catch (error) {
        console.error('[Scraper] Fatal error:', error);
        throw error;
    }
}
