import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface SectionHeadingProps {
    kicker?: ReactNode;
    title: ReactNode;
    /** Akcja po prawej (np. link „Wszystkie”). */
    action?: ReactNode;
    as?: 'h2' | 'h3';
    className?: string;
}

/** Nagłówek sekcji (BandHead na bekapaka.pl): kicker + tytuł Condensed + akcja. */
export function SectionHeading({ kicker, title, action, as: Tag = 'h2', className }: SectionHeadingProps) {
    return (
        <div className={cn('flex items-end justify-between gap-4', className)}>
            <div className="flex flex-col gap-2 min-w-0">
                {kicker && <span className="kicker">{kicker}</span>}
                <Tag className={cn('text-bkpk-text-primary', Tag === 'h2' ? 'text-[28px] sm:text-[32px]' : 'text-[22px] sm:text-[24px]')}>
                    {title}
                </Tag>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

export default SectionHeading;
