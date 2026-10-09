import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useCachedJSON } from './useCachedJSON';
import { clearApiCache, fetchJSON } from '../lib/api';

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
    vi.unstubAllGlobals();
    clearApiCache();
});

describe('useCachedJSON — dane między stronami', () => {
    it('drugie wejście pokazuje dane od razu (bez loadera), świeże nie pytają serwera', async () => {
        const fetchMock = vi.fn(async () => json([{ id: 1 }]));
        vi.stubGlobal('fetch', fetchMock);

        const first = renderHook(() => useCachedJSON<{ id: number }[]>('/api/games'));
        expect(first.result.current.loading).toBe(true);
        await waitFor(() => expect(first.result.current.data).toEqual([{ id: 1 }]));
        first.unmount();

        const second = renderHook(() => useCachedJSON<{ id: number }[]>('/api/games'));
        expect(second.result.current.loading).toBe(false);
        expect(second.result.current.data).toEqual([{ id: 1 }]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('nieświeże dane widać, a w tle przychodzą nowe; błąd odświeżenia ich nie chowa', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => json({ v: 1 })));
        await fetchJSON('/api/league/table');

        vi.stubGlobal('fetch', vi.fn(async () => json({ v: 2 })));
        const { result } = renderHook(() => useCachedJSON<{ v: number }>('/api/league/table', 0));
        expect(result.current.data).toEqual({ v: 1 });
        await waitFor(() => expect(result.current.data).toEqual({ v: 2 }));

        vi.stubGlobal('fetch', vi.fn(async () => json({}, 503)));
        await act(() => result.current.reload());
        expect(result.current.data).toEqual({ v: 2 });
        expect(result.current.error).toBeNull();
    });

    it('wylogowanie czyści pamięć — kolejne wejście znowu pyta serwer', async () => {
        const fetchMock = vi.fn(async () => json({ me: true }));
        vi.stubGlobal('fetch', fetchMock);
        await fetchJSON('/api/me/home');
        clearApiCache();
        const { result } = renderHook(() => useCachedJSON('/api/me/home'));
        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.data).toEqual({ me: true }));
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
