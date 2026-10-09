import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { __resetScrollPositions, useScrollRestoration } from './useScrollRestoration';

let navigate: ReturnType<typeof useNavigate>;

function Harness() {
    const mainRef = useRef<HTMLElement>(null);
    useScrollRestoration(mainRef);
    navigate = useNavigate();
    return <main ref={mainRef} />;
}

describe('useScrollRestoration', () => {
    let scrollY = 0;
    const scrollTo = vi.fn((arg: ScrollToOptions | number) => {
        scrollY = typeof arg === 'number' ? arg : arg.top ?? 0;
        Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true });
    });

    beforeEach(() => {
        __resetScrollPositions();
        scrollY = 0;
        Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
        vi.stubGlobal('scrollTo', scrollTo);
        scrollTo.mockClear();
    });
    afterEach(() => vi.unstubAllGlobals());

    const scrollPage = (y: number) => {
        Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
        window.dispatchEvent(new Event('scroll'));
    };

    it('nowa strona od góry, „Wstecz” wraca w to samo miejsce', () => {
        render(
            <MemoryRouter initialEntries={['/games']}>
                <Harness />
            </MemoryRouter>,
        );
        scrollPage(840);

        act(() => navigate('/games/42'));
        expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });

        act(() => navigate(-1));
        expect(scrollTo).toHaveBeenLastCalledWith({ top: 840, behavior: 'instant' });
    });

    it('zmiana samego ?widok= nie przewija', () => {
        render(
            <MemoryRouter initialEntries={['/league']}>
                <Harness />
            </MemoryRouter>,
        );
        scrollPage(300);
        scrollTo.mockClear();
        act(() => navigate('/league?widok=terminarz'));
        expect(scrollTo).not.toHaveBeenCalled();
    });
});
