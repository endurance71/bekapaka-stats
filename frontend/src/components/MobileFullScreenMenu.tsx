import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, LogOut, X, type LucideIcon } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '../shared/lib/utils';
import { getPositionLabel, resolvePlayerPhoto } from '../shared/lib/playerUtils';
import SeasonSelector from './SeasonSelector';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';

export interface MobileMenuLink {
    to: string;
    label: string;
    icon: LucideIcon;
}

interface MenuUser {
    firstName: string;
    lastName: string;
    number?: number;
    position?: string;
    username: string;
    photo?: string | null;
    data?: unknown;
    kalkPlayer?: unknown;
}

interface MobileFullScreenMenuProps {
    isOpen: boolean;
    onClose: () => void;
    user: MenuUser | null;
    links: MobileMenuLink[];
    onLogout: () => void;
}

interface MenuProfileSectionProps {
    user: MenuUser | null;
    onClose: () => void;
    seasons: ReturnType<typeof useSeasonPreferenceContext>['seasons'];
    seasonId: string | null;
    seasonsLoading: boolean;
    selectedSeason: ReturnType<typeof useSeasonPreferenceContext>['selectedSeason'];
    onSeasonChange: (id: string) => void;
}

function MenuProfileSection({
    user,
    onClose,
    seasons,
    seasonId,
    seasonsLoading,
    selectedSeason,
    onSeasonChange
}: MenuProfileSectionProps) {
    return (
        <section
            className="mx-4 mt-3 mb-4 shrink-0 rounded-2xl border border-bkpk-border-strong bg-bkpk-surface-tint-1/80 overflow-hidden"
            aria-label="Profil i sezon"
        >
            {user ? (
                <Link
                    to="/profile"
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 border-b border-bkpk-border-subtle active:bg-bkpk-surface-tint-2 transition-colors"
                >
                    <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-bkpk-border-strong bg-bkpk-surface">
                            <img
                                src={resolvePlayerPhoto(user)}
                                onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                                className="w-full h-full object-cover"
                                alt=""
                            />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 rounded-md bg-bkpk-primary text-[10px] font-black text-white flex items-center justify-center border border-bkpk-bg">
                            {user.number ?? '—'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-bkpk-primary uppercase tracking-widest leading-none mb-0.5">
                            {getPositionLabel(user.position)}
                        </p>
                        <p className="text-sm font-black font-outfit text-bkpk-text-primary truncate leading-tight">
                            {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[11px] text-bkpk-text-muted truncate">@{user.username}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-bkpk-text-muted shrink-0" aria-hidden />
                </Link>
            ) : null}

            <div className="p-3">
                <SeasonSelector
                    seasons={seasons}
                    seasonId={seasonId}
                    onChange={onSeasonChange}
                    loading={seasonsLoading}
                    variant="block"
                />
                {selectedSeason && !selectedSeason.isActive ? (
                    <p className="mt-2 text-[10px] font-bold text-bkpk-warning uppercase tracking-widest">
                        Archiwum sezonu
                    </p>
                ) : null}
            </div>
        </section>
    );
}

export default function MobileFullScreenMenu({
    isOpen,
    onClose,
    user,
    links,
    onLogout
}: MobileFullScreenMenuProps) {
    const { seasons, seasonId, selectedSeason, loading: seasonsLoading, setSeasonId } =
        useSeasonPreferenceContext();

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {isOpen ? (
                <motion.div
                    key="mobile-menu"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu nawigacji"
                    className="lg:hidden fixed inset-0 z-[9999] flex flex-col bg-bkpk-bg text-bkpk-text-primary"
                    style={{
                        paddingTop: 'env(safe-area-inset-top, 0px)',
                        paddingLeft: 'env(safe-area-inset-left, 0px)',
                        paddingRight: 'env(safe-area-inset-right, 0px)'
                    }}
                    initial={{ opacity: 0, x: '-100%' }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: '-100%' }}
                    transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                    <header className="flex items-center justify-between gap-3 px-4 py-3 shrink-0">
                        <div>
                            <div className="font-black font-outfit text-lg leading-none text-bkpk-text-primary">
                                BeKaPaKa
                            </div>
                            <div className="text-[10px] font-bold text-bkpk-text-muted uppercase tracking-[0.2em] mt-1">
                                Nawigacja
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-bkpk-surface-tint-1/60 border border-bkpk-border-strong text-bkpk-text-primary"
                            aria-label="Zamknij menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </header>

                    <MenuProfileSection
                        user={user}
                        onClose={onClose}
                        seasons={seasons}
                        seasonId={seasonId}
                        seasonsLoading={seasonsLoading}
                        selectedSeason={selectedSeason}
                        onSeasonChange={setSeasonId}
                    />

                    <nav
                        className="flex-1 min-h-0 mx-4 overflow-y-auto no-scrollbar rounded-2xl border border-bkpk-border-subtle bg-bkpk-surface-tint-1/40 p-1.5"
                        aria-label="Sekcje aplikacji"
                    >
                        {links.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        cn(
                                            'flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-colors min-h-[44px]',
                                            isActive
                                                ? 'bg-bkpk-primary/15 text-bkpk-primary'
                                                : 'text-bkpk-text-secondary active:bg-bkpk-surface-tint-2'
                                        )
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span
                                                className={cn(
                                                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border',
                                                    isActive
                                                        ? 'bg-bkpk-primary/20 border-bkpk-primary/30'
                                                        : 'bg-bkpk-surface-tint-1 border-bkpk-border-subtle'
                                                )}
                                            >
                                                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                                            </span>
                                            <span className="flex-1">{link.label}</span>
                                            {isActive ? (
                                                <span className="w-1 h-5 rounded-full bg-bkpk-primary shrink-0" />
                                            ) : null}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div
                        className="shrink-0 px-4 pt-3"
                        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
                    >
                        <button
                            type="button"
                            onClick={onLogout}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-bkpk-danger font-bold text-sm min-h-[44px] active:bg-bkpk-danger/10"
                        >
                            <LogOut className="w-4 h-4" />
                            Wyloguj
                        </button>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>,
        document.body
    );
}
