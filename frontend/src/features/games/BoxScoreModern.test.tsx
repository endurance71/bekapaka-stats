import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BoxScore, { hasExtendedBoxColumns } from './BoxScoreModern';

beforeAll(() => {
    // jsdom bez matchMedia — widok desktopowy
    window.matchMedia ??= ((query: string) => ({
        matches: false, media: query, onchange: null,
        addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
});

describe('BoxScoreModern', () => {
    it('shows KALK v2 columns and starter marker only when data is present', () => {
        const rows = [{ name: 'D. Olearczyk', number: 1, points: 12, starter: true, offRebounds: 3, defRebounds: 0, fouls: 1, foulsDrawn: 4, blocksAgainst: 2 }];
        expect(hasExtendedBoxColumns(rows)).toBe(true);
        render(<MemoryRouter><BoxScore playerStats={rows} /></MemoryRouter>);
        expect(screen.getByRole('columnheader', { name: 'Zb A/O' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'F/Fw' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Bl o' })).toBeInTheDocument();
        expect(screen.getByText('3/0')).toBeInTheDocument();
        expect(screen.getByText('1/4')).toBeInTheDocument();
        expect(screen.getByTitle('Pierwsza piątka')).toBeInTheDocument();
    });

    it('keeps the legacy column set for game logs', () => {
        render(<MemoryRouter><BoxScore playerStats={[{ name: 'Rywal', points: 10 }]} /></MemoryRouter>);
        expect(screen.queryByRole('columnheader', { name: 'Zb A/O' })).not.toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Pkt' })).toBeInTheDocument();
    });
});
