import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { UpdateNotification } from './UpdateNotification';

describe('UpdateNotification — pigułka nowej wersji', () => {
    it('mała pigułka z „Odśwież” i zamknięciem', () => {
        const applyUpdate = vi.fn();
        const dismiss = vi.fn();
        render(<UpdateNotification updateAvailable applyUpdate={applyUpdate} dismiss={dismiss} />);
        fireEvent.click(screen.getByRole('button', { name: /Odśwież/ }));
        fireEvent.click(screen.getByRole('button', { name: /Zamknij informację/ }));
        expect(applyUpdate).toHaveBeenCalledOnce();
        expect(dismiss).toHaveBeenCalledOnce();
        expect(screen.queryByText(/Dostępna nowa wersja/)).toBeNull();
    });

    it('bez aktualizacji nic nie pokazuje', () => {
        const { container } = render(<UpdateNotification updateAvailable={false} applyUpdate={vi.fn()} dismiss={vi.fn()} />);
        expect(container.firstChild).toBeNull();
    });
});
