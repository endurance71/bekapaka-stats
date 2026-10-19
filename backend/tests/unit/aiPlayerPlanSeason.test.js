import { beforeEach, describe, expect, it, vi } from 'vitest';

// Plan rozwoju zapamiętuje sezon danych: przy <3 meczach w aktywnym sezonie plan powstaje dla poprzedniego,
// a panel musi pokazać, z którego sezonu pochodzi.
const prismaMock = vi.hoisted(() => ({
  rosterPlayer: { findUnique: vi.fn(), update: vi.fn(async () => ({})) }
}));

vi.mock('../../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../../ai/buildPlayerContext.js', () => ({
  buildPlayerContext: vi.fn(async (_id, { seasonId }) => ({ playerId: 'p1', seasonId: seasonId || 'season_2026-2027', hash: `h-${seasonId}`, payload: {} }))
}));
vi.mock('../../ai/playerDevelopmentMarkdown.js', async (importOriginal) => ({
  ...(await importOriginal()),
  hasDetailedPlayerPlanMarkdown: (text) => text === '## Zapisany plan'
}));
vi.mock('../../ai/textEngine.js', () => ({ aiText: vi.fn(async () => ({ text: 'nie-json', model: 'test-model' })) }));

const { preparePlayerDevelopment, savePlayerDevelopment, generatePlayerDevelopment } = await import('../../ai/generate.js');

describe('player development plan season', () => {
  beforeEach(() => {
    prismaMock.rosterPlayer.findUnique.mockReset().mockResolvedValue(null);
    prismaMock.rosterPlayer.update.mockClear();
  });

  it('prepare carries the season the player context was built for', async () => {
    const prep = await preparePlayerDevelopment('p1', { seasonId: 'season_2025-2026' });
    expect(prep.seasonId).toBe('season_2025-2026');
    expect(prismaMock.rosterPlayer.findUnique.mock.calls[0][0].select.aiDevelopmentSeasonId).toBe(true);
  });

  it('save stores and returns the plan season (panel and MCP agent share this path)', async () => {
    const prep = await preparePlayerDevelopment('p1', { seasonId: 'season_2025-2026' });
    const out = await savePlayerDevelopment(prep, 'nie-json', 'test-model');
    expect(prismaMock.rosterPlayer.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1' }, data: expect.objectContaining({ aiDevelopmentSeasonId: 'season_2025-2026', aiDevelopmentHash: 'h-season_2025-2026' }) })
    );
    expect(out.seasonId).toBe('season_2025-2026');
  });

  it('a cached plan reports the season it was saved for', async () => {
    prismaMock.rosterPlayer.findUnique.mockResolvedValue({
      aiDevelopmentSummary: '## Zapisany plan',
      aiDevelopmentHash: 'h-season_2025-2026',
      aiDevelopmentAt: new Date('2026-10-19T10:00:00Z'),
      aiDevelopmentModel: 'agent-mcp',
      aiDevelopmentSeasonId: 'season_2025-2026'
    });
    const out = await generatePlayerDevelopment('p1', { seasonId: 'season_2025-2026' });
    expect(out).toMatchObject({ cached: true, seasonId: 'season_2025-2026' });
    expect(prismaMock.rosterPlayer.update).not.toHaveBeenCalled();
  });
});
