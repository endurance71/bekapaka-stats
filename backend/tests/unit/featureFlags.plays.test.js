import { afterEach, describe, expect, it, vi } from 'vitest';
import { playsEnabled } from '../../lib/featureFlags.js';

describe('zagrywki wyłączone domyślnie (PLAYS_ENABLED)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('flaga jest włączona tylko dla „true”', () => {
    expect(playsEnabled({})).toBe(false);
    expect(playsEnabled({ PLAYS_ENABLED: 'false' })).toBe(false);
    expect(playsEnabled({ PLAYS_ENABLED: '1' })).toBe(false);
    expect(playsEnabled({ PLAYS_ENABLED: ' TRUE ' })).toBe(true);
  });

  it('bez flagi silnik AI nie zna operacji panel.play', async () => {
    vi.stubEnv('PLAYS_ENABLED', '');
    const { operations } = await import('../../ai-engine/operations.js');
    expect(operations.map((o) => o.id)).not.toContain('panel.play');
    expect(operations.map((o) => o.id)).toContain('panel.pregame');
  });

  it('z flagą operacja wraca', async () => {
    vi.stubEnv('PLAYS_ENABLED', 'true');
    const { operations } = await import('../../ai-engine/operations.js');
    expect(operations.map((o) => o.id)).toContain('panel.play');
  });
});
