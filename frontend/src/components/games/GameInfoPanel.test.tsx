import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import GameInfoPanel from './GameInfoPanel';
import type { GameInfoResponse } from './kalkMatchTypes';

beforeAll(() => {
    if (!('ResizeObserver' in globalThis)) {
        (globalThis as any).ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    }
});

const info: GameInfoResponse = {
    matchId: '4124',
    seasonId: 'season_2026-2027',
    home: { name: 'BeKaPaKa Bobolice', teamKalkId: '138', isBekapaka: true, score: 86 },
    away: { name: 'Kosz-All-In', teamKalkId: '148', isBekapaka: false, score: 20 },
    bekapakaSide: 'home',
    stageLabel: 'Sezon zasadniczy',
    roundLabel: 'Kolejka - 3',
    venue: 'ZOS - KOSiR',
    city: 'Koszalin',
    startsAtUtc: '2026-10-04T10:00:00Z',
    date: '2026-10-04T10:00:00Z',
    overtimes: 0,
    hasPlayByPlay: true,
    sectionsAvailable: [],
    mvp: { slug: 'filip-karpinski', name: 'Filip Karpiński', number: 69, eval: 36, side: 'home', teamName: 'BeKaPaKa Bobolice', line: { pts: 28, reb: 6, ast: 4, eval: 36 } },
    referees: ['Jan Kowalski', 'Adam Nowak'],
    commissioner: 'Piotr Zieliński',
    statistician: null,
    leaders: { pts: [{ name: 'Filip Karpiński', slug: 'filip-karpinski', teamKalkId: '138', value: 28, side: 'home' }] },
    flow5: [{ minute: 5, home: 13, away: 2 }, { minute: 10, home: 26, away: 4 }],
    quarters: [{ period: 1, label: 'Q1', home: 26, away: 4 }],
    pointsSources: {
        home: { ptsOffTurnovers: 26, ptsInPaint: 0, secondChancePts: 10, fastBreakPts: 44 },
        away: { ptsOffTurnovers: 2, ptsInPaint: 0, secondChancePts: 6, fastBreakPts: 2 },
    },
    teamStats: { home: null, away: null },
    h2h: {
        focusSide: 'home',
        focusTeam: 'BeKaPaKa Bobolice',
        otherTeam: 'Kosz-All-In',
        games: 1,
        focusWins: 0,
        otherWins: 1,
        meetings: [{
            matchId: '900', seasonId: 'season_2025-2026', date: '2025-11-01T10:00:00Z', homeTeamName: 'Kosz-All-In', guestTeamName: 'BeKaPaKa Bobolice',
            scoreHome: 72, scoreAway: 70, stageLabel: null, roundLabel: null, focusAtHome: false, focusScore: 70, otherScore: 72, focusWon: false,
        }],
    },
    records: {
        home: { pts: { value: 28, players: [{ name: 'F. Karpiński', slug: 'filip-karpinski', number: 69 }] } },
        away: { pts: { value: 8, players: [{ name: 'F. Filipczak', slug: null, number: 11 }] } },
    },
};

describe('GameInfoPanel', () => {
    it('renders MVP, officials, points sources, records and H2H', () => {
        render(<MemoryRouter><GameInfoPanel info={info} /></MemoryRouter>);
        expect(screen.getByText('MVP meczu')).toBeInTheDocument();
        expect(screen.getAllByText('Filip Karpiński').length).toBeGreaterThan(0);
        expect(screen.getByText('Jan Kowalski, Adam Nowak')).toBeInTheDocument();
        expect(screen.getByText('Piotr Zieliński')).toBeInTheDocument();
        expect(screen.getByText('Po stratach rywala')).toBeInTheDocument();
        // KALK raportuje 0 „spod kosza” dla obu → wiersz pominięty
        expect(screen.queryByText('Spod kosza')).not.toBeInTheDocument();
        expect(screen.getByText('Rekordy meczu')).toBeInTheDocument();
        expect(screen.getByText('F. Filipczak')).toBeInTheDocument();
        const h2hLink = screen.getByRole('link', { name: /01\.11\.2025/ });
        expect(h2hLink).toHaveAttribute('href', '/games/900?seasonId=season_2025-2026');
    });
});
