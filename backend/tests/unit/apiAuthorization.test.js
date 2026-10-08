import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const mocks = vi.hoisted(() => ({
  touchUserActivity: vi.fn(),
  createGame: vi.fn(async () => ({ id: 'game-1' })),
  getRoster: vi.fn(async () => [{
    id: 'player-1', firstName: 'Jan', lastName: 'Testowy',
    password: 'hashed-secret', username: 'private-login',
    data: { photo: '/jan.png', password: 'legacy-secret' }
  }]),
  getPlayerById: vi.fn(async () => ({
    id: 'player-1', firstName: 'Jan', lastName: 'Testowy',
    password: 'hashed-secret', aiDevelopmentSummary: 'private analysis',
    data: { photo: '/jan.png' }
  }))
}));

vi.mock('../../lib/prisma.js', () => ({ prisma: {} }));
vi.mock('../../dataStore.js', async (importOriginal) => ({
  ...await importOriginal(),
  ...mocks
}));

const secret = 'test-only-secret-at-least-thirty-two-chars';
const token = (id, role) => jwt.sign({ id, role }, secret);

let server;
let baseUrl;

async function request(path, method = 'GET', bearer) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {})
    },
    ...(method !== 'GET' ? { body: '{}' } : {})
  });
}

beforeAll(async () => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('JWT_SECRET', secret);
  const { app } = await import('../../server.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  vi.unstubAllEnvs();
});

describe('API authorization', () => {
  it('players cannot change their own photo (coach only, via admin)', async () => {
    expect((await request('/api/profile', 'PUT', token('player-1', 'PLAYER'))).status).toBe(403);
    expect((await request('/api/admin/users/player-1', 'PUT', token('player-1', 'PLAYER'))).status).toBe(403);
  });

  it('player goals: only the player or a coach; match day only for a coach', async () => {
    expect((await request('/api/players/player-1/goals', 'PUT')).status).toBe(401);
    expect((await request('/api/players/player-1/goals', 'PUT', token('player-2', 'PLAYER'))).status).toBe(403);
    expect((await request('/api/admin/matches/s1/4144/match-day', 'PATCH', token('player-1', 'PLAYER'))).status).toBe(403);
  });

  it('team analytics, scouting and the player home require login', async () => {
    for (const path of ['/api/trends/team', '/api/trends/league', '/api/scouting/next', '/api/scouting/detailed', '/api/me/home']) {
      expect((await request(path)).status).toBe(401);
    }
  });

  it('requires an admin for game and tactical writes', async () => {
    for (const path of ['/api/games', '/api/tactics/plays', '/api/tactics/plays/generate', '/api/coach-notes/game-1', '/api/tags/game-1']) {
      expect((await request(path, 'POST')).status).toBe(401);
      expect((await request(path, 'POST', token('player-1', 'PLAYER'))).status).toBe(403);
    }
    expect((await request('/api/games', 'POST', token('admin-1', 'ADMIN'))).status).toBe(201);
  });

  it('requires admin authentication for presentation writes', async () => {
    const path='/api/admin/matches/kalk/season/match/presentation';
    expect((await request(path, 'PATCH')).status).toBe(401);
    expect((await request(path, 'PATCH', token('p', 'PLAYER'))).status).toBe(403);
  });

  it('removes account secrets from the public roster', async () => {
    const response = await request('/api/roster');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body[0].photo).toBe('/jan.png');
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(JSON.stringify(body)).not.toContain('private-login');
  });

  it('requires a login for profile and restricts development notes', async () => {
    expect((await request('/api/players/player-1')).status).toBe(401);
    const other = await request('/api/players/player-1', 'GET', token('player-2', 'PLAYER'));
    expect(other.status).toBe(200);
    expect(await other.json()).not.toHaveProperty('aiDevelopmentSummary');
    const own = await request('/api/players/player-1', 'GET', token('player-1', 'PLAYER'));
    expect((await own.json()).aiDevelopmentSummary).toBe('private analysis');
    const admin = await request('/api/players/player-1', 'GET', token('admin-1', 'ADMIN'));
    expect((await admin.json()).aiDevelopmentSummary).toBe('private analysis');
  });

  it('does not reflect arbitrary browser origins in CORS headers', async () => {
    const blocked = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://untrusted.example' }
    });
    expect(blocked.headers.get('access-control-allow-origin')).toBeNull();
    const allowed = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://panel.bekapaka.pl' }
    });
    expect(allowed.headers.get('access-control-allow-origin')).toBe('https://panel.bekapaka.pl');
  });

  it('protects the legacy playbook endpoint too', async () => {
    expect((await request('/api/plays')).status).toBe(401);
  });
});
