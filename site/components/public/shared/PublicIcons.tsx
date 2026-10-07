export type PublicIconProps = {
  size?: number
  className?: string
}

const defaultStroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const,
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

export function VideoIcon({ size = 18, className }: PublicIconProps) {
  return (
    <svg {...iconProps({ size, className })}>
      <rect x='2' y='6' width='14' height='12' rx='2' />
      <path d='m16 10 6-3v14l-6-3' />
    </svg>
  )
}
