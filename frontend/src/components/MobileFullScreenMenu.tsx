import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOverlayViewportHeight, usePageScrollLock } from '@bekapaka/safari-overlay';
import type { ComponentType } from 'react';
import { ChevronRight, LogOut, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '../shared/lib/utils';
import { getPositionLabel, type PhotoSource } from '../shared/lib/playerUtils';
import SeasonSelector from './SeasonSelector';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import { BrandMark } from '../shared/ui/BrandMark';
import { JerseyStripes } from '../shared/ui/JerseyStripes';
import PlayerAvatar from '../shared/ui/PlayerAvatar';

/** Must match transition duration in component className */
const MENU_ANIMATION_MS = 280;

export interface MobileMenuLink {
    to: string;
    label: string;
    icon: ComponentType<{ className?: string; strokeWidth?: number | string }>;
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
            className="mx-4 mt-2 mb-2 shrink-0 border-y border-bkpk-border-subtle"
            aria-label="Profil i sezon"
        >
            {user ? (
                <Link
                    to="/profile"
                    onClick={onClose}
                    className="flex items-center gap-3 py-3 border-b border-bkpk-border-subtle active:bg-bkpk-surface-tint-2 transition-colors"
                >
                    <div className="relative shrink-0">
                        <div className="w-12 h-[60px] overflow-hidden bg-ink-700 chamfer-sm">
                            <PlayerAvatar player={user as PhotoSource} className="w-full h-full" />
                        </div>
                        <span className="absolute -bottom-1 -right-2 min-w-[1.5rem] h-6 px-1 bg-bkpk-primary font-display text-sm leading-none text-bkpk-on-primary flex items-center justify-center">
                            {user.number ?? '—'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="label-caps text-[11px] text-bkpk-primary leading-none mb-1">
                            {getPositionLabel(user.position)}
                        </p>
                        <p className="font-display text-xl uppercase text-bkpk-text-primary truncate leading-none">
                            {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[11px] text-bkpk-text-muted truncate">@{user.username}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-bkpk-text-muted shrink-0" aria-hidden />
                </Link>
            ) : null}

            <div className="py-3">
                <SeasonSelector
                    seasons={seasons}
                    seasonId={seasonId}
                    onChange={onSeasonChange}
                    loading={seasonsLoading}
                    variant="block"
                />
                {selectedSeason && !selectedSeason.isActive ? (
                    <p className="mt-2 label-caps text-[11px] text-bkpk-warning">
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

    useEffect(() => {
        if (!isMounted) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') handleRequestClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isMounted, handleRequestClose]);

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
                    paddingRight: 'env(safe-area-inset-right, 0px)'
                }}
            >
                <header className="relative flex items-center px-4 py-2 min-h-[56px] shrink-0 border-b border-bkpk-border-subtle">
                    <button
                        type="button"
                        onClick={handleRequestClose}
                        className="relative z-10 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center border border-bkpk-border-strong text-bkpk-text-primary shrink-0 touch-manipulation"
                        aria-label="Zamknij menu"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <Link
                        to="/dashboard"
                        onClick={handleRequestClose}
                        className="absolute inset-x-4 z-[5] flex flex-col items-center justify-center text-center min-w-0 px-12 touch-manipulation"
                        aria-label="Przejdź do pulpitu"
                    >
                        <BrandMark size="sm" />
                    </Link>

                    {user ? (
                        <Link
                            to="/profile"
                            onClick={handleRequestClose}
                            className="relative z-10 ml-auto flex items-center justify-center w-11 h-11 border border-bkpk-border-strong overflow-hidden bg-ink-700 shrink-0"
                            aria-label="Mój profil"
                        >
                            <PlayerAvatar player={user as PhotoSource} className="w-full h-full" />
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
                    className="flex-1 min-h-0 mx-4 mb-2 overflow-y-auto no-scrollbar"
                    aria-label="Sekcje aplikacji"
                >
                    {links.map((link, index) => {
                        return (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                onClick={handleRequestClose}
                                className={({ isActive }) =>
                                    cn(
                                        'group relative flex items-center gap-4 pl-4 pr-2 min-h-[50px] py-1 border-b border-bkpk-border-subtle transition-colors duration-150',
                                        'before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1',
                                        isActive
                                            ? 'text-bkpk-text-primary before:bg-bkpk-medal-gold'
                                            : 'text-bkpk-text-secondary active:bg-bkpk-surface-tint-1 before:bg-transparent'
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className="label-caps text-xs text-bkpk-text-muted tabular-nums w-6 shrink-0" aria-hidden>
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <span className="flex-1 font-display uppercase leading-none text-[clamp(24px,6.6vw,32px)]">
                                            {link.label}
                                        </span>
                                        {isActive ? <span className="sr-only">(aktywna)</span> : null}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="group flex items-center gap-3 w-full pl-4 pr-2 mt-2 min-h-[48px] label-caps text-sm text-bkpk-text-danger active:bg-bkpk-surface-tint-1 touch-manipulation"
                    >
                        <LogOut className="w-5 h-5 shrink-0" strokeWidth={2} />
                        <span className="flex-1 text-left">Wyloguj</span>
                    </button>
                </nav>
                <JerseyStripes className="shrink-0 px-4 pb-[calc(0.5rem+var(--safe-area-bottom))]" />
            </div>
        </div>,
        document.body
    );
}
