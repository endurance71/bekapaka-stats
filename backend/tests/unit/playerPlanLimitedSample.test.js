import { describe, expect, it } from 'vitest';
import { buildLimitedSampleNotice, withLimitedSampleNotice } from '../../ai/playerDevelopmentMarkdown.js';
import { buildPlayerDevelopmentUser } from '../../ai/prompts/playerDevelopment.pl.js';

describe('player plan with fewer than 3 games', () => {
  it('starts the plan with a notice about the limited analysis', () => {
    expect(buildLimitedSampleNotice({ games: 1, minGamesForFull: 3 })).toMatch(/^> \*\*Ograniczona analiza — dopiero 1 mecz w sezonie\.\*\*.*po 3 meczach/);
    expect(buildLimitedSampleNotice({ games: 2, minGamesForFull: 3 })).toContain('dopiero 2 mecze');
    expect(withLimitedSampleNotice('## Profil\n\nTekst.', { games: 2, minGamesForFull: 3 })).toMatch(/^> \*\*Ograniczona analiza[\s\S]*\n\n## Profil/);
  });

  it('leaves a full plan unchanged', () => {
    expect(buildLimitedSampleNotice(undefined)).toBe('');
    expect(withLimitedSampleNotice('## Profil\n\nTekst.', undefined)).toBe('## Profil\n\nTekst.');
  });

  it('tells the model not to invent trends from a small sample', () => {
    const limited = buildPlayerDevelopmentUser({ player: { firstName: 'Jan' }, limitedSample: { games: 1, minGamesForFull: 3 } });
    expect(limited).toContain('OGRANICZONA PRÓBKA');
    expect(limited).toContain('1 mecz w sezonie');
    expect(buildPlayerDevelopmentUser({ player: { firstName: 'Jan' } })).not.toContain('OGRANICZONA PRÓBKA');
  });
});
