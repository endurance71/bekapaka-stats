import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

const widths = {
    narrow: 'max-w-[1100px]',
    default: 'max-w-[1400px]',
    wide: 'max-w-[1600px]',
} as const;

export interface PageContainerProps {
    children: ReactNode;
    width?: keyof typeof widths;
    className?: string;
}

/** Jedna oś treści dla wszystkich ekranów panelu (marginesy 16 / 32 / 40 px jak siatka Digital 2.0). */
export function PageContainer({ children, width = 'default', className }: PageContainerProps) {
    return (
        <div
            className={cn(
                'w-full mx-auto px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10 space-y-8 md:space-y-10',
                widths[width],
                className
            )}
        >
            {children}
        </div>
    );
}

export default PageContainer;
