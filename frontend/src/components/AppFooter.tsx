import { cn } from '../shared/lib/utils'

type AppFooterProps = {
  className?: string
}

export function AppFooter({ className }: AppFooterProps) {
  return (
    <footer className={cn('text-center text-xs text-bkpk-text-muted space-y-1', className)}>
      <p className="font-semibold text-bkpk-text-secondary">BeKaPaKa Bobolice — BKPK</p>
      <a
        href="https://bekapaka.pl"
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:text-bkpk-primary transition-colors"
      >
        bekapaka.pl
      </a>
      <p>© 2026 by MT HUB Damian Motyliński</p>
      <a
        href="mailto:kontakt@damianmotylinski.pl"
        className="block hover:text-bkpk-primary transition-colors"
      >
        kontakt@damianmotylinski.pl
      </a>
    </footer>
  )
}
