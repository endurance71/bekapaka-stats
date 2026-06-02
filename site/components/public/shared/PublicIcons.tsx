import type { ReactNode } from 'react'

type PublicIconProps = {
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

export function CalendarIcon({ size = 16, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <rect x='3' y='4' width='18' height='18' rx='2' />
      <path d='M16 2v4M8 2v4M3 10h18' />
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
