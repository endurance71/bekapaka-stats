/**
 * Raport o rywalu i odprawa przedmeczowa (A4 / PDF), także z aplikacji na iPhonie.
 * W PWA iOS `window.print()` nie działa, a Safari nie ma sesji aplikacji — dlatego panel pobiera krótki
 * podpisany link (15 min), otwiera go w Safari, a serwer zwraca gotowe strony A4 do druku lub zapisu PDF.
 *
 * Wygląd wg brandbooka 2.0 (tokens.json): czerń #0B0B0B, czerwień #EF1734, papier #F3F1EC, fonty Barlow
 * Condensed ExtraBold + Barlow, herb 2.0 z napisem BOBOLICE. Rywal bez logo (neutralna tarcza, zasada M8).
 */
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { POSITION_TO_SPOT, ZONE_SPOTS } from '../ai/prompts/teamDefense.pl.js';

const SCOPE = 'pregame-print';
export const PRINT_LINK_TTL = '15m';

export function signPrintToken(secret, { seasonId, opponent }) {
  return jwt.sign({ scope: SCOPE, seasonId, opponent }, secret, { expiresIn: PRINT_LINK_TTL });
}

/** @returns {{ seasonId: string, opponent: string } | null} */
export function verifyPrintToken(secret, token) {
  try {
    const payload = jwt.verify(String(token || ''), secret);
    if (payload?.scope !== SCOPE || !payload.opponent || !payload.seasonId) return null;
    return { seasonId: payload.seasonId, opponent: payload.opponent };
  } catch {
    return null;
  }
}

/** Pliki marki serwowane obok strony druku (fonty i herb) — tylko z tej listy. */
const BRAND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../studio/brand/02_system');
export const PRINT_ASSETS = {
  'BarlowCondensed-ExtraBold.ttf': { file: path.join(BRAND_DIR, 'fonts/BarlowCondensed-ExtraBold.ttf'), type: 'font/ttf' },
  'Barlow-SemiBold.ttf': { file: path.join(BRAND_DIR, 'fonts/Barlow-SemiBold.ttf'), type: 'font/ttf' },
  'Barlow-Regular.ttf': { file: path.join(BRAND_DIR, 'fonts/Barlow-Regular.ttf'), type: 'font/ttf' },
  'herb2-kolor.svg': { file: path.join(BRAND_DIR, 'symbole/svg/herb2-kolor.svg'), type: 'image/svg+xml' }
};

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const asList = (v) => (Array.isArray(v) ? v : []);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const NONE = '—';
const FOCUS = { offense: 'Atak', defense: 'Obrona', transition: 'Przejście', rebounding: 'Zbiórki', mental: 'Nastawienie' };

/** Liczba po polsku (przecinek dziesiętny). */
export function fmt(v, digits = 1) {
  if (!isNum(v)) return NONE;
  return v.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: digits });
}
const pct = (v) => (isNum(v) ? `${fmt(v)}%` : NONE);
const signed = (v) => (isNum(v) ? `${v > 0 ? '+' : ''}${fmt(v)}` : NONE);
const sample = (n) => (n === 1 ? '1 mecz' : n >= 2 && n <= 4 ? `${n} mecze` : `${n} meczów`);

const fold = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const surname = (name) => fold(String(name || '').trim().split(/\s+/).pop());

/** Odmienione nazwisko z tekstu („Głodka”, „Nagórskiego”) → zawodnik z listy. */
export function findBySurname(players, word) {
  const w = fold(word);
  if (w.length < 3) return null;
  const hits = asList(players).filter((p) => {
    const s = surname(p.name);
    let i = 0;
    while (i < s.length && i < w.length && s[i] === w[i]) i += 1;
    return i >= Math.min(4, s.length) && i >= s.length - 2;
  });
  return hits.length === 1 ? hits[0] : null;
}

