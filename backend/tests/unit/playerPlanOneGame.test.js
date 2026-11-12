import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({ prisma: {} }));

import { gameHasCourtTime } from '../../ai/buildPlayerContext.js';

describe('plan rozwoju od pierwszego meczu', () => {
  it('liczy mecz z minutami albo z akcją w box score', () => {
    expect(gameHasCourtTime({ min: '09:36', pts: 0 })).toBe(true);
    expect(gameHasCourtTime({ min: '00:00', reb: 2 })).toBe(true);
    expect(gameHasCourtTime({ min: '0:00', fga: 1 })).toBe(true);
  });

  it('nie liczy samego wpisu w protokole bez gry', () => {
    expect(gameHasCourtTime({ min: '00:00', pts: 0, reb: 0, ast: 0, pf: 0 })).toBe(false);
    expect(gameHasCourtTime({})).toBe(false);
  });
});
