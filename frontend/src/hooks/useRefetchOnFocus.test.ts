import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRefetchOnFocus } from './useRefetchOnFocus';

const show = () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
};

describe('odświeżanie po powrocie do aplikacji', () => {
    it('pobiera ponownie po przerwie, nie częściej niż co interwał', () => {
        vi.useFakeTimers();
        const refetch = vi.fn();
        renderHook(() => useRefetchOnFocus(refetch, 1000));
        show();
        expect(refetch).not.toHaveBeenCalled(); // przed upływem interwału
        vi.advanceTimersByTime(1500);
        show();
        show();
        expect(refetch).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });
});
