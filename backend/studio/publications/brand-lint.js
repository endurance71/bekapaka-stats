// Brand and truth checks for publication copy (manual, schematic, AI or agent). Isomorphic.
// Errors block approval; warnings ask the owner to look again.
import { channels } from './channels.js';
import { shortDate, when } from './templates.js';

export const LINT_VERSION = '1.6.0';

const textFields = {
  instagram_feed: ['caption', 'firstComment', 'altText'],
  instagram_story: ['stickerText', 'altText'],
  facebook: ['text', 'altText'],
  website: ['title', 'excerpt', 'content', 'coverAlt'],
};
const allowedCaps = new Set(['BEKAPAKA', 'BKPK', 'KALK', 'KOSIR', 'CESIR', 'MVP', 'WWW', 'PTS', 'REB', 'AST']);
const rules = [
  { re: /\bBekapaka\b/, level: 'error', message: 'Nazwa klubu: „BeKaPaKa” (nie „Bekapaka”).' },
  { re: /\bBe\s+Ka\s+Pa\s+Ka\b/i, level: 'error', message: 'Nazwa klubu bez spacji: „BeKaPaKa”.' },
  { re: /\bBKP\b/, level: 'error', message: 'Skrót klubu to „BKPK”.' },
  { re: /bilet/i, level: 'error', message: 'Mecze są bezpłatne — piszemy „Wstęp wolny”, bez biletów.' },
  { re: /\b(na wyjeździe|wyjazdow\w*|u siebie|mecz\w* domow\w*|w roli gospodarza)\b/i, level: 'warning', message: 'Mecze KALK są w jednej hali — bez oznaczeń dom/wyjazd, podaj miejsce.' },
  { re: /\b(najlepsz\w+ w historii|legendarn\w+|niesamowit\w+|epick\w+)\b/i, level: 'warning', message: 'Fakty zamiast patosu.' },
  {
    re: /(miażdż\p{L}*|zmiażdż\p{L}*|bezlitosn\p{L}*|rozgromi\p{L}*|pogrom\p{L}*|demolk\p{L}*|upokorz\p{L}*|deklasacj\p{L}*|nokaut\p{L}*)/iu,
    level: 'warning',
    message: 'Bez triumfalizmu — wysoką wygraną pokaż liczbami, z szacunkiem dla rywala.',
  },
  {
    re: /(\boczk(a|ami|ach|o)\b|zalicz\p{L}* (seri|trafien|zbiórk|asyst)|przypieczętow\p{L}*|narzuci\p{L}* (swój )?rytm|zapisał\p{L}* na swoim koncie)/iu,
    level: 'warning',
    message: 'Wytarty zwrot — napisz prościej (np. „punkty”, „trafił”, „zamknęliśmy mecz”).',
  },
  // Judgements backed by a clear result are fine („zdominowaliśmy” at 86:20); otherwise they need numbers.
  {
    re: /(kontrolowa\p{L}*|dominowa\p{L}*|zdominowa\p{L}*|pod dyktando|narzuci\p{L}* (swój|nasz)|od (samego )?początku (meczu|spotkania))/iu,
    level: 'warning',
    message: 'Ocena przebiegu gry bez pokrycia w wyniku — przy wyrównanym meczu zostaw liczby.',
    unless: (facts) => Number.isFinite(facts?.scoreUs) && Number.isFinite(facts?.scoreThem) && Math.abs(facts.scoreUs - facts.scoreThem) >= 15,
  },
  {
    re: /(dobr\p{L}+ obron\p{L}*|walk\p{L}* do (samego )?końca|atmosfer\p{L}*|trybun\p{L}*|kontuzj\p{L}*|wsad\p{L}*|równo z syreną)/iu,
    level: 'warning',
    message: 'Zdarzenie, którego nie ma w danych meczu (akcja, atmosfera, kontuzja) — usuń albo potwierdź.',
  },
];
// „o 14:40”, „godz. 14:40” — clock times must be the Warsaw times of the dates in facts.
const clock = /(?<![\p{L}\p{N}])(?:o|godz\.?|godzinie)\s+(\d{1,2})[:.](\d{2})(?![\p{N}])/giu;
const localTime = (iso) =>
  iso && Number.isFinite(Date.parse(iso))
    ? new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso))
    : '';
const emoji = /\p{Extended_Pictographic}/gu;
// Owner's post-match pattern (2026-10-18) structures Facebook and Instagram posts with emoji;
// a story sticker stays short and the website stays without them.
const emojiLimit = { instagram_feed: 15, facebook: 20, instagram_story: 2, website: 0 };
// Fixed facts of the game that are not in match data.
const fixedFacts = /\b6,75\s*m\b/g;
// Weekday stems (all cases): „sobota”, „w sobotę”, „we wtorek”. Index matches Date#getDay in Warsaw.
const weekdayStems = ['niedziel', 'poniedział', 'wtor', 'środ', 'czwart', 'piąt', 'sobot'];
function warsawWeekday(iso) {
  if (!iso || !Number.isFinite(Date.parse(iso))) return null;
  const name = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long' }).format(new Date(iso));
  return weekdayStems.findIndex((stem) => name.startsWith(stem.slice(0, 4)));
}

