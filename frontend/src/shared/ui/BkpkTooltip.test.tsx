import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BkpkTooltip from './BkpkTooltip';

describe('BkpkTooltip', () => {
    it('stuknięcie otwiera i zamyka, Esc i stuknięcie poza zamykają', async () => {
        render(
            <div>
                <BkpkTooltip content="Zebrane piłki" label="Wyjaśnienie: zbiórki" />
                <p>poza</p>
            </div>
        );
        const trigger = screen.getByRole('button', { name: 'Wyjaśnienie: zbiórki' });
        fireEvent.pointerDown(trigger, { pointerType: 'touch' });
        fireEvent.click(trigger);
        expect(screen.getByRole('tooltip')).toHaveTextContent('Zebrane piłki');
        fireEvent.pointerDown(trigger, { pointerType: 'touch' });
        fireEvent.click(trigger);
        await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());

        fireEvent.click(trigger);
        fireEvent.keyDown(document, { key: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());

        fireEvent.click(trigger);
        fireEvent.pointerDown(screen.getByText('poza'));
        await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    });
});
