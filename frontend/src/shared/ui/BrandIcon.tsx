import type { ComponentType, CSSProperties } from 'react';
import { cn } from '../lib/utils';
import data from '../../assets/brand/icons/data.svg';
import godzina from '../../assets/brand/icons/godzina.svg';
import hala from '../../assets/brand/icons/hala.svg';
import info from '../../assets/brand/icons/info.svg';
import kontakt from '../../assets/brand/icons/kontakt.svg';
import mecz from '../../assets/brand/icons/mecz.svg';
import mvp from '../../assets/brand/icons/mvp.svg';
import sklad from '../../assets/brand/icons/sklad.svg';
import turniej from '../../assets/brand/icons/turniej.svg';

/**
 * Ikony 2.0 z brandbooka (`backend/studio/brand/02_system/symbole/ikony2.py`, jedna rodzina, 96×96,
 * ścięte narożniki). Kształt jako maska CSS → kolor z `currentColor`, rozmiar z klas (`w-5 h-5`).
 */
const ICONS = { data, godzina, hala, info, kontakt, mecz, mvp, sklad, turniej } as const;

export type BrandIconName = keyof typeof ICONS;

export interface BrandIconProps {
    className?: string;
    /** Ignorowane — zgodność z ikonami lucide w nawigacji. */
    strokeWidth?: number | string;
    'aria-hidden'?: boolean | 'true' | 'false';
    'aria-label'?: string;
}

export default function BrandIcon({ name, className, 'aria-label': label }: BrandIconProps & { name: BrandIconName }) {
    const url = `url("${ICONS[name]}")`;
    const style: CSSProperties = {
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
    };
    return (
        <span
            role={label ? 'img' : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            className={cn('inline-block shrink-0 bg-current w-5 h-5', className)}
            style={style}
        />
    );
}

/** Komponent ikony o API jak lucide (`<Icon className strokeWidth />`) — do tablic nawigacji. */
export type IconComponent = ComponentType<BrandIconProps>;

export function brandIcon(name: BrandIconName): IconComponent {
    const Icon = (props: BrandIconProps) => <BrandIcon name={name} {...props} />;
    Icon.displayName = `BrandIcon(${name})`;
    return Icon;
}

export const MatchIcon = brandIcon('mecz');
export const TrophyIcon = brandIcon('turniej');
export const JerseyIcon = brandIcon('sklad');
export const CalendarIcon = brandIcon('data');
export const ClockIcon = brandIcon('godzina');
export const VenueIcon = brandIcon('hala');
export const MvpIcon = brandIcon('mvp');
export const InfoIcon = brandIcon('info');
