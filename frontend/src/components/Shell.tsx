import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MobileFullScreenMenu from './MobileFullScreenMenu';
import MobileBottomNav from './MobileBottomNav';
import {
  LayoutDashboard,
  CalendarRange,
  Trophy,
  Users,
  ShieldCheck,
  Activity,
  Bot,
  LogOut,
  User,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '../shared/lib/utils';
import { useAuth } from '../context/AuthContext';
import SidebarProfile from './SidebarProfile';
import { resolvePlayerPhoto } from '../shared/lib/playerUtils';
import SeasonSelector from './SeasonSelector';
import { useSeasonPreferenceContext } from '../context/SeasonPreferenceContext';
import { AppFooter } from './AppFooter';
import { useBreakpoint } from '../hooks/useIsMobile';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

const allLinks = [
  { to: '/dashboard', label: 'Pulpit', icon: LayoutDashboard, public: true },
  { to: '/games', label: 'Mecze', icon: CalendarRange, public: true },
  { to: '/league', label: 'Liga KALK', icon: Trophy, public: true },
  { to: '/roster', label: 'Skład', icon: Users, public: true },
  { to: '/trends', label: 'Analizy', icon: Activity, public: true },
  { to: '/ai', label: 'AI', icon: Bot, public: true },
  { to: '/profile', label: 'Mój Profil', icon: User, public: true },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, public: false, adminOnly: true },
];

/** Secondary links shown in hamburger menu on mobile (bottom bar covers main 5). */
const mobileMenuOnlyLinks = allLinks.filter(
  (link) => !['/dashboard', '/games', '/league', '/roster', '/trends'].includes(link.to)
);

function NavItems({
  links,
  onNavigate,
  collapsed = false,
}: {
  links: typeof allLinks;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            title={collapsed ? link.label : undefined}
            className={({ isActive }) => cn(
              'group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 font-bold text-sm tracking-tight min-h-[48px]',
              collapsed && 'justify-center px-2',
              isActive
                ? 'bg-bkpk-primary/10 text-bkpk-primary border border-bkpk-primary/25 shadow-[0_0_15px_rgba(236,167,44,0.05)]'
                : 'text-bkpk-text-muted hover:text-bkpk-primary hover:bg-bkpk-primary/5 border border-transparent'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-bkpk-primary' : 'text-bkpk-text-muted group-hover:text-bkpk-primary')} />
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
                {!collapsed && isActive && (
                  <span className="w-1.5 h-6 bg-bkpk-primary rounded-full shadow-bkpk-glow shrink-0" />
                )}
              </>
            )}
          </NavLink>
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
        'flex flex-col min-h-[100dvh] min-h-[100svh] bg-bkpk-bg font-montserrat text-bkpk-text-primary',
        'md:flex-row md:fixed md:inset-0 md:z-0 md:max-h-[100dvh] md:overflow-hidden'
      )}
    >

      {/* Tablet + desktop sidebar */}
      <motion.aside
        role="navigation"
        aria-label="Nawigacja główna"
        layout
        className={cn(
          'hidden md:flex flex-col bg-bkpk-surface border-r border-bkpk-border-strong transition-colors duration-200 shrink-0',
          navCollapsed ? 'w-16 p-3' : 'w-56 lg:w-72 p-6 lg:p-8'
        )}
      >
        {user && !navCollapsed && (
          <Link to="/profile" className="block cursor-pointer mb-6">
            <SidebarProfile user={user} />
          </Link>
        )}

        <div className="flex items-center justify-end mb-2 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-lg text-bkpk-text-muted hover:text-bkpk-primary hover:bg-bkpk-primary/5 touch-manipulation"
            aria-label={navCollapsed ? 'Rozwiń menu boczne' : 'Zwiń menu boczne'}
          >
            {navCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        <NavItems links={links} collapsed={navCollapsed} />

        {!navCollapsed && (
          <div className="mt-6 pt-6 border-t border-bkpk-border-strong">
            <SeasonSelector
              seasons={seasons}
              seasonId={seasonId}
              onChange={setSeasonId}
              loading={seasonsLoading}
              variant="block"
            />
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-bkpk-border-strong space-y-4">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-4 px-4 py-3 text-bkpk-text-muted hover:text-bkpk-text-danger transition-colors font-bold text-sm tracking-tight w-full text-left min-h-[48px] touch-manipulation',
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

        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 shrink-0 relative flex items-center px-3 pb-2.5 bg-bkpk-bg/55 backdrop-blur-md border-b border-bkpk-border-subtle mobile-header-safe-top">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="relative z-10 flex items-center justify-center w-11 h-11 rounded-xl bg-bkpk-surface-tint-1 border border-bkpk-border-strong text-bkpk-text-primary active:bg-bkpk-surface-tint-2 shrink-0 touch-manipulation"
            aria-label="Otwórz menu nawigacji"
            aria-expanded={isMenuOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="pointer-events-none absolute inset-x-3 flex justify-center items-center min-w-0 px-12">
            <span className="font-black font-outfit text-sm tracking-tight text-bkpk-text-primary truncate text-center">
              BeKaPaKa
            </span>
          </div>

          {user ? (
            <Link
              to="/profile"
              className="relative z-10 ml-auto flex items-center justify-center w-11 h-11 rounded-xl border border-bkpk-border-strong overflow-hidden bg-bkpk-surface-tint-2 shrink-0 touch-manipulation"
              aria-label="Mój profil"
            >
              <img
                src={resolvePlayerPhoto(user)}
                onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                className="w-full h-full object-cover"
                alt=""
              />
            </Link>
          ) : (
            <div className="relative z-10 ml-auto w-11 h-11 shrink-0" aria-hidden />
          )}
        </header>

        <main
          className={cn(
            'flex-1 w-full relative z-10 overflow-y-auto overflow-x-hidden',
            'md:min-h-0 md:no-scrollbar md:scroll-smooth md:bg-bkpk-bg',
            'pb-20 md:pb-0'
          )}
        >
          {children}
          <div className="md:hidden px-4 pb-2">
            <AppFooter />
          </div>
        </main>

        <MobileBottomNav />

        <MobileFullScreenMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          user={user}
          links={mobileMenuOnlyLinks.filter((link) => !link.adminOnly || user?.role === 'ADMIN')}
          onLogout={handleLogout}
        />

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-bkpk-primary/5 blur-[120px] rounded-full pointer-events-none -mr-48 -mt-48" />
        <div className="hidden md:block absolute bottom-0 left-0 w-[500px] h-[500px] bg-bkpk-success/5 blur-[120px] rounded-full pointer-events-none -ml-48 -mb-48" />
      </div>
    </div>
  );
}
