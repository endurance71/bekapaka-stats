// Schematic copy: deterministic drafts filled only with confirmed facts. No AI, no invented content.
// Missing facts drop whole sentences instead of leaving placeholders. Isomorphic (shared with the browser).
import { copySchemas } from './channels.js';

export const TEMPLATE_VERSION = '1.3.0';
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

// Full match report for bekapaka.pl from the KALK statistics and play-by-play in facts.report.
// Prose is built only from numbers present in facts (no arithmetic beyond what match-flow.js stored).
const quarterNames = ['pierwsza', 'druga', 'trzecia', 'czwarta'];
const quarterAcc = ['pierwszą', 'drugą', 'trzecią', 'czwartą'];
const names = (list) => (list.length > 1 ? `${list.slice(0, -1).join(', ')} i ${list.at(-1)}` : list[0] || '');
const scorerList = (scorers) => names(scorers.map((p) => `${p.name} ${p.pts}`));
const minuteSpan = (a, b) => (a === b ? `w ${a}. minucie` : `od ${a}. do ${b}. minuty`);

function flowParagraphs(f) {
  const r = f.report;
  const flow = r.flow;
  const q = flow?.quarters?.length ? flow.quarters : r.quarters;
  const runsIn = (i) => (flow?.runs || []).filter((run) => Math.min(4, Math.ceil(run.fromMinute / 10)) === i + 1);
  const runText = (run) =>
    `${capital(minuteSpan(run.fromMinute, run.toMinute))} ${run.team === 'us' ? 'zanotowaliśmy serię' : 'rywale zanotowali serię'} ${run.points}:0 – z ${run.from} na ${run.to}${run.team === 'us' && run.scorers.length ? ` (punkty: ${scorerList(run.scorers)})` : ''}.`;
  return q.map((x, i) => {
    const won = x.us > x.them;
    const tied = x.us === x.them;
    const word = i < 4 ? quarterNames[i] : x.label.toLowerCase();
    const after = x.after && i > 0 && i < q.length - 1 ? (i === 1 ? ` Do przerwy było ${x.after}.` : i === 2 ? ` Po trzech kwartach: ${x.after}.` : '') : '';
    const first =
      i === 0 && flow?.firstPoints
        ? `${flow.firstPoints.team === 'us' ? `Pierwsze punkty meczu zdobył ${flow.firstPoints.name}` : 'Pierwsze punkty zdobyli rywale'}${flow.firstPoints.minute <= 1 ? ' już w 1. minucie' : ` w ${flow.firstPoints.minute}. minucie`}. `
        : '';
    const opening = tied
      ? `${capital(word)} kwarta zakończyła się remisem ${x.us}:${x.them}.`
      : i === 0
        ? `${capital(quarterAcc[0])} kwartę ${won ? 'wygraliśmy' : 'przegraliśmy'} ${x.us}:${x.them}.`
        : `${capital(i < 4 ? quarterAcc[i] : word)} ${i < 4 ? 'kwartę ' : ''}${won ? 'wygraliśmy' : 'przegraliśmy'} ${x.us}:${x.them}.`;
    const topLines = [`Najwięcej punktów w tej kwarcie zdobył ${x.topScorer?.name} (${x.topScorer?.pts}).`, `Najskuteczniejszy był ${x.topScorer?.name} – ${x.topScorer?.pts} pkt.`, `Najwięcej punktów: ${x.topScorer?.name} (${x.topScorer?.pts}).`, `${x.topScorer?.name} zdobył w niej ${count(x.topScorer?.pts, 'punkt', 'punkty', 'punktów')}.`];
    const top = x.topScorer ? ` ${topLines[i % topLines.length]}` : '';
    const runs = runsIn(i).map(runText).join(' ');
    return [first + opening + after + top, runs].filter(has).join(' ');
  });
}

