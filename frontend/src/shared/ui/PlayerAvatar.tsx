import { useState } from 'react';
import { cn } from '../lib/utils';
import { resolvePlayerImage } from '../lib/playerUtils';
import monogramUrl from '../../assets/brand/monogram-bialy.svg';

type AvatarPlayer = Parameters<typeof resolvePlayerImage>[0];

interface PlayerAvatarProps {
    player: AvatarPlayer;
    /** Rozmiar i obramowanie z miejsca użycia (np. `w-12 h-12`). */
    className?: string;
    alt?: string;
}

/**
 * Awatar zawodnika jak na bekapaka.pl: portret marki / zdjęcie (kadr od góry), a bez zdjęcia —
 * monogram BKPK na czarnym tle (zamiast szarej sylwetki `default.png`).
 */
export default function PlayerAvatar({ player, className, alt = '' }: PlayerAvatarProps) {
    const src = resolvePlayerImage(player);
    const [failed, setFailed] = useState<string | null>(null);
    const showPhoto = Boolean(src) && failed !== src;

    return (
        <span className={cn('relative block overflow-hidden bg-bkpk-bg', className)}>
            {showPhoto ? (
                <img
                    src={src!}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    onError={() => setFailed(src)}
                />
            ) : (
                <img src={monogramUrl} alt={alt} aria-hidden={alt ? undefined : true} className="absolute inset-[22%] w-[56%] h-[56%] object-contain opacity-80" />
            )}
        </span>
    );
}
