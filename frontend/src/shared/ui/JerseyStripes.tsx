import { cn } from '../lib/utils';

/** DNA stroju A: 4 czerwone paski wygaszane ku górze — separator nagłówków i stopki. */
export function JerseyStripes({ className }: { className?: string }) {
    return (
        <span className={cn('jersey-stripes', className)} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
        </span>
    );
}

export default JerseyStripes;
