import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarRange,
  Trophy,
  Users,
  Activity,
} from 'lucide-react'
import { cn } from '../shared/lib/utils'

const tabLinks = [
  { to: '/dashboard', label: 'Pulpit', icon: LayoutDashboard },
  { to: '/games', label: 'Mecze', icon: CalendarRange },
  { to: '/league', label: 'Liga', icon: Trophy },
  { to: '/roster', label: 'Skład', icon: Users },
  { to: '/trends', label: 'Analizy', icon: Activity },
] as const

export default function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav
      className='fixed bottom-0 left-0 right-0 z-50 flex justify-around items-stretch bg-bkpk-bg/95 backdrop-blur-md border-t border-bkpk-border-subtle md:hidden'
      aria-label='Nawigacja dolna'
    >
      {tabLinks.map((link) => {
        const Icon = link.icon
        const isActive =
          location.pathname === link.to ||
          (link.to !== '/dashboard' && location.pathname.startsWith(`${link.to}/`))

        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] min-w-[44px] touch-manipulation tap-highlight-transparent transition-colors',
              isActive
                ? 'text-bkpk-primary bg-bkpk-primary/10'
                : 'text-bkpk-text-muted hover:text-bkpk-primary'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className='w-5 h-5 shrink-0' aria-hidden />
            <span className='text-[10px] font-bold tracking-tight leading-none'>{link.label}</span>
            {isActive ? (
              <span className='w-1 h-1 rounded-full bg-bkpk-primary mt-0.5' aria-hidden />
            ) : null}
          </NavLink>
        )
      })}
    </nav>
  )
}
