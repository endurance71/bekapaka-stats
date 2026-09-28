import { describe, expect, it } from 'vitest';
import { toPlayerProfileResponse, toPublicRosterPlayer } from '../../lib/apiResponses.js';

const player = {
  id: 'player-1',
  firstName: 'Jan',
  lastName: 'Testowy',
  data: { photo: '/jan.png', password: 'legacy-secret', phone: 'private' },
  password: 'hashed-secret',
  username: 'private-login',
  lastLoginIp: '127.0.0.1',
  aiDevelopmentSummary: 'private analysis',
  aiDevelopmentAt: new Date('2026-01-01'),
  aiDevelopmentModel: 'test-model',
  kalkPlayer: {
    id: 'kalk-1',
    name: 'Jan Testowy',
    raw: { photo_url: '/kalk.png', private: 'hidden' }
  }
};

describe('player API response allowlists', () => {
  it('does not expose account fields, legacy data, or AI notes on the public roster', () => {
    const response = toPublicRosterPlayer(player);
    const serialized = JSON.stringify(response);
    expect(response.photo).toBe('/jan.png');
    expect(response.kalkPlayer.raw.photo_url).toBe('/kalk.png');
    for (const secret of ['legacy-secret', 'private-login', '127.0.0.1', 'private analysis', 'hidden']) {
      expect(serialized).not.toContain(secret);
    }
  });

  it('limits player development notes to self or admin callers', () => {
    const other = toPlayerProfileResponse(player);
    const own = toPlayerProfileResponse(player, { includeDevelopment: true });
    expect(other).not.toHaveProperty('aiDevelopmentSummary');
    expect(own.aiDevelopmentSummary).toBe('private analysis');
    expect(JSON.stringify(own)).not.toContain('hashed-secret');
  });
});
