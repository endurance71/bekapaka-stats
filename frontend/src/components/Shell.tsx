import { ReactNode, useState, useEffect, type ComponentType } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MobileFullScreenMenu from './MobileFullScreenMenu';
import {
  LayoutDashboard,
  ShieldCheck,
  Activity,
  Bot,
  LogOut,
  User,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Target,
} from 'lucide-react';
import { cn } from '../shared/lib/utils';
import { useAuth } from '../context/AuthContext';
import SidebarProfile from './SidebarProfile';
import SeasonSelector from './SeasonSelector';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import { AppFooter } from './AppFooter';
import { BrandMark } from '../shared/ui/BrandMark';
import { useBreakpoint } from '../hooks/useIsMobile';
import { OfflineIndicator } from './pwa/OfflineIndicator';
import { InstallPromptBanner } from './pwa/InstallPromptBanner';
import { UpdateNotification } from './pwa/UpdateNotification';
import PlayerAvatar from '../shared/ui/PlayerAvatar';
import { JerseyIcon, MatchIcon, TrophyIcon } from '../shared/ui/BrandIcon';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

/** Menu: zawodnik widzi 6 pozycji; sekcja „Trener” (Analizy, AI, Admin) tylko dla admina. */
export const allLinks: NavLinkItem[] = [
  { to: '/dashboard', label: 'Start', icon: LayoutDashboard, group: 'player' },
  { to: '/games', label: 'Mecze', icon: MatchIcon, group: 'player' },
  { to: '/rywal', label: 'Następny rywal', icon: Target, group: 'player' },
  { to: '/league', label: 'Liga', icon: TrophyIcon, group: 'player' },
  { to: '/druzyna', label: 'Drużyna', icon: JerseyIcon, group: 'player' },
  { to: '/profile', label: 'Ja', icon: User, group: 'player' },
  { to: '/trends', label: 'Analizy', icon: Activity, group: 'coach', adminOnly: true },
  { to: '/ai', label: 'AI', icon: Bot, group: 'coach', adminOnly: true },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, group: 'coach', adminOnly: true },
];

export interface NavLinkItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number | string }>;
  group: 'player' | 'coach';
  adminOnly?: boolean;
}

