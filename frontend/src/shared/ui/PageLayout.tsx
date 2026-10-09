import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../lib/utils';
import SectionHeading from './SectionHeading';

/** Wspólny odstęp siatek panelu (24 px) — ten sam między kartami, kolumnami i rzędami. */
export const LAYOUT_GAP = 'gap-6';

/** Siatka `MainAside` dla układów, które same rozmieszczają dzieci (`@5xl:col-start-*`). */
export const MAIN_ASIDE_GRID =
    'grid grid-cols-1 items-start gap-6 @5xl:grid-cols-[minmax(0,1fr)_340px] @7xl:grid-cols-[minmax(0,1fr)_400px]';

export interface MainAsideProps {
    children: ReactNode;
    aside: ReactNode;
    /**
     * Od jakiej szerokości treści kolumna boczna stoi obok: `5xl` (1024 px, domyślnie)
     * albo `7xl` (1280 px) — dla szerokich tabel, żeby ich nie ściskać.
     */
    asideFrom?: '5xl' | '7xl';
    /** Na węższym ekranie kolumna boczna nad treścią (np. podium liderów przed pełną tabelą). */
    asideFirst?: boolean;
    className?: string;
}

/**
 * Treść + kolumna boczna. Węższy ekran: jedno pod drugim w tej kolejności (telefon bez zmian);
 * szeroki: kolumna boczna 340 px, a od 1280 px treści — 400 px.
 */
export function MainAside({ children, aside, asideFrom = '5xl', asideFirst = false, className }: MainAsideProps) {
    return (
        <div
            data-layout="main-aside"
            className={cn(
                asideFrom === '5xl'
                    ? MAIN_ASIDE_GRID
                    : cn('grid grid-cols-1 items-start', LAYOUT_GAP, '@7xl:grid-cols-[minmax(0,1fr)_400px]'),
                className
            )}
        >
            {/* Każda kolumna jest kontenerem — karty w środku dobierają układ do swojej kolumny, nie do okna */}
            <div className="@container min-w-0 space-y-6">{children}</div>
            <aside
                className={cn(
                    '@container min-w-0 space-y-6',
                    asideFirst && (asideFrom === '5xl' ? 'order-first @5xl:order-none' : 'order-first @7xl:order-none')
                )}
            >
                {aside}
            </aside>
        </div>
    );
}

export interface CardGridProps {
    children: ReactNode;
    /** Najmniejsza szerokość karty w px (z niej wynika liczba kolumn) albo własne wyrażenie CSS. */
    min?: number | string;
    /** Najwięcej kolumn (np. 2 dla dwóch dużych bloków), domyślnie bez limitu. */
    max?: number;
    /** `fit` (domyślnie): mało kart = karty szersze; `fill`: stała szerokość karty (np. karty zawodników). */
    mode?: 'fit' | 'fill';
    className?: string;
}

/**
 * Karty w rzędach o równej wysokości; liczba kolumn wynika z dostępnego miejsca
 * (`auto-fit` z minimalną szerokością karty — mniej kart niż miejsca = karty się rozciągają), więc na szerokim ekranie przybywa kolumn.
 */
export function CardGrid({ children, min = 320, max, mode = 'fit', className }: CardGridProps) {
    // max kolumn: minimalna szerokość rośnie tak, by w rzędzie nie zmieściło się więcej niż `max`
    const base = typeof min === 'number' ? `${min}px` : min;
    const minExpr = max ? `max(${base}, calc((100% - ${(max - 1) * 24}px) / ${max}))` : base;
    const style = { '--card-min': minExpr } as CSSProperties;
    return (
        <div
            data-layout="card-grid"
            style={style}
            className={cn(
                'grid [&>*]:h-full',
                mode === 'fit'
                    ? 'grid-cols-[repeat(auto-fit,minmax(min(100%,var(--card-min)),1fr))]'
                    : 'grid-cols-[repeat(auto-fill,minmax(min(100%,var(--card-min)),1fr))]',
                LAYOUT_GAP,
                className
            )}
        >
            {children}
        </div>
    );
}

export interface SectionProps {
    title: ReactNode;
    kicker?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}

/** Sekcja strony: jeden nagłówek (`SectionHeading`, h2) i treść pod nim. */
export function Section({ title, kicker, action, children, className }: SectionProps) {
    return (
        <section className={cn('space-y-5', className)}>
            <SectionHeading title={title} kicker={kicker} action={action} />
            {children}
        </section>
    );
}
