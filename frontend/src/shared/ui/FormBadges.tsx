import { cn } from '../lib/utils';

type ResultKind = 'win' | 'loss' | 'neutral';

function resultKind(value: string): ResultKind {
    const upper = value.toUpperCase();
    if (upper.startsWith('W') || upper.startsWith('Z')) return 'win';
    if (upper.startsWith('L') || upper.startsWith('P')) return 'loss';
    return 'neutral';
}

const badgeBase = 'inline-flex items-center justify-center w-7 h-7 border-[1.5px] font-display text-[15px] leading-none';
const kindClass: Record<ResultKind, string> = {
    win: 'bg-bkpk-text-primary border-bkpk-text-primary text-bkpk-bg',
    loss: 'border-bkpk-text-secondary text-bkpk-text-secondary',
    neutral: 'border-bkpk-border-strong text-bkpk-text-muted',
};

/** Forma jak `standings-badge` na bekapaka.pl: litera + kształt (pełny / kontur) + tekst dla czytnika. */
export function FormBadges({ form, className }: { form?: string[] | null; className?: string }) {
    if (!form || form.length === 0) {
        return <span className="text-bkpk-text-muted">—</span>;
    }
    return (
        <span className={cn('inline-flex gap-1', className)}>
            {form.map((entry, index) => {
                const kind = resultKind(entry);
                const label = kind === 'win' ? 'Wygrana' : kind === 'loss' ? 'Porażka' : entry;
                return (
                    <span key={index} className={cn(badgeBase, kindClass[kind])} title={label}>
                        <span aria-hidden="true">{kind === 'win' ? 'W' : kind === 'loss' ? 'P' : entry.toUpperCase()}</span>
                        <span className="sr-only">{label}</span>
                    </span>
                );
            })}
        </span>
    );
}

/** Seria (np. W3 / L2 → P2) — polska notacja jak na stronie. */
export function StreakBadge({ streak }: { streak?: string | null }) {
    if (!streak || streak.trim() === '' || streak.trim() === '—') {
        return <span className="text-bkpk-text-muted">—</span>;
    }
    // Seria 1 to po prostu ostatni wynik — już widać go w formie
    if (Number(streak.replace(/\D/g, '')) < 2) return null;
    const kind = resultKind(streak);
    const display = streak.toUpperCase().startsWith('L') ? `P${streak.slice(1)}` : streak.toUpperCase();
    return (
        <span className={cn('inline-flex items-center justify-center min-w-9 h-7 px-1.5', badgeBase.replace('w-7 ', ''), kindClass[kind])}>
            <span aria-hidden="true">{display}</span>
            <span className="sr-only">
                {kind === 'win' ? 'Seria wygranych' : kind === 'loss' ? 'Seria porażek' : 'Seria'}: {streak.replace(/\D/g, '')}
            </span>
        </span>
    );
}

export default FormBadges;
