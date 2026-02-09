import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BkpkButton from './BkpkButton';

describe('BkpkButton', () => {
    it('renders correctly', () => {
        render(<BkpkButton>Click me</BkpkButton>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('handles click events', () => {
        const handleClick = vi.fn();
        render(<BkpkButton onClick={handleClick}>Click me</BkpkButton>);

        fireEvent.click(screen.getByText('Click me'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies variant classes', () => {
        render(<BkpkButton variant="destructive">Delete</BkpkButton>);
        const button = screen.getByText('Delete').closest('button');
        expect(button).toHaveClass('bg-bkpk-danger-fill');
    });
});
