import { describe, it, expect, vi, beforeEach } from 'vitest';

// update_graphic without a database: the publication, the graphic project and its save are stubbed.
const state = {};
vi.mock('../../studio/service.js', () => ({
  projectView: vi.fn(async () => state.view),
  updateProject: vi.fn(async (_db, _owner, id, revision, payload) => {
    state.saved = payload;
    return { ...state.view, id, currentRevision: revision + 1, payload };
  }),
  validation: vi.fn(async () => ({ errors: [] })),
}));
vi.mock('../../studio/publications/service.js', () => ({
  publicationView: vi.fn(async () => ({ status: 'draft', items: [{ channel: 'facebook_post', graphic: { projectId: 'g1' }, extraGraphics: [] }] })),
  approveItem: vi.fn(),
  approveItemGraphics: vi.fn(),
  confirmFacts: vi.fn(),
}));
vi.mock('../../studio/publications/website.js', () => ({ publishWebsite: vi.fn(), websiteConfigured: vi.fn(() => false) }));
vi.mock('../../studio/agent/graphics.js', () => ({ signedLink: vi.fn() }));

const { updateChannelGraphic } = await import('../../studio/agent/accept.js');
const { updateProject } = await import('../../studio/service.js');

const input = (extra) => ({ publicationId: '7f3c2a1e-4b5d-4c6e-8f90-123456789abc', channel: 'facebook_post', ...extra });
const graphic = (postType, visualStyle) => ({
  id: 'g1',
  name: 'Grafika',
  status: 'draft',
  currentRevision: 3,
  payload: { postType, visualStyle, formats: ['feed'], content: { opponent: 'Maxbau Okna Dako PSP', opponentShort: 'MODP' } },
});

describe('update_graphic: rival shield text (opponentShort)', () => {
  beforeEach(() => {
    state.saved = undefined;
    vi.mocked(updateProject).mockClear();
  });

  it.each([
    ['preview', 'sport'],
    ['final', 'poster'],
  ])('saves the shield text of a match graphic (%s) in capitals', async (postType, style) => {
    state.view = graphic(postType, style);
    const out = await updateChannelGraphic({}, 'owner', input({ opponentShort: ' psp ' }));
    expect(state.saved.content.opponentShort).toBe('PSP');
    expect(state.saved.content.opponent).toBe('Maxbau Okna Dako PSP');
    expect(out).toMatchObject({ opponentShort: 'PSP', revision: 4, stillToFix: [] });
  });

  it('accepts 1 to 8 characters, as the graphic contract does (contracts.js: opponentShort text(8))', async () => {
    state.view = graphic('preview', 'sport');
    await expect(updateChannelGraphic({}, 'owner', input({ opponentShort: 'ABCDEFGH' }))).resolves.toMatchObject({ opponentShort: 'ABCDEFGH' });
    await expect(updateChannelGraphic({}, 'owner', input({ opponentShort: 'ABCDEFGHI' }))).rejects.toThrow();
    await expect(updateChannelGraphic({}, 'owner', input({ opponentShort: '   ' }))).rejects.toThrow();
    expect(updateProject).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['lineup', 'five', 'editorial'],
    ['player', 'mvp', 'photo'],
    ['report', 'report-cover', 'editorial'],
    ['statistics', 'leaders', 'editorial'],
  ])('refuses it on a graphic without the rival shield (%s) and saves nothing', async (_family, postType, style) => {
    state.view = graphic(postType, style);
    await expect(updateChannelGraphic({}, 'owner', input({ opponentShort: 'PSP' }))).rejects.toMatchObject({ status: 422, message: 'Ta grafika nie ma tarczy rywala' });
    expect(updateProject).not.toHaveBeenCalled();
  });

  it('leaves the shield text alone when the field is not sent', async () => {
    state.view = graphic('lineup', 'editorial');
    const out = await updateChannelGraphic({}, 'owner', input({ title: 'PIERWSZA PIĄTKA' }));
    expect(state.saved.content.opponentShort).toBe('MODP');
    expect(out.title).toBe('PIERWSZA PIĄTKA');
  });
});
