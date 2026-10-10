import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CardGrid, MainAside } from './PageLayout';
import PageTabs from './PageTabs';
import PageContainer from './PageContainer';
import { nextRound } from '../../features/league/NextRoundCard';

describe('układ stron — wspólne klocki', () => {
    it('PageContainer: jedna szerokość, wyrównanie do lewej, kontener zapytań', () => {
        const { container } = render(<PageContainer>x</PageContainer>);
        const el = container.firstElementChild!;
        expect(el.className).toContain('@container');
        expect(el.className).toContain('max-w-[1920px]');
        expect(el.className).not.toContain('mx-auto');
    });

    it('MainAside: treść, potem kolumna boczna; od @5xl obok siebie (albo od @7xl dla szerokich tabel)', () => {
        const { container, rerender } = render(<MainAside aside={<p>bok</p>}><p>treść</p></MainAside>);
        const grid = container.querySelector('[data-layout="main-aside"]')!;
        expect(grid.children[0].textContent).toBe('treść');
        expect(grid.children[1].tagName).toBe('ASIDE');
        expect(grid.className).toContain('@5xl:grid-cols-[minmax(0,1fr)_340px]');

        rerender(<MainAside aside={<p>bok</p>} asideFrom="7xl" asideFirst><p>treść</p></MainAside>);
        const wide = container.querySelector('[data-layout="main-aside"]')!;
        expect(wide.className).not.toContain('@5xl:grid-cols');
        expect(wide.children[1].className).toContain('order-first @7xl:order-none');
    });

    it('CardGrid: minimalna szerokość karty i limit kolumn w zmiennej CSS', () => {
        const { container } = render(<CardGrid min={480} max={2}><div /><div /></CardGrid>);
        const grid = container.querySelector<HTMLElement>('[data-layout="card-grid"]')!;
        expect(grid.style.getPropertyValue('--card-min')).toBe('max(480px, calc((100% - 24px) / 2))');
        expect(grid.className).toContain('auto-fit');
    });

    it('PageTabs: role zakładek, aktywna oznaczona, zmiana przez onChange', () => {
        const onChange = vi.fn();
        render(<PageTabs label="Sekcje" active="a" onChange={onChange} tabs={[{ id: 'a', label: 'Tabela' }, { id: 'b', label: 'Terminarz' }]} />);
        expect(screen.getByRole('tablist', { name: 'Sekcje' })).toBeTruthy();
        expect(screen.getByRole('tab', { name: 'Tabela' }).getAttribute('aria-selected')).toBe('true');
        fireEvent.click(screen.getByRole('tab', { name: 'Terminarz' }));
        expect(onChange).toHaveBeenCalledWith('b');
    });

    it('nextRound: mecze najbliższej nierozegranej kolejki', () => {
        const now = Date.parse('2026-10-09T10:00:00Z');
        const m = (id: string, date: string, round: string, isFinished = false) => ({ id, date, homeTeam: 'A', guestTeam: 'B', isFinished, roundLabel: round });
        const r = nextRound([
            m('1', '2026-10-04T12:00:00Z', 'Kolejka - 3', true),
            m('2', '2026-10-18T12:40:00Z', 'Kolejka - 5'),
            m('3', '2026-10-10T13:00:00Z', 'Kolejka - 4'),
            m('4', '2026-10-10T15:00:00Z', 'Kolejka - 4'),
        ], now);
        expect(r.label).toBe('Kolejka 4');
        expect(r.matches.map((x) => x.id)).toEqual(['3', '4']);
    });
});
