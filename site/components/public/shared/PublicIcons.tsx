import type { ReactNode } from 'react'

export type PublicIconProps = {
  size?: number
  className?: string
}

const defaultStroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function iconProps({ size = 16, className }: PublicIconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    className,
    'aria-hidden': true as const,
    ...defaultStroke,
  }
}

export function CloseIcon({ size = 20, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <path d='M18 6L6 18M6 6l12 12' />
    </svg>
  )
}

export function ArrowRightIcon({ size = 14, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <path d='M5 12h14M13 6l6 6-6 6' />
    </svg>
  )
}

export function HomeIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <path d='M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z' />
    </svg>
  )
}

export function CalendarIcon({ size = 16, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <rect x='3' y='4' width='18' height='18' rx='2' />
      <path d='M16 2v4M8 2v4M3 10h18' />
    </svg>
  )
}

export function NewspaperIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <path d='M4 6h16v12H4z' />
      <path d='M8 10h8M8 14h5M16 10v6' />
    </svg>
  )
}

export function TrophyIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <path d='M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z' />
      <path d='M7 4H5a2 2 0 0 0 0 4M17 4h2a2 2 0 0 1 0 4' />
    </svg>
  )
}

export function UsersIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <path d='M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1' />
      <circle cx='9' cy='7' r='3' />
      <path d='M22 19v-1a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
    </svg>
  )
}

export function HandshakeIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <path d='m11 17 2 2a4 4 0 0 0 5 0l1-1M7 13l-2-2a4 4 0 0 1 0-5l1-1' />
      <path d='m8 12 4-4M14 8l2-2M4 20l4-4' />
    </svg>
  )
}

export function BuildingIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <path d='M3 21h18M5 21V7l7-4 7 4v14' />
      <path d='M9 11h1M9 15h1M14 11h1M14 15h1' />
    </svg>
  )
}

export function MapPinIcon({ size = 16, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <path d='M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z' />
      <circle cx='12' cy='10' r='2.5' />
    </svg>
  )
}

export function VideoIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <rect x='2' y='6' width='14' height='12' rx='2' />
      <path d='m16 10 6-3v14l-6-3' />
    </svg>
  )
}

export function MailIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <rect x='2' y='4' width='20' height='16' rx='2' />
      <path d='m22 7-10 7L2 7' />
    </svg>
  )
}

export function MonitorIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <rect x='2' y='3' width='20' height='14' rx='2' />
      <path d='M8 21h8M12 17v4' />
    </svg>
  )
}

export function PercentIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <line x1='19' y1='5' x2='5' y2='19' />
      <circle cx='6.5' cy='6.5' r='2.5' />
      <circle cx='17.5' cy='17.5' r='2.5' />
    </svg>
  )
}

export function HeartIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <path d='M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z' />
    </svg>
  )
}

export function BankIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <path d='M3 10h18M5 10V19M9 10V19M15 10V19M19 10V19M2 19h20M12 3 22 10H2z' />
    </svg>
  )
}

export function IconLabel({
  icon,
  children,
  className,
}: {
  icon: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <span className={className ? `public-icon-label ${className}` : 'public-icon-label'}>
      <span className='public-icon-label__icon'>{icon}</span>
      <span className='public-icon-label__text'>{children}</span>
    </span>
  )
}

export function MetaWithIcons({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={className ? `meta-with-icons ${className}` : 'meta-with-icons'}>{children}</span>
  )
}
