import { ReactNode, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarRange,
  Trophy,
  Users,
  Target,
  ShieldCheck,
  Activity,
  LogOut,
  MoreHorizontal,
  X,
  User,
} from 'lucide-react';
import { cn } from '../shared/lib/utils';
import { useAuth } from '../context/AuthContext';
import SidebarProfile from './SidebarProfile';
import { getPhotoUrl, getPositionLabel, resolvePlayerPhoto } from '../shared/lib/playerUtils';

const allLinks = [
  { to: '/dashboard', label: 'Pulpit', icon: LayoutDashboard, public: true },
  { to: '/games', label: 'Mecze', icon: CalendarRange, public: true },
  { to: '/league', label: 'Liga KALK', icon: Trophy, public: true },
  { to: '/roster', label: 'Skład', icon: Users, public: true },
  { to: '/trends', label: 'Analizy', icon: Activity, public: true },
  { to: '/training', label: 'Trening', icon: Target, public: true },
  { to: '/profile', label: 'Mój Profil', icon: User, public: true },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, public: false, adminOnly: true },
];

// Primary tabs shown in the bottom bar (max 5 for ergonomics)
const PRIMARY_TAB_COUNT = 5;

export default function Shell({ children }: { children: ReactNode }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = allLinks.filter(link => !link.adminOnly || user?.role === 'ADMIN');
  const primaryLinks = links.slice(0, PRIMARY_TAB_COUNT);
  const secondaryLinks = links.slice(PRIMARY_TAB_COUNT);
  const hasMore = secondaryLinks.length > 0;

  return (
    <div className="flex h-screen bg-bkpk-bg overflow-hidden font-inter text-bkpk-text-primary">

      {/* ═══════════════════════════════════════════════
          SIDEBAR — Desktop (lg+)
          ═══════════════════════════════════════════════ */}
      <aside
        role="navigation"
        aria-label="Nawigacja główna"
        className="hidden lg:flex flex-col w-72 bg-bkpk-surface border-r border-bkpk-border-strong p-8 transition-all duration-500"
      >
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-10 h-10 rounded-xl bg-bkpk-surface flex items-center justify-center shadow-bkpk-glow border border-bkpk-border-strong overflow-hidden p-1">
            <img src="/logo.png" alt="BK Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-black font-outfit text-sm tracking-tight leading-none text-bkpk-text-primary">BeKaPaKa Stats</div>
            <div className="text-xs font-bold text-bkpk-text-muted uppercase tracking-[0.2em] mt-1">Centrum Statystyk</div>
          </div>
        </div>

        {user && (
          <Link to="/profile" className="block cursor-pointer">
            <SidebarProfile user={user} />
          </Link>
        )}

        <nav className="flex-1 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => cn(
                  "group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm tracking-tight",
                  isActive
                    ? "bg-bkpk-surface-tint-2 text-bkpk-primary shadow-sm"
                    : "text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-1"
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-bkpk-primary" : "group-hover:text-bkpk-text-primary")} />
                    <span>{link.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="ml-auto w-1 h-4 bg-bkpk-primary rounded-full shadow-bkpk-glow"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-bkpk-border-strong">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 text-bkpk-text-muted hover:text-bkpk-danger transition-colors font-bold text-sm tracking-tight w-full text-left"
            aria-label="Wyloguj się"
          >
            <LogOut className="w-5 h-5" />
            <span>Wyloguj</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Mobile Header — compact top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-bkpk-surface/80 backdrop-blur-xl border-b border-bkpk-border-strong z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bkpk-surface flex items-center justify-center border border-bkpk-border-strong shadow-bkpk-glow overflow-hidden p-0.5">
              <img src="/logo.png" alt="BK Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-black font-outfit text-base tracking-tight text-bkpk-text-primary">BeKaPaKa</span>
          </div>
          {user && (
            <Link to="/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-bkpk-border-strong overflow-hidden bg-bkpk-surface-tint-2">
                <img
                  src={resolvePlayerPhoto(user)}
                  onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                  className="w-full h-full object-cover grayscale"
                  alt=""
                />
              </div>
            </Link>
          )}
        </header>

        {/* Content Viewport — extra bottom padding on mobile for tab bar */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 scroll-smooth lg:pb-0 pb-20">
          {children}
        </main>

        {/* ═══════════════════════════════════════════════
            BOTTOM TAB BAR — Mobile (<lg)
            ═══════════════════════════════════════════════ */}
        <nav
          role="navigation"
          aria-label="Nawigacja mobilna"
          className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-bkpk-surface/90 backdrop-blur-2xl border-t border-bkpk-border-strong"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-stretch justify-around h-16">
            {primaryLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => cn(
                    "flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors duration-200 relative",
                    isActive ? "text-bkpk-primary" : "text-bkpk-text-muted active:text-bkpk-text-primary"
                  )}
                  aria-current={undefined} // React Router handles this
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="bottom-tab-active"
                          className="absolute top-0 inset-x-3 h-0.5 bg-bkpk-primary rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                      <span className={cn(
                        "text-[10px] leading-none",
                        isActive ? "font-bold" : "font-medium"
                      )}>
                        {link.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* "More" tab for secondary links */}
            {hasMore && (
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors duration-200",
                  isMoreOpen ? "text-bkpk-primary" : "text-bkpk-text-muted active:text-bkpk-text-primary"
                )}
                aria-expanded={isMoreOpen}
                aria-label="Więcej opcji nawigacji"
              >
                {isMoreOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
                <span className="text-[10px] font-medium leading-none">Więcej</span>
              </button>
            )}
          </div>
        </nav>

        {/* ═══════════════════════════════════════════════
            "More" Sheet — Slides up from bottom tab bar
            ═══════════════════════════════════════════════ */}
        <AnimatePresence>
          {isMoreOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-bkpk-overlay-medium z-40"
                onClick={() => setIsMoreOpen(false)}
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="lg:hidden fixed bottom-16 inset-x-0 z-40 bg-bkpk-surface border-t border-bkpk-border-strong rounded-t-2xl overflow-hidden"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              >
                <div className="p-4 space-y-1">
                  {/* Drag handle */}
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-1 rounded-full bg-bkpk-border-strong" />
                  </div>

                  {secondaryLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsMoreOpen(false)}
                        className={({ isActive }) => cn(
                          "flex items-center gap-4 p-4 rounded-xl transition-all font-bold text-sm",
                          isActive ? "bg-bkpk-primary/10 text-bkpk-primary" : "text-bkpk-text-secondary hover:bg-bkpk-surface-tint-1"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {link.label}
                      </NavLink>
                    );
                  })}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all font-bold text-sm text-bkpk-danger w-full text-left mt-2 border-t border-bkpk-border-strong pt-4"
                  >
                    <LogOut className="w-5 h-5" />
                    Wyloguj
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Global Ambient Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-bkpk-primary/5 blur-[120px] rounded-full pointer-events-none -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-bkpk-success/5 blur-[120px] rounded-full pointer-events-none -ml-48 -mb-48" />
      </div>
    </div>
  );
}
