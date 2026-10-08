// Schematic copy: deterministic drafts filled only with confirmed facts. No AI, no invented content.
// Missing facts drop whole sentences instead of leaving placeholders. Isomorphic (shared with the browser).
import { copySchemas } from './channels.js';

export const TEMPLATE_VERSION = '1.2.0';
const CLUB = 'BeKaPaKa Bobolice';
const ZONE = 'Europe/Warsaw';

const has = (v) => v !== null && v !== undefined && String(v).trim() !== '';
const join = (...parts) => parts.filter(has).join(' ');
const paragraphs = (...parts) => parts.filter(has).join('\n\n');
const valid = (iso) => has(iso) && Number.isFinite(Date.parse(iso));
const fmt = (iso, options) => new Intl.DateTimeFormat('pl-PL', { timeZone: ZONE, ...options }).format(new Date(iso));

// „w sobotę”, „we wtorek” — accusative weekday with the right preposition.
const weekdayAcc = {
  poniedziałek: 'w poniedziałek',
  wtorek: 'we wtorek',
  środa: 'w środę',
  czwartek: 'w czwartek',
  piątek: 'w piątek',
  sobota: 'w sobotę',
  niedziela: 'w niedzielę',
};
export function when(iso) {
  if (!valid(iso)) return '';
  const day = weekdayAcc[fmt(iso, { weekday: 'long' })] || '';
  return `${day}, ${fmt(iso, { day: 'numeric', month: 'long' })}, o ${fmt(iso, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`;
}
export const shortDate = (iso) =>
  valid(iso) ? fmt(iso, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '';
const dayOnly = (iso) => (valid(iso) ? fmt(iso, { day: 'numeric', month: 'long', year: 'numeric' }) : '');

const scored = (f) => f.scoreUs !== null && f.scoreThem !== null;
const score = (f) => (scored(f) ? `${f.scoreUs}:${f.scoreThem}` : '');
const won = (f) => scored(f) && f.scoreUs > f.scoreThem;
const roundLabel = (f) => (has(f.round) ? `${f.round}. kolejka${has(f.competition) ? ` ${f.competition}` : ' KALK'}` : '');
const statWord = { PTS: 'pkt', REB: 'zb.', AST: 'as.', PPG: 'pkt/mecz', RPG: 'zb./mecz', APG: 'as./mecz' };
const leaderLine = (l) => `${l.name} ${l.value} ${statWord[l.stat] || l.stat}`.trim();
const leaders = (f, n = 2) => f.leaders.slice(0, n).map(leaderLine).join(', ');
// Abbreviations end with a dot already („11 zb.”): never print „zb..”.
const sentence = (s) => (has(s) ? (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`) : '');
// Team and person names are never declined: „mecz BeKaPaKa – Pantery”, not „z Panterami”.
const vs = (f) => `BeKaPaKa – ${f.opponent}`;
const entry = (f) => (has(f.entryInfo) ? f.entryInfo.replace(/\.$/, '') + '.' : '');

// Per playbook: core sentences reused by every channel. Each returns '' when its facts are missing.
const core = {
  'match-preview': (f) => ({
    hook: has(f.opponent) ? `Przed nami mecz ${vs(f)}${has(f.round) ? ` (${f.round}. kolejka)` : ''}!` : '',
    lines: [
      has(f.date) ? `${capital(when(f.date))}${has(f.venue) ? `, ${f.venue}` : ''}.` : '',
      entry(f),
      'Przyjdźcie nas wspierać!',
    ],
    sticker: valid(f.date) ? `${shortDate(f.date)} · ${f.venue}` : '',
  }),
  matchday: (f) => ({
    hook: has(f.opponent) ? `Dziś mecz ${vs(f)}!` : 'Dziś gramy!',
    lines: [valid(f.date) ? `Początek o ${fmt(f.date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}${has(f.venue) ? `, ${f.venue}` : ''}.` : '', entry(f)],
    sticker: 'Dziś gramy',
  }),
  'match-live': (f) => ({
    hook: scored(f) ? `${CLUB} ${score(f)} ${f.opponent}` : '',
    lines: [has(f.notes) ? f.notes : ''],
    sticker: score(f),
  }),
  'match-result': (f) => ({
    hook: scored(f)
      ? won(f)
        ? `Wygrana! ${CLUB} ${score(f)} ${f.opponent}.`
        : `Wynik meczu: ${CLUB} ${score(f)} ${f.opponent}.`
      : '',
    lines: [
      roundLabel(f) ? `${capital(roundLabel(f))}${has(f.venue) ? `, ${f.venue}` : ''}.` : '',
      f.report?.halftime ? `Do przerwy ${f.report.halftime.us}:${f.report.halftime.them}.` : '',
      f.leaders.length ? sentence(`Najlepsi: ${leaders(f)}`) : '',
      won(f) ? 'Dziękujemy za doping!' : 'Dziękujemy za doping. Pracujemy dalej.',
    ],
    sticker: scored(f) ? `${won(f) ? 'Wygrana' : 'Wynik'} ${score(f)}` : '',
  }),
  'match-report': (f) => ({
    hook: scored(f) ? `Relacja: ${vs(f)} ${score(f)}.` : `Relacja: ${vs(f)}.`,
    lines: [roundLabel(f) ? `${capital(roundLabel(f))}.` : '', f.leaders.length ? sentence(`Liderzy: ${leaders(f, 3)}`) : '', 'Pełna relacja na bekapaka.pl.'],
    sticker: 'Relacja z meczu',
  }),
  mvp: (f) => ({
    hook: has(f.person) ? `MVP meczu: ${f.person}!` : '',
    lines: [f.leaders.length ? sentence(leaders(f, 3)) : '', scored(f) && has(f.opponent) ? `Mecz ${vs(f)}, ${score(f)}.` : '', 'Gratulujemy!'],
    sticker: has(f.person) ? `MVP: ${f.person}` : 'MVP meczu',
  }),
  'match-leaders': (f) => ({
    hook: has(f.opponent) ? `Liderzy meczu ${vs(f)}.` : 'Liderzy meczu.',
    lines: [f.leaders.map(leaderLine).join('\n'), 'Dane: KALK.'],
    sticker: 'Liderzy meczu',
  }),
  'round-standings': (f) => ({
    hook: has(f.round) ? `Tabela po ${f.round}. kolejce${has(f.competition) ? ` ${f.competition}` : ' KALK'}.` : 'Tabela ligi.',
    lines: [has(f.notes) ? f.notes : '', 'Dane: KALK, stan na dzień publikacji.'],
    sticker: has(f.round) ? `Tabela po ${f.round}. kolejce` : 'Tabela ligi',
  }),
  schedule: (f) => ({
    hook: has(f.title) ? `${f.title}.` : 'Nasze najbliższe mecze.',
    lines: [has(f.notes) ? f.notes : '', 'Wszystkie mecze KALK w KOSiR Koszalin. Wstęp wolny.'],
    sticker: 'Terminarz',
  }),
  postponed: (f) => ({
    hook: has(f.opponent) ? `Mecz ${vs(f)} przełożony.` : 'Mecz przełożony.',
    lines: [
      valid(f.originalDate) ? `Pierwotny termin: ${shortDate(f.originalDate)}.` : '',
      valid(f.date) ? `Nowy termin: ${when(f.date)}${has(f.venue) ? `, ${f.venue}` : ''}.` : 'Nowy termin podamy, gdy zostanie potwierdzony.',
      has(f.notes) ? f.notes : '',
    ],
    sticker: 'Mecz przełożony',
  }),
  cancelled: (f) => ({
    hook: has(f.opponent) ? `Mecz ${vs(f)} odwołany.` : 'Mecz odwołany.',
    lines: [valid(f.date) ? `Dotyczy spotkania zaplanowanego na ${shortDate(f.date)}.` : '', has(f.notes) ? f.notes : ''],
    sticker: 'Mecz odwołany',
  }),
  'tournament-preview': (f) => ({
    hook: has(f.title) ? `${f.title}!` : '',
    lines: [
      valid(f.date) ? `${capital(when(f.date))}${has(f.venue) ? `, ${f.venue}` : ''}.` : '',
      entry(f),
      has(f.notes) ? f.notes : '',
      'Zapraszamy całe Bobolice!',
    ],
    sticker: has(f.title) ? f.title.slice(0, 60) : 'Turniej',
  }),
  'tournament-program': (f) => ({
    hook: has(f.title) ? `Program: ${f.title}.` : 'Program turnieju.',
    lines: [has(f.notes) ? f.notes : '', has(f.venue) ? `Miejsce: ${f.venue}.` : ''],
    sticker: 'Program turnieju',
  }),
  'tournament-summary': (f) => ({
    hook: has(f.title) ? `${f.title} za nami!` : 'Turniej za nami!',
    lines: [has(f.notes) ? f.notes : '', 'Dziękujemy drużynom, kibicom i partnerom.'],
    sticker: 'Podsumowanie turnieju',
  }),
  'player-profile': (f) => ({
    hook: has(f.person) ? `Poznajcie: ${f.person}.` : '',
    lines: [has(f.notes) ? f.notes : ''],
    sticker: has(f.person) ? f.person : '',
  }),
  'new-player': (f) => ({
    hook: has(f.person) ? `Witamy w drużynie: ${f.person}!` : '',
    lines: [has(f.notes) ? f.notes : '', `Powodzenia w barwach ${CLUB}!`],
    sticker: 'Nowy zawodnik',
  }),
  'partner-thanks': (f) => ({
    hook: has(f.title) ? `${f.title}.` : 'Dziękujemy naszym partnerom.',
    lines: [has(f.notes) ? f.notes : '', 'Gramy razem — dziękujemy za wsparcie!'],
    sticker: 'Dziękujemy partnerom',
  }),
  'partner-profile': (f) => ({
    hook: has(f.partner) ? `Gramy razem: ${f.partner}.` : '',
    lines: [has(f.notes) ? f.notes : '', 'Dziękujemy za wsparcie klubu!'],
    sticker: has(f.partner) ? f.partner.slice(0, 60) : '',
  }),
  'partner-wall': (f) => ({
    hook: 'Partnerzy BeKaPaKa — razem gramy w tym sezonie.',
    lines: [has(f.notes) ? f.notes : '', 'Dziękujemy!'],
    sticker: 'Nasi partnerzy',
  }),
  birthday: (f) => ({
    hook: has(f.person) ? `Dziś urodziny obchodzi ${f.person}!` : '',
    lines: ['Wszystkiego najlepszego! Zdrowia, radości z gry i wielu trafień — życzy cała drużyna.'],
    sticker: 'Sto lat!',
  }),
  training: (f) => ({
    hook: 'Trening!',
    lines: [valid(f.date) ? `${capital(when(f.date))}${has(f.venue) ? `, ${f.venue}` : ''}.` : '', has(f.notes) ? f.notes : ''],
    sticker: valid(f.date) ? shortDate(f.date) : 'Trening',
  }),
  backstage: (f) => ({ hook: has(f.title) ? `${f.title}.` : '', lines: [has(f.notes) ? f.notes : ''], sticker: 'Kulisy' }),
  quote: (f) => ({
    hook: has(f.notes) ? `„${f.notes.replace(/^[„"]|[”"]$/g, '')}”` : '',
    lines: [has(f.person) ? `— ${f.person}` : ''],
    sticker: '',
  }),
  anniversary: (f) => ({
    hook: has(f.title) ? `${f.title}!` : '',
    lines: [valid(f.date) ? `${capital(dayOnly(f.date))}.` : '', has(f.notes) ? f.notes : '', 'Dziękujemy, że jesteście z nami!'],
    sticker: 'Jubileusz',
  }),
  'fan-invitation': (f) => ({
    hook: has(f.title) ? `${f.title}!` : '',
    lines: [valid(f.date) ? `${capital(when(f.date))}${has(f.venue) ? `, ${f.venue}` : ''}.` : '', entry(f), has(f.notes) ? f.notes : ''],
    sticker: valid(f.date) ? shortDate(f.date) : 'Zapraszamy',
  }),
  'club-statement': (f) => ({ hook: has(f.title) ? `${f.title}.` : '', lines: [has(f.notes) ? f.notes : ''], sticker: 'Komunikat' }),
  news: (f) => ({ hook: has(f.title) ? `${f.title}.` : '', lines: [has(f.notes) ? f.notes : '', 'Więcej na bekapaka.pl.'], sticker: '' }),
  'season-summary': (f) => ({
    hook: has(f.seasonLabel) ? `Sezon ${f.seasonLabel} za nami.` : 'Sezon za nami.',
    lines: [has(f.notes) ? f.notes : '', 'Dziękujemy drużynie, kibicom i partnerom!'],
    sticker: 'Sezon w liczbach',
  }),
};
function capital(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

const factList = (f) =>
  [
    has(f.competition) || has(f.round) ? ['Rozgrywki', join(f.competition || 'KALK', has(f.round) ? `· ${f.round}. kolejka` : '')] : null,
    has(f.opponent) ? ['Rywal', f.opponent] : null,
    valid(f.date) ? ['Termin', `${dayOnly(f.date)}, ${fmt(f.date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`] : null,
    has(f.venue) ? ['Miejsce', f.venue] : null,
    has(f.entryInfo) ? ['Wstęp', f.entryInfo] : null,
  ]
    .filter(Boolean)
    .map(([k, v]) => `- **${k}:** ${v}`);

// Polish plural: 1 zbiórka, 2–4 zbiórki, 5+ zbiórek.
const plural = (n, one, few, many) => {
  const a = Math.abs(n);
  if (a === 1) return one;
  return a % 10 >= 2 && a % 10 <= 4 && (a % 100 < 12 || a % 100 > 14) ? few : many;
};
const count = (n, one, few, many) => (Number.isFinite(n) ? `${n} ${plural(n, one, few, many)}` : '');
const shot = (ratio, p) => (has(ratio) ? `${ratio}${p !== null && p !== undefined ? ` (${p}%)` : ''}` : '');
const pair = (label, us, them, opp) => (has(us) && has(them) ? `- **${label}:** BeKaPaKa ${us} · ${opp} ${them}` : '');
const playerStat = (p) =>
  [`${p.pts} pkt`, `${p.reb} zb.`, `${p.ast} as.`, p.stl ? `${p.stl} prz.` : '', p.eval !== null && p.eval !== undefined ? `eval ${p.eval}` : '']
    .filter(has)
    .join(', ');

// Full match report for bekapaka.pl from the KALK statistics in facts.report. Only facts, no narrative guesses.
function reportArticle(f) {
  const r = f.report;
  const opp = f.opponent;
  const lead = [
    valid(f.date) && has(f.venue) ? `${capital(dayOnly(f.date))} w ${f.venue} rozegraliśmy mecz${has(f.round) ? ` ${f.round}. kolejki` : ''} ${f.competition || 'KALK'}${has(f.seasonLabel) ? ` (${f.seasonLabel.replace(/^Sezon/, 'sezon')})` : ''}.` : '',
    has(opp) ? `Rywalem był zespół ${opp}.` : '',
    scored(f) ? (won(f) ? `Wygraliśmy ${score(f)}.` : f.scoreUs === f.scoreThem ? `Mecz zakończył się remisem ${score(f)}.` : `Przegraliśmy ${score(f)}.`) : '',
    r.overtimes ? `O wyniku zdecydowała dogrywka.` : '',
  ].filter(has).join(' ');
  const scoreLine = scored(f) && has(opp) && f.scoreUs < 100 && f.scoreThem < 100 ? `${CLUB} ${score(f)} ${opp}` : '';

  // Narrative only from quarter scores: who led after the first quarter and at halftime, how the second half went.
  const ordinal = ['pierwszą', 'drugą', 'trzecią', 'czwartą'];
  const standing = (us, them) => (us > them ? 'prowadziliśmy' : us < them ? 'przegrywaliśmy' : 'był remis');
  const quarterWord = (q, i) => (i < 4 ? `${ordinal[i]} kwartę` : q.label.toLowerCase());
  const result = (q) => (q.us > q.them ? 'wygraliśmy' : q.us < q.them ? 'przegraliśmy' : 'zremisowaliśmy');
  const q = r.quarters;
  const h = r.halftime;
  const sameLead = q[0] && h && standing(q[0].us, q[0].them) === standing(h.us, h.them) && q[0].us !== q[0].them;
  const second = q.length >= 4 ? (result(q[2]) === result(q[3]) ? `${capital(quarterWord(q[2], 2))} ${result(q[2])} ${q[2].us}:${q[2].them}, a czwartą ${q[3].us}:${q[3].them}.` : `${capital(quarterWord(q[2], 2))} ${result(q[2])} ${q[2].us}:${q[2].them}, a ${quarterWord(q[3], 3)} ${result(q[3])} ${q[3].us}:${q[3].them}.`) : '';
  const story = [
    q[0] && sameLead ? `Po pierwszej kwarcie ${standing(q[0].us, q[0].them)} ${q[0].us}:${q[0].them}, a do przerwy ${h.us}:${h.them}.` : '',
    q[0] && !sameLead ? `Po pierwszej kwarcie ${standing(q[0].us, q[0].them)} ${q[0].us}:${q[0].them}.` : '',
    h && !sameLead ? `Do przerwy ${standing(h.us, h.them)} ${h.us}:${h.them}.` : '',
    second,
  ]
    .filter(has)
    .join(' ');
  const flow = r.quarters.map((q) => `- **${q.label}:** ${q.us}:${q.them}`);
  if (r.halftime) flow.splice(2, 0, `- **Do przerwy:** ${r.halftime.us}:${r.halftime.them}`);
  const best = r.quarters.filter((q) => q.us > q.them).sort((a, b) => b.us - b.them - (a.us - a.them))[0];
  const flowNote = best && r.quarters.length > 1 ? `Najwyżej wygraną kwartą była ${best.label.toLowerCase()} (${best.us}:${best.them}).` : '';

  const t = r.team?.us;
  const strip = t
    ? [count(t.reb, 'zbiórka', 'zbiórki', 'zbiórek'), count(t.ast, 'asysta', 'asysty', 'asyst'), count(t.stl, 'przechwyt', 'przechwyty', 'przechwytów'), Number.isFinite(t.fastBreakPts) && t.fastBreakPts > 0 ? `${t.fastBreakPts} pkt z kontry` : '', Number.isFinite(t.benchPts) && t.benchPts > 0 ? `${t.benchPts} pkt z ławki` : '']
        .filter(has)
    : [];

  // Players' paragraph: top scorer with his line, then the best passer and rebounder if they are other players.
  const [scorer] = r.players;
  const passer = [...r.players].sort((a, b) => b.ast - a.ast)[0];
  const rebounder = [...r.players].sort((a, b) => b.reb - a.reb)[0];
  const doubleDigits = r.players.filter((p) => p.pts >= 10).length;
  const people = [
    scorer && scorer.pts > 0 ? `Najwięcej punktów zdobył ${scorer.name} – ${scorer.pts}${scorer.reb || scorer.ast ? `, do tego ${[scorer.reb ? count(scorer.reb, 'zbiórka', 'zbiórki', 'zbiórek') : '', scorer.ast ? count(scorer.ast, 'asysta', 'asysty', 'asyst') : ''].filter(has).join(' i ')}` : ''}.` : '',
    passer && passer !== scorer && passer.ast >= 5 ? `${passer.name} zanotował ${count(passer.ast, 'asystę', 'asysty', 'asyst')}.` : '',
    rebounder && rebounder !== scorer && rebounder !== passer && rebounder.reb >= 5 ? `Najwięcej zbiórek miał ${rebounder.name} (${rebounder.reb}).` : '',
    doubleDigits > 1 ? `Dwucyfrową liczbę punktów zdobyło ${doubleDigits} zawodników.` : '',
  ]
    .filter(has)
    .join(' ');
  const top = r.players.slice(0, 6).map((p) => `- **${p.name}${p.number !== null && p.number !== undefined ? ` (#${p.number})` : ''}:** ${playerStat(p)}`);
  const scorers = r.players.filter((p) => p.pts > 0).length;
  const them = r.team?.them;
  const teamRows = r.team
    ? [
        pair('Rzuty z gry', shot(t.fg, t.fgPct), shot(them.fg, them.fgPct), opp),
        pair('Za 3 punkty', shot(t.three, t.threePct), shot(them.three, them.threePct), opp),
        pair('Rzuty wolne', shot(t.ft, t.ftPct), shot(them.ft, them.ftPct), opp),
        pair('Zbiórki', t.reb, them.reb, opp),
        pair('Asysty', t.ast, them.ast, opp),
        pair('Przechwyty', t.stl, them.stl, opp),
        pair('Straty', t.tov, them.tov, opp),
        pair('Punkty z ławki', t.benchPts, them.benchPts, opp),
      ].filter(has)
    : [];
  const next = r.nextMatch;
  const nextRows = next
    ? [`- **Rywal:** ${next.opponent}`, valid(next.date) ? `- **Termin:** ${when(next.date)}` : '', has(next.venue) ? `- **Miejsce:** ${next.venue}` : '', has(f.entryInfo) ? `- **Wstęp:** ${f.entryInfo}` : ''].filter(has)
    : [];

  return paragraphs(
    lead,
    scoreLine,
    flow.length >= 2 ? `## Przebieg meczu\n\n${story}\n\n${flow.join('\n')}` : '',
    flowNote,
    strip.length >= 2 ? `BeKaPaKa w liczbach: ${strip.join(' · ')}` : '',
    top.length >= 2 ? `## Nasi zawodnicy\n\n${people}\n\n${top.join('\n')}` : '',
    scorers > 1 ? `Punkty dla BeKaPaKa zdobyło ${scorers} zawodników.` : '',
    r.mvp ? `MVP meczu: ${r.mvp.name}${r.mvp.eval !== null && r.mvp.eval !== undefined ? ` (eval ${r.mvp.eval})` : ''}.` : '',
    teamRows.length >= 2 ? `## Statystyki zespołów\n\n${teamRows.join('\n')}` : '',
    r.opponentTop.length ? `Najskuteczniejsi w zespole ${opp}: ${r.opponentTop.map((p) => `${p.name} ${p.pts} pkt`).join(', ')}.` : '',
    nextRows.length >= 2 ? `## Następny mecz\n\n${nextRows.join('\n')}` : '',
    'Dziękujemy kibicom za doping.',
  );
}

// Article for bekapaka.pl, using the conventions of the site's ArticleMarkdown
// (standalone score line, „… w liczbach:” strip, „**Etykieta:** wartość” fact list).
function article(id, f, c) {
  if (f.report && ['match-result', 'match-report'].includes(id)) return reportArticle(f);
  const facts = factList(f);
  const scoreLine = scored(f) && has(f.opponent) && f.scoreUs < 100 && f.scoreThem < 100 ? `${CLUB} ${score(f)} ${f.opponent}` : '';
  const numbers = f.leaders.length >= 2 ? `Mecz w liczbach: ${f.leaders.slice(0, 4).map((l) => `${l.value} ${statWord[l.stat] || l.stat} ${l.name}`).join(' · ')}` : '';
  // The score board replaces the hook that only repeats the score.
  return paragraphs(
    scoreLine || c.hook,
    ...c.lines.filter((l) => !offSite(l)),
    numbers,
    facts.length >= 2 ? `## Najważniejsze informacje\n\n${facts.join('\n')}` : '',
  );
}

const isReport = (id, f) => !!f.report && scored(f) && has(f.opponent) && ['match-result', 'match-report'].includes(id);
const reportTitle = (id, f) => (isReport(id, f) ? `${CLUB} ${score(f)} ${f.opponent}${has(f.round) ? ` – relacja z ${f.round}. kolejki ${f.competition || 'KALK'}` : ' – relacja'}` : '');
function reportExcerpt(id, f) {
  if (!isReport(id, f)) return '';
  const top = f.report.players[0];
  const text = [`${won(f) ? 'Wygrana' : f.scoreUs === f.scoreThem ? 'Remis' : 'Porażka'} BeKaPaKa Bobolice ${score(f)} z zespołem ${f.opponent}${has(f.venue) ? ` w ${f.venue}` : ''}.`, top ? `Najwięcej punktów: ${top.name} (${top.pts}).` : '', 'Przebieg kwart, statystyki zawodników i zespołów.']
    .filter(has)
    .join(' ');
  return text.length <= 220 ? text : text.slice(0, 217).replace(/\s+\S*$/, '') + '…';
}

// On bekapaka.pl itself „more on bekapaka.pl / link in bio” sentences make no sense.
const offSite = (line) => /bekapaka\.pl|link w bio/i.test(line);
function excerpt(c) {
  const text = [c.hook, ...c.lines.filter((l) => !offSite(l))].filter(has).join(' ').replace(/\s+/g, ' ');
  return text.length <= 220 ? text : text.slice(0, 217).replace(/\s+\S*$/, '') + '…';
}

const websiteTags = { Mecz: ['mecz'], Turniej: ['turniej'], Drużyna: ['drużyna'], Partnerzy: ['partnerzy'], Statystyki: ['mecz'] };

/**
 * Draft copy for every channel of a playbook. `settings.hashtags` holds the owner-approved sets.
 * Returns parsed copy objects (channel contracts), never throws on missing facts.
 */
export function schematicCopy(playbookDef, facts, settings = {}) {
  const build = core[playbookDef.id];
  if (!build) return {};
  const c = build(facts);
  const body = paragraphs(c.hook, c.lines.filter(has).join('\n'));
  const igTags = settings.hashtags?.instagram ?? ['#BKPK'];
  const fbTags = settings.hashtags?.facebook ?? [];
  const alt = altText(playbookDef, facts);
  const out = {
    instagram_feed: { caption: body.replace(/Pełna relacja na bekapaka\.pl\./, 'Pełna relacja: link w bio.').replace('Więcej na bekapaka.pl.', 'Więcej: link w bio.'), hashtags: igTags, firstComment: '', altText: alt },
    instagram_story: { stickerText: (c.sticker || '').slice(0, 60), sticker: playbookDef.id === 'match-preview' ? 'countdown' : 'none', link: '', altText: alt },
    facebook: { text: body, hashtags: fbTags, link: facts.link || '', altText: alt },
    website: {
      title: (reportTitle(playbookDef.id, facts) || c.hook || facts.title || playbookDef.label).replace(/[.!]$/, '').slice(0, 90),
      excerpt: reportExcerpt(playbookDef.id, facts) || excerpt(c),
      content: article(playbookDef.id, facts, c),
      tags: websiteTags[playbookDef.category] || ['klub'],
      coverAlt: alt.slice(0, 300),
    },
  };
  return Object.fromEntries(
    Object.keys(playbookDef.items).map((channel) => [channel, copySchemas[channel].parse(out[channel])]),
  );
}

// Describes the content of the graphic, not „grafika przedstawia…”.
const withScore = new Set(['match-live', 'match-result', 'match-report', 'mvp', 'match-leaders']);
export function altText(playbookDef, f) {
  const showScore = withScore.has(playbookDef.id) && scored(f);
  const parts = [playbookDef.label, showScore && has(f.opponent) ? `${CLUB} ${score(f)} ${f.opponent}` : has(f.opponent) ? `${CLUB} – ${f.opponent}` : '', valid(f.date) ? shortDate(f.date) : '', f.venue, f.person];
  return parts.filter(has).join('. ').slice(0, 1500);
}