function NavItems({
  links,
  onNavigate,
  collapsed = false,
}: {
  links: NavLinkItem[];
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <nav className="flex-1 overflow-y-auto no-scrollbar -mx-2" aria-label="Menu">
      {links.map((link, i) => {
        const Icon = link.icon;
        const groupStart = link.group === 'coach' && links[i - 1]?.group !== 'coach';
        return (
          <div key={link.to}>
          {groupStart && (
            collapsed
              ? <div className="mx-4 my-2 border-t border-bkpk-border-subtle" aria-hidden />
              : <p className="label-caps text-[11px] text-bkpk-text-muted px-4 pt-5 pb-2">Trener</p>
          )}
          <NavLink
            to={link.to}
            onClick={onNavigate}
            title={collapsed ? link.label : undefined}
            className={({ isActive }) => cn(
              'group relative flex items-center gap-4 px-4 transition-colors duration-150 font-semibold text-[15px] uppercase tracking-[0.08em] min-h-[48px]',
              'before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:transition-colors',
              collapsed && 'justify-center px-2',
              isActive
                ? 'bg-bkpk-surface text-bkpk-text-primary before:bg-bkpk-medal-gold'
                : 'text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-1 before:bg-transparent hover:before:bg-bkpk-primary'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-bkpk-text-primary' : 'text-bkpk-text-muted group-hover:text-bkpk-text-primary')} strokeWidth={2} />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex-1 overflow-hidden whitespace-nowrap"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
          </div>
        );
      })}
    </nav>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) !== 'false';
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate('/login');
  };

  const links = allLinks.filter((link) => !link.adminOnly || user?.role === 'ADMIN');
  const { seasons, seasonId, loading: seasonsLoading, setSeasonId } = useSeasonPreferenceContext();
  const breakpoint = useBreakpoint();
  const isDesktopSidebar = breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';
  const navCollapsed = sidebarCollapsed && !isDesktopSidebar;

  return (
    <div
      className={cn(
        'flex flex-col min-h-[100dvh] min-h-[100svh] bg-bkpk-bg font-text text-bkpk-text-primary',
        'md:flex-row md:fixed md:inset-0 md:z-0 md:max-h-[100dvh] md:overflow-hidden'
      )}
    >

      {/* Tablet + desktop sidebar */}
      <motion.aside
        role="navigation"
        aria-label="Nawigacja główna"
        layout
        className={cn(
          'hidden md:flex flex-col bg-bkpk-bg border-r border-bkpk-border-subtle transition-colors duration-200 shrink-0',
          navCollapsed ? 'w-16 p-3' : 'w-60 lg:w-72 p-5 lg:p-6'
        )}
      >
        <Link
          to="/dashboard"
          className={cn('block mb-6 pb-4 border-b border-bkpk-border-subtle relative after:absolute after:left-0 after:-bottom-px after:h-[2px] after:bg-bkpk-primary', navCollapsed ? 'after:w-full flex justify-center' : 'after:w-16')}
          aria-label="BeKaPaKa — przejdź do pulpitu"
        >
          <BrandMark compact={navCollapsed} label="Panel klubu" size={navCollapsed ? 'sm' : 'md'} />
        </Link>

        {user && !navCollapsed && (
          <Link to="/profile" className="block cursor-pointer mb-6">
            <SidebarProfile user={user} />
          </Link>
        )}

        <div className="flex items-center justify-end mb-2 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] border border-bkpk-border-strong text-bkpk-text-muted hover:text-bkpk-text-primary hover:border-bkpk-text-primary touch-manipulation"
            aria-label={navCollapsed ? 'Rozwiń menu boczne' : 'Zwiń menu boczne'}
          >
            {navCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        <NavItems links={links} collapsed={navCollapsed} />

        {!navCollapsed && (
          <div className="mt-6 pt-6 border-t border-bkpk-border-subtle">
            <SeasonSelector
              seasons={seasons}
              seasonId={seasonId}
              onChange={setSeasonId}
              loading={seasonsLoading}
              variant="block"
            />
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-bkpk-border-subtle space-y-4">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-4 px-2 py-3 text-bkpk-text-muted hover:text-bkpk-text-danger transition-colors font-semibold text-[13px] uppercase tracking-[0.08em] w-full text-left min-h-[48px] touch-manipulation',
              navCollapsed && 'justify-center px-2'
            )}
            aria-label="Wyloguj się"
            title={navCollapsed ? 'Wyloguj' : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!navCollapsed && <span>Wyloguj</span>}
          </button>
          {!navCollapsed && <AppFooter className="px-2 pb-1" />}
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Mobile header — pasek statusu + 0,5 rem (jak nagłówek MobileFullScreenMenu, PWA na iOS: black-translucent) */}
        <header className="md:hidden sticky top-0 z-40 shrink-0 relative flex items-center px-3 pb-2 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] bg-bkpk-bg border-b border-bkpk-border-subtle min-h-[56px] after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:bg-bkpk-primary">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="relative z-10 flex items-center justify-center w-11 h-11 border border-bkpk-border-strong text-bkpk-text-primary active:bg-bkpk-surface-tint-2 shrink-0 touch-manipulation"
            aria-label="Otwórz menu nawigacji"
            aria-expanded={isMenuOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            to="/dashboard"
            className="absolute inset-x-3 z-[5] flex justify-center items-center min-w-0 px-12 touch-manipulation"
            aria-label="Przejdź do pulpitu"
          >
            <BrandMark size="sm" />
          </Link>

          {user ? (
            <Link
              to="/profile"
              className="relative z-10 ml-auto flex items-center justify-center w-11 h-11 border border-bkpk-border-strong overflow-hidden bg-ink-700 shrink-0 touch-manipulation"
              aria-label="Mój profil"
            >
              <PlayerAvatar player={user} className="w-full h-full" />
            </Link>
          ) : (
            <div className="relative z-10 ml-auto w-11 h-11 shrink-0" aria-hidden />
          )}
        </header>

        <main
          className={cn(
            'flex-1 w-full relative z-10 overflow-y-auto overflow-x-hidden',
            'pb-[max(0.5rem,var(--safe-area-bottom))] md:pb-0',
            'md:min-h-0 md:no-scrollbar md:scroll-smooth md:bg-bkpk-bg'
          )}
        >
          {children}
          <div className="md:hidden px-4 pb-2">
            <AppFooter />
          </div>
        </main>

        <MobileFullScreenMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          user={user}
          links={links}
          onLogout={handleLogout}
        />

        <OfflineIndicator />
        <InstallPromptBanner />
        <UpdateNotification />

      </div>
    </div>
  );
}