/** Bardzo prosty Markdown z tekstów analizy: akapity, listy „- ”, nagłówki „### ”, **pogrubienie**. */
export function mdLite(text) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const out = [];
  let list = [];
  const flush = () => {
    if (list.length) out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`);
    list = [];
  };
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (/^[-•*]\s+/.test(line)) list.push(line.replace(/^[-•*]\s+/, ''));
    else if (/^#{1,4}\s+/.test(line)) {
      flush();
      out.push(`<h4>${inline(line.replace(/^#{1,4}\s+/, ''))}</h4>`);
    } else {
      flush();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  flush();
  return out.join('');
}

/** Linie „- Nazwisko: …” z analizy → mapa nazwisko → tekst. */
function linesByPlayer(text, players) {
  const map = new Map();
  for (const raw of String(text || '').split('\n')) {
    const m = raw.trim().match(/^[-•*]\s*(?:\*\*)?([^:*]{2,40}?)(?:\*\*)?:\s*(.+)$/);
    if (!m) continue;
    const p = findBySurname(players, m[1].trim().split(/\s+/).pop());
    if (p && !map.has(p.name)) map.set(p.name, m[2].trim());
  }
  return map;
}

const initials = (name) =>
  String(name || '')
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** Neutralna tarcza rywala z inicjałami (bez logo — zasada M8 marki). */
const shield = (name) => `<svg class="shield" viewBox="0 0 100 112" aria-hidden="true"><path d="M50 4 94 18v38c0 26-19 44-44 52C25 100 6 82 6 56V18z" fill="#F7F6F2" stroke="#F7F6F2" stroke-width="0"/><path d="M50 12 86 23v33c0 21-15 36-36 43-21-7-36-22-36-43V23z" fill="#2A2826"/><text x="50" y="66" text-anchor="middle">${esc(initials(name))}</text></svg>`;

const tableName = (n) => String(n || '').replace(/\s+/g, ' ').trim();
const sameTeam = (a, b) => fold(a) && fold(a) === fold(b);

// ───────────────────────── sekcje ─────────────────────────

function hero({ opponent, report, facts }) {
  const us = report?.teams?.us;
  const them = report?.teams?.them;
  const season = report?.seasonLabel ? `Sezon ${report.seasonLabel}` : '';
  return `<header class="hero">
  <svg class="v" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true"><path d="M150 0h70l-20 150L180 0z" fill="#AE1027" opacity=".0"/><path d="M190 0h120L250 300 230 300z" fill="#EF1734" opacity=".9"/><path d="M330 0h40L262 300h-14z" fill="#EF1734" opacity=".45"/></svg>
  <div class="hero-top">
    <img class="herb" src="assets/herb2-kolor.svg" alt="BeKaPaKa Bobolice">
    <div class="kicker">Raport o rywalu<br><span>Dywizja II${season ? ` · ${esc(season)}` : ''}</span></div>
  </div>
  <div class="versus">
    <div class="team us"><div class="tname">BeKaPaKa<br>Bobolice</div><div class="tmeta">${us?.rank ? `${esc(us.rank)}. miejsce · ` : ''}bilans ${esc(us?.record || NONE)}</div></div>
    <div class="vs">vs</div>
    <div class="team them">${shield(opponent)}<div><div class="tname">${esc(opponent)}</div><div class="tmeta">${them?.rank ? `${esc(them.rank)}. miejsce · ` : ''}bilans ${esc(them?.record || NONE)}</div></div></div>
  </div>
  <div class="facts">${facts.map(([k, v]) => `<div><b>${esc(k)}</b>${esc(v)}</div>`).join('')}</div>
</header>`;
}

function kpis(report) {
  const us = report.averages?.us || {};
  const them = report.averages?.them || {};
  const tu = report.teams?.us || {};
  const tt = report.teams?.them || {};
  const tiles = [
    ['Punkty na mecz', tt.ppg, tu.ppg, false],
    ['Stracone na mecz', tt.oppg, tu.oppg, true],
    ['Bilans punktów', isNum(tt.ppg) && isNum(tt.oppg) ? tt.ppg - tt.oppg : null, isNum(tu.ppg) && isNum(tu.oppg) ? tu.ppg - tu.oppg : null, false, true],
    ['Straty na mecz', them.tovPg, us.tovPg, true],
    ['Zbiórki w ataku', them.orbPg, us.orbPg, false],
    ['Punkty z kontry', them.fastBreakPtsPg, us.fastBreakPtsPg, false]
  ];
  return `<div class="kpis">${tiles
    .map(([label, t, u, lower, sign]) => {
      const f = sign ? signed : fmt;
      const weBetter = isNum(t) && isNum(u) && (lower ? u < t : u > t);
      return `<div class="kpi"><b>${esc(label)}</b><div class="big">${f(t)}</div><div class="cmp ${weBetter ? 'good' : ''}">my: ${f(u)}</div></div>`;
    })
    .join('')}</div>`;
}

const COMPARE = [
  ['Punkty zdobyte', 'ppg'],
  ['Punkty stracone', 'oppg', true],
  ['Zbiórki', 'rpg'],
  ['Zbiórki w ataku', 'orbPg'],
  ['Asysty', 'apg'],
  ['Przechwyty', 'spg'],
  ['Bloki', 'bpg'],
  ['Straty', 'tovPg', true],
  ['Faule', 'pfPg', true],
  ['Trafione za 3', 'threePmPg'],
  ['Skuteczność za 3 (%)', 'threePct'],
  ['Rzuty wolne (%)', 'ftPct'],
  ['Punkty z kontry', 'fastBreakPtsPg'],
  ['Punkty po stratach rywala', 'ptsOffTurnoversPg'],
  ['Punkty z drugiej szansy', 'secondChancePtsPg'],
  ['Punkty ławki', 'benchPtsPg']
];

function compareBars(report, opponent) {
  const us = { ...(report.averages?.us || {}), ppg: report.teams?.us?.ppg ?? report.averages?.us?.ppg, oppg: report.teams?.us?.oppg ?? report.averages?.us?.oppg };
  const them = { ...(report.averages?.them || {}), ppg: report.teams?.them?.ppg ?? report.averages?.them?.ppg, oppg: report.teams?.them?.oppg ?? report.averages?.them?.oppg };
  const rows = COMPARE.filter(([, k]) => isNum(us[k]) || isNum(them[k]))
    .map(([label, k, lower]) => {
      const u = us[k];
      const t = them[k];
      const max = Math.max(isNum(u) ? u : 0, isNum(t) ? t : 0) || 1;
      const better = isNum(u) && isNum(t) && u !== t ? ((lower ? u < t : u > t) ? 'us' : 'them') : '';
      return `<div class="crow ${better}"><span class="cv u">${fmt(u)}</span><span class="cb u"><i style="width:${isNum(u) ? Math.round((u / max) * 100) : 0}%"></i></span><span class="cl">${esc(label)}${lower ? '<em>mniej = lepiej</em>' : ''}</span><span class="cb t"><i style="width:${isNum(t) ? Math.round((t / max) * 100) : 0}%"></i></span><span class="cv t">${fmt(t)}</span></div>`;
    })
    .join('');
  if (!rows) return '';
  const games = report.averages?.them?.games;
  return `<section class="card">
  <h2>Porównanie drużyn <small>średnio na mecz${isNum(games) ? ` · rywal: ${sample(games)}` : ''}</small></h2>
  <div class="clegend"><span class="lu">BeKaPaKa</span><span class="lt">${esc(opponent)}</span></div>
  <div class="compare">${rows}</div>
  <p class="note">Wyróżniona strona jest lepsza w danej kategorii.</p>
</section>`;
}

function factorCards(report) {
  const a = report.advanced?.us || {};
  const b = report.advanced?.them || {};
  const fa = a.fourFactors || {};
  const fb = b.fourFactors || {};
  const items = [
    ['Tempo', 'posiadania na mecz', a.pace, b.pace, null],
    ['Skuteczność rzutów', 'eFG — trójka liczona ×1,5', fa.efg, fb.efg, false, true],
    ['Straty', 'na 100 akcji', fa.tov, fb.tov, true, true],
    ['Zbiórki w ataku', '% piłek z własnej tablicy', fa.orb, fb.orb, false, true],
    ['Rzuty wolne', 'na 100 rzutów z gry', fa.ftr, fb.ftr, false]
  ].filter(([, , u, t]) => isNum(u) || isNum(t));
  if (!items.length) return '';
  return `<div class="factors">${items
    .map(([label, hint, u, t, lower, isPct]) => {
      const max = Math.max(isNum(u) ? u : 0, isNum(t) ? t : 0) || 1;
      const f = isPct ? pct : fmt;
      const better = lower === null || !isNum(u) || !isNum(t) || u === t ? '' : (lower ? u < t : u > t) ? 'us' : 'them';
      return `<div class="factor ${better}"><b>${esc(label)}</b><small>${esc(hint)}</small>
      <div class="fbar u"><i style="width:${isNum(u) ? Math.round((u / max) * 100) : 0}%"></i><span>${f(u)}</span></div>
      <div class="fbar t"><i style="width:${isNum(t) ? Math.round((t / max) * 100) : 0}%"></i><span>${f(t)}</span></div></div>`;
    })
    .join('')}</div>`;
}

function shotProfile(report, opponent) {
  const row = (label, sp, cls) =>
    sp && (isNum(sp.two) || isNum(sp.three))
      ? `<div class="sp"><span class="spl">${esc(label)}</span><div class="spbar ${cls}">${[
          ['two', 'za 2'],
          ['three', 'za 3'],
          ['ft', 'wolne']
        ]
          .map(([k, l]) => (isNum(sp[k]) && sp[k] > 0 ? `<i class="${k}" style="width:${sp[k]}%">${sp[k] >= 20 ? `<span>${l} ${fmt(sp[k], 0)}%</span>` : ''}</i>` : ''))
          .join('')}</div><small class="spn">za 2: ${pct(sp.two)} · za 3: ${pct(sp.three)} · wolne: ${pct(sp.ft)}</small></div>`
      : '';
  const html = row('BeKaPaKa', report.advanced?.us?.shotProfile, 'u') + row(opponent, report.advanced?.them?.shotProfile, 't');
  return html ? `<div class="subcard"><h3>Skąd biorą się punkty</h3>${html}</div>` : '';
}

function quarters(report, opponent) {
  const qa = report.averages?.us?.quarterScoring;
  const qb = report.averages?.them?.quarterScoring;
  if (!qa && !qb) return '';
  const diffs = ['q1', 'q2', 'q3', 'q4'].flatMap((q) => [qa?.[q], qb?.[q]].filter(Boolean).map((x) => Math.abs((x.for ?? 0) - (x.against ?? 0))));
  const max = Math.max(4, ...diffs);
  const cell = (x, cls) => {
    if (!x) return `<td colspan="3" class="na">${NONE}</td>`;
    const d = (x.for ?? 0) - (x.against ?? 0);
    const w = Math.round((Math.abs(d) / max) * 50);
    return `<td class="qs">${fmt(x.for)}:${fmt(x.against)}</td><td class="qd ${cls}"><span class="axis"></span><i class="${d >= 0 ? 'pos' : 'neg'}" style="width:${w}%"></i></td><td class="qn ${d >= 0 ? 'pos' : 'neg'}">${signed(Math.round(d * 10) / 10)}</td>`;
  };
  const body = ['q1', 'q2', 'q3', 'q4']
    .map((q, i) => `<tr><th>${i + 1}. kw.</th>${cell(qa?.[q], 'u')}${cell(qb?.[q], 't')}</tr>`)
    .join('');
  return `<div class="subcard"><h3>Kwarty — średnio zdobyte : stracone</h3>
  <table class="qt"><thead><tr><th></th><th colspan="3">BeKaPaKa</th><th colspan="3">${esc(shortTeam(opponent))}</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

function tendencies(report, opponent) {
  const p = report.pbp?.them;
  if (!p?.available) return '';
  const u = report.pbp?.us?.available ? report.pbp.us : null;
  const runs = (x) => `${fmt(x.runsOf8PlusFor, 0)} : ${fmt(x.runsOf8PlusAgainst, 0)}`;
  const clutch = (x) => (x.clutch ? `${fmt(x.clutch.avgPointsFor)} : ${fmt(x.clutch.avgPointsAgainst)}` : NONE);
  const tiles = [
    ['Serie 8:0 i więcej', runs(p), 'zdobyte : stracone', u && runs(u)],
    ['Zmiany prowadzenia', fmt(p.avgLeadChanges), 'średnio w meczu', u && fmt(u.avgLeadChanges)],
    ['Końcówka meczu', clutch(p), 'pkt zdobyte : stracone', u && clutch(u)],
    ['Faule', fmt(p.avgFoulsPerGame), 'na mecz', u && fmt(u.avgFoulsPerGame)],
    ['Wykluczenia za 5 fauli', fmt(p.playersFouledOut, 0), `w ${sample(p.matchesWithPbp || 0)}`, u && `${fmt(u.playersFouledOut, 0)} w ${sample(u.matchesWithPbp || 0)}`]
  ];
  const fq = p.avgFoulsByPeriod || {};
  const qs = ['Q1', 'Q2', 'Q3', 'Q4'].filter((q) => isNum(fq[q]));
  const fmax = Math.max(1, ...qs.map((q) => fq[q]));
  const fouls = qs.length
    ? `<div class="fq"><b>Faule rywala w kwartach</b>${qs
        .map((q, i) => `<div class="fqc"><div class="fqb"><i style="height:${Math.round((fq[q] / fmax) * 100)}%"></i></div><span>${fmt(fq[q])}</span><em>${i + 1}. kw.</em></div>`)
        .join('')}</div>`
    : '';
  return `<div class="subcard"><h3>${esc(opponent)} — przebieg meczów <small>zapis akcji po akcji, ${sample(p.matchesWithPbp || 0)}</small></h3>
  <div class="tiles">${tiles.map(([k, v, s, mine]) => `<div class="tile"><b>${esc(k)}</b><span>${esc(v)}</span><small>${esc(s)}</small>${mine ? `<small class="mine">my: ${esc(mine)}</small>` : ''}</div>`).join('')}</div>${fouls}</div>`;
}

function formStrip(label, list) {
  const items = asList(list).slice(0, 5);
  if (!items.length) return '';
  return `<div class="form"><span class="fl">${esc(label)}</span>${items
    .map(
      (f) =>
        `<span class="fr ${f.result === 'W' ? 'w' : f.result === 'L' ? 'l' : ''}"><b>${f.result === 'W' ? 'W' : f.result === 'L' ? 'P' : '·'}</b><span>${esc(f.score || NONE)}</span><em>${esc(shortTeam(f.opponent))}</em></span>`
    )
    .join('')}</div>`;
}
const shortTeam = (n) => {
  const s = tableName(n);
  return s.length > 16 ? `${s.slice(0, 15)}…` : s;
};

function standings(report, opponent) {
  const rows = asList(report.table);
  if (!rows.length) return '';
  return `<div class="subcard"><h3>Tabela</h3><table class="st"><thead><tr><th>#</th><th>Drużyna</th><th>M</th><th>W-P</th><th>Kosze</th><th>Pkt</th></tr></thead><tbody>${rows
    .map((t) => {
      const cls = /bekapaka/i.test(t.name) ? 'us' : sameTeam(t.name, opponent) ? 'them' : '';
      return `<tr class="${cls}"><td>${esc(t.rank)}</td><td>${esc(tableName(t.name))}</td><td>${esc(t.matches)}</td><td>${esc(t.wins)}-${esc(t.losses)}</td><td>${esc(t.pointsFor)}:${esc(t.pointsAgainst)}</td><td><b>${esc(t.points)}</b></td></tr>`;
    })
    .join('')}</tbody></table></div>`;
}

function history(report) {
  const h2h = asList(report.headToHead);
  const prev = asList(report.previousSeasons?.them);
  if (!h2h.length && !prev.length) return '';
  const h = h2h.length
    ? `<p><b>Nasze mecze z rywalem:</b> ${h2h
        .map((m) => `${esc(m.date ? String(m.date).slice(0, 10) : '')} ${esc(m.score || '')} ${m.result === 'W' ? '(W)' : m.result === 'L' ? '(P)' : ''}`)
        .join(' · ')}</p>`
    : '';
  const p = prev.length
    ? `<p><b>Rywal w poprzednich sezonach:</b> ${prev
        .map((s) => `${esc(String(s.seasonId || '').replace(/^season_(\d{4})-\d{2}(\d{2})$/, '$1/$2'))}: ${esc(s.record)} (${fmt(s.ppg)}:${fmt(s.oppg)})`)
        .join(' · ')}</p>`
    : '';
  return `<div class="subcard hist">${h}${p}</div>`;
}

// ── zawodnicy ──
const STAT = [
  ['pts', 'pkt'],
  ['reb', 'zb'],
  ['ast', 'as'],
  ['stl', 'prz'],
  ['tov', 'str'],
  ['min', 'min']
];

function delta(cur, prev, lower = false) {
  if (!isNum(cur) || !isNum(prev)) return '';
  const d = Math.round((cur - prev) * 10) / 10;
  if (Math.abs(d) < 0.5) return '<em class="d eq">=</em>';
  const up = d > 0;
  return `<em class="d ${up !== lower ? 'up' : 'down'}">${up ? '▲' : '▼'}${fmt(Math.abs(d))}</em>`;
}

function playerCard(p, prevLabel, howTo) {
  const c = p.current || {};
  const prev = asList(p.previous)[0] || null;
  const meta = [p.position, isNum(p.heightCm) ? `${p.heightCm} cm` : null, isNum(p.birthYear) ? `rocznik ${p.birthYear}` : null].filter(Boolean).join(' · ');
  const stats = STAT.map(([k, l]) => {
    const v = c.perGame?.[k];
    const pv = prev?.perGame?.[k];
    return `<div class="ps"><span class="pv">${fmt(v)}</span><span class="pl">${l}</span><span class="pp">${prev ? `${fmt(pv)} ${delta(v, pv, k === 'tov')}` : '&nbsp;'}</span></div>`;
  }).join('');
  const shots = [
    ['za 2', 'two'],
    ['za 3', 'three'],
    ['wolne', 'ft']
  ]
    .map(([l, k]) => {
      const v = c.pct?.[k];
      const pv = prev?.pct?.[k];
      return `<div class="sh"><span class="shl">${l}</span><span class="shb"><i style="width:${isNum(v) ? Math.min(100, v) : 0}%"></i></span><span class="shv">${pct(v)}</span><span class="shp">${prev ? pct(pv) : ''}</span></div>`;
    })
    .join('');
  const facts = [
    `${sample(c.games || 0)}${isNum(p.starts) && p.starts > 0 ? ` (${p.starts} w piątce)` : ''}`,
    isNum(p.plusMinus) ? `+/- ${signed(p.plusMinus)} na mecz (${sample(p.plusMinusGames || 0)})` : null,
    isNum(p.careerBest?.pts) && p.careerBest.pts > 0 ? `rekord: ${p.careerBest.pts} pkt` : null
  ].filter(Boolean);
  const prevLine = prev
    ? `<div class="prev"><b>${esc(prev.seasonLabel || prevLabel || 'Poprzedni sezon')}:</b> ${esc(tableName(prev.teamName))}${prev.competition ? `, ${esc(prev.competition)}` : ''} — ${sample(prev.games)}, ${fmt(prev.perGame?.pts)} pkt, ${fmt(prev.perGame?.reb)} zb, ${fmt(prev.perGame?.ast)} as${
        asList(p.previous).length > 1 ? ` <span class="also">(+ ${asList(p.previous).slice(1).map((s) => `${esc(s.competition || '')} ${sample(s.games)}`).join(', ')})</span>` : ''
      }</div>`
    : `<div class="prev muted">${esc(prevLabel || 'Poprzedni sezon')}: brak meczów w bazie</div>`;
  return `<article class="pcard">
  <div class="phead"><span class="num">${isNum(p.number) ? esc(p.number) : '–'}</span><div><h3>${esc(p.name)}</h3><small>${esc(meta || '')}</small></div></div>
  <div class="pstats">${stats}</div>
  <div class="plegend">${prev ? `pod liczbą: ${esc(prev.seasonLabel || prevLabel || '')} i zmiana` : ''}</div>
  <div class="shots">${shots}</div>
  <div class="pfacts">${facts.map(esc).join(' · ')}</div>
  ${prevLine}
  ${howTo ? `<div class="how"><b>Jak bronić:</b> ${esc(howTo)}</div>` : ''}
</article>`;
}

function rosterTable(players, prevLabel) {
  if (!players.length) return '';
  return `<table class="rt"><thead><tr><th>#</th><th>Zawodnik</th><th>M</th><th>Min</th><th>Pkt</th><th>Zb</th><th>As</th><th>Prz</th><th>Str</th><th>F</th><th>2 pkt</th><th>3 pkt</th><th>RW</th><th>${esc(prevLabel || 'Poprz.')} pkt</th></tr></thead><tbody>${players
    .map((p) => {
      const c = p.current || {};
      const pv = asList(p.previous)[0];
      return `<tr><td>${isNum(p.number) ? esc(p.number) : ''}</td><td class="nm">${esc(p.name)}</td><td>${esc(c.games)}</td><td>${fmt(c.perGame?.min)}</td><td><b>${fmt(c.perGame?.pts)}</b></td><td>${fmt(c.perGame?.reb)}</td><td>${fmt(c.perGame?.ast)}</td><td>${fmt(c.perGame?.stl)}</td><td>${fmt(c.perGame?.tov)}</td><td>${fmt(c.perGame?.pf)}</td><td>${pct(c.pct?.two)}</td><td>${pct(c.pct?.three)}</td><td>${pct(c.pct?.ft)}</td><td>${pv ? `${fmt(pv.perGame?.pts)} <small>(${pv.games} m.${pv.competition && !/II$/.test(pv.competition) ? `, ${esc(pv.competition)}` : ''})</small>` : NONE}</td></tr>`;
    })
    .join('')}</tbody></table>`;
}

// ── plan ──
/** Piątka → miejsca strefy 2-3 (D1–D5 z karty albo z pozycji koszykarskich). */
export function zoneLineup(startingFive) {
  const slots = asList(startingFive);
  const taken = new Map();
  const pending = [];
  for (const slot of slots) {
    const raw = String(slot?.position || '').toUpperCase().trim();
    const id = /^D[1-5]$/.test(raw) ? raw : POSITION_TO_SPOT[raw];
    if (id && !taken.has(id)) taken.set(id, slot);
    else pending.push(slot);
  }
  for (const spot of ZONE_SPOTS) if (!taken.has(spot.id) && pending.length) taken.set(spot.id, pending.shift());
  return ZONE_SPOTS.map((spot) => ({ spot, slot: taken.get(spot.id) || null }));
}

const lastName = (name) => String(name || '').trim().split(/\s+/).pop();

function zoneCourt(lineup) {
  const pos = { D1: [86, 104], D2: [214, 104], D3: [52, 182], D4: [248, 182], D5: [150, 200] };
  const dots = lineup
    .map(({ spot, slot }) => {
      const [x, y] = pos[spot.id];
      const label = slot ? `${slot.number != null ? `#${slot.number} ` : ''}${lastName(slot.name)}` : spot.label;
      return `<g><circle cx="${x}" cy="${y}" r="17" fill="${spot.line === 'top' ? '#EF1734' : '#0B0B0B'}"/><text class="zid" x="${x}" y="${y + 5}" text-anchor="middle">${spot.id}</text><text class="zname" x="${x}" y="${spot.line === 'top' || spot.id === 'D5' ? y - 24 : y + 32}" text-anchor="middle">${esc(label)}</text></g>`;
    })
    .join('');
  return `<svg class="court" viewBox="0 0 300 260" aria-label="Strefa 2-3">
  <rect x="1" y="1" width="298" height="258" fill="#EFEBE3" stroke="#0B0B0B" stroke-width="2"/>
  <path d="M22 259 V200 A128 128 0 0 1 278 200 V259" fill="none" stroke="#0B0B0B" stroke-width="2"/>
  <rect x="105" y="146" width="90" height="113" fill="#E4DED3" stroke="#0B0B0B" stroke-width="2"/>
  <path d="M120 146 A30 30 0 0 1 180 146" fill="none" stroke="#0B0B0B" stroke-width="2"/>
  <line x1="135" y1="244" x2="165" y2="244" stroke="#0B0B0B" stroke-width="3"/><circle cx="150" cy="236" r="6" fill="none" stroke="#EF1734" stroke-width="2.5"/>
  <path d="M86 104 L52 182 L150 200 L242 182 L214 104 Z" fill="rgba(239,23,52,.07)" stroke="#EF1734" stroke-width="1.2" stroke-dasharray="4 4"/>
  ${dots}
</svg>`;
}

/** Zagrożenia dla strefy z liczb zawodników rywala (bez interpretacji modelu). */
function zoneThreats(players) {
  const list = asList(players).filter((p) => p.current?.games > 0);
  const pick = (key, min, fmtRow) =>
    list
      .filter((p) => isNum(p.current.perGame?.[key]) && p.current.perGame[key] >= min)
      .sort((a, b) => b.current.perGame[key] - a.current.perGame[key])
      .slice(0, 3)
      .map((p) => `<li><b>${esc(p.name)}</b> ${fmtRow(p)} <small>(${sample(p.current.games)})</small></li>`)
      .join('');
  const groups = [
    ['Strzelcy z dystansu — doskok', pick('threePm', 0.7, (p) => `${fmt(p.current.perGame.threePm)} trójki na mecz, ${pct(p.current.pct?.three)}`)],
    ['Zbiórki w ataku — zastawiamy', pick('orb', 1.5, (p) => `${fmt(p.current.perGame.orb)} w ataku, ${fmt(p.current.perGame.reb)} razem`)],
    ['Straty — pułapka w rogu', pick('tov', 2, (p) => `${fmt(p.current.perGame.tov)} straty na mecz`)],
    ['Faule — wchodzimy na nich', pick('pf', 3, (p) => `${fmt(p.current.perGame.pf)} fauli na mecz`)]
  ].filter(([, html]) => html);
  if (!groups.length) return '';
  return `<div class="threats">${groups.map(([h, html]) => `<div><h3>${esc(h)}</h3><ul>${html}</ul></div>`).join('')}</div>`;
}

function zoneRow({ spot, slot }, own, prevLabel) {
  const o = own;
  const ownLine = o
    ? `${fmt(o.ppg)} pkt · ${fmt(o.rpg)} zb · ${fmt(o.spg)} prz · ${fmt(o.apg)} as${isNum(o.plusMinusTotal) ? ` · +/- ${signed(o.plusMinusTotal)}` : ''} <small>(${sample(o.games)})</small>`
    : '';
  const oPrev = o && asList(o.previous)[0];
  const ownPrev = oPrev ? `<small class="prevs">${esc(oPrev.seasonLabel || prevLabel || '')}: ${fmt(oPrev.perGame?.pts)} pkt, ${fmt(oPrev.perGame?.reb)} zb (${sample(oPrev.games)})</small>` : '';
  // Stare karty (krycie 1 na 1, „Kryje X.”) nie pasują do strefy — wtedy zadanie miejsca strefy
  const text = slot?.assignment && !/^\s*Kryje\s/u.test(slot.assignment)
    ? slot.assignment.replace(/^\s*D[1-5]\s*[—–-]\s*[^.]{0,40}\.\s*/u, '')
    : spot.duty;
  return `<div class="zr">
  <div class="zspot ${spot.line}"><b>${spot.id}</b><span>${esc(spot.label)}</span></div>
  <div class="zbody"><div class="zwho"><b>${slot ? `${slot.number != null ? `#${esc(slot.number)} ` : ''}${esc(slot.name)}` : NONE}</b><span>${ownLine}</span>${ownPrev}</div><p>${esc(text)}</p></div>
</div>`;
}

// ───────────────────────── strona ─────────────────────────

/**
 * Strony A4 raportu. Logistyka z terminarza i dnia meczowego ma pierwszeństwo przed zapisem odprawy.
 * @param {{ briefing: any, logistics: { matchDate: Date|null, tipoffTime: string|null, gatheringTime: string|null, kit: string|null }, venue?: string|null, opponent: string, report?: any }} data
 */
export function renderPregamePrintHtml({ briefing, logistics, venue, opponent, report = null }) {
  const date = logistics?.matchDate || (briefing?.matchDate ? new Date(briefing.matchDate) : null);
  const dateText = date ? date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' }) : NONE;
  const isoDay = date ? date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }) : '';
  const tipoff = logistics?.tipoffTime || briefing?.tipoffTime || NONE;
  const gathering = logistics?.gatheringTime || briefing?.gatheringTime || NONE;
  const kit = logistics?.kit || briefing?.jerseyColor || 'trener poda';
  const hall = venue || briefing?.venue || NONE;
  const facts = [
    ['Data', dateText],
    ['Zbiórka', gathering],
    ['Początek', tipoff],
    ['Hala', hall],
    ['Strój', kit]
  ];

  const analysis = report?.analysis || null;
  const oppPlayers = asList(report?.opponentPlayers);
  const ownPlayers = asList(report?.ownPlayers);
  const prevLabel = report?.prevSeasonLabel || null;
  const threats = linesByPlayer(analysis?.personnel?.threats, oppPlayers);
  const keyCards = oppPlayers.slice(0, 6);
  const others = oppPlayers.slice(6);
  const short = esc(opponent);

  // Strona 1 — przegląd
  const page1 = `<section class="page">
  ${hero({ opponent, report, facts })}
  ${report ? kpis(report) : ''}
  ${analysis?.summary ? `<section class="card lead"><h2>W skrócie</h2>${mdLite(analysis.summary)}</section>` : ''}
  ${report ? compareBars(report, opponent) : ''}
  ${!report ? '<p class="empty">Brak danych scoutingu rywala w bazie — poniżej sama odprawa.</p>' : ''}
  ${footer(opponent)}
</section>`;

  // Strona 2 — styl gry
  const styleBlocks = report
    ? [factorCards(report), shotProfile(report, opponent), quarters(report, opponent), tendencies(report, opponent)].filter(Boolean)
    : [];
  const forms = report ? formStrip('BeKaPaKa', report.form?.us) + formStrip(opponent, report.form?.them) : '';
  const page2 = report
    ? `<section class="page">
  <h1 class="ph">Styl gry i forma</h1>
  ${styleBlocks[0] ? `<section class="card"><h2>Cztery czynniki i tempo <small><span class="dot u"></span>BeKaPaKa <span class="dot t"></span>${short}</small></h2>${styleBlocks[0]}</section>` : ''}
  <div class="grid2">${styleBlocks.slice(1, 3).join('')}</div>
  ${styleBlocks.slice(3).join('')}
  ${forms ? `<div class="subcard"><h3>Forma — ostatnie mecze <small>W = wygrana, P = porażka; wynik z perspektywy drużyny</small></h3>${forms}</div>` : ''}
  ${standings(report, opponent)}
  ${footer(opponent)}
</section>`
    : '';

  // Strona 3 — atak i obrona rywala (tekst analizy) + tabela i historia
  const threatsHtml = zoneThreats(oppPlayers);
  const hist = report ? history(report) : '';
  const pageText = analysis?.offense || analysis?.defense || hist || threatsHtml
    ? `<section class="page">
  <h1 class="ph">Atak i obrona rywala</h1>
  ${analysis?.offense ? `<section class="card text"><h2>Ich atak</h2>${mdLite(analysis.offense)}</section>` : ''}
  ${analysis?.defense ? `<section class="card text"><h2>Ich obrona</h2>${mdLite(analysis.defense)}</section>` : ''}
  ${analysis?.personnel?.matchups ? `<section class="card text"><h2>Jak ich bronić strefą 2-3</h2>${mdLite(analysis.personnel.matchups)}</section>` : ''}
  ${threatsHtml ? `<section class="card"><h2>Na kogo uważa strefa <small>z liczb sezonu</small></h2>${threatsHtml}</section>` : ''}
  ${hist}
  ${footer(opponent)}
</section>`
    : '';

  // Strona 3 — zawodnicy rywala: bieżący i poprzedni sezon
  const page3 = keyCards.length
    ? `<section class="page">
  <h1 class="ph">Zawodnicy rywala <small>sezon ${esc(report.seasonLabel || '')}${prevLabel ? ` · pod liczbami sezon ${esc(prevLabel)}` : ''} · średnio na mecz</small></h1>
  <div class="pgrid">${keyCards.map((p) => playerCard(p, prevLabel, threats.get(p.name))).join('')}</div>
  ${others.length ? `<section class="card"><h2>Pozostali zawodnicy</h2>${rosterTable(others, prevLabel)}</section>` : ''}
  ${footer(opponent)}
</section>`
    : '';

  // Strona 4 — plan na mecz
  const verdict = String(analysis?.verdict || '').trim();
  const [vHead, ...vRest] = verdict.split('\n');
  const keys = asList(briefing?.tacticalKeys)
    .map(
      (k, i) =>
        `<div class="key"><span class="kn">${esc(k.number ?? i + 1)}</span><div><span class="tag">${esc(FOCUS[k.focus] ?? 'Taktyka')}</span><h3>${esc(k.title)}</h3><p>${esc(k.description)}</p></div></div>`
    )
    .join('');
  const lineup = zoneLineup(briefing?.startingFive);
  const hasFive = lineup.some((l) => l.slot);
  const zoneRows = hasFive
    ? lineup
        .map((l) => zoneRow(l, l.slot && (ownPlayers.find((p) => String(p.playerId) === String(l.slot.playerId)) || ownPlayers.find((p) => fold(p.name) === fold(l.slot.name))), prevLabel))
        .join('')
    : '';
  const locker = asList(analysis?.lockerRoom);
  const sq = report?.squad;
  const squadHtml = sq
    ? `<section class="card squad"><h2>Skład na mecz <small>${sq.available.length} zawodników</small></h2><div class="chips">${sq.available
        .map((p) => `<span class="chip"><b>${p.number != null ? esc(p.number) : "–"}</b>${esc(p.name)}</span>`)
        .join('')}</div>${
        sq.unavailable.length
          ? `<p class="out"><b>Nie grają:</b> ${sq.unavailable.map((p) => `${esc(p.name)}${p.reason === 'kontuzja' ? ' <em>(kontuzja)</em>' : ''}`).join(', ')}</p>`
          : ''
      }</section>`
    : '';
  const page4 = `<section class="page">
  <h1 class="ph">Plan na mecz</h1>
  ${squadHtml}
  ${vHead ? `<section class="klucz"><b>${esc(vHead.replace(/^KLUCZ:\s*/i, ''))}</b>${vRest.length ? mdLite(vRest.join('\n')) : ''}</section>` : ''}
  ${keys ? `<section class="card"><h2>3 kluczowe założenia</h2><div class="keys">${keys}</div></section>` : ''}
  ${locker.length ? `<section class="card szatnia"><h2>Szatnia — 5 rzeczy przed wyjściem</h2><ol>${locker.map((l) => `<li><span class="box"></span>${esc(l)}</li>`).join('')}</ol></section>` : ''}
  ${!briefing ? '<p class="empty">Odprawa na ten mecz nie jest jeszcze gotowa.</p>' : ''}
  ${footer(opponent)}
</section>`;

  const page5 = hasFive || briefing?.benchKeys
    ? `<section class="page">
  <h1 class="ph">Strefa 2-3 <small>pierwsza piątka na miejscach strefy · sezon ${esc(report?.seasonLabel || '')}, średnio na mecz${prevLabel ? ` · pod spodem sezon ${esc(prevLabel)}` : ''}</small></h1>
  ${hasFive || briefing?.benchKeys ? `<div class="zone-top">${hasFive ? `<div class="card zc">${zoneCourt(lineup)}</div>` : ''}${briefing?.benchKeys ? `<section class="card text bench"><h2>Rezerwowi — kto kogo zmienia</h2>${mdLite(briefing.benchKeys)}</section>` : ''}</div>` : ''}
  ${zoneRows ? `<section class="card"><h2>Zadania w strefie</h2><div class="zrows">${zoneRows}</div></section>` : ''}
  ${footer(opponent)}
</section>`
    : '';

  const title = `Raport o rywalu – BeKaPaKa vs ${opponent}${isoDay ? ` – ${isoDay}` : ''}`;
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="toolbar">
  <button type="button" id="print">Zapisz PDF / drukuj</button>
  <span class="hint" id="ios-hint" hidden>iPhone: „Udostępnij” → „Drukuj” → w podglądzie ponownie „Udostępnij” → WhatsApp (wyśle PDF).</span>
  <span class="hint" id="desk-hint">W oknie druku wybierz „Zapisz jako PDF”.</span>
</div>
<main>${page1}${page2}${pageText}${page3}${page4}${page5}</main>
<script src="print.js"></script>
</body>
</html>`;
}

function footer(opponent) {
  return `<footer class="pf"><span>BeKaPaKa Bobolice · raport o rywalu: ${esc(opponent)}</span><span class="pn"></span></footer>`;
}

const CSS = `
@font-face { font-family: 'Barlow Condensed'; font-weight: 800; src: url('assets/BarlowCondensed-ExtraBold.ttf') format('truetype'); }
@font-face { font-family: 'Barlow'; font-weight: 400; src: url('assets/Barlow-Regular.ttf') format('truetype'); }
@font-face { font-family: 'Barlow'; font-weight: 600; src: url('assets/Barlow-SemiBold.ttf') format('truetype'); }
:root { --black:#0B0B0B; --red:#EF1734; --red-dark:#AE1027; --paper:#F3F1EC; --white:#F7F6F2; --muted:#9C978F; --line:#2A2826; --ink:#1d1b19; --card:#FBFAF7; --rule:#DDD8CE; --them:#3B3835; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@page { size: A4; margin: 0; }
html, body { margin: 0; }
body { background: #8f8a82; font: 400 9.6pt/1.38 'Barlow', -apple-system, 'Segoe UI', Arial, sans-serif; color: var(--ink); }
main { padding: 12px 0 24px; counter-reset: pg; }
.page { counter-increment: pg; } .pn::after { content: counter(pg); }
.page { position: relative; width: 210mm; min-height: 297mm; margin: 0 auto 14px; padding: 10mm 11mm 16mm; background: var(--paper); box-shadow: 0 2px 14px rgba(0,0,0,.25); break-after: page; page-break-after: always; overflow-x: hidden; }
.page:last-child { break-after: auto; page-break-after: auto; }
h1, h2, h3, .big, .tname, .vs, .num, .kn, .pv, .kicker { font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif; font-weight: 800; text-transform: uppercase; letter-spacing: .01em; }
h1.ph { font-size: 25pt; line-height: 1; margin: 0 0 4mm; padding-bottom: 2.5mm; border-bottom: 3px solid var(--black); display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
h1.ph::before { content: ''; width: 9px; height: 22px; background: var(--red); transform: skewX(-24deg); align-self: center; }
h1 small, h2 small, h3 small { font: 600 7.4pt/1.2 'Barlow', sans-serif; text-transform: none; letter-spacing: .02em; color: #6f6a62; }
h2 { font-size: 13pt; margin: 0 0 2.5mm; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
h2::before { content: ''; width: 5px; height: 12px; background: var(--red); transform: skewX(-24deg); align-self: center; }
h3 { font-size: 10.5pt; margin: 0 0 2mm; }
p { margin: 0 0 1.6mm; } ul { margin: 0 0 1.6mm; padding-left: 4.5mm; } li { margin-bottom: .8mm; }
.card, .subcard { background: var(--card); border: 1px solid var(--rule); padding: 3.4mm 3.8mm; margin-bottom: 3.2mm; break-inside: avoid; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3.2mm; } .grid2 > * { margin-bottom: 0; } .grid2 { margin-bottom: 3.2mm; }
.grid2.text .card, .card.text { font-size: 9pt; }
.card.text p, .card.text li { font-size: 9pt; line-height: 1.38; }
.note { font-size: 7.4pt; color: #6f6a62; margin: 1.5mm 0 0; }
.empty { padding: 6mm; background: var(--card); border: 1px dashed var(--muted); }
.pf { position: absolute; left: 11mm; right: 11mm; bottom: 7mm; display: flex; justify-content: space-between; font: 600 7pt 'Barlow', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); border-top: 1px solid var(--rule); padding-top: 2mm; }

/* hero */
.hero { position: relative; margin: -10mm -11mm 3.4mm; padding: 7mm 11mm 4.5mm; background: var(--black); color: var(--white); overflow: hidden; }
.hero .v { position: absolute; right: 0; top: 0; width: 58%; height: 74%; }
.hero-top { position: relative; display: flex; align-items: center; gap: 5mm; }
.herb { width: 25mm; height: auto; }
.kicker { font-size: 24pt; line-height: .95; letter-spacing: .02em; }
.kicker span { display: inline-block; margin-top: 1.5mm; font: 600 8pt 'Barlow', sans-serif; letter-spacing: .2em; color: #cfcac2; }
.versus { position: relative; display: grid; grid-template-columns: 1fr auto 1.35fr; align-items: center; gap: 5mm; margin: 3.5mm 0 3mm; }
.tname { font-size: 23pt; line-height: .92; }
.us .tname { color: var(--white); }
.tmeta { font: 600 8pt 'Barlow', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #cfcac2; margin-top: 1.5mm; }
.team.us { border-left: 5px solid var(--red); padding-left: 3mm; }
.team.them { display: flex; align-items: center; gap: 3mm; }
.shield { width: 14mm; height: 16mm; flex: none; } .shield text { font: 800 30px 'Barlow Condensed', sans-serif; fill: var(--white); }
.vs { font-size: 15pt; color: var(--black); background: var(--red); padding: 1mm 3mm; transform: skewX(-12deg); }
.facts { position: relative; display: grid; grid-template-columns: 1.7fr .8fr .8fr 1.3fr 1fr; border-top: 1px solid var(--line); }
.facts div { padding: 2.2mm 2.5mm 0 0; font: 600 9.2pt/1.25 'Barlow', sans-serif; }
.facts b { display: block; font-size: 6.6pt; letter-spacing: .18em; text-transform: uppercase; color: var(--red); margin-bottom: .6mm; }

/* KPI */
.kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2.2mm; margin-bottom: 3.2mm; }
.kpi { background: var(--black); color: var(--white); padding: 2.6mm 2.6mm 2.2mm; break-inside: avoid; }
.kpi b { display: block; font: 600 6.6pt/1.15 'Barlow', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #cfcac2; min-height: 2.3em; }
.kpi .big { font-size: 23pt; line-height: 1; margin: .8mm 0 .6mm; }
.kpi .cmp { font: 600 7.6pt 'Barlow', sans-serif; color: #cfcac2; }
.kpi .cmp.good { color: var(--white); } .kpi .cmp.good::after { content: ' ✓'; color: var(--red); }
.lead p { font-size: 9.8pt; }

/* porównanie */
.clegend { display: flex; justify-content: space-between; font: 800 9pt 'Barlow Condensed', sans-serif; text-transform: uppercase; margin-bottom: 1.2mm; }
.clegend .lu { color: var(--red); } .clegend .lt { color: var(--them); }
.crow { display: grid; grid-template-columns: 11mm 1fr 44mm 1fr 11mm; align-items: center; gap: 2mm; padding: .45mm 0; border-bottom: 1px solid #ebe7df; }
.crow:last-child { border-bottom: 0; }
.cv { font: 800 10.4pt 'Barlow Condensed', sans-serif; color: #8a857d; }
.cv.u { text-align: right; } .cl { text-align: center; font: 600 8.2pt/1.1 'Barlow', sans-serif; }
.cl em { display: block; font-style: normal; font-weight: 400; font-size: 6.4pt; color: #8a857d; }
.cb { height: 3.1mm; background: #ebe7df; display: flex; } .cb.u { justify-content: flex-end; }
.cb i { display: block; height: 100%; } .cb.u i { background: #f3a3ae; } .cb.t i { background: #a9a49c; }
.crow.us .cv.u { color: var(--red); } .crow.us .cb.u i { background: var(--red); }
.crow.them .cv.t { color: var(--black); } .crow.them .cb.t i { background: var(--them); }

/* czynniki */
.factors { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2.6mm; }
.factor b { display: block; font: 800 10pt 'Barlow Condensed', sans-serif; text-transform: uppercase; }
.factor small { display: block; font-size: 6.6pt; color: #8a857d; min-height: 2.3em; line-height: 1.15; margin-bottom: 1mm; }
.fbar { position: relative; height: 5.4mm; background: #ebe7df; margin-bottom: 1mm; }
.fbar i { position: absolute; inset: 0 auto 0 0; } .fbar.u i { background: #f3a3ae; } .fbar.t i { background: #a9a49c; }
.factor.us .fbar.u i { background: var(--red); } .factor.them .fbar.t i { background: var(--them); }
.factor:not(.us):not(.them) .fbar.u i { background: var(--red); } .factor:not(.us):not(.them) .fbar.t i { background: var(--them); }
.fbar span { position: relative; z-index: 1; padding-left: 1.5mm; font: 800 9.6pt/5.4mm 'Barlow Condensed', sans-serif; color: #fff; text-shadow: 0 0 2px rgba(0,0,0,.35); }
.dot { display: inline-block; width: 8px; height: 8px; margin: 0 3px 0 6px; } .dot.u { background: var(--red); } .dot.t { background: var(--them); }

/* profil rzutów */
.sp { display: grid; grid-template-columns: 26mm 1fr; align-items: center; gap: .6mm 2mm; margin-bottom: 2.4mm; }
.spn { grid-column: 2; font-size: 7pt; color: #6f6a62; }
.spl { font: 800 9pt/1.05 'Barlow Condensed', sans-serif; text-transform: uppercase; }
.spbar { display: flex; height: 7mm; overflow: hidden; }
.spbar i { display: flex; align-items: center; justify-content: center; font: 600 7.2pt 'Barlow', sans-serif; color: #fff; white-space: nowrap; overflow: hidden; }
.spbar.u .two { background: var(--red); } .spbar.u .three { background: var(--red-dark); } .spbar.u .ft { background: #f3a3ae; color: var(--ink); }
.spbar.t .two { background: var(--them); } .spbar.t .three { background: var(--black); } .spbar.t .ft { background: #a9a49c; color: var(--ink); }

/* kwarty */
.qt { width: 100%; border-collapse: collapse; font-size: 8.4pt; }
.qt th { text-align: left; font: 600 7pt 'Barlow', sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #6f6a62; padding: .6mm 1mm; }
.qt td { padding: 1mm; border-top: 1px solid #ebe7df; }
.qt td.qs { font: 800 10pt 'Barlow Condensed', sans-serif; white-space: nowrap; width: 15%; }
.qt td.qd { position: relative; width: 22%; height: 6mm; }
.qt td.qn { width: 9%; font: 600 7.4pt 'Barlow', sans-serif; text-align: right; white-space: nowrap; } .qt td.qn.pos { color: #1f7a3d; } .qt td.qn.neg { color: var(--red); }
.qt th { white-space: nowrap; }
.qd .axis { position: absolute; left: 50%; top: 1mm; bottom: 1mm; width: 1px; background: #bdb7ad; }
.qd i { position: absolute; top: 1.6mm; height: 2.8mm; }
.qd i.pos { left: 50%; } .qd i.neg { right: 50%; }
.qd.u i.pos { background: var(--red); } .qd.u i.neg { background: #f3a3ae; }
.qd.t i.pos { background: var(--them); } .qd.t i.neg { background: #a9a49c; }
.qt .na { color: #8a857d; }

/* przebieg */
.tiles { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2mm; }
.tile { border-left: 3px solid var(--red); padding: .5mm 0 .5mm 2mm; }
.tile b { display: block; font: 600 6.6pt/1.15 'Barlow', sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #6f6a62; }
.tile span { display: block; font: 800 17pt/1.05 'Barlow Condensed', sans-serif; }
.tile small { display: block; font-size: 6.8pt; color: #8a857d; } .tile small.mine { color: var(--red); font-weight: 600; font-size: 7.4pt; margin-top: .4mm; }
.fq { display: flex; align-items: flex-end; gap: 4mm; margin-top: 3mm; }
.fq > b { font: 600 7pt/1.2 'Barlow', sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #6f6a62; width: 26mm; align-self: center; }
.fqc { display: flex; flex-direction: column; align-items: center; width: 14mm; }
.fqb { height: 12mm; width: 7mm; display: flex; align-items: flex-end; background: #ebe7df; } .fqb i { width: 100%; background: var(--them); }
.fqc span { font: 800 10pt 'Barlow Condensed', sans-serif; } .fqc em { font-style: normal; font-size: 6.6pt; color: #8a857d; }

/* forma */
.form { display: flex; align-items: stretch; gap: 1.6mm; margin-bottom: 1.8mm; }
.fl { width: 32mm; font: 800 9pt/1.05 'Barlow Condensed', sans-serif; text-transform: uppercase; align-self: center; }
.fr { flex: 1; display: grid; grid-template-columns: 6mm 1fr; grid-template-rows: auto auto; background: #ebe7df; }
.fr b { grid-row: 1 / 3; display: flex; align-items: center; justify-content: center; font: 800 11pt 'Barlow Condensed', sans-serif; color: #fff; background: #8a857d; }
.fr.w b { background: var(--red); } .fr.l b { background: var(--black); }
.fr span { padding: .4mm 1.6mm 0; font: 800 10pt 'Barlow Condensed', sans-serif; } .fr em { padding: 0 1.6mm .5mm; font-style: normal; font-size: 6.8pt; color: #6f6a62; }

/* tabela */
.st { width: 100%; border-collapse: collapse; font-size: 8.2pt; }
.st th { text-align: left; font: 600 6.6pt 'Barlow', sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #6f6a62; padding: .5mm 1mm; }
.st td { padding: .7mm 1mm; border-top: 1px solid #ebe7df; }
.st tr.us td { background: var(--red); color: #fff; font-weight: 600; } .st tr.them td { background: var(--black); color: #fff; font-weight: 600; }
.hist p { font-size: 8.4pt; }

/* zawodnicy */
.pgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-bottom: 3.2mm; }
.pcard { background: var(--card); border: 1px solid var(--rule); border-top: 3px solid var(--black); padding: 2.8mm 3.2mm; break-inside: avoid; font-size: 8.2pt; }
.phead { display: flex; gap: 2.6mm; align-items: center; margin-bottom: 2mm; }
.phead .num { flex: none; width: 10mm; height: 10mm; display: flex; align-items: center; justify-content: center; background: var(--black); color: var(--red); font-size: 15pt; }
.phead h3 { font-size: 12pt; margin: 0; line-height: 1; } .phead small { color: #6f6a62; font-size: 7.2pt; }
.pstats { display: grid; grid-template-columns: repeat(6, 1fr); border-top: 1px solid #ebe7df; border-bottom: 1px solid #ebe7df; }
.ps { display: flex; flex-direction: column; align-items: center; padding: 1mm 0; }
.ps .pv { font-size: 15pt; line-height: 1; } .ps .pl { font: 600 6.4pt 'Barlow', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #6f6a62; }
.ps .pp { font-size: 7pt; color: #8a857d; white-space: nowrap; }
.d { font-style: normal; font-size: 6.6pt; margin-left: 1px; } .d.up { color: #1f7a3d; } .d.down { color: var(--red); } .d.eq { color: #8a857d; }
.plegend { font-size: 6.4pt; color: #8a857d; text-align: right; margin: .5mm 0 1mm; min-height: 1em; }
.shots { display: grid; gap: .8mm; margin-bottom: 1.6mm; }
.sh { display: grid; grid-template-columns: 9mm 1fr 11mm 10mm; align-items: center; gap: 1.5mm; }
.shl { font: 600 6.8pt 'Barlow', sans-serif; text-transform: uppercase; letter-spacing: .06em; color: #6f6a62; }
.shb { height: 2.6mm; background: #ebe7df; } .shb i { display: block; height: 100%; background: var(--them); }
.shv { font: 800 9.4pt 'Barlow Condensed', sans-serif; text-align: right; } .shp { font-size: 6.8pt; color: #8a857d; }
.pfacts { font-size: 7.4pt; color: #45413c; margin-bottom: 1mm; }
.prev { font-size: 7.4pt; color: #45413c; background: #f0ede6; padding: 1mm 1.6mm; margin-bottom: 1.2mm; } .prev.muted { color: #8a857d; } .prev .also { color: #8a857d; }
.how { font-size: 7.8pt; border-left: 3px solid var(--red); padding-left: 2mm; }
.rt { width: 100%; border-collapse: collapse; font-size: 7.8pt; }
.rt th { font: 600 6.4pt 'Barlow', sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #6f6a62; text-align: right; padding: .5mm 1mm; }
.rt td { text-align: right; padding: .7mm 1mm; border-top: 1px solid #ebe7df; white-space: nowrap; } .rt td.nm, .rt th:nth-child(2) { text-align: left; }
.rt small { color: #8a857d; }

/* plan */
.klucz { background: var(--black); color: var(--white); padding: 4mm 4.5mm; margin-bottom: 3.2mm; border-left: 6px solid var(--red); break-inside: avoid; }
.klucz > b { display: block; font: 800 14pt/1.08 'Barlow Condensed', sans-serif; text-transform: uppercase; margin-bottom: 1.6mm; }
.klucz > b::before { content: 'KLUCZ  '; color: var(--red); }
.klucz ul { margin: 0; } .klucz li { font-size: 9pt; }
.keys { display: grid; gap: 2.4mm; }
.key { display: grid; grid-template-columns: 11mm 1fr; gap: 2.6mm; }
.kn { font-size: 30pt; line-height: .9; color: var(--red); }
.key h3 { margin: .6mm 0 .8mm; font-size: 11pt; } .key p { font-size: 8.8pt; margin: 0; }
.tag { display: inline-block; font: 600 6.4pt 'Barlow', sans-serif; letter-spacing: .14em; text-transform: uppercase; background: var(--black); color: var(--white); padding: .3mm 1.4mm; }
.mus { display: grid; gap: 2mm; }
.mu { display: grid; grid-template-columns: 1fr 12mm 1fr; gap: 0 2mm; align-items: stretch; break-inside: avoid; border-bottom: 1px solid #ebe7df; padding-bottom: 2mm; }
.mu:last-child { border-bottom: 0; padding-bottom: 0; }
.mside { display: flex; gap: 2mm; padding: 1.6mm 2mm; font-size: 7.8pt; }
.mside b { display: block; font: 800 10.5pt/1.05 'Barlow Condensed', sans-serif; text-transform: uppercase; }
.mside span { display: block; color: #2b2825; } .mside small { color: #6f6a62; } .mside small.prevs { display: block; font-size: 6.8pt; margin-top: .3mm; }
.mside.us { background: #fde8eb; border-left: 3px solid var(--red); } .mside.them { background: #ebe7df; border-left: 3px solid var(--them); }
.pos { flex: none; font: 800 12pt 'Barlow Condensed', sans-serif; color: var(--red); width: 7mm; }
.marrow { display: flex; align-items: center; justify-content: center; font: 600 6.6pt 'Barlow', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #6f6a62; }
.mu .task { grid-column: 1 / -1; margin: 1.2mm 0 0; font-size: 8.4pt; }
.szatnia ol { list-style: none; padding: 0; margin: 0; display: grid; gap: 1.6mm; }
.szatnia li { display: grid; grid-template-columns: 5mm 1fr; gap: 2mm; font-size: 9pt; margin: 0; }
.box { width: 3.6mm; height: 3.6mm; border: 1.5px solid var(--black); margin-top: .6mm; }

/* strefa 2-3 */
.bench p, .bench li { font-size: 8.2pt !important; line-height: 1.32 !important; }
.zone-top { display: grid; grid-template-columns: 68mm 1fr; gap: 3.2mm; margin-bottom: 3.2mm; } .zone-top > * { margin-bottom: 0; }
.zc { padding: 2.5mm; } .court { width: 100%; height: auto; display: block; }
.court .zid { font: 800 15px 'Barlow Condensed', sans-serif; fill: #fff; }
.court .zname { font: 800 12.5px 'Barlow Condensed', sans-serif; fill: #0B0B0B; text-transform: uppercase; paint-order: stroke; stroke: #EFEBE3; stroke-width: 4px; stroke-linejoin: round; }
.threats { display: grid; grid-template-columns: 1fr 1fr; gap: 2.2mm 3mm; }
.threats h3 { font-size: 9.6pt; margin: 0 0 .8mm; color: var(--red); }
.threats ul { margin: 0; padding-left: 4mm; font-size: 8.4pt; } .threats li { margin-bottom: .4mm; } .threats small { color: #8a857d; }
.zrows { display: grid; gap: 1.6mm; }
.zr { display: grid; grid-template-columns: 20mm 1fr; gap: 2.6mm; break-inside: avoid; border-bottom: 1px solid #ebe7df; padding-bottom: 1.6mm; }
.zr:last-child { border-bottom: 0; padding-bottom: 0; }
.zspot { background: var(--black); color: var(--white); padding: 1.6mm 2mm; } .zspot.top { background: var(--red); }
.zspot b { display: block; font: 800 18pt/1 'Barlow Condensed', sans-serif; } .zspot span { font: 600 6.6pt/1.15 'Barlow', sans-serif; letter-spacing: .08em; text-transform: uppercase; }
.zwho b { font: 800 10.5pt/1.05 'Barlow Condensed', sans-serif; text-transform: uppercase; margin-right: 2mm; }
.zwho span { font-size: 7.8pt; color: #2b2825; } .zwho small { color: #6f6a62; } .zwho small.prevs { display: block; font-size: 6.8pt; }
.zbody p { margin: .8mm 0 0; font-size: 8.1pt; line-height: 1.34; }

.chips { display: flex; flex-wrap: wrap; gap: 1.4mm; }
.chip { display: inline-flex; align-items: center; gap: 1.4mm; background: var(--black); color: var(--white); font: 800 10pt 'Barlow Condensed', sans-serif; text-transform: uppercase; padding: .8mm 2.2mm .8mm 0; }
.chip b { background: var(--red); color: #fff; padding: 0 1.6mm; min-width: 7mm; text-align: center; font-weight: 800; }
.squad .out { margin: 2mm 0 0; font-size: 8.6pt; } .squad .out em { color: var(--red); font-style: normal; font-weight: 600; }

/* ekran */
.toolbar { position: sticky; top: 0; z-index: 5; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; padding: 10px 16px; background: var(--black); color: var(--white); }
.toolbar button { font: 800 13pt 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: .04em; padding: 10px 18px; border: 0; background: var(--red); color: #fff; cursor: pointer; }
.hint { font-size: 12px; color: #cfcac2; }
@media screen and (max-width: 820px) {
  main { overflow-x: hidden; }
  .page { zoom: calc(100vw / 220mm); }
}
@media print {
  body { background: none; } main { padding: 0; } .toolbar { display: none; }
  .page { margin: 0; box-shadow: none; width: 210mm; min-height: 297mm; }
}
`;

/** Skrypt strony druku (osobny plik — CSP panelu blokuje skrypty inline). */
export const PRINT_SCRIPT = `(function () {
  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var btn = document.getElementById('print');
  if (btn) btn.addEventListener('click', function () { window.print(); });
  if (ios) {
    var h = document.getElementById('ios-hint'); if (h) h.hidden = false;
    var d = document.getElementById('desk-hint'); if (d) d.hidden = true;
  } else window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 600); });
})();`;

export function printErrorHtml(message) {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Odprawa</title></head><body style="font:16px/1.5 -apple-system,Arial,sans-serif;padding:24px"><p>${esc(message)}</p></body></html>`;
}
