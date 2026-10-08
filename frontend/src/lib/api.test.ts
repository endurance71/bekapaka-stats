import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, fetchJSON, setUnauthorizedHandler } from './api';
import { isSessionRejected } from '../context/AuthContext';

afterEach(() => { vi.unstubAllGlobals(); setUnauthorizedHandler(null); localStorage.clear(); });

describe('api — błędy', () => {
    it('brak sieci = ApiError 0 i nie wylogowuje', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
        const err = await fetchJSON('/api/auth/me').catch((e: ApiError) => e) as ApiError;
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(0);
        expect(isSessionRejected(err)).toBe(false);
    });

    it('503 z serwera: polski komunikat, sesja zostaje', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
        const err = await fetchJSON('/api/games').catch((e: ApiError) => e) as ApiError;
        expect(err.status).toBe(503);
        expect(err.message).toMatch(/Serwer chwilowo/);
        expect(isSessionRejected(err)).toBe(false);
    });

    it('401 z tokenem = wylogowanie; 401 przy logowaniu bez tokenu nie przeładowuje strony', async () => {
        const handler = vi.fn();
        setUnauthorizedHandler(handler);
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'Błędny login lub hasło' }), { status: 401 })));
        const noToken = await fetchJSON('/api/auth/login').catch((e: ApiError) => e) as ApiError;
        expect(noToken.message).toBe('Błędny login lub hasło');
        expect(handler).not.toHaveBeenCalled();
        localStorage.setItem('bkpk_token', 't');
        const withToken = await fetchJSON('/api/auth/me').catch((e: ApiError) => e) as ApiError;
        expect(isSessionRejected(withToken)).toBe(true);
        expect(handler).toHaveBeenCalledTimes(1);
    });
});
