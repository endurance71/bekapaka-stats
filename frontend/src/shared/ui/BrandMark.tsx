import sygnetUrl from '../../assets/brand/sygnet2-kolor-ciasny.svg';
import wordmarkUrl from '../../assets/brand/wordmark-negatyw.svg';
import { cn } from '../lib/utils';

export interface BrandMarkProps {
    /** Tylko Sygnet 2.0 (zwinięty sidebar). */
    compact?: boolean;
    /** Etykieta pod wordmarkiem, np. „Panel klubu”. */
    label?: string;
    size?: 'sm' | 'md';
    className?: string;
}

/** Nagłówek WWW wg Brandbooka 2.0: Sygnet 2.0 + wordmark (jak ClubLogo na bekapaka.pl). */
export function BrandMark({ compact = false, label, size = 'md', className }: BrandMarkProps) {
    const markH = size === 'sm' ? 'h-8' : 'h-10';
    const wordW = size === 'sm' ? 'w-[112px]' : 'w-[136px]';

    return (
        <span className={cn('inline-flex items-center gap-3 min-h-[44px] min-w-0', className)}>
            <img src={sygnetUrl} alt="" width={912} height={981} decoding="async" className={cn(markH, 'w-auto aspect-[912/981] shrink-0')} />
            {!compact && (
                <span className="flex flex-col gap-1 min-w-0">
                    <img src={wordmarkUrl} alt="BeKaPaKa" width={1216} height={300} decoding="async" className={cn(wordW, 'h-auto')} />
                    {label && (
                        <span className="label-caps text-[11px] leading-none text-bkpk-text-muted truncate">
                            {label}
                        </span>
                    )}
                </span>
            )}
        </span>
    );
}

export default BrandMark;
