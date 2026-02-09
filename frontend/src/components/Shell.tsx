import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';
import { cn } from '../shared/lib/utils';
import { useAuth } from '../context/AuthContext';
import SidebarProfile from './SidebarProfile';

const allLinks = [
  { to: '/dashboard', label: 'Pulpit', icon: LayoutDashboard, public: true },
  { to: '/games', label: 'Mecze', icon: CalendarRange, public: true },
  { to: '/league', label: 'Liga KALK', icon: Trophy, public: true },
  { to: '/roster', label: 'Skład', icon: Users, public: true },
  { to: '/trends', label: 'Analizy', icon: Activity, public: true },
  { to: '/training', label: 'Trening', icon: Target, public: true },
  { to: '/admin', label: 'Administracja', icon: ShieldCheck, public: false, adminOnly: true },
];

export default function Shell({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = allLinks.filter(link => !link.adminOnly || user?.role === 'ADMIN');

  return (
    <div className="flex h-screen bg-bkpk-bg overflow-hidden font-inter text-bkpk-text-primary">

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-bkpk-surface border-r border-bkpk-border-strong p-8 transition-all duration-500">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-10 h-10 rounded-xl bg-bkpk-surface flex items-center justify-center shadow-bkpk-glow border border-bkpk-border-strong overflow-hidden p-1">
            <img src="/logo.png" alt="BK Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-black font-outfit text-sm tracking-tight leading-none text-bkpk-text-primary">BeKaPaKa Stats</div>
            <div className="text-xs font-bold text-bkpk-text-muted uppercase tracking-[0.2em] mt-1">Centrum Statystyk</div>
          </div>
        </div>

        {user && <SidebarProfile user={user} />}

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
          >
            <LogOut className="w-5 h-5" />
            <span>Wyloguj</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-6 bg-bkpk-surface/50 backdrop-blur-xl border-b border-bkpk-border-strong z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bkpk-surface flex items-center justify-center border border-bkpk-border-strong shadow-bkpk-glow overflow-hidden p-0.5">
              <img src="/logo.png" alt="BK Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-black font-outfit text-lg tracking-tight text-bkpk-text-primary">BeKaPaKa</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-bkpk-surface-tint-2 rounded-lg border border-bkpk-border-strong"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden absolute inset-0 top-[81px] bg-bkpk-bg/95 backdrop-blur-2xl z-50 p-6 flex flex-col space-y-4"
            >
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-5 p-5 rounded-2xl transition-all font-black text-xl font-outfit",
                      isActive ? "bg-bkpk-primary text-bkpk-bg" : "text-bkpk-text-secondary"
                    )}
                  >
                    <Icon className="w-6 h-6" />
                    {link.label}
                  </NavLink>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-5 p-5 rounded-2xl transition-all font-black text-xl font-outfit text-bkpk-danger mt-auto"
              >
                <LogOut className="w-6 h-6" />
                Wyloguj
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 scroll-smooth">
          {children}
        </main>

        {/* Global Ambient Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-bkpk-primary/5 blur-[120px] rounded-full pointer-events-none -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-bkpk-success/5 blur-[120px] rounded-full pointer-events-none -ml-48 -mb-48" />
      </div>
    </div>
  );
}
