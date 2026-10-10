// Operacje AI panelu dostępne dla agenta MCP (Claude Code właściciela na jego subskrypcji): te same prepare/save
// co generacja w panelu, więc prompt, walidacja i zapis są identyczne niezależnie od tego, kto pisze tekst.
import { z } from 'zod';
import {
  prepareGameAnalysis,
  preparePlayerDevelopment,
  prepareScoutingReport,
  prepareTeamBriefing,
  saveGameAnalysis,
  savePlayerDevelopment,
  saveScoutingReport,
  saveTeamBriefing
} from './generate.js';
import { preparePlay, preparePregame, savePlay, savePregame } from './tacticsOps.js';

/** Model zapisywany przy wynikach agenta MCP — odróżnialny od API i SDK w katalogu i audycie. */
export const AGENT_MODEL = 'agent-mcp';
const seasonId = z.string().trim().max(80).optional();
const text = (max) => z.string().trim().max(max).optional();
const seasonProp = { seasonId: { type: 'string', description: 'Sezon (opcjonalnie, domyślnie aktywny)' } };

export const panelAgentOperations = {
  'panel.match': {
    label: 'Analiza meczu (Markdown z wymaganymi sekcjami)',
    output: 'markdown',
    args: { type: 'object', properties: { gameId: { type: 'string' }, ...seasonProp }, required: ['gameId'] },
    parse: (a) => z.object({ gameId: z.string().trim().min(1).max(80), seasonId }).strict().parse(a),
    prepare: (a) => prepareGameAnalysis(a.gameId, { seasonId: a.seasonId }),
    save: (prep, output) => saveGameAnalysis(prep, output, AGENT_MODEL)
  },
  'panel.player': {
    label: 'Plan rozwoju zawodnika (JSON → Markdown)',
    output: 'json',
    args: { type: 'object', properties: { playerId: { type: 'string' }, ...seasonProp }, required: ['playerId'] },
    parse: (a) => z.object({ playerId: z.string().trim().min(1).max(80), seasonId }).strict().parse(a),
    prepare: (a) => preparePlayerDevelopment(a.playerId, { seasonId: a.seasonId }),
    // Wynik agenta nie jest po cichu zastępowany szablonem — niepełny plan jest odrzucany.
    save: (prep, output) => savePlayerDevelopment(prep, output, AGENT_MODEL, { strict: true })
  },
  'panel.scouting': {
    label: 'Raport scoutingowy rywala (JSON)',
    output: 'json',
    args: { type: 'object', properties: { opponent: { type: 'string' }, ...seasonProp }, required: ['opponent'] },
    parse: (a) => z.object({ opponent: z.string().trim().min(1).max(120), seasonId }).strict().parse(a),
    prepare: (a) => prepareScoutingReport(a.opponent, { seasonId: a.seasonId }),
    save: (prep, output) => saveScoutingReport(prep, output, AGENT_MODEL)
  },
  'panel.briefing': {
    label: 'Briefing drużyny (Markdown z wymaganymi sekcjami)',
    output: 'markdown',
    args: { type: 'object', properties: { ...seasonProp } },
    parse: (a) => z.object({ seasonId }).strict().parse(a),
    prepare: (a) => prepareTeamBriefing({ seasonId: a.seasonId }),
    save: (prep, output) => saveTeamBriefing(prep, output, AGENT_MODEL)
  },
  'panel.play': {
    label: 'Generator zagrywki (JSON z diagramem: 10 graczy, piłka)',
    output: 'json',
    args: {
      type: 'object',
      properties: { category: { type: 'string' }, targetDefense: { type: 'string' }, goal: { type: 'string' }, additionalNotes: { type: 'string' }, ...seasonProp }
    },
    parse: (a) => z.object({ category: text(40), targetDefense: text(80), goal: text(300), additionalNotes: text(1000), seasonId }).strict().parse(a),
    prepare: (a) => preparePlay(a),
    save: (prep, output) => savePlay(prep, output, AGENT_MODEL)
  },
  'panel.pregame': {
    label: 'Karta odprawy przedmeczowej (JSON: 3 klucze taktyczne, piątka z kadry)',
    output: 'json',
    args: { type: 'object', properties: { opponent: { type: 'string', description: 'Domyślnie najbliższy rywal' }, ...seasonProp } },
    parse: (a) => z.object({ opponent: text(120), seasonId }).strict().parse(a),
    prepare: (a) => preparePregame(a),
    save: (prep, output) => savePregame(prep, output, AGENT_MODEL)
  }
};

export { withAiLock } from './locks.js';
