import { Star } from 'lucide-react';
import { getPhotoUrl as buildPhotoUrl, getPositionLabel } from '../lib/playerUtils';

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

/** Karta zawodnika wg bekapaka.pl: portret 4:5, numer konturem za sylwetką, nazwisko Condensed, pasek średnich. */
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
    const resolvedPhotoUrl = (() => {
        const hasValidRemotePhoto = Boolean(photoUrl) && !photoUrl!.toLowerCase().includes('empty.jpg');
        return hasValidRemotePhoto ? photoUrl! : buildPhotoUrl(firstName, lastName);
    })();

    const stats = [
        { label: 'PPG', value: ppg },
        { label: 'RPG', value: rpg },
        { label: 'APG', value: apg },
    ];

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
            aria-label={`${firstName} ${lastName}, numer ${number}`}
            className="group relative w-full cursor-pointer select-none"
        >
            {/* Portret */}
            <div className="relative aspect-[4/5] overflow-hidden chamfer bg-[radial-gradient(120%_80%_at_50%_20%,var(--c-ink-700),var(--c-ink-900)_60%,var(--c-black))] [container-type:inline-size]">
                <span
                    className="absolute left-1/2 top-[6%] -translate-x-1/2 font-display leading-none outline-text text-bkpk-primary text-[72cqw] tabular-nums pointer-events-none"
                    aria-hidden
                >
                    {number}
                </span>
                <img
                    src={resolvedPhotoUrl}
                    onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-[400ms] ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-bkpk-bg to-transparent" aria-hidden />

                {isStarter && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 status-flag text-bkpk-medal-gold bg-bkpk-bg/80">
                        <Star className="w-3 h-3 fill-current" aria-hidden />
                        <span className="sr-only sm:not-sr-only">Pierwsza piątka</span>
                    </span>
                )}

                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                    <span className="label-caps text-[11px] text-bkpk-primary">{getPositionLabel(position)}</span>
                    <h3 className="mt-1 text-[22px] sm:text-[28px] leading-[0.95] text-bkpk-text-primary">
                        <span className="block text-sm sm:text-base text-bkpk-text-secondary font-text font-semibold normal-case">{firstName}</span>
                        {lastName}
                    </h3>
                </div>
            </div>

            {/* Średnie */}
            <dl className="grid grid-cols-3 border-x border-b border-bkpk-border-subtle bg-bkpk-surface">
                {stats.map((s, i) => (
                    <div key={s.label} className={i > 0 ? 'border-l border-bkpk-border-subtle py-2 text-center' : 'py-2 text-center'}>
                        <dt className="label-caps text-[10px] sm:text-[11px] text-bkpk-text-muted">{s.label}</dt>
                        <dd className="font-display text-lg sm:text-xl leading-none text-bkpk-text-primary tabular-nums mt-1">
                            {(s.value ?? 0).toFixed(1)}
                        </dd>
                    </div>
                ))}
            </dl>
            <span className="absolute inset-x-0 bottom-0 h-[3px] bg-bkpk-primary scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" aria-hidden />
        </div>
    );
}
