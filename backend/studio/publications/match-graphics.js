// Content of the post-match graphic set (reference publication 18.10.2026): poster cover, our leaders and
// „Klucz do wygranej” comparison, all built from confirmed facts. Every number comes from facts.report or facts.leaders.
import { count } from './templates.js';

const has = (v) => v !== null && v !== undefined && v !== '';
const fin = (v) => Number.isFinite(v);
// Column header of the rival: its own acronym („GMVT TEAM” → GMVT), else initials or the first letters of one word.
export function columnName(name) {
  const words = String(name || '').split(/[\s\-–]+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean);
  if (!words.length) return 'RYWAL';
  if (/^[\p{Lu}\p{N}]{2,6}$/u.test(words[0])) return words[0];
  const short = words.length > 1 ? words.map((w) => w[0]).join('').slice(0, 4) : words[0].slice(0, 6);
  return short.toLocaleUpperCase('pl-PL');
}

const dateLabel = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};
export const kickerOf = (f) => (has(f.round) ? `${f.round}. kolejka ${f.competition || 'KALK'}` : f.competition || '').slice(0, 60);
const scored = (f) => fin(f.scoreUs) && fin(f.scoreThem);
export const subtitleOf = (f) =>
  [scored(f) ? `BeKaPaKa ${f.scoreUs}:${f.scoreThem} ${String(f.opponent || '').toLocaleUpperCase('pl-PL')}` : '', dateLabel(f.date)].filter(has).join(' · ').slice(0, 120);

// Team comparison metrics. `lower` marks a stat where fewer is better.
const METRICS = [
  { key: 'orb', label: 'Zbiórki w ataku', hero: 'zbiórki w ataku', detail: (us, them) => (fin(us.secondChancePts) ? `${us.secondChancePts} pkt drugiej szansy${fin(them.secondChancePts) ? ` (rywal ${them.secondChancePts})` : ''}` : '') },
  { key: 'ptsOffTurnovers', label: 'Punkty po stratach', hero: 'pkt po stratach', detail: (us, them) => (fin(them.tov) ? `${count(them.tov, 'strata', 'straty', 'strat')} rywala` : '') },
  { key: 'fastBreakPts', label: 'Punkty z kontry', hero: 'pkt z kontry' },
  { key: 'stl', label: 'Przechwyty', hero: 'przechwyty' },
  { key: 'reb', label: 'Zbiórki', hero: 'zbiórki' },
  { key: 'ast', label: 'Asysty', hero: 'asysty' },
  { key: 'benchPts', label: 'Punkty z ławki', hero: 'pkt z ławki' },
  { key: 'blk', label: 'Bloki', hero: 'bloki' },
  { key: 'tov', label: 'Straty', hero: 'straty', lower: true },
];

/** Comparisons with both values known, the ones where BeKaPaKa was clearly better first. */
export function teamComparisons(report) {
  const us = report?.team?.us, them = report?.team?.them;
  if (!us || !them) return [];
  return METRICS.filter((m) => fin(us[m.key]) && fin(them[m.key]))
    .map((m, order) => {
      const gap = m.lower ? them[m.key] - us[m.key] : us[m.key] - them[m.key];
      return { ...m, order, us: us[m.key], them: them[m.key], gap, edge: gap / Math.max(m.lower ? us[m.key] : them[m.key], 1), detailText: m.detail ? m.detail(us, them) : '' };
    })
    .sort((a, b) => (b.gap > 0) - (a.gap > 0) || (b.gap > 0 ? b.edge - a.edge : a.order - b.order));
}

const locative = (quarter) => {
  const m = /^(\d)\. kwarta$/.exec(quarter || '');
  return m ? `w ${m[1]}. kwarcie` : /^dogrywka/i.test(quarter || '') ? 'w dogrywce' : '';
};
/** The club's longest scoring run as „12:0”, labelled with when it happened. */
export function bestRun(report) {
  const runs = (report?.flow?.runs || []).filter((r) => r.team === 'us');
  if (!runs.length) return null;
  const r = runs.reduce((a, b) => (b.points > a.points ? b : a));
  const [fu, ft] = r.from.split(':').map(Number), [tu, tt] = r.to.split(':').map(Number);
  if (tu - fu < 6) return null;
  const afterBreak = r.quarter === '3. kwarta' && r.fromMinute <= 22;
  return { value: `${tu - fu}:${tt - ft}`, label: afterBreak ? 'seria po przerwie' : `seria ${locative(r.quarter)}`.trim() };
}