function factNumbers(facts) {
  const raw = JSON.stringify(facts) + ' ' + [facts.date, facts.originalDate, facts.report?.nextMatch?.date].map((d) => `${shortDate(d)} ${when(d)}`).join(' ');
  const known = new Set((raw.match(/\d+/g) || []).map((n) => String(Number(n))));
  // Shooting percentages with one decimal, derived from made/attempted pairs in facts („21/69” → 30,4 %, „4/4” → 100 %).
  for (const [, made, tried] of JSON.stringify(facts).matchAll(/(?<![\d/])(\d{1,3})\/(\d{1,3})(?![\d/])/g)) {
    if (!Number(tried)) continue;
    const [whole, tenth] = ((Number(made) * 100) / Number(tried)).toFixed(1).split('.');
    known.add(String(Number(whole))).add(String(Number(tenth)));
  }
  return known;
}

/** @returns {{level:'error'|'warning', field:string, message:string}[]} */
export function lintCopy(channel, copy, facts) {
  const issues = [];
  const add = (level, field, message) => issues.push({ level, field, message });
  const known = factNumbers(facts || {});
  for (const field of textFields[channel] || []) {
    const value = String(copy?.[field] ?? '');
    if (!value) continue;
    for (const rule of rules) if (rule.re.test(value) && !rule.unless?.(facts)) add(rule.level, field, rule.message);
    const unknown = [...new Set((value.replace(fixedFacts, '').match(/\d+/g) || []).map((n) => String(Number(n))))].filter(
      (n) => Number(n) > 10 && !known.has(n),
    );
    if (unknown.length) add('warning', field, `Liczby spoza potwierdzonych faktów: ${unknown.join(', ')}. Sprawdź źródło.`);
    const limit = emojiLimit[channel] ?? 2;
    if ((value.match(emoji) || []).length > limit) add('warning', field, limit ? `Maksymalnie ${limit} emoji.` : 'Na stronie bez emoji.');
    const times = new Set([facts?.date, facts?.originalDate, facts?.report?.nextMatch?.date].map(localTime).filter(Boolean));
    const wrong = [...value.matchAll(clock)].map((m) => `${m[1].padStart(2, '0')}:${m[2]}`).filter((t) => !times.has(t));
    if (wrong.length) add('warning', field, `Godzina ${[...new Set(wrong)].join(', ')} nie zgadza się z terminami w faktach (czas polski).`);
    const day = warsawWeekday(facts?.date);
    if (day !== null && day >= 0) {
      const mentioned = weekdayStems.map((stem, i) => (new RegExp(`(^|[^\\p{L}])${stem}\\p{L}*`, 'iu').test(value) ? i : -1)).filter((i) => i >= 0);
      // The next match (report.nextMatch) is announced with its own weekday.
      const allowed = [day, warsawWeekday(facts?.report?.nextMatch?.date)].filter((d) => d !== null && d >= 0);
      if (mentioned.length && !mentioned.some((d) => allowed.includes(d)))
        add('warning', field, `Dzień tygodnia nie zgadza się z datą w faktach (${new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long' }).format(new Date(facts.date))}).`);
    }
    const shouting = (value.match(/\b[A-ZĄĆĘŁŃÓŚŹŻ]{5,}\b/g) || []).filter((w) => !allowedCaps.has(w));
    if (shouting.length) add('warning', field, `Bez wersalików w tekście: ${[...new Set(shouting)].slice(0, 3).join(', ')}.`);
  }
  const limits = channels[channel]?.limits || {};
  if (channel === 'instagram_feed') {
    if (!copy.caption) add('error', 'caption', 'Uzupełnij opis posta.');
    const hook = (copy.caption || '').split('\n')[0];
    if (hook.length > limits.hook) add('warning', 'caption', `Pierwsza linia ma ${hook.length} znaków — przed „więcej” widać ok. ${limits.hook}.`);
    if (!copy.hashtags?.includes('#BKPK')) add('warning', 'hashtags', 'Dodaj hashtag klubu #BKPK.');
    if (/https?:\/\//.test(copy.caption || '')) add('warning', 'caption', 'Linki w opisie Instagrama nie są klikalne — „link w bio”.');
  }
  if (channel === 'facebook' && !copy.text) add('error', 'text', 'Uzupełnij treść posta.');
  if (channel === 'facebook' && !copy.sponsors) add('error', 'sponsors', 'Brak oznaczeń sponsorów pod postem — wstaw aktualną listę ze strony.');
  if (channel === 'website') {
    if (!copy.title) add('error', 'title', 'Uzupełnij tytuł artykułu.');
    if (!copy.content) add('error', 'content', 'Uzupełnij treść artykułu.');
    const n = (copy.excerpt || '').length;
    if (!n) add('error', 'excerpt', 'Uzupełnij zajawkę.');
    else if (n < limits.excerptMin || n > limits.excerptMax)
      add('warning', 'excerpt', `Zajawka ma ${n} znaków — zalecane ${limits.excerptMin}–${limits.excerptMax}.`);
    if (/\p{Extended_Pictographic}/u.test(copy.title + copy.excerpt)) add('warning', 'title', 'Bez emoji w tytule i zajawce strony.');
  }
  if (['instagram_feed', 'instagram_story', 'facebook'].includes(channel) && !copy.altText)
    add('error', 'altText', 'Uzupełnij tekst alternatywny grafiki.');
  return issues;
}
export const hasErrors = (issues) => issues.some((i) => i.level === 'error');
