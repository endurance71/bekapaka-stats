import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOverlayViewportHeight, usePageScrollLock } from '@bekapaka/safari-overlay';
import { ChevronRight, LogOut, X, type LucideIcon } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '../shared/lib/utils';
import { getPositionLabel, resolvePlayerPhoto } from '../shared/lib/playerUtils';
import SeasonSelector from './SeasonSelector';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';

/** Must match transition duration in component className */
const MENU_ANIMATION_MS = 280;

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
                                loading="lazy"
                                decoding="async"
                                alt=""
                            />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 rounded-md bg-bkpk-primary text-[10px] font-black text-bkpk-on-primary flex items-center justify-center border border-bkpk-bg">
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

    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const isClosingRef = useRef(false);
    const closeCleanupRef = useRef<(() => void) | null>(null);

    const finishUnmount = useCallback(() => {
        closeCleanupRef.current?.();
        closeCleanupRef.current = null;
        isClosingRef.current = false;
        setIsMounted(false);
        setIsVisible(false);
    }, []);

    const startCloseAnimation = useCallback(() => {
        if (isClosingRef.current) return;
        isClosingRef.current = true;

        closeCleanupRef.current?.();

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsVisible(false);
            });
        });

        const panel = panelRef.current;
        let completed = false;

        const complete = () => {
            if (completed) return;
            completed = true;
            closeCleanupRef.current?.();
            closeCleanupRef.current = null;
            finishUnmount();
        };

        const handleTransitionEnd = (event: TransitionEvent) => {
            if (!panel || event.target !== panel || event.propertyName !== 'transform') return;
            complete();
        };

        panel?.addEventListener('transitionend', handleTransitionEnd);
        const fallbackId = window.setTimeout(complete, MENU_ANIMATION_MS + 80);

        closeCleanupRef.current = () => {
            panel?.removeEventListener('transitionend', handleTransitionEnd);
            window.clearTimeout(fallbackId);
        };
    }, [finishUnmount]);

    const handleRequestClose = useCallback(() => {
        if (!isMounted || isClosingRef.current) return;
        startCloseAnimation();
        window.setTimeout(() => {
            onClose();
        }, MENU_ANIMATION_MS);
    }, [isMounted, onClose, startCloseAnimation]);

    useEffect(() => {
        if (!isOpen) return;

        isClosingRef.current = false;
        setIsMounted(true);

        let openFrame1 = 0;
        let openFrame2 = 0;
        openFrame1 = requestAnimationFrame(() => {
            openFrame2 = requestAnimationFrame(() => {
                setIsVisible(true);
            });
        });

        return () => {
            cancelAnimationFrame(openFrame1);
            cancelAnimationFrame(openFrame2);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen || !isMounted) return;
        startCloseAnimation();
    }, [isOpen, isMounted, startCloseAnimation]);

    useEffect(() => {
        return () => {
            closeCleanupRef.current?.();
        };
    }, []);

    useOverlayViewportHeight(isMounted);
    usePageScrollLock(isMounted, { htmlClass: 'is-overlay-open' });

    const handleLogout = () => {
        handleRequestClose();
        window.setTimeout(() => {
            onLogout();
        }, MENU_ANIMATION_MS);
    };

    if (typeof document === 'undefined' || !isMounted) {
        return null;
    }

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu nawigacji"
            className={cn(
                'mobile-fullscreen-menu-root lg:hidden fixed left-0 right-0 z-[9999] w-full min-h-[100lvh] max-h-none bg-bkpk-bg overlay-viewport-fill',
                isVisible ? 'pointer-events-auto' : 'pointer-events-none'
            )}
        >
            <div
                ref={panelRef}
                className={cn(
                    'mobile-fullscreen-menu-panel absolute inset-0 flex flex-col bg-bkpk-bg text-bkpk-text-primary',
                    'min-h-[100lvh] max-h-none overlay-viewport-fill',
                    'transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
                    isVisible ? 'translate-x-0' : '-translate-x-full'
                )}
                style={{
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                    paddingLeft: 'env(safe-area-inset-left, 0px)',
                    paddingRight: 'env(safe-area-inset-right, 0px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)'
                }}
            >
                <header className="relative flex items-center px-4 py-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleRequestClose}
                        className="relative z-10 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-bkpk-surface-tint-1/60 border border-bkpk-border-strong text-bkpk-text-primary shrink-0 touch-manipulation"
                        aria-label="Zamknij menu"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="pointer-events-none absolute inset-x-4 flex flex-col items-center justify-center text-center min-w-0 px-12">
                        <div className="font-black font-outfit text-lg leading-none text-bkpk-text-primary truncate max-w-full">
                            BeKaPaKa
                        </div>
                        <div className="text-[10px] font-bold text-bkpk-text-muted uppercase tracking-[0.2em] mt-1">
                            Centrum statystyk
                        </div>
                    </div>

                    {user ? (
                        <Link
                            to="/profile"
                            onClick={handleRequestClose}
                            className="relative z-10 ml-auto flex items-center justify-center w-11 h-11 rounded-xl border border-bkpk-border-strong overflow-hidden bg-bkpk-surface-tint-2 shrink-0"
                            aria-label="Mój profil"
                        >
                            <img
                                src={resolvePlayerPhoto(user)}
                                onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                                alt=""
                            />
                        </Link>
                    ) : (
                        <div className="relative z-10 ml-auto w-11 h-11 shrink-0" aria-hidden />
                    )}
                </header>

                <MenuProfileSection
                    user={user}
                    onClose={handleRequestClose}
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
                                onClick={handleRequestClose}
                                className={({ isActive }) =>
                                    cn(
                                        'group flex items-center gap-4 px-3 py-3.5 rounded-xl font-bold text-sm tracking-tight transition-all duration-200 min-h-[48px]',
                                        isActive
                                            ? 'bg-bkpk-primary/10 text-bkpk-primary border border-bkpk-primary/25 shadow-[0_0_15px_rgba(236,167,44,0.05)]'
                                            : 'text-bkpk-text-muted active:bg-bkpk-primary/5 border border-transparent'
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon
                                            className={cn(
                                                'w-5 h-5 shrink-0',
                                                isActive ? 'text-bkpk-primary' : 'text-bkpk-text-muted group-active:text-bkpk-primary'
                                            )}
                                            strokeWidth={isActive ? 2.5 : 2}
                                        />
                                        <span className="flex-1">{link.label}</span>
                                        {isActive ? (
                                            <span className="w-1.5 h-6 rounded-full bg-bkpk-primary shadow-bkpk-glow shrink-0" />
                                        ) : null}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="shrink-0 px-4 pt-3 pb-3 bg-bkpk-bg border-t border-bkpk-border-subtle">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-bkpk-text-danger font-bold text-sm min-h-[44px] active:bg-bkpk-danger/10"
                    >
                        <LogOut className="w-4 h-4" />
                        Wyloguj
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
