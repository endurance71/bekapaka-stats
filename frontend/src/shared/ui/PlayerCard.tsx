import { useState } from 'react';
import { MvpIcon as Star } from './BrandIcon';
import { getPositionLabel } from '../lib/playerUtils';
import { resolvePlayerPortrait } from '../lib/playerPortraits';
import { formatStatFixed } from '../lib/formatStat';
import monogramUrl from '../../assets/brand/monogram-bialy.svg';

export interface PlayerCardProps {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
    number: number;
    position?: string;
    ppg?: number;
    rpg?: number;
    apg?: number;
    isStarter?: boolean;
    onClick?: (id: string) => void;
}

/**
 * Karta zawodnika jak w składzie na bekapaka.pl (`site/components/public/shared/PlayerCard.tsx`):
 * portret 4:5 z numerem konturem ZA postacią, imię, nazwisko Condensed, „#nr · pozycja”, średnie pod linią.
 * Bez zdjęcia: sam numer + monogram BKPK.
 */
export default function PlayerCard({
    id,
    firstName,
    lastName,
    photoUrl,
    number,
    position,
    ppg,
    rpg,
    apg,
    isStarter,
    onClick
}: PlayerCardProps) {
    const [photoFailed, setPhotoFailed] = useState(false);

    const portrait = resolvePlayerPortrait(firstName, lastName, number);
    const sourcePhoto = photoUrl && !photoUrl.toLowerCase().includes('empty.jpg') && !photoUrl.includes('/photos/default.png') ? photoUrl : null;
    const photo = portrait ?? (photoFailed ? null : sourcePhoto);
    const displayNumber = number ? String(number) : null;

    return (
        <div
            onClick={() => onClick?.(id)}
            onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick(id);
                }
            }}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={`${firstName} ${lastName}${displayNumber ? `, numer ${displayNumber}` : ''}`}
            className="player-card cursor-pointer select-none"
        >
            <span className={photo ? 'portrait' : 'portrait portrait--empty'}>
                <span className="portrait__number cut" aria-hidden="true">
                    {displayNumber ?? '—'}
                </span>
                {photo && (
                    <img
                        className={portrait ? 'portrait__photo' : 'portrait__photo portrait__photo--source'}
                        src={photo}
                        alt=""
                        width={480}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        onError={() => setPhotoFailed(true)}
                    />
                )}
                {!photo && <img className="portrait__monogram" src={monogramUrl} width={48} height={48} alt="" />}
                {isStarter && (
                    <span className="absolute top-3 left-3 z-[4] inline-flex items-center gap-1 status-flag text-bkpk-medal-gold bg-bkpk-bg/80">
                        <Star className="w-3 h-3 fill-current" aria-hidden />
                        <span className="sr-only sm:not-sr-only">Pierwsza piątka</span>
                    </span>
                )}
            </span>
            <span className="player-card__body">
                <span className="player-card__first">{firstName}</span>{' '}
                <strong className="player-card__last">{lastName}</strong>
                <span className="player-card__meta">
                    {displayNumber ? `#${displayNumber} · ` : ''}
                    {getPositionLabel(position)}
                </span>
                <span className="player-card__stats">
                    <span>
                        <b>{formatStatFixed(ppg, 1)}</b> pkt
                    </span>
                    <span>
                        <b>{formatStatFixed(rpg, 1)}</b> zb
                    </span>
                    <span>
                        <b>{formatStatFixed(apg, 1)}</b> as
                    </span>
                </span>
            </span>
        </div>
    );
}
