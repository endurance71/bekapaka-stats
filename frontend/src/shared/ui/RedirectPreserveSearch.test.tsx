import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import RedirectPreserveSearch from './RedirectPreserveSearch';

function Where() {
    const { pathname, search } = useLocation();
    return <p>{pathname + search}</p>;
}

const renderAt = (url: string) =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <Routes>
                <Route path="/scouting" element={<RedirectPreserveSearch to="/rywal" />} />
                <Route path="/tactics" element={<RedirectPreserveSearch to="/druzyna" extra={{ widok: 'zagrywki' }} />} />
                <Route path="*" element={<Where />} />
            </Routes>
        </MemoryRouter>
    );

describe('stare adresy panelu', () => {
    it('/scouting?opponent=… → /rywal z tym samym rywalem', () => {
        renderAt('/scouting?opponent=GMVT%20TEAM');
        expect(screen.getByText('/rywal?opponent=GMVT+TEAM')).toBeInTheDocument();
    });

    it('/tactics → /druzyna?widok=zagrywki', () => {
        renderAt('/tactics');
        expect(screen.getByText('/druzyna?widok=zagrywki')).toBeInTheDocument();
    });
});
