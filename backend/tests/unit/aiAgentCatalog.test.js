import { describe, it, expect, vi } from 'vitest';

const SEASON = 'season_2026-2027';
const catalogItems = [
  { type: 'briefing', generateKind: 'briefing', generateTarget: null, title: 'Briefing', hasContent: true, stale: true, staleReason: 'hash-changed', seasonId: SEASON },
  { type: 'match', generateKind: 'match', generateTarget: '4124', title: 'Mecz A', hasContent: false, dataReady: true, seasonId: SEASON },
  { type: 'match', generateKind: 'match', generateTarget: 'lm-1', title: 'Mecz bez box score', hasContent: false, dataReady: false, seasonId: SEASON },
  { type: 'player', generateKind: 'player', generateTarget: 'p1', title: 'Plan — Jan', hasContent: true, stale: false, isTemplate: true, seasonId: SEASON },
  { type: 'player', generateKind: 'player', generateTarget: 'p2', title: 'Plan — Ola', hasContent: true, stale: false, seasonId: SEASON },
  { type: 'scouting_plan', generateKind: 'scouting', generateTarget: 'Kosz-All-In', title: 'Plan — Kosz', hasContent: false, seasonId: SEASON },
  { type: 'scouting_personnel', generateKind: 'scouting', generateTarget: 'Kosz-All-In', title: 'Kadra — Kosz', hasContent: false, seasonId: SEASON },
];

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    kalkSeason: { findMany: async () => [{ id: SEASON, label: '2026/2027', isActive: true }] },
    rosterPlayer: { findUnique: async ({ where }) => (where.id === 'p1' ? { aiDevelopmentSummary: '## Plan', aiDevelopmentHash: 'p-new', aiDevelopmentModel: 'template' } : null) },
  },
}));
vi.mock('../../seasonService.js', () => ({ resolveSeasonId: async (s) => s || SEASON }));
vi.mock('../../ai/catalog.js', () => ({ getAiAnalysesCatalog: async () => ({ seasonId: SEASON, items: catalogItems }) }));
vi.mock('../../ai/geminiClient.js', () => ({ TEMPLATE_MODEL_NAME: 'template' }));
vi.mock('../../ai/scoutingData.js', () => ({ findScoutingReport: async () => ({ report: null }) }));
vi.mock('../../ai/scoutingPersonnel.js', () => ({ buildPersonnelMdFromAnalysis: () => null }));
vi.mock('../../ai/generate.js', () => ({
  findMatchAiTarget: async (id) => (id === 'old' ? { existing: { aiSummary: '## Mecz', aiSummaryHash: 'm-old' } } : { existing: null }),
  prepareGameAnalysis: async (id) => {
    if (id === 'old') throw new Error('Brak pełnego box score');
    return { inputHash: 'm-new', target: { existing: null } };
  },
  preparePlayerDevelopment: async () => ({ inputHash: 'p-new', existing: { aiDevelopmentSummary: '## Plan', aiDevelopmentHash: 'p-new', aiDevelopmentModel: 'template' } }),
  prepareScoutingReport: async () => ({ inputHash: 's-new', ctx: { opponentName: 'Kosz-All-In', seasonId: SEASON } }),
  prepareTeamBriefing: async () => ({ inputHash: 'b-new' }),
  getTeamBriefingCached: async () => ({ contentMd: '## Tydzień', sourceHash: 'b-old', generatedAt: new Date('2026-10-01T10:00:00Z'), model: 'agent-mcp' }),
}));
vi.mock('../../ai/tacticsOps.js', () => ({
  preparePregame: async ({ opponent } = {}) => ({ opponent: opponent || 'Kosz-All-In', seasonId: SEASON, nextMatch: { date: '2026-10-18T16:00:00Z' } }),
  cachedPregame: async () => null,
}));

const { agentItems, panelCatalogForAgent, readPanelAnalysis, listSeasonsForAgent } = await import('../../ai/agentCatalog.js');

describe('panel analyses for the MCP agent', () => {
  it('turns catalog items into tasks, merges scouting and skips matches without data', () => {
    const { items, notReady } = agentItems(catalogItems);
    expect(notReady).toBe(1);
    expect(items.map((i) => [i.kind, i.status])).toEqual([
      ['briefing', 'stale'],
      ['match', 'missing'],
      ['player', 'stale'],
      ['player', 'fresh'],
      ['scouting', 'missing'],
    ]);
    expect(items[1].task).toEqual({ operation: 'panel.match', args: { gameId: '4124', seasonId: SEASON } });
    expect(items[2].staleReason).toBe('template');
    expect(items[4].task).toEqual({ operation: 'panel.scouting', args: { opponent: 'Kosz-All-In', seasonId: SEASON } });
    expect(items[0].task).toEqual({ operation: 'panel.briefing', args: { seasonId: SEASON } });
  });

  it('lists missing and stale work by default, with the next pre-game card', async () => {
    const out = await panelCatalogForAgent();
    expect(out.counts).toEqual({ missing: 3, stale: 2, fresh: 1 });
    expect(out.items.map((i) => i.task.operation)).toEqual(['panel.briefing', 'panel.match', 'panel.player', 'panel.scouting', 'panel.pregame']);
    expect(out.items.at(-1).task.args).toEqual({ opponent: 'Kosz-All-In', seasonId: SEASON });
  });

  it('filters by kind and status', async () => {
    const out = await panelCatalogForAgent({ kind: 'player', status: ['fresh'] });
    expect(out.items.map((i) => i.task.args.playerId)).toEqual(['p2']);
  });

  it('reads saved analyses and judges them against current data', async () => {
    expect(await readPanelAnalysis({ kind: 'briefing' })).toMatchObject({ status: 'stale', content: '## Tydzień', model: 'agent-mcp', generatedAt: '2026-10-01T10:00:00.000Z' });
    expect(await readPanelAnalysis({ kind: 'player', target: 'p1' })).toMatchObject({ status: 'stale', content: '## Plan' });
    expect(await readPanelAnalysis({ kind: 'match', target: '4124' })).toMatchObject({ status: 'missing', content: null });
    expect(await readPanelAnalysis({ kind: 'pregame' })).toMatchObject({ status: 'missing', target: 'Kosz-All-In', staleTracking: false });
    await expect(readPanelAnalysis({ kind: 'player' })).rejects.toMatchObject({ status: 400 });
    await expect(readPanelAnalysis({ kind: 'player', target: 'nobody' })).rejects.toMatchObject({ status: 404 });
  });

  it('still returns saved text when current data cannot be assembled', async () => {
    expect(await readPanelAnalysis({ kind: 'match', target: 'old' })).toMatchObject({ status: 'unknown', content: '## Mecz', note: expect.stringContaining('box score') });
  });

  it('lists seasons with the default one', async () => {
    expect(await listSeasonsForAgent()).toEqual({ defaultSeasonId: SEASON, seasons: [{ id: SEASON, label: '2026/2027', isActive: true }] });
  });
});
