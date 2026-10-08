/**
 * Kalendarz .ics terminarza BeKaPaKa (RFC 5545) — subskrypcja w telefonie i „Dodaj do kalendarza”.
 * Te same reguły co strona (site/lib/calendar-ics.ts): UTC, ucieczka znaków, łamanie linii, UID
 * `bekapaka-kalk-<id>@bekapaka.pl` (ten sam mecz ze strony i z panelu nie dubluje się w kalendarzu).
 * Bez danych wewnętrznych (zbiórka, uwagi trenera) — plik jest publiczny.
 */
import { isBekapakaTeamName } from '../kalk/parseMatchBoxScore.js';

const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;

export function escapeIcsText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function toIcsUtc(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Linie dłuższe niż 75 znaków łamane CRLF + spacja. */
export function foldIcsLine(line) {
  const max = 75;
  if (line.length <= max) return line;
  const parts = [line.slice(0, max)];
  let rest = line.slice(max);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, max - 1)}`);
    rest = rest.slice(max - 1);
  }
  return parts.join('\r\n');
}

/** Mecz z terminarza (LeagueMatch) → wydarzenie kalendarza. */
export function leagueMatchToEvent(m) {
  const start = new Date(m.date);
  if (Number.isNaN(start.getTime())) return null;
  const score = m.isFinished && m.scoreHome != null && m.scoreAway != null ? ` (${m.scoreHome}:${m.scoreAway})` : '';
  const details = [m.phaseLabel, m.roundLabel].filter(Boolean).join(' · ');
  return {
    uid: `bekapaka-kalk-${m.kalkMatchId || m.id}@bekapaka.pl`,
    title: `${m.homeTeam} – ${m.guestTeam}${score}`,
    description: `Liga KALK, Dywizja II${details ? ` — ${details}` : ''}. Gospodarz: ${m.homeTeam}.`,
    location: m.venue || '',
    start,
    end: new Date(start.getTime() + MATCH_DURATION_MS)
  };
}

/** Kalendarz z wieloma wydarzeniami (lub jednym). */
export function buildIcsCalendar(events, { name = 'BeKaPaKa Bobolice — mecze', now = new Date() } = {}) {
  const stamp = toIcsUtc(now);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BeKaPaKa Bobolice//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(name)}`,
    'X-WR-TIMEZONE:Europe/Warsaw'
  ];
  for (const e of events) {
    if (!e) continue;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsUtc(e.start)}`,
      `DTEND:${toIcsUtc(e.end)}`,
      `SUMMARY:${escapeIcsText(e.title)}`,
      `DESCRIPTION:${escapeIcsText(e.description)}`,
      ...(e.location ? [`LOCATION:${escapeIcsText(e.location)}`] : []),
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
}

/** Mecze BeKaPaKa z terminarza sezonu (opcjonalnie jeden mecz). */
export function selectTeamMatches(rows, matchId = null) {
  return (rows || [])
    .filter((m) => isBekapakaTeamName(m.homeTeam) || isBekapakaTeamName(m.guestTeam))
    .filter((m) => !matchId || m.kalkMatchId === matchId || m.id === matchId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
