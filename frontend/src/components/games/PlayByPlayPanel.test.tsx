import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PlayByPlayPanel from './PlayByPlayPanel';
import type { PbpEvent, PlayByPlayResponse } from './kalkMatchTypes';

const ev = (seq: number, period: number, side: 'home' | 'away' | null, h: number, a: number, extra: Partial<PbpEvent> = {}): PbpEvent => ({
    seq,
    period,
    clockSec: 600 - seq * 10,
    side,
    playerName: side ? `Gracz ${seq}` : null,
    playerSlug: null,
    playerNumber: side ? seq : null,
    actionRaw: side ? 'Celny rzut za 2' : 'Początek okresu',
    actionType: side ? 'shot_made' : 'period_start',
    shotValue: 2,
    made: true,
    reboundType: null,
    subOutNumber: null,
    scoreHome: h,
    scoreAway: a,
    isScoring: Boolean(side),
    ...extra,
});

const data: PlayByPlayResponse = {
    matchId: '4124',
    seasonId: 's',
    available: true,
    // BeKaPaKa na wyjeździe → i tak lewa kolumna
    home: { name: 'Kosz-All-In', teamKalkId: '148', isBekapaka: false, score: 2 },
    away: { name: 'BeKaPaKa Bobolice', teamKalkId: '138', isBekapaka: true, score: 10 },
    bekapakaSide: 'away',
    events: [
        ev(1, 1, null, 0, 0),
        ev(2, 1, 'away', 0, 2),
        ev(3, 1, 'away', 0, 4),
        ev(4, 1, 'away', 0, 6),
        ev(5, 1, 'away', 0, 8),
        ev(6, 2, 'home', 2, 8),
        ev(7, 2, 'away', 2, 10, { actionRaw: 'Zbiórka', actionType: 'rebound', isScoring: false, reboundType: 'D', scoreAway: 8, scoreHome: 2 }),
    ],
    periods: [
        { period: 1, label: 'Q1', scoreHome: 0, scoreAway: 8 },
        { period: 2, label: 'Q2', scoreHome: 2, scoreAway: 8 },
    ],
    runs: [{ side: 'away', points: 8, startSeq: 2, endSeq: 5, period: 1, endPeriod: 1, fromScore: { home: 0, away: 0 }, toScore: { home: 0, away: 8 } }],
    leadChanges: 0,
    ties: 0,
    largestLead: { home: 0, away: 8 },
    largestRun: { home: 2, away: 8 },
};

describe('PlayByPlayPanel', () => {
    it('renders periods, BeKaPaKa-first scores and run badges', () => {
        render(<PlayByPlayPanel data={data} />);
        expect(screen.getByRole('region', { name: 'Kwarta 1' })).toBeInTheDocument();
        expect(screen.getByText('Run 8:0')).toBeInTheDocument();
        // Wynik w perspektywie BeKaPaKa (lewa strona) — 8:0, nie 0:8
        const q1 = screen.getByRole('region', { name: 'Kwarta 1' });
        expect(within(q1).getAllByText('8:0').length).toBeGreaterThan(0);
        expect(screen.getByText('Zbiórka w obronie')).toBeInTheDocument();
        expect(screen.getByText('6 zdarzeń')).toBeInTheDocument();
    });

    it('filters by quarter and scoring events', () => {
        render(<PlayByPlayPanel data={data} />);
        fireEvent.click(screen.getByRole('button', { name: 'Q2' }));
        expect(screen.queryByRole('region', { name: 'Kwarta 1' })).not.toBeInTheDocument();
        expect(screen.getByText('2 zdarzenia')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Punkty' }));
        expect(screen.getByText('1 zdarzenie')).toBeInTheDocument();
    });
});
