// Generates docs/studio-content-system.md from the live modules (playbooks, prompts, channels, templates).
// The Studio „Prompty” page shows the same text. Regenerate: node scripts/studio/export-prompts.mjs
import { channelIds, channels, factsSchema, PUBLICATION_VERSION } from './channels.js';
import { playbooks, PLAYBOOK_VERSION } from './playbooks.js';
import { brandVoice, channelInstructions, PROMPT_VERSION } from './prompts.js';
import { REPORT_PROMPT_VERSION, reportSystem } from './report-prompt.js';
import { schematicCopy, TEMPLATE_VERSION } from './templates.js';
import { LINT_VERSION } from './brand-lint.js';

const labels = { instagram_feed: 'IG post', instagram_story: 'IG relacja', facebook: 'Facebook', website: 'WWW' };
const exampleFacts = factsSchema.parse({
  kind: 'match',
  competition: 'KALK',
  seasonLabel: 'KALK 2026/27',
  round: '5',
  opponent: 'Pantery',
  date: '2026-10-18T15:00:00.000Z',
  venue: 'KOSiR Koszalin',
  entryInfo: 'Wstęp wolny',
  scoreUs: 78,
  scoreThem: 64,
  leaders: [
    { name: 'Jan Kowalski', value: '24', stat: 'PTS' },
    { name: 'Adam Nowak', value: '11', stat: 'REB' },
  ],
});
const fence = (text, lang = '') => '```' + lang + '\n' + text + '\n```';
const cell = (s) => String(s).replace(/\|/g, '\\|');

