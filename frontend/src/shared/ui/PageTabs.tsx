import type { ComponentType } from 'react';
import { cn } from '../lib/utils';

export interface PageTab<T extends string> {
    id: T;
    label: string;
    icon?: ComponentType<{ className?: string }>;
}

export interface PageTabsProps<T extends string> {
    tabs: readonly PageTab<T>[];
    active: T;
    onChange: (id: T) => void;
    /** Opis listy zakładek dla czytnika ekranu, np. „Sekcje ligi”. */
    label: string;
    className?: string;
}

/**
 * Zakładki podstrony — jak `.tabs` na bekapaka.pl: wersaliki, 3 px czerwone podkreślenie aktywnej.
 * Jeden wygląd dla Ligi, Drużyny i Meczu; na telefonie bez ikon, przewijane w bok.
 */
export function PageTabs<T extends string>({ tabs, active, onChange, label, className }: PageTabsProps<T>) {
    return (
        <div role="tablist" aria-label={label} className={cn('flex overflow-x-auto no-scrollbar max-w-full gap-5 sm:gap-8 border-b border-bkpk-border-subtle', className)}>
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = active === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            'relative inline-flex items-center gap-2 min-h-[48px] shrink-0 whitespace-nowrap label-caps text-xs sm:text-sm transition-colors duration-200',
                            'after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-bkpk-primary after:origin-left after:transition-transform after:duration-200',
                            isActive
                                ? 'text-bkpk-text-primary after:scale-x-100'
                                : 'text-bkpk-text-muted hover:text-bkpk-text-primary after:scale-x-0'
                        )}
                    >
                        {Icon && (
                            <span className="hidden sm:inline-flex shrink-0" aria-hidden="true">
                                <Icon className="w-4 h-4" />
                            </span>
                        )}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}

export default PageTabs;
