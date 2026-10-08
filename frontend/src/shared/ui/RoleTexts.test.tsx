import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let role: 'ADMIN' | 'USER' = 'USER';
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'u1', role } }),
    useIsAdmin: () => role === 'ADMIN'
}));

import KalkEmptyState from './KalkEmptyState';
import AiAnalysisBlock from '../../components/ai/AiAnalysisBlock';

describe('teksty zależne od roli', () => {
    beforeEach(() => {
        role = 'USER';
    });

    it('KalkEmptyState: zawodnik bez przycisku administracji', () => {
        render(<MemoryRouter><KalkEmptyState /></MemoryRouter>);
        expect(screen.queryByRole('button', { name: /Administracji/ })).not.toBeInTheDocument();
        expect(screen.getByText(/pobraniu wyników z ligi KALK/)).toBeInTheDocument();
    });

    it('KalkEmptyState: admin widzi przycisk', () => {
        role = 'ADMIN';
        render(<MemoryRouter><KalkEmptyState /></MemoryRouter>);
        expect(screen.getByRole('button', { name: /Administracji/ })).toBeInTheDocument();
    });

    it('AiAnalysisBlock: zawodnik bez instrukcji dla admina i bez nazwy modelu', () => {
        const { rerender } = render(
            <AiAnalysisBlock loading={false} title="Analiza" content={null} emptyHint="Brak — użyj „Generuj”." playerEmptyHint="Pojawi się później." />
        );
        expect(screen.getByText('Pojawi się później.')).toBeInTheDocument();
        expect(screen.queryByText(/Generuj/)).not.toBeInTheDocument();

        rerender(
            <AiAnalysisBlock loading={false} title="Analiza" content="## Tekst" generatedAt="2026-10-08T10:00:00Z" model="gemini-x" sourceLabel="Szablon" staleHint="Nieaktualna" />
        );
        expect(screen.queryByText(/gemini-x/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Szablon/)).not.toBeInTheDocument();
        expect(screen.queryByText('Nieaktualna')).not.toBeInTheDocument();

        rerender(
            <AiAnalysisBlock loading={false} title="Analiza" content="## Tekst" generatedAt="2026-10-08T10:00:00Z" model="gemini-x" staleHint="Nieaktualna" canGenerate />
        );
        expect(screen.getByText(/gemini-x/)).toBeInTheDocument();
        expect(screen.getByText('Nieaktualna')).toBeInTheDocument();
    });
});