function reportArticle(f) {
  const r = f.report;
  const opp = f.opponent;
  const flow = r.flow;
  const t = r.team?.us;
  const them = r.team?.them;
  const wire = flow && flow.leadChanges === 0 && flow.ties === 0 && flow.firstPoints?.team === 'us' && won(f);
  const lead = [
    valid(f.date) ? `${capital(when(f.date).replace(/, o \d\d:\d\d$/, ''))}${has(f.venue) ? `, w ${f.venue},` : ''} rozegraliśmy mecz${has(f.round) ? ` ${f.round}. kolejki` : ''} ${f.competition || 'KALK'}${has(f.seasonLabel) ? ` (${f.seasonLabel.replace(/^Sezon/, 'sezon')})` : ''}.` : '',
    scored(f) && has(opp) ? (won(f) ? `Wygraliśmy z zespołem ${opp} ${score(f)}.` : f.scoreUs === f.scoreThem ? `Mecz z zespołem ${opp} zakończył się remisem ${score(f)}.` : `Przegraliśmy z zespołem ${opp} ${score(f)}.`) : '',
    wire ? 'Prowadziliśmy od pierwszych punktów do końcowej syreny.' : '',
    r.mvp ? `MVP meczu został ${r.mvp.name}${r.mvp.eval !== null && r.mvp.eval !== undefined ? ` (eval ${r.mvp.eval})` : ''}.` : '',
    r.overtimes ? 'O wyniku zdecydowała dogrywka.' : '',
  ].filter(has).join(' ');
  const scoreLine = scored(f) && has(opp) && f.scoreUs < 100 && f.scoreThem < 100 ? `${CLUB} ${score(f)} ${opp}` : '';

  const flowText = flowParagraphs(f);
  const extra = [
    flow?.rivalDrought && !flow.runs.some((run) => run.team === 'us' && run.toMinute === flow.rivalDrought.toMinute && `${run.points}:0` === flow.rivalDrought.run)
      ? `Rywale nie zdobyli punktu ${minuteSpan(flow.rivalDrought.fromMinute, flow.rivalDrought.toMinute)} – w tym czasie zdobyliśmy ${count(Number(flow.rivalDrought.run.split(':')[0]), 'punkt', 'punkty', 'punktów')}.`
      : '',
    flow?.largestLead ? `Najwyższe prowadzenie – ${count(flow.largestLead.points, 'punkt', 'punkty', 'punktów')} – mieliśmy w ${flow.largestLead.minute}. minucie, przy stanie ${flow.largestLead.score}.` : '',
    flow?.largestDeficit ? `Największa strata do rywala wynosiła ${count(flow.largestDeficit.points, 'punkt', 'punkty', 'punktów')} (${flow.largestDeficit.minute}. minuta, ${flow.largestDeficit.score}).` : '',
    flow && flow.leadChanges > 0 ? `Prowadzenie zmieniało się ${flow.leadChanges} ${plural(flow.leadChanges, 'raz', 'razy', 'razy')}.` : '',
  ].filter(has).join(' ');
  const quarterRows = r.quarters.map((x) => `- **${x.label}:** ${x.us}:${x.them}`);
  if (r.halftime) quarterRows.splice(2, 0, `- **Do przerwy:** ${r.halftime.us}:${r.halftime.them}`);

  const strip = t
    ? [t.reb ? count(t.reb, 'zbiórka', 'zbiórki', 'zbiórek') : '', t.ast ? count(t.ast, 'asysta', 'asysty', 'asyst') : '', t.stl ? count(t.stl, 'przechwyt', 'przechwyty', 'przechwytów') : '', Number.isFinite(t.fastBreakPts) && t.fastBreakPts > 0 ? `${t.fastBreakPts} pkt z kontry` : '', Number.isFinite(t.benchPts) && t.benchPts > 0 ? `${t.benchPts} pkt z ławki` : '']
        .filter(has)
    : [];

  // Players: top scorer with shooting, best passer and rebounder, other double-digit scorers.
  const [scorer] = r.players;
  const passer = [...r.players].sort((a, b) => b.ast - a.ast)[0];
  const rebounder = [...r.players].sort((a, b) => b.reb - a.reb)[0];
  const others = r.players.filter((p) => p.pts >= 10 && p !== scorer && p !== passer);
  const people = [
    scorer && scorer.pts > 0 ? `${scorer.name} zdobył ${count(scorer.pts, 'punkt', 'punkty', 'punktów')}${has(scorer.fg) ? ` (${scorer.fg} z gry)` : ''}${scorer.reb || scorer.ast ? `, miał też ${[scorer.reb ? count(scorer.reb, 'zbiórkę', 'zbiórki', 'zbiórek') : '', scorer.ast ? count(scorer.ast, 'asystę', 'asysty', 'asyst') : ''].filter(has).join(' i ')}` : ''}.` : '',
    passer && passer !== scorer && passer.ast >= 5 ? `${passer.name} rozdał ${count(passer.ast, 'asystę', 'asysty', 'asyst')}${passer.pts ? ` i dołożył ${count(passer.pts, 'punkt', 'punkty', 'punktów')}` : ''}.` : '',
    others.length ? `Dwucyfrową liczbę punktów zdobyli także: ${names(others.map((p) => `${p.name} (${p.pts})`))}.` : '',
    rebounder && rebounder !== scorer && rebounder !== passer && rebounder.reb >= 5 ? `Najwięcej zbiórek miał ${rebounder.name} (${rebounder.reb}).` : '',
  ].filter(has).join(' ');
  const playerRows = r.players.slice(0, 8).map((p) => `- **${p.name}${p.number !== null && p.number !== undefined ? ` (#${p.number})` : ''}:** ${[`${p.pts} pkt`, has(p.fg) ? `${p.fg} z gry` : '', `${p.reb} zb.`, `${p.ast} as.`, p.stl ? `${p.stl} prz.` : '', p.eval !== null && p.eval !== undefined ? `eval ${p.eval}` : ''].filter(has).join(', ')}`);

  const teamText = t && them
    ? [
        has(t.fg) && has(them.fg) ? `Trafiliśmy ${t.fg.replace('/', ' z ')} rzutów z gry${t.fgPct !== null ? ` (${t.fgPct}%)` : ''}, rywale ${them.fg.replace('/', ' z ')}${them.fgPct !== null ? ` (${them.fgPct}%)` : ''}.` : '',
        Number.isFinite(them.tov) && Number.isFinite(t.ptsOffTurnovers) && t.ptsOffTurnovers > 0 ? `Rywale popełnili ${count(them.tov, 'stratę', 'straty', 'strat')}, a po stratach zdobyliśmy ${count(t.ptsOffTurnovers, 'punkt', 'punkty', 'punktów')}.` : '',
        Number.isFinite(t.reb) && Number.isFinite(them.reb) ? `Zbiórki: ${t.reb} do ${them.reb}.` : '',
      ].filter(has).join(' ')
    : '';
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
    flowText.length ? `## Przebieg meczu\n\n${flowText.join('\n\n')}` : '',
    extra,
    quarterRows.length >= 2 ? quarterRows.join('\n') : '',
    strip.length >= 2 ? `BeKaPaKa w liczbach: ${strip.join(' · ')}` : '',
    playerRows.length >= 2 ? `## Nasi zawodnicy\n\n${people}\n\n${playerRows.join('\n')}` : '',
    teamRows.length >= 2 ? `## Statystyki zespołów\n\n${teamText}\n\n${teamRows.join('\n')}` : '',
    r.opponentTop.length ? `Najwięcej punktów dla ${opp}: ${r.opponentTop.map((p) => `${p.name} (${p.pts})`).join(', ')}.` : '',
    nextRows.length >= 2 ? `## Następny mecz\n\n${nextRows.join('\n')}` : '',
  );
}

// Data block of a match report: score line, quarters, numbers strip, team comparison, rival scorers, next match.
// Built from facts only — shared by the schematic report and the AI-written one (assembleReport).
export function reportData(f) {
  const r = f.report;
  const opp = f.opponent;
  const t = r.team?.us;
  const them = r.team?.them;
  const quarterRows = r.quarters.map((x) => `- **${x.label}:** ${x.us}:${x.them}`);
  if (r.halftime) quarterRows.splice(2, 0, `- **Do przerwy:** ${r.halftime.us}:${r.halftime.them}`);
  const strip = t
    ? [t.reb ? count(t.reb, 'zbiórka', 'zbiórki', 'zbiórek') : '', t.ast ? count(t.ast, 'asysta', 'asysty', 'asyst') : '', t.stl ? count(t.stl, 'przechwyt', 'przechwyty', 'przechwytów') : '', Number.isFinite(t.fastBreakPts) && t.fastBreakPts > 0 ? `${t.fastBreakPts} pkt z kontry` : '', Number.isFinite(t.benchPts) && t.benchPts > 0 ? `${t.benchPts} pkt z ławki` : ''].filter(has)
    : [];
  const teamRows = t && them
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
  const playerRows = r.players.slice(0, 8).map((p) => `- **${p.name}${p.number !== null && p.number !== undefined ? ` (#${p.number})` : ''}:** ${[`${p.pts} pkt`, has(p.fg) ? `${p.fg} z gry` : '', `${p.reb} zb.`, `${p.ast} as.`, p.stl ? `${p.stl} prz.` : '', p.eval !== null && p.eval !== undefined ? `eval ${p.eval}` : ''].filter(has).join(', ')}`);
  const next = r.nextMatch;
  const nextRows = next
    ? [`- **Rywal:** ${next.opponent}`, valid(next.date) ? `- **Termin:** ${when(next.date)}` : '', has(next.venue) ? `- **Miejsce:** ${next.venue}` : '', has(f.entryInfo) ? `- **Wstęp:** ${f.entryInfo}` : ''].filter(has)
    : [];
  return {
    scoreLine: scored(f) && has(opp) && f.scoreUs < 100 && f.scoreThem < 100 ? `${CLUB} ${score(f)} ${opp}` : '',
    quarterRows,
    strip,
    teamRows,
    playerRows,
    opponentLine: r.opponentTop.length ? `Najwięcej punktów dla ${opp}: ${r.opponentTop.map((p) => `${p.name} (${p.pts})`).join(', ')}.` : '',
    nextRows,
  };
}

/** Website copy from the AI reporter's prose (report-prompt.js) and the data block built from facts. */
export function assembleReport(parts, f) {
  const d = reportData(f);
  const data = [...d.quarterRows, ...d.teamRows];
  const content = paragraphs(
    parts.lead,
    d.scoreLine,
    `## Przebieg meczu\n\n${parts.story.join('\n\n')}`,
    `## Bohaterowie meczu\n\n${parts.heroes.join('\n\n')}`,
    parts.closing || '',
    d.strip.length >= 2 ? `BeKaPaKa w liczbach: ${d.strip.join(' · ')}` : '',
    data.length >= 2 ? `## Mecz w danych\n\n${data.join('\n')}` : '',
    d.playerRows.length >= 2 ? `### Nasi zawodnicy\n\n${d.playerRows.join('\n')}` : '',
    // The closing paragraph already names the rival's top scorer.
    parts.closing ? '' : d.opponentLine,
    d.nextRows.length >= 2 ? `## Następny mecz\n\n${d.nextRows.join('\n')}` : '',
  );
  return copySchemas.website.parse({ title: parts.title, excerpt: parts.excerpt, content, tags: ['mecz', 'kalk'], coverAlt: parts.coverAlt || altText({ id: 'match-result', label: 'Wynik meczu' }, f).slice(0, 300) });
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
