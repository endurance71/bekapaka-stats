import { motion } from 'framer-motion';
import { cn } from '../shared/lib/utils';
import { getPositionLabel, resolvePlayerPhoto } from '../shared/lib/playerUtils';

interface User {
    firstName: string;
    lastName: string;
    number?: number;
    position?: string;
    username: string;
    photo?: string | null;
    data?: any;
    kalkPlayer?: any;
}

interface SidebarProfileProps {
    user: User;
    variant?: 'sidebar' | 'menu';
}

/** Zawodnik zalogowany: portret 4:5 ze ściętym rogiem, numer konturem, nazwisko Condensed. */
export default function SidebarProfile({ user, variant = 'sidebar' }: SidebarProfileProps) {
    const isMenu = variant === 'menu';
    const wrapperClass = cn('relative group', isMenu ? 'mb-0' : 'mb-6');

    const content = (
        <div className="flex items-center gap-3 p-2 -m-2 border border-transparent group-hover:border-bkpk-border-subtle group-hover:bg-bkpk-surface transition-colors">
            <div className="relative w-12 h-[60px] shrink-0 overflow-hidden bg-ink-700 chamfer-sm">
                <img
                    src={resolvePlayerPhoto(user)}
                    onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                    alt=""
                    className="w-full h-full object-cover object-top"
                />
            </div>
            <div className="min-w-0 flex-1">
                <p className="label-caps text-[11px] leading-none text-bkpk-primary truncate">
                    {getPositionLabel(user.position)}
                </p>
                <p className="mt-1.5 font-display text-xl leading-none uppercase text-bkpk-text-primary truncate">
                    {user.firstName} {user.lastName}
                </p>
                <p className="mt-1 text-xs text-bkpk-text-muted truncate">@{user.username}</p>
            </div>
            <span
                className="font-display text-[34px] leading-none outline-text text-bkpk-primary shrink-0"
                aria-label={user.number ? `Numer ${user.number}` : undefined}
            >
                {user.number || '--'}
            </span>
        </div>
    );

    if (isMenu) {
        return <div className={wrapperClass}>{content}</div>;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={wrapperClass}>
            {content}
        </motion.div>
    );
}
