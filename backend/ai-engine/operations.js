// Every AI operation in BeKaPaKa and how it is routed. `engine` = follows the global text-engine switch
// (existing API or Claude Agent SDK); `api-only` = always the configured API, whatever the switch says.
// New text operations (campaigns, scenarios, storyboards…) are added here and get both engines and MCP for free.
export const operations = Object.freeze([
  { id: 'panel.match', surface: 'panel', label: 'Analiza meczu', routing: 'engine', output: 'markdown' },
  { id: 'panel.player', surface: 'panel', label: 'Plan rozwoju zawodnika', routing: 'engine', output: 'json' },
  { id: 'panel.scouting', surface: 'panel', label: 'Raport scoutingowy rywala', routing: 'engine', output: 'json' },
  { id: 'panel.briefing', surface: 'panel', label: 'Briefing drużyny', routing: 'engine', output: 'markdown' },
  { id: 'panel.play', surface: 'panel', label: 'Generator zagrywek', routing: 'engine', output: 'json' },
  { id: 'panel.pregame', surface: 'panel', label: 'Karta odprawy przedmeczowej', routing: 'engine', output: 'json' },
  { id: 'studio.copy', surface: 'studio', label: 'Teksty publikacji (IG, FB, WWW)', routing: 'engine', output: 'json' },
  { id: 'studio.report', surface: 'studio', label: 'Relacja meczowa na stronę', routing: 'engine', output: 'json' },
  { id: 'studio.text', surface: 'studio', label: 'Opis i tekst alternatywny grafiki', routing: 'engine', output: 'json' },
  { id: 'studio.image', surface: 'studio', label: 'Tła AI (generowanie obrazów)', routing: 'api-only', output: 'image' },
]);

export const IMAGE_NOTICE = 'Generowanie i edycja obrazów nadal wykorzystują skonfigurowane API, niezależnie od wybranego silnika tekstowego.';

/** Studio task id → operation id (the worker and budget work in task ids). */
export const studioOperation = (taskId) => `studio.${taskId}`;
