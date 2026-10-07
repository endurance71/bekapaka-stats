import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { JerseyStripes } from './JerseyStripes';

export interface PageHeaderProps {
    /** Krótka etykieta nad tytułem (kicker z czerwoną belką). */
    kicker?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    /** Akcje / meta po prawej (przyciski, wybór sezonu). */
    actions?: ReactNode;
    /** Paski stroju pod nagłówkiem (domyślnie tak). */
    stripes?: boolean;
    className?: string;
}

/** Nagłówek podstrony wg bekapaka.pl: kicker → tytuł Condensed wersalikami → lead → paski stroju. */
export function PageHeader({ kicker, title, description, actions, stripes = true, className }: PageHeaderProps) {
    return (
        <header className={cn('flex flex-col gap-5 sm:gap-6', className)}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-3 min-w-0">
                    {kicker && <span className="kicker">{kicker}</span>}
                    <h1 className="text-[40px] sm:text-[48px] lg:text-[57px] leading-[0.95] text-bkpk-text-primary break-words">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-bkpk-text-secondary text-base sm:text-lg leading-relaxed max-w-2xl">
                            {description}
                        </p>
                    )}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
            </div>
            {stripes && <JerseyStripes className="max-w-[200px]" />}
        </header>
    );
}

export default PageHeader;
