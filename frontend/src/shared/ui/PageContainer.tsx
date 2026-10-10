import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface PageContainerProps {
    children: ReactNode;
    className?: string;
}

/**
 * Jedna oś treści dla wszystkich ekranów panelu: od menu do ~1920 px, wyrównana do lewej
 * (nagłówek każdej strony w tym samym miejscu). `@container` — układy (`MainAside`, `CardGrid`)
 * dobierają kolumny do szerokości treści, więc zwinięte menu daje od razu więcej miejsca.
 */
export function PageContainer({ children, className }: PageContainerProps) {
    return (
        <div className={cn('@container w-full max-w-[1920px] px-4 md:px-8 lg:px-10 py-6 md:py-8 lg:py-10 space-y-8 lg:space-y-10', className)}>
            {children}
        </div>
    );
}

export default PageContainer;