/** Poster cover: kicker, two hero numbers (best run, biggest edge) and the quarters. */
export function posterContent(f) {
  const report = f.report;
  const edges = teamComparisons(report).filter((c) => c.gap > 0);
  const run = bestRun(report);
  const heroStats = [...(run ? [run] : []), ...edges.map((c) => ({ value: String(c.us), label: c.hero }))].slice(0, 2);
  return { kicker: kickerOf(f), heroStats, quarters: (report?.quarters || []).slice(0, 5) };
}

// Player detail line: what besides points made the performance.
function playerDetail(p) {
  return [
    p.reb >= 5 ? count(p.reb, 'zbiórka', 'zbiórki', 'zbiórek') : '',
    p.ast >= 3 ? count(p.ast, 'asysta', 'asysty', 'asyst') : '',
    p.stl >= 3 ? count(p.stl, 'przechwyt', 'przechwyty', 'przechwytów') : '',
    has(p.fg) ? `${p.fg} z gry` : '',
  ]
    .filter(has)
    .slice(0, 3)
    .join(' · ')
    .slice(0, 100);
}
const shirt = (n) => (fin(n) && n >= 0 && n <= 999 ? String(n) : '');

/** Our leaders: three top scorers and the best rebounder outside them (from the box score), else the KALK leaders. */
export function leaderRows(f) {
  const players = f.report?.players || [];
  if (players.length) {
    const scorers = [...players].filter((p) => p.pts > 0).sort((a, b) => b.pts - a.pts).slice(0, 3);
    const rows = scorers.map((p) => ({ label: p.name, value: String(p.pts), unit: 'PKT', detail: playerDetail(p), number: shirt(p.number), value2: '' }));
    const rebounder = [...players].filter((p) => !scorers.includes(p) && p.reb >= 5).sort((a, b) => b.reb - a.reb)[0];
    if (rebounder) rows.push({ label: rebounder.name, value: String(rebounder.reb), unit: 'ZB.', detail: rebounder.pts > 0 ? count(rebounder.pts, 'punkt', 'punkty', 'punktów') : '', number: shirt(rebounder.number), value2: '' });
    if (rows.length) return rows;
  }
  return (f.leaders || []).map((l) => ({ label: l.name, value: l.value, detail: l.stat, unit: '', number: '', value2: '' }));
}

/** „Klucz do wygranej”: four comparisons where BeKaPaKa was best, completed with the remaining known ones. */
export function comparisonRows(f) {
  return teamComparisons(f.report)
    .slice(0, 4)
    .map((c) => ({ label: c.label, value: String(c.us), value2: String(c.them), detail: c.detailText.slice(0, 100), unit: '', number: '' }));
}

const won = (f) => scored(f) && f.scoreUs > f.scoreThem;
const vsLine = (f) => `BeKaPaKa – ${f.opponent}${scored(f) ? ` ${f.scoreUs}:${f.scoreThem}` : ''}`;

/** Content per graphic role of the post-match set; null when the facts cannot fill it. */
export function setContent(role, f) {
  if (role === 'poster') return posterContent(f);
  if (role === 'leaders') {
    const tableRows = leaderRows(f);
    if (!tableRows.length) return null;
    return {
      title: 'Nasi liderzy',
      kicker: kickerOf(f),
      subtitle: subtitleOf(f),
      tableRows,
      altText: `Nasi liderzy w meczu ${vsLine(f)}: ${tableRows.map((r) => `${r.label} ${r.unit === 'ZB.' ? count(Number(r.value), 'zbiórka', 'zbiórki', 'zbiórek') : `${r.value}${r.unit ? ` ${r.unit.toLowerCase()}` : ''}`}`).join(', ')}.`,
    };
  }
  if (role === 'comparison') {
    const tableRows = comparisonRows(f);
    if (!tableRows.length) return null;
    return {
      title: won(f) ? 'Klucz do wygranej' : 'Mecz w liczbach',
      kicker: kickerOf(f),
      subtitle: subtitleOf(f),
      columns: ['BKPK', columnName(f.opponent)],
      tableRows,
      altText: `${won(f) ? 'Klucz do wygranej' : 'Mecz w liczbach'} – ${vsLine(f)}: ${tableRows.map((r) => `${r.label.toLowerCase()} ${r.value}:${r.value2}`).join(', ')}.`,
    };
  }
  return {};
}