/** @param {{ mcpUrl?: string, tools?: {name:string, description:string, scope:string}[] }} options */
export function contentSystemDocument({ mcpUrl = 'https://studio.bekapaka.pl/api/studio/v1/mcp', tools = [] } = {}) {
  const example = schematicCopy(playbooks.find((p) => p.id === 'match-result'), exampleFacts, { hashtags: { instagram: ['#BKPK'], facebook: [] } });
  return [
    '# System treści BeKaPaKa — Instagram, Facebook, bekapaka.pl',
    '',
    '> Plik generowany z kodu Studio (`node scripts/studio/export-prompts.mjs`). Nie edytuj ręcznie — zmień `backend/studio/publications/*` i wygeneruj ponownie.',
    '',
    `Wersje: publikacje ${PUBLICATION_VERSION} · schematy ${PLAYBOOK_VERSION} · szablony ${TEMPLATE_VERSION} · prompty ${PROMPT_VERSION} · relacja ${REPORT_PROMPT_VERSION} · kontrola marki ${LINT_VERSION}.`,
    '',
    '## Jak powstaje publikacja',
    '',
    '1. **Schemat** — wybór typu publikacji (tabela niżej). Schemat określa grafiki, kanały, termin i fakty, które muszą paść.',
    '2. **Fakty** — z meczu KALK (wynik, kolejka, sezon, liderzy) albo wpisane ręcznie. Właściciel potwierdza je w Studio. Każdy tekst korzysta wyłącznie z faktów.',
    '3. **Grafiki** — projekty Studio (renderer marki 2.0). Zatwierdzenie kompozycji, potwierdzenie rewizji, eksport PNG.',
    '4. **Teksty kanałów** — ze schematu (deterministycznie), z AI w Studio (Gemini, budżet miesięczny, cache) albo od agenta przez MCP. Wszystkie przechodzą tę samą kontrolę marki.',
    '5. **Zatwierdzenie** — tylko właściciel, osobno dla każdego kanału. Zmiana tekstu, formatu lub grafiki cofa zatwierdzenie.',
    '6. **Publikacja** — Instagram i Facebook ręcznie (kopiuj tekst, zapisz grafikę, paczka ZIP, „Oznacz jako opublikowane”); strona bekapaka.pl przez szkic w CMS, podgląd w trybie draft i publikację ze Studio po zatwierdzeniu. Meta API — kolejny etap.',
    '',
    '## Kanały i limity',
    '',
    '| Kanał | Formaty grafiki | Limity |',
    '|---|---|---|',
    ...channelIds.map((c) => `| ${channels[c].label} | ${channels[c].formats.join(', ')} | ${cell(JSON.stringify(channels[c].limits))} |`),
    '',
    '## Schematy publikacji',
    '',
    '| Schemat | Kategoria | Kiedy | Kanały | Wymagane fakty | Co musi paść |',
    '|---|---|---|---|---|---|',
    ...playbooks.map(
      (p) =>
        `| **${cell(p.label)}** (\`${p.id}\`) | ${p.category} | ${cell(p.timing)} | ${Object.keys(p.items).map((c) => labels[c]).join(', ')} | ${p.required.join(', ') || '—'} | ${cell(p.hint)} |`,
    ),
    '',
    '## Zasady marki (prompt systemowy)',
    '',
    fence(brandVoice),
    '',
    '## Instrukcje kanałów',
    '',
    ...channelIds.flatMap((c) => [fence(channelInstructions[c]), '']),
    '## Relacja meczowa na stronę (osobny prompt)',
    '',
    'Gdy publikacja meczu ma statystyki KALK, artykuł na stronę pisze osobne wywołanie: model dostaje oś meczu (fakty w kolejności zdarzeń) i zwraca tylko prozę — tytuł, zajawkę, lead, akapity przebiegu i bohaterów. Studio składa artykuł i dokłada blok danych (wynik, kwarty, porównanie zespołów, następny mecz) z faktów.',
    '',
    fence(reportSystem),
    '',
    '## Kontrola marki',
    '',
    '- **Blokuje zatwierdzenie:** forma „Bekapaka”, „Be Ka Pa Ka”, „BKP”; słowo „bilet”; brak tekstu alternatywnego; pusty opis/treść/tytuł/zajawka.',
    '- **Ostrzega:** liczby spoza potwierdzonych faktów (>10), dzień tygodnia niezgodny z datą w faktach, „dom/wyjazd/u siebie”, patos, ponad 2 emoji, wersaliki w zdaniach, hak Instagrama dłuższy niż 125 znaków, link w opisie Instagrama, brak #BKPK, zajawka poza 140–220 znakami, emoji w tytule strony.',
    '- Hashtagi: domyślnie wyłącznie `#BKPK` (jedyny hashtag z księgi marki). Inne tylko po decyzji klubu (Ustawienia w Studio).',
    '',
    '## Przykład: wynik meczu ze schematu',
    '',
    'Fakty:',
    '',
    fence(JSON.stringify(exampleFacts, null, 2), 'json'),
    '',
    ...Object.entries(example).flatMap(([channel, copy]) => [`**${channels[channel].label}**`, '', fence(JSON.stringify(copy, null, 2), 'json'), '']),
    '## Agent zewnętrzny (MCP)',
    '',
    `- Adres: \`${mcpUrl}\` (Streamable HTTP, bez sesji, tylko POST).`,
    '- Autoryzacja: nagłówek `Authorization: Bearer bkpk_agent_…`. Token tworzy właściciel w Studio → Ustawienia → Agent. Token pokazywany jest raz; można go odwołać.',
    '- Agent może czytać schematy, zasady i publikacje, tworzyć robocze publikacje i proponować teksty kanałów w stanie roboczym. **Nie może** potwierdzać faktów, zatwierdzać, publikować, pobierać paczek ani zmieniać ustawień.',
    '- Limit: 120 żądań na minutę na token.',
    '',
    ...(tools.length ? ['| Narzędzie | Uprawnienie | Opis |', '|---|---|---|', ...tools.map((t) => `| \`${t.name}\` | ${t.scope} | ${cell(t.description)} |`), ''] : []),
    'Przykładowa konfiguracja klienta MCP:',
    '',
    fence(JSON.stringify({ mcpServers: { 'bekapaka-studio': { type: 'http', url: mcpUrl, headers: { Authorization: 'Bearer ${BKPK_AGENT_TOKEN}' } } } }, null, 2), 'json'),
    '',
    'Zalecany przebieg pracy agenta: `list_publications` → `get_publication` (fakty i blokady) → `get_prompts` → opcjonalnie `schematic_copy` jako szkic → `propose_copy` dla każdego kanału → poprawki do zera błędów kontroli marki → informacja dla właściciela, że teksty czekają na zatwierdzenie.',
    '',
  ].join('\n');
}
